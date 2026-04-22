import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/physiqo-logo.jpg";

const signupSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(72),
  age: z.coerce.number().int().min(13, "Min age 13").max(110),
  gender: z.enum(["male", "female", "other"]),
  height_cm: z.coerce.number().min(80).max(260),
  weight_kg: z.coerce.number().min(25).max(400),
  goal: z.enum(["fat_loss", "muscle_gain", "maintenance"]),
  activity_level: z.enum(["beginner", "intermediate", "advanced"]),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(72),
});

export default function Auth() {
  const [params, setParams] = useSearchParams();
  const mode = params.get("mode") === "signup" ? "signup" : "login";
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    full_name: "", email: "", password: "",
    age: "", gender: "male", height_cm: "", weight_kg: "",
    goal: "fat_loss", activity_level: "beginner",
  });

  useEffect(() => { if (!loading && user) nav("/dashboard", { replace: true }); }, [user, loading, nav]);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email: form.email, password: form.password });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome back!");
    nav("/dashboard");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signupSchema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSubmitting(true);
    const d = parsed.data;
    const { error } = await supabase.auth.signUp({
      email: d.email,
      password: d.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: d.full_name,
          age: String(d.age),
          gender: d.gender,
          height_cm: String(d.height_cm),
          weight_kg: String(d.weight_kg),
          goal: d.goal,
          activity_level: d.activity_level,
        },
      },
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account created! You're in.");
    nav("/dashboard");
  };

  return (
    <div className="min-h-screen bg-hero flex flex-col">
      <header className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display font-bold">
          <img src={logo} alt="Physiqo logo" className="h-9 w-9 rounded-lg object-cover" />
          Physiqo
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm"><Link to="/"><ArrowLeft className="h-4 w-4" /> Home</Link></Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-border bg-card shadow-card p-7 md:p-8">
            <div className="mb-6 text-center">
              <h1 className="font-display text-2xl font-bold mb-1">
                {mode === "signup" ? "Create your account" : "Welcome back"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {mode === "signup" ? "Build your personalized plan in 60 seconds." : "Sign in to access your plan."}
              </p>
            </div>

            {/* Toggle */}
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 mb-6">
              <button type="button" onClick={() => setParams({})}
                className={`text-sm font-medium py-2 rounded-lg transition-colors ${mode === "login" ? "bg-card shadow-soft" : "text-muted-foreground"}`}>
                Sign in
              </button>
              <button type="button" onClick={() => setParams({ mode: "signup" })}
                className={`text-sm font-medium py-2 rounded-lg transition-colors ${mode === "signup" ? "bg-card shadow-soft" : "text-muted-foreground"}`}>
                Sign up
              </button>
            </div>

            {mode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <Field label="Email"><Input type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" /></Field>
                <Field label="Password"><Input type="password" required value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="••••••••" /></Field>
                <Button type="submit" variant="brand" size="lg" className="w-full" disabled={submitting}>
                  {submitting ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <Field label="Full name"><Input required value={form.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="Alex Carter" /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Email"><Input type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} /></Field>
                  <Field label="Password"><Input type="password" required value={form.password} onChange={(e) => update("password", e.target.value)} /></Field>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Age"><Input type="text" inputMode="numeric" required value={form.age} onChange={(e) => update("age", e.target.value)} placeholder="25" /></Field>
                  <Field label="Height (cm)"><Input type="text" inputMode="numeric" required value={form.height_cm} onChange={(e) => update("height_cm", e.target.value)} placeholder="175" /></Field>
                  <Field label="Weight (kg)"><Input type="text" inputMode="numeric" required value={form.weight_kg} onChange={(e) => update("weight_kg", e.target.value)} placeholder="70" /></Field>
                </div>
                <Field label="Gender">
                  <Select value={form.gender} onValueChange={(v) => update("gender", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Fitness goal">
                  <Select value={form.goal} onValueChange={(v) => update("goal", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fat_loss">Fat Loss</SelectItem>
                      <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Activity level">
                  <Select value={form.activity_level} onValueChange={(v) => update("activity_level", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
                  {submitting ? "Creating…" : "Create account"}
                </Button>
              </form>
            )}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6">
            By continuing you agree to our Terms & Privacy Policy.
          </p>
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}
