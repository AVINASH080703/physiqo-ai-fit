import { Link, useLocation, useNavigate } from "react-router-dom";
import { Dumbbell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function SiteHeader() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const nav = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    nav("/");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
            <Dumbbell className="h-4.5 w-4.5" strokeWidth={2.5} />
          </span>
          Physiqo
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          {pathname === "/" && (
            <>
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
              <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            </>
          )}
          {user && pathname !== "/dashboard" && (
            <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              {pathname !== "/dashboard" && (
                <Button asChild size="sm" variant="brand"><Link to="/dashboard">Dashboard</Link></Button>
              )}
              <Button onClick={handleLogout} size="icon" variant="ghost" aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild size="sm" variant="brand"><Link to="/auth?mode=signup">Get started</Link></Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
