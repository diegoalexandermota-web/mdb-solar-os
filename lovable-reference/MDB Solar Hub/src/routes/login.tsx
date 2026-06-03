import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Sun, ArrowRight, ShieldCheck, Zap, Droplets, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — MDB Solar OS" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: "/dashboard", replace: true });
  }, [session, navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
  }

  async function handleGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/dashboard",
    });
    if (result.error) {
      setBusy(false);
      toast.error("Google sign-in failed");
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left brand panel */}
      <div className="hidden lg:flex relative flex-col justify-between p-12 text-primary-foreground overflow-hidden"
           style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute -top-32 -right-32 size-96 rounded-full bg-gold/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 size-96 rounded-full bg-primary-glow/30 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="size-11 rounded-xl bg-gold grid place-items-center shadow-elegant">
            <Sun className="size-6 text-gold-foreground" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight">MDB Solar OS</div>
            <div className="text-xs uppercase tracking-widest opacity-70">Operating System</div>
          </div>
        </div>
        <div className="relative space-y-6">
          <h1 className="text-5xl font-bold leading-tight tracking-tight">
            The operating system for <span className="text-gold">solar, water & home</span> teams.
          </h1>
          <p className="text-lg opacity-80 max-w-md">
            Run every lead from doorknock to PTO. AI-drafted follow-ups, drag-and-drop pipeline,
            proposals in 60 seconds, commission tracking — built specifically for MDB.
          </p>
          <div className="grid grid-cols-3 gap-3 max-w-md pt-4">
            {[
              { icon: Zap, label: "Solar" },
              { icon: Droplets, label: "Water" },
              { icon: ShieldCheck, label: "Home" },
            ].map((p) => (
              <div key={p.label} className="rounded-lg bg-white/10 backdrop-blur p-3 border border-white/10">
                <p.icon className="size-5 text-gold mb-2" />
                <div className="text-xs font-medium opacity-90">{p.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-xs opacity-60">© 2026 MDB Home Improvement, LLC. Florida lic. CVC57001234.</div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-primary grid place-items-center">
              <Sun className="size-5 text-gold" strokeWidth={2.5} />
            </div>
            <div className="font-bold tracking-tight">MDB Solar OS</div>
          </div>
          <div className="space-y-2">
            <div className="text-xs font-semibold text-primary uppercase tracking-widest">Sign in</div>
            <h2 className="text-3xl font-bold tracking-tight">Welcome back, MDB rep.</h2>
            <p className="text-muted-foreground text-sm">
              Pipeline, proposals, and your AI copilot are one click away.
            </p>
          </div>
          <form
            onSubmit={handleLogin}
            className="space-y-4"
          >
            <Button type="button" onClick={handleGoogle} disabled={busy} variant="outline" className="w-full gap-2">
              <svg viewBox="0 0 24 24" className="size-4"><path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.05 1.05-2.7 2.2-5.59 2.2c-4.45 0-7.94-3.6-7.94-8.05s3.49-8.05 7.94-8.05c2.41 0 4.16.94 5.46 2.16l2.33-2.33C18.43 2.21 16.03 1 12.48 1C5.67 1 0 6.67 0 13.48S5.67 25.96 12.48 25.96c3.65 0 6.4-1.2 8.53-3.43c2.2-2.2 2.88-5.3 2.88-7.8c0-.78-.06-1.49-.18-2.07h-11.23z"/></svg>
              Continue with Google
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or with email</span></div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Work email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full px-3.5 py-2.5 rounded-md border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <label className="text-xs font-medium text-foreground">Password</label>
                <a className="text-xs text-primary hover:underline cursor-pointer">Forgot?</a>
              </div>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full px-3.5 py-2.5 rounded-md border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button type="submit" size="lg" disabled={busy} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <>Sign in to MDB OS <ArrowRight className="size-4" /></>}
            </Button>
            <div className="text-center text-xs text-muted-foreground">
              New here? <Link to="/signup" className="text-primary font-medium hover:underline">Create an account</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}