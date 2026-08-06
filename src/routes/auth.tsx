import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — RefineAI" },
      { name: "description", content: "Sign in or create your RefineAI account." },
      { property: "og:title", content: "Sign in — RefineAI" },
      { property: "og:description", content: "Sign in or create your RefineAI account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [verificationNoticeEmail, setVerificationNoticeEmail] = useState<string | null>(null);

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
    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        return toast.error("Email not confirmed yet", {
          description: "Please check your email inbox and click the verification link before logging in.",
          duration: 6000,
        });
      }
      return toast.error(error.message);
    }
    navigate({ to: "/dashboard" });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/dashboard",
        data: { full_name: fullName },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);

    if (data.session) {
      toast.success("Account created successfully! Welcome to RefineAI.");
      navigate({ to: "/dashboard" });
    } else {
      setVerificationNoticeEmail(email);
      setActiveTab("signin");
      toast.success("Account created successfully!", {
        description: `A verification email has been sent to ${email}. Please check your inbox and confirm your email before signing in.`,
        duration: 8000,
      });
    }
  }

  async function handleGoogle() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/dashboard",
      },
    });
    if (error) {
      setBusy(false);
      return toast.error(error.message || "Google sign-in failed");
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex max-w-md flex-col px-6 pt-16">
        <Link to="/" className="mb-6 text-sm text-muted-foreground hover:text-foreground">
          ← Back to RefineAI
        </Link>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight">Welcome to RefineAI</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Build, score, and export ATS-friendly resumes.
          </p>

          <Button variant="outline" className="mt-6 w-full" onClick={handleGoogle} disabled={busy}>
            Continue with Google
          </Button>
          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "signin" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              {verificationNoticeEmail && (
                <div className="mt-4 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3.5 text-sm text-blue-900 dark:text-blue-200">
                  <div className="flex items-start gap-2.5">
                    <MailCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Verification link sent!</p>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        We sent a verification link to <strong className="text-foreground">{verificationNoticeEmail}</strong>. Please check your inbox and verify your email before logging in below.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <form onSubmit={handleSignIn} className="mt-4 space-y-3">
                <div>
                  <Label htmlFor="e1">Email</Label>
                  <Input
                    id="e1"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="p1">Password</Label>
                  <Input
                    id="p1"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  Sign in
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="mt-4 space-y-3">
                <div>
                  <Label htmlFor="n2">Full name</Label>
                  <Input
                    id="n2"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="e2">Email</Label>
                  <Input
                    id="e2"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="p2">Password</Label>
                  <Input
                    id="p2"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
