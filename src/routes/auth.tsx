import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Refine" },
      { name: "description", content: "Sign in or create your Refine account." },
      { property: "og:title", content: "Sign in — Refine" },
      { property: "og:description", content: "Sign in or create your Refine account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    navigate({ to: "/dashboard" });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/dashboard",
        data: { full_name: fullName },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Check your email to confirm your account.");
  }

  async function handleGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      return toast.error(result.error.message || "Google sign-in failed");
    }
    if (result.redirected) return; // browser navigating away
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex max-w-md flex-col px-6 pt-16">
        <Link to="/" className="mb-6 text-sm text-muted-foreground hover:text-foreground">
          ← Back to Refine
        </Link>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight">Welcome to Refine</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Build, score, and export ATS-friendly resumes.
          </p>

          <Button
            variant="outline"
            className="mt-6 w-full"
            onClick={handleGoogle}
            disabled={busy}
          >
            Continue with Google
          </Button>
          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="mt-4 space-y-3">
                <div>
                  <Label htmlFor="e1">Email</Label>
                  <Input id="e1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="p1">Password</Label>
                  <Input id="p1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>Sign in</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="mt-4 space-y-3">
                <div>
                  <Label htmlFor="n2">Full name</Label>
                  <Input id="n2" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="e2">Email</Label>
                  <Input id="e2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="p2">Password</Label>
                  <Input id="p2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>Create account</Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
