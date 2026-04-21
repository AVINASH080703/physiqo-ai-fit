/**
 * Admin / data explorer page — generic CRUD UI for all tables.
 * Demonstrates the data layer; users only see their own rows (RLS).
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { DataTable, Column } from "@/components/admin/DataTable";
import { useCreate } from "@/hooks/useCrud";
import type { Row } from "@/services/db";

const metricSchema = z.object({
  weight_kg: z.coerce.number().min(25).max(400),
  chest_cm: z.coerce.number().min(30).max(200).optional(),
  waist_cm: z.coerce.number().min(30).max(200).optional(),
  hips_cm: z.coerce.number().min(30).max(200).optional(),
  arm_cm: z.coerce.number().min(15).max(80).optional(),
  notes: z.string().max(500).optional(),
});

export default function Admin() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!loading && !user) nav("/auth", { replace: true }); }, [user, loading, nav]);

  if (!user) return null;

  const metricColumns: Column<Row<"body_metrics">>[] = [
    { key: "logged_at", label: "Date", render: (r) => new Date(r.logged_at).toLocaleDateString() },
    { key: "weight_kg", label: "Weight (kg)" },
    { key: "chest_cm", label: "Chest" },
    { key: "waist_cm", label: "Waist" },
    { key: "notes", label: "Notes", sortable: false },
  ];
  const planColumns: Column<Row<"workout_plans">>[] = [
    { key: "name", label: "Name" },
    { key: "goal", label: "Goal" },
    { key: "activity_level", label: "Level" },
    { key: "is_active", label: "Active" },
    { key: "created_at", label: "Created" },
  ];
  const profileColumns: Column<Row<"profiles">>[] = [
    { key: "full_name", label: "Name" },
    { key: "age", label: "Age" },
    { key: "gender", label: "Gender" },
    { key: "goal", label: "Goal" },
    { key: "activity_level", label: "Level" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container py-8 md:py-10 space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Data explorer</h1>
          <p className="text-sm text-muted-foreground">Manage your records across all tables.</p>
        </div>

        <Tabs defaultValue="metrics" className="space-y-5">
          <TabsList>
            <TabsTrigger value="metrics">Body metrics</TabsTrigger>
            <TabsTrigger value="plans">Workout plans</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-4">
            <div className="flex justify-end"><AddMetricDialog userId={user.id} /></div>
            <DataTable
              table="body_metrics"
              columns={metricColumns}
              userId={user.id}
              defaultSort="logged_at"
              searchColumn="notes"
              emptyMessage="No metrics logged yet."
            />
          </TabsContent>

          <TabsContent value="plans">
            <DataTable
              table="workout_plans"
              columns={planColumns}
              userId={user.id}
              defaultSort="created_at"
              searchColumn="name"
              emptyMessage="No workout plans saved yet."
            />
          </TabsContent>

          <TabsContent value="profile">
            <DataTable
              table="profiles"
              columns={profileColumns}
              userId={user.id}
              defaultSort="updated_at"
              searchColumn="full_name"
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function AddMetricDialog({ userId }: { userId: string }) {
  const create = useCreate("body_metrics");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ weight_kg: "", chest_cm: "", waist_cm: "", hips_cm: "", arm_cm: "", notes: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === "" ? undefined : v]));
    const parsed = metricSchema.safeParse(cleaned);
    if (!parsed.success) return;
    await create.mutateAsync({ user_id: userId, ...parsed.data });
    setForm({ weight_kg: "", chest_cm: "", waist_cm: "", hips_cm: "", arm_cm: "", notes: "" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="brand"><Plus className="h-4 w-4" /> New entry</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log body metrics</DialogTitle>
          <DialogDescription>Weight is required; the rest are optional.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Field label="Weight (kg) *"><Input required type="number" step="0.1" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} /></Field>
            <Field label="Chest (cm)"><Input type="number" step="0.1" value={form.chest_cm} onChange={(e) => setForm({ ...form, chest_cm: e.target.value })} /></Field>
            <Field label="Waist (cm)"><Input type="number" step="0.1" value={form.waist_cm} onChange={(e) => setForm({ ...form, waist_cm: e.target.value })} /></Field>
            <Field label="Hips (cm)"><Input type="number" step="0.1" value={form.hips_cm} onChange={(e) => setForm({ ...form, hips_cm: e.target.value })} /></Field>
            <Field label="Arm (cm)"><Input type="number" step="0.1" value={form.arm_cm} onChange={(e) => setForm({ ...form, arm_cm: e.target.value })} /></Field>
          </div>
          <Field label="Notes"><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
          <DialogFooter>
            <Button type="submit" variant="brand" disabled={create.isPending}>{create.isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs font-medium">{label}</Label>{children}</div>;
}
