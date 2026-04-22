/** Daily nutrition + water tracking page with food library, search, veg/non-veg filter and AI plan. */
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Sparkles, Trash2, Droplet, Apple, Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { friendlyDbError } from "@/lib/dbErrors";
import { formatVolume } from "@/lib/units";
import type { Database } from "@/integrations/supabase/types";

type Food = Database["public"]["Tables"]["food_items"]["Row"];
type Target = Database["public"]["Tables"]["nutrition_targets"]["Row"];
type Pref = Database["public"]["Tables"]["user_preferences"]["Row"];

const startOfToday = () => {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString();
};

export default function Nutrition() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [meal, setMeal] = useState<"breakfast" | "lunch" | "dinner" | "snack">("snack");
  const [aiLoading, setAiLoading] = useState(false);

  // ---- Preferences
  const { data: prefs } = useQuery({
    queryKey: ["prefs", user?.id],
    queryFn: async (): Promise<Pref | null> => {
      const { data } = await supabase.from("user_preferences").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });
  const unit = prefs?.unit_system ?? "metric";
  const dietPref = prefs?.diet_preference ?? "non_veg";

  // ---- Targets
  const { data: target } = useQuery({
    queryKey: ["nutrition_targets", user?.id],
    queryFn: async (): Promise<Target | null> => {
      const { data } = await supabase.from("nutrition_targets").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // ---- Today's logs
  const { data: logs = [] } = useQuery({
    queryKey: ["nutrition_logs", user?.id, "today"],
    queryFn: async () => {
      const { data } = await supabase.from("nutrition_logs").select("*").eq("user_id", user!.id)
        .gte("logged_at", startOfToday()).order("logged_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: water = [] } = useQuery({
    queryKey: ["water_logs", user?.id, "today"],
    queryFn: async () => {
      const { data } = await supabase.from("water_logs").select("*").eq("user_id", user!.id)
        .gte("logged_at", startOfToday()).order("logged_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  // ---- Food library
  const { data: foods = [], isLoading: foodsLoading } = useQuery({
    queryKey: ["food_items", search, categoryFilter, dietPref],
    queryFn: async () => {
      let q = supabase.from("food_items").select("*").order("name").limit(60);
      if (search) q = q.ilike("name", `%${search}%`);
      if (categoryFilter !== "all") q = q.eq("category", categoryFilter as never);
      const { data } = await q;
      let rows = data ?? [];
      // Respect diet preference
      if (dietPref === "veg") rows = rows.filter((f) => f.category !== "non_veg");
      if (dietPref === "vegan") rows = rows.filter((f) => !["non_veg", "dairy"].includes(f.category));
      return rows as Food[];
    },
  });

  // ---- Totals
  const totals = useMemo(() => logs.reduce(
    (a, l) => ({
      calories: a.calories + Number(l.calories),
      protein: a.protein + Number(l.protein_g),
      carbs: a.carbs + Number(l.carbs_g),
      fat: a.fat + Number(l.fat_g),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 }),
  [logs]);
  const waterTotalMl = water.reduce((a, w) => a + (w.unit === "oz" ? Number(w.amount) * 29.5735 : Number(w.amount)), 0);

  // ---- Mutations
  const addFoodLog = useMutation({
    mutationFn: async ({ food, servings }: { food: Food; servings: number }) => {
      const { error } = await supabase.from("nutrition_logs").insert({
        user_id: user!.id, food_item_id: food.id, custom_name: food.name,
        servings, meal,
        calories: Number(food.calories) * servings,
        protein_g: Number(food.protein_g) * servings,
        carbs_g: Number(food.carbs_g) * servings,
        fat_g: Number(food.fat_g) * servings,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Food logged"); qc.invalidateQueries({ queryKey: ["nutrition_logs"] }); },
    onError: (e) => toast.error(friendlyDbError(e, "Could not log food")),
  });

  const removeFoodLog = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("nutrition_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Removed"); qc.invalidateQueries({ queryKey: ["nutrition_logs"] }); },
    onError: (e) => toast.error(friendlyDbError(e)),
  });

  const addWater = useMutation({
    mutationFn: async (amount: number) => {
      const { error } = await supabase.from("water_logs").insert({
        user_id: user!.id, amount, unit: unit === "imperial" ? "oz" : "ml",
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["water_logs"] }),
    onError: (e) => toast.error(friendlyDbError(e)),
  });

  const updatePref = useMutation({
    mutationFn: async (patch: Partial<Pref>) => {
      const { error } = await supabase.from("user_preferences").upsert({
        user_id: user!.id,
        unit_system: patch.unit_system ?? unit,
        diet_preference: patch.diet_preference ?? dietPref,
      } as never, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prefs"] }),
    onError: (e) => toast.error(friendlyDbError(e)),
  });

  const generatePlan = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-nutrition-plan");
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      toast.success("New AI plan ready");
      qc.invalidateQueries({ queryKey: ["nutrition_targets"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not generate plan");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="container py-8 flex-1">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold">Nutrition & Hydration</h1>
            <p className="text-muted-foreground text-sm">Track calories, macros, micros and water intake.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={dietPref} onValueChange={(v) => updatePref.mutate({ diet_preference: v as Pref["diet_preference"] })}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="veg">Vegetarian</SelectItem>
                <SelectItem value="non_veg">Non-vegetarian</SelectItem>
                <SelectItem value="vegan">Vegan</SelectItem>
              </SelectContent>
            </Select>
            <Select value={unit} onValueChange={(v) => updatePref.mutate({ unit_system: v as Pref["unit_system"] })}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="metric">Metric</SelectItem>
                <SelectItem value="imperial">Imperial</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={generatePlan} disabled={aiLoading} variant="brand">
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              AI plan
            </Button>
          </div>
        </div>

        {/* Macros summary */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <MacroCard label="Calories" value={totals.calories} target={Number(target?.calories ?? 2000)} unit="kcal" />
          <MacroCard label="Protein" value={totals.protein} target={Number(target?.protein_g ?? 100)} unit="g" />
          <MacroCard label="Carbs" value={totals.carbs} target={Number(target?.carbs_g ?? 250)} unit="g" />
          <MacroCard label="Fat" value={totals.fat} target={Number(target?.fat_g ?? 65)} unit="g" />
        </div>

        {/* Micros + water */}
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Droplet className="h-4 w-4 text-brand" /> Water</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-end justify-between mb-3">
                <div className="text-2xl font-display font-bold">{formatVolume(waterTotalMl, unit)}</div>
                <div className="text-xs text-muted-foreground">/ {formatVolume(Number(target?.water_ml ?? 2500), unit)}</div>
              </div>
              <Progress value={Math.min(100, (waterTotalMl / Number(target?.water_ml ?? 2500)) * 100)} className="mb-3" />
              <div className="flex flex-wrap gap-2">
                {(unit === "imperial" ? [8, 12, 16, 24] : [200, 300, 500, 750]).map((amt) => (
                  <Button key={amt} variant="outline" size="sm" onClick={() => addWater.mutate(amt)}>
                    + {amt} {unit === "imperial" ? "oz" : "ml"}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Key micronutrient targets</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              <MicroRow label="Magnesium" target={target?.magnesium_mg ?? 400} unit="mg" />
              <MicroRow label="Potassium" target={target?.potassium_mg ?? 3500} unit="mg" />
              <MicroRow label="Calcium" target={target?.calcium_mg ?? 1000} unit="mg" />
              <MicroRow label="Iron" target={target?.iron_mg ?? 15} unit="mg" />
              <MicroRow label="Fiber" target={target?.fiber_g ?? 30} unit="g" />
              {target?.notes && <p className="text-xs text-muted-foreground pt-2 border-t border-border">{target.notes}</p>}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="library">
          <TabsList>
            <TabsTrigger value="library"><Apple className="h-4 w-4 mr-1" /> Food library</TabsTrigger>
            <TabsTrigger value="logs">Today's log ({logs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="mt-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search foods…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  <SelectItem value="veg">Vegetarian</SelectItem>
                  <SelectItem value="non_veg">Non-veg</SelectItem>
                  <SelectItem value="dairy">Dairy</SelectItem>
                  <SelectItem value="grain">Grain</SelectItem>
                  <SelectItem value="fruit">Fruit</SelectItem>
                  <SelectItem value="nut_seed">Nut / seed</SelectItem>
                  <SelectItem value="beverage">Beverage</SelectItem>
                </SelectContent>
              </Select>
              <Select value={meal} onValueChange={(v) => setMeal(v as typeof meal)}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {foodsLoading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : foods.length === 0 ? (
              <div className="text-sm text-muted-foreground">No matching foods.</div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {foods.map((f) => <FoodCard key={f.id} food={f} onAdd={(servings) => addFoodLog.mutate({ food: f, servings })} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="logs" className="mt-4">
            {logs.length === 0 ? (
              <div className="text-sm text-muted-foreground">Nothing logged yet today.</div>
            ) : (
              <div className="space-y-2">
                {logs.map((l) => (
                  <div key={l.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                    <div>
                      <div className="font-medium">{l.custom_name ?? "Food"}</div>
                      <div className="text-xs text-muted-foreground">
                        {l.meal} · {Number(l.servings).toFixed(2)}× · {Math.round(Number(l.calories))} kcal · P{Math.round(Number(l.protein_g))} C{Math.round(Number(l.carbs_g))} F{Math.round(Number(l.fat_g))}
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => removeFoodLog.mutate(l.id)} aria-label="Remove">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <SiteFooter />
    </div>
  );
}

function MacroCard({ label, value, target, unit }: { label: string; value: number; target: number; unit: string }) {
  const pct = Math.min(100, (value / Math.max(1, target)) * 100);
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
        <div className="flex items-end justify-between mb-2">
          <span className="text-2xl font-display font-bold">{Math.round(value)}</span>
          <span className="text-xs text-muted-foreground">/ {Math.round(target)} {unit}</span>
        </div>
        <Progress value={pct} />
      </CardContent>
    </Card>
  );
}

function MicroRow({ label, target, unit }: { label: string; target: number | string; unit: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{Number(target).toFixed(0)} {unit}</span>
    </div>
  );
}

function FoodCard({ food, onAdd }: { food: Food; onAdd: (servings: number) => void }) {
  const [open, setOpen] = useState(false);
  const [servings, setServings] = useState("1");
  return (
    <Card className="hover:border-brand/40 transition-colors">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="font-medium">{food.name}</div>
            <div className="text-xs text-muted-foreground">per {Number(food.serving_size_g)} g</div>
          </div>
          <Badge variant="secondary" className="capitalize text-xs">{food.category.replace("_", "-")}</Badge>
        </div>
        <div className="grid grid-cols-4 gap-1 text-xs text-muted-foreground mb-3">
          <div><div className="text-foreground font-semibold">{Number(food.calories).toFixed(0)}</div>kcal</div>
          <div><div className="text-foreground font-semibold">{Number(food.protein_g).toFixed(1)}</div>P g</div>
          <div><div className="text-foreground font-semibold">{Number(food.carbs_g).toFixed(1)}</div>C g</div>
          <div><div className="text-foreground font-semibold">{Number(food.fat_g).toFixed(1)}</div>F g</div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-3 flex-wrap">
          <span>Mg {Number(food.magnesium_mg).toFixed(0)}</span>·
          <span>K {Number(food.potassium_mg).toFixed(0)}</span>·
          <span>Ca {Number(food.calcium_mg).toFixed(0)}</span>·
          <span>Fe {Number(food.iron_mg).toFixed(1)}</span>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="w-full"><Plus className="h-4 w-4" /> Log</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log {food.name}</DialogTitle></DialogHeader>
            <div className="space-y-2">
              <Label>Servings</Label>
              <Input type="text" inputMode="decimal" value={servings} onChange={(e) => setServings(e.target.value)} />
              <p className="text-xs text-muted-foreground">1 serving = {Number(food.serving_size_g)} g</p>
            </div>
            <DialogFooter>
              <Button variant="brand" onClick={() => { const n = parseFloat(servings); if (!isFinite(n) || n <= 0) return; onAdd(n); setOpen(false); setServings("1"); }}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
