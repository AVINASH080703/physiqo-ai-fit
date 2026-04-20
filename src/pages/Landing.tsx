import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Activity, LineChart, Target, Brain, RefreshCcw, ShieldCheck, Check } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-physiqo.jpg";

const features = [
  { icon: Brain, title: "AI Workout Generator", desc: "Personalized weekly plans built from your body metrics, goal, and activity level." },
  { icon: LineChart, title: "Progress Tracking", desc: "Log weight and body measurements. Watch your transformation unfold visually." },
  { icon: RefreshCcw, title: "Adaptive Adjustments", desc: "Your plan evolves with your feedback and progress every week." },
  { icon: Target, title: "Goal-Driven", desc: "Fat loss, muscle gain, or maintenance — every rep tuned to your outcome." },
  { icon: Activity, title: "Beginner to Advanced", desc: "Sets, reps and rest periods scaled to your training experience." },
  { icon: ShieldCheck, title: "Private & Secure", desc: "Your data is yours. Encrypted and protected with row-level security." },
];

const steps = [
  { n: "01", title: "Tell us about you", desc: "Share your age, body metrics, goal, and current activity level — takes under a minute." },
  { n: "02", title: "Get your AI plan", desc: "We instantly build a 7-day workout split designed around your unique profile." },
  { n: "03", title: "Track & evolve", desc: "Log progress weekly. Your plan adapts as you transform." },
];

const tiers = [
  { name: "Starter", price: "Free", desc: "Perfect to get started.", features: ["AI weekly workout plan", "Basic progress tracking", "Body metrics dashboard"], cta: "Start free", highlight: false },
  { name: "Pro", price: "$9", per: "/mo", desc: "For consistent training.", features: ["Everything in Starter", "Adaptive weekly adjustments", "Detailed analytics & charts", "Export your data"], cta: "Go Pro", highlight: true },
  { name: "Elite", price: "$19", per: "/mo", desc: "For serious results.", features: ["Everything in Pro", "Nutrition recommendations", "Priority AI updates", "1:1 monthly check-in"], cta: "Get Elite", highlight: false },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-hero">
        <div className="container py-16 md:py-24 lg:py-28 grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-7 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-soft">
              <Sparkles className="h-3.5 w-3.5 text-brand" /> AI-personalized fitness, made simple
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05] text-balance">
              Train smarter with AI <span className="text-brand">built for your body.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl text-balance">
              Stop following generic plans. Physiqo creates a workout routine tuned to your metrics, goals and progress — and adapts as you evolve.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="hero" size="xl">
                <Link to="/auth?mode=signup">Get Your Plan <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="xl">
                <a href="#how">How it works</a>
              </Button>
            </div>
            <div className="flex items-center gap-6 pt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-brand" /> No credit card</div>
              <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-brand" /> Cancel anytime</div>
              <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-brand" /> 60-second setup</div>
            </div>
          </div>
          <div className="relative">
            <div className="relative aspect-square overflow-hidden rounded-3xl shadow-card animate-float">
              <img src={heroImg} alt="Person training at home with personalized fitness routine" width={1280} height={1280} className="h-full w-full object-cover" />
            </div>
            <div className="absolute -bottom-4 -left-4 rounded-2xl bg-card border border-border shadow-card p-4 hidden sm:block">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-brand/10 flex items-center justify-center"><Activity className="h-5 w-5 text-brand" /></div>
                <div>
                  <div className="text-xs text-muted-foreground">Week progress</div>
                  <div className="font-semibold">5 of 6 sessions</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 md:py-28">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center mb-14 space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-brand">Features</div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-balance">Everything you need to build the body you want</h2>
            <p className="text-muted-foreground">Designed to feel as good as your post-workout endorphins.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group rounded-2xl border border-border bg-card p-6 shadow-soft hover:shadow-card transition-all hover:-translate-y-0.5">
                <div className="h-11 w-11 rounded-xl bg-brand/10 text-brand flex items-center justify-center mb-4 group-hover:bg-brand group-hover:text-brand-foreground transition-colors">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold mb-1.5">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-20 md:py-28 bg-secondary/40">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center mb-14 space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-brand">How it works</div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-balance">Your plan in three steps</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="relative rounded-2xl bg-card border border-border p-7 shadow-soft">
                <div className="font-display text-5xl font-bold text-brand/15 mb-2">{s.n}</div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20 md:py-28">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center mb-14 space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-brand">Pricing</div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-balance">Simple plans for every level</h2>
            <p className="text-muted-foreground">Start free. Upgrade when you're ready to go further.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {tiers.map((t) => (
              <div key={t.name} className={`relative rounded-2xl border p-7 flex flex-col ${t.highlight ? "border-brand shadow-glow bg-card" : "border-border bg-card shadow-soft"}`}>
                {t.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand text-brand-foreground text-xs font-semibold px-3 py-1">Most popular</div>
                )}
                <h3 className="font-display font-bold text-xl mb-1">{t.name}</h3>
                <p className="text-sm text-muted-foreground mb-5">{t.desc}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="font-display text-4xl font-bold">{t.price}</span>
                  {t.per && <span className="text-muted-foreground text-sm">{t.per}</span>}
                </div>
                <ul className="space-y-2.5 mb-7 flex-1">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-brand mt-0.5 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button asChild variant={t.highlight ? "hero" : "outline"} size="lg">
                  <Link to="/auth?mode=signup">{t.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <div className="rounded-3xl bg-primary text-primary-foreground p-10 md:p-16 text-center shadow-card">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 text-balance">Your transformation starts today.</h2>
            <p className="text-primary-foreground/70 mb-8 max-w-xl mx-auto">Build a plan in under 60 seconds. Free forever for the essentials.</p>
            <Button asChild variant="hero" size="xl">
              <Link to="/auth?mode=signup">Start Free <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
