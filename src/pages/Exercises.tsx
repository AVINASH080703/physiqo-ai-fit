/** Exercise library + daily exercise log. */
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2, Flame, Dumbbell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { friendlyDbError } from "@/lib/dbErrors";
import type { Database } from "@/integrations/supabase/types";

type Ex = Database["public"]["Tables"]["exercises"]["Row"];

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString(); };

export default function Exercises() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => (await supabase.from("profiles").select("weight_kg").eq("user_id", user!.id).maybeSingle()).data,
    enabled: !!user,
  });
  const weightKg = Number(profile?.weight_kg ?? 70);

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ["exercises", search, cat],
    queryFn: async () => {
      let q = supabase.from("exercises").select("*").order("name");
      if (search) q = q.ilike("name", `%${search}%`);
      if (cat !== "all") q = q.eq("category", cat as never);
      return ((await q).data ?? []) as Ex[];
    },
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["exercise_logs", user?.id, "today"],
    queryFn: async () => {
      const { data } = await supabase.from("exercise_logs").select("*").eq("user_id", user!.id)
        .gte("logged_at", startOfToday()).order("logged_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const totalCalories = useMemo(() => logs.reduce((a, l) => a + Number(l.calories_burned ?? 0), 0), [logs]);
  const totalDuration = useMemo(() => logs.reduce((a, l) => a + Number(l.duration_min ?? 0), 0), [logs]);

  const addLog = useMutation({
    mutationFn: async ({ ex, duration, sets, reps, weight }: { ex: Ex; duration: number; sets?: number; reps?: number; weight?: number }) => {
      // Calories burned: MET × weight(kg) × hours
      const cals = Number(ex.met_value) * weightKg * (duration / 60);
      const { error } = await supabase.from("exercise_logs").insert({
        user_id: user!.id, exercise_id: ex.id, custom_name: ex.name,
        duration_min: duration, sets: sets ?? null, reps: reps ?? null, weight_kg: weight ?? null,
        calories_burned: Math.round(cals),
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Logged"); qc.invalidateQueries({ queryKey: ["exercise_logs"] }); },
    onError: (e) => toast.error(friendlyDbError(e)),
  });

  const removeLog = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("exercise_logs").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Removed"); qc.invalidateQueries({ queryKey: ["exercise_logs"] }); },
    onError: (e) => toast.error(friendlyDbError(e)),
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="container py-8 flex-1">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold">Exercises</h1>
          <p className="text-muted-foreground text-sm">Browse the library and log your sessions.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Flame className="h-4 w-4 text-brand" /> Today's burn</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold">{Math.round(totalCalories)} <span className="text-sm font-normal text-muted-foreground">kcal</span></div>
              <div className="text-xs text-muted-foreground">{Math.round(totalDuration)} min total · {logs.length} session(s)</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Dumbbell className="h-4 w-4 text-brand" /> Quick add</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {exercises.slice(0, 4).map((e) => (
                <Button key={e.id} size="sm" variant="outline" onClick={() => addLog.mutate({ ex: e, duration: 15 })}>
                  + 15 min {e.name}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="library">
          <TabsList>
            <TabsTrigger value="library">Library</TabsTrigger>
            <TabsTrigger value="logs">Today's log ({logs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="mt-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search exercises…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={cat} onValueChange={setCat}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="strength">Strength</SelectItem>
                  <SelectItem value="cardio">Cardio</SelectItem>
                  <SelectItem value="hiit">HIIT</SelectItem>
                  <SelectItem value="mobility">Mobility</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {exercises.map((e) => <ExerciseCard key={e.id} ex={e} weightKg={weightKg} onAdd={(d, s, r, w) => addLog.mutate({ ex: e, duration: d, sets: s, reps: r, weight: w })} />)}
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
                      <div className="font-medium">{l.custom_name ?? "Exercise"}</div>
                      <div className="text-xs text-muted-foreground">
                        {l.duration_min ? `${Number(l.duration_min)} min · ` : ""}
                        {l.sets && l.reps ? `${l.sets}×${l.reps} · ` : ""}
                        {l.weight_kg ? `${Number(l.weight_kg)} kg · ` : ""}
                        {Math.round(Number(l.calories_burned ?? 0))} kcal
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => removeLog.mutate(l.id)} aria-label="Remove">
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

function ExerciseCard({ ex, weightKg, onAdd }: { ex: Ex; weightKg: number; onAdd: (duration: number, sets?: number, reps?: number, weight?: number) => void }) {
  const [open, setOpen] = useState(false);
  const [duration, setDuration] = useState("15");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const estCals = (parseFloat(duration) || 0) * Number(ex.met_value) * weightKg / 60;
  return (
    <Card className="hover:border-brand/40 transition-colors">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="font-medium">{ex.name}</div>
            <div className="text-xs text-muted-foreground">{ex.muscle_group ?? "—"}</div>
          </div>
          <Badge variant="secondary" className="capitalize text-xs">{ex.category}</Badge>
        </div>
        <div className="text-xs text-muted-foreground mb-1">{ex.equipment ?? "—"} · MET {Number(ex.met_value)}</div>
        {ex.instructions && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{ex.instructions}</p>}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="w-full"><Plus className="h-4 w-4" /> Log</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log {ex.name}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Duration (min)</Label><Input type="text" inputMode="decimal" value={duration} onChange={(e) => setDuration(e.target.value)} /></div>
              <div><Label>Weight (kg)</Label><Input type="text" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="opt." /></div>
              <div><Label>Sets</Label><Input type="text" inputMode="numeric" value={sets} onChange={(e) => setSets(e.target.value)} placeholder="opt." /></div>
              <div><Label>Reps</Label><Input type="text" inputMode="numeric" value={reps} onChange={(e) => setReps(e.target.value)} placeholder="opt." /></div>
            </div>
            <p className="text-xs text-muted-foreground">Estimated: ~{Math.round(estCals)} kcal</p>
            <DialogFooter>
              <Button variant="brand" onClick={() => {
                const d = parseFloat(duration); if (!isFinite(d) || d <= 0) return;
                onAdd(d, sets ? parseInt(sets) : undefined, reps ? parseInt(reps) : undefined, weight ? parseFloat(weight) : undefined);
                setOpen(false);
              }}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
