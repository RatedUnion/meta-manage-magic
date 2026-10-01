import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Owner sign in — Dedicated Ultimatum Appointed Associates" },
      {
        name: "description",
        content:
          "Secure sign in for Dedicated Ultimatum Appointed Associates staff to review booking history and appointment requests.",
      },
      { property: "og:title", content: "Owner sign in — Dedicated Ultimatum" },
      { property: "og:description", content: "Staff access to the booking history dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/bookings", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) navigate({ to: "/bookings", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const signInEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/bookings", replace: true });
  };

  const signUpEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      toast.success("Account created. Check your email to confirm, then sign in.");
      setMode("signin");
      return;
    }
    navigate({ to: "/bookings", replace: true });
  };

  return (
    <main className="min-h-screen bg-background px-4 py-16">
      <div className="mx-auto w-full max-w-md">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to site
        </Link>
        <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
          <h1 className="text-2xl font-semibold tracking-tight">Owner sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Booking history is private. Sign in to review appointment requests.
          </p>

          <form onSubmit={signInEmail} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={busy} className="w-full">
              <LogIn className="mr-2 h-4 w-4" /> Sign in
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
