import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Activity, Target, Flame, TrendingUp, Plus, Dumbbell, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateWeeklyPlan, goalLabels, levelLabels, Goal, Level, WeeklyPlan } from "@/lib/planGenerator";
import { toast } from "sonner";

interface Profile {
  full_name: string | null;
  age: number | null;
  gender: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  goal: Goal | null;
  activity_level: Level | null;
}
interface Metric {
  id: string;
  weight_kg: number;
  chest_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  arm_cm: number | null;
  notes: string | null;
  logged_at: string;
}

const metricSchema = z.object({
  weight_kg: z.coerce.number().min(25).max(400),
  chest_cm: z.coerce.number().min(30).max(200).optional().or(z.literal("")),
  waist_cm: z.coerce.number().min(30).max(200).optional().or(z.literal("")),
  hips_cm: z.coerce.number().min(30).max(200).optional().or(z.literal("")),
  arm_cm: z.coerce.number().min(15).max(80).optional().or(z.literal("")),
  notes: z.string().max(500).optional(),
});

export default function Dashboard() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [busy, setBusy] = useState(true);

  const [form, setForm] = useState({ weight_kg: "", chest_cm: "", waist_cm: "", hips_cm: "", arm_cm: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (!loading && !user) nav("/auth", { replace: true }); }, [user, loading, nav]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setBusy(true);
      const [{ data: prof }, { data: m }] = await Promise.all([
        supabase.from("profiles").select("full_name, age, gender, height_cm, weight_kg, goal, activity_level").eq("user_id", user.id).maybeSingle(),
        supabase.from("body_metrics").select("*").eq("user_id", user.id).order("logged_at", { ascending: true }),
      ]);
      setProfile(prof as Profile | null);
      setMetrics((m as Metric[]) ?? []);
      if (prof?.weight_kg) setForm((f) => ({ ...f, weight_kg: String(prof.weight_kg) }));
      if (prof?.goal && prof?.activity_level) {
        setPlan(generateWeeklyPlan(prof.goal, prof.activity_level));
      }
      setBusy(false);
    })();
  }, [user]);

  const latestWeight = metrics.length ? metrics[metrics.length - 1].weight_kg : profile?.weight_kg ?? null;
  const startWeight = metrics.length ? metrics[0].weight_kg : profile?.weight_kg ?? null;
  const delta = latestWeight && startWeight ? Number(latestWeight) - Number(startWeight) : 0;

  const chartData = useMemo(() => {
    const base = profile?.weight_kg
      ? [{ date: "Start", weight: Number(profile.weight_kg) }]
      : [];
    return [
      ...base,
      ...metrics.map((m) => ({
        date: new Date(m.logged_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        weight: Number(m.weight_kg),
      })),
    ];
  }, [metrics, profile]);

  const handleAddMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = metricSchema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setSubmitting(true);
    const d = parsed.data;
    const payload = {
      user_id: user.id,
      weight_kg: d.weight_kg,
      chest_cm: d.chest_cm === "" ? null : d.chest_cm,
      waist_cm: d.waist_cm === "" ? null : d.waist_cm,
      hips_cm: d.hips_cm === "" ? null : d.hips_cm,
      arm_cm: d.arm_cm === "" ? null : d.arm_cm,
      notes: d.notes || null,
    };
    const { data, error } = await supabase.from("body_metrics").insert(payload).select().single();
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    setMetrics((m) => [...m, data as Metric]);
    setForm({ weight_kg: String(d.weight_kg), chest_cm: "", waist_cm: "", hips_cm: "", arm_cm: "", notes: "" });
    toast.success("Progress logged");
  };

  const regeneratePlan = () => {
    if (!profile?.goal || !profile?.activity_level) return;
    setPlan(generateWeeklyPlan(profile.goal, profile.activity_level));
    toast.success("Plan refreshed");
  };

  if (loading || busy) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container py-10 space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container py-8 md:py-10 space-y-8">
        {/* Greeting */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back</p>
            <h1 className="font-display text-3xl font-bold">{profile?.full_name || "Athlete"} 👋</h1>
          </div>
          <Button onClick={regeneratePlan} variant="brand"><Sparkles className="h-4 w-4" /> Regenerate plan</Button>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Target} label="Goal" value={profile?.goal ? goalLabels[profile.goal] : "—"} />
          <StatCard icon={Activity} label="Level" value={profile?.activity_level ? levelLabels[profile.activity_level] : "—"} />
          <StatCard icon={Flame} label="Current weight" value={latestWeight ? `${Number(latestWeight).toFixed(1)} kg` : "—"} />
          <StatCard
            icon={TrendingUp}
            label="Change"
            value={delta === 0 ? "0.0 kg" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)} kg`}
            tone={profile?.goal === "fat_loss" ? (delta < 0 ? "good" : delta > 0 ? "bad" : "neutral") : profile?.goal === "muscle_gain" ? (delta > 0 ? "good" : delta < 0 ? "bad" : "neutral") : "neutral"}
          />
        </div>

        <Tabs defaultValue="plan" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="plan">Workout</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="log">Log</TabsTrigger>
          </TabsList>

          {/* WORKOUT PLAN */}
          <TabsContent value="plan" className="space-y-5">
            {plan ? (
              <>
                <div className="rounded-2xl bg-card border border-border p-6 shadow-soft">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand"><Dumbbell className="h-5 w-5" /></span>
                    <h2 className="font-display font-bold text-xl">{plan.name}</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.summary}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {plan.days.map((d) => (
                    <div key={d.day} className="rounded-2xl bg-card border border-border p-5 shadow-soft">
                      <div className="flex items-baseline justify-between mb-1">
                        <h3 className="font-display font-semibold">{d.day}</h3>
                        <span className="text-xs text-muted-foreground">{d.duration}</span>
                      </div>
                      <p className="text-sm text-brand font-medium mb-3">{d.focus}</p>
                      <ul className="space-y-2">
                        {d.exercises.map((ex, i) => (
                          <li key={i} className="flex items-center justify-between gap-3 text-sm py-1.5 border-b border-border/60 last:border-0">
                            <span className="font-medium">{ex.name}</span>
                            <span className="text-xs text-muted-foreground">{ex.sets} × {ex.reps} · {ex.rest}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
                Complete your profile to generate a plan.
              </div>
            )}
          </TabsContent>

          {/* PROGRESS */}
          <TabsContent value="progress" className="space-y-5">
            <div className="rounded-2xl bg-card border border-border p-6 shadow-soft">
              <h2 className="font-display font-bold text-lg mb-1">Weight progress</h2>
              <p className="text-sm text-muted-foreground mb-5">Your body weight over time.</p>
              <div className="h-64">
                {chartData.length >= 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={["dataMin - 2", "dataMax + 2"]} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                      <Line type="monotone" dataKey="weight" stroke="hsl(var(--accent-brand))" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--accent-brand))" }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Log your first weight to see the chart.</div>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-card border border-border shadow-soft overflow-hidden">
              <div className="p-6 pb-3">
                <h3 className="font-display font-bold">Recent logs</h3>
              </div>
              {metrics.length === 0 ? (
                <p className="px-6 pb-6 text-sm text-muted-foreground">No entries yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {[...metrics].reverse().slice(0, 8).map((m) => (
                    <div key={m.id} className="flex items-center justify-between px-6 py-3 text-sm">
                      <div>
                        <div className="font-medium">{Number(m.weight_kg).toFixed(1)} kg</div>
                        {m.notes && <div className="text-xs text-muted-foreground line-clamp-1 max-w-md">{m.notes}</div>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(m.logged_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* LOG METRICS */}
          <TabsContent value="log">
            <form onSubmit={handleAddMetric} className="rounded-2xl bg-card border border-border p-6 shadow-soft space-y-4 max-w-2xl">
              <div>
                <h2 className="font-display font-bold text-lg">Log today's metrics</h2>
                <p className="text-sm text-muted-foreground">Weight is required. Measurements are optional.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Field label="Weight (kg) *"><Input required type="number" step="0.1" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} /></Field>
                <Field label="Chest (cm)"><Input type="number" step="0.1" value={form.chest_cm} onChange={(e) => setForm({ ...form, chest_cm: e.target.value })} /></Field>
                <Field label="Waist (cm)"><Input type="number" step="0.1" value={form.waist_cm} onChange={(e) => setForm({ ...form, waist_cm: e.target.value })} /></Field>
                <Field label="Hips (cm)"><Input type="number" step="0.1" value={form.hips_cm} onChange={(e) => setForm({ ...form, hips_cm: e.target.value })} /></Field>
                <Field label="Arm (cm)"><Input type="number" step="0.1" value={form.arm_cm} onChange={(e) => setForm({ ...form, arm_cm: e.target.value })} /></Field>
              </div>
              <Field label="Notes (optional)">
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="How did the week feel?" rows={3} />
              </Field>
              <Button type="submit" variant="brand" size="lg" disabled={submitting}>
                <Plus className="h-4 w-4" /> {submitting ? "Saving…" : "Save entry"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs font-medium">{label}</Label>{children}</div>;
}

function StatCard({ icon: Icon, label, value, tone = "neutral" }: { icon: any; label: string; value: string; tone?: "good" | "bad" | "neutral" }) {
  const toneClass = tone === "good" ? "text-brand" : tone === "bad" ? "text-destructive" : "text-foreground";
  return (
    <div className="rounded-2xl bg-card border border-border p-5 shadow-soft">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-3">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className={`font-display text-2xl font-bold ${toneClass}`}>{value}</div>
    </div>
  );
}
