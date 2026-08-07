import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  MailCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Target,
  FileText,
} from "lucide-react";

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
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (data?.session) navigate({ to: "/dashboard" });
      })
      .catch((err) => {
        console.warn("[Auth] Session check skipped:", err);
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
          description:
            "Please check your email inbox and click the verification link before logging in.",
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
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between overflow-x-hidden bg-grid-pattern relative">
      {/* Background Ambient Spheres */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-[130px]" />
      <div className="pointer-events-none absolute right-0 top-1/3 -z-10 h-[300px] w-[400px] rounded-full bg-indigo-500/10 blur-[110px]" />

      {/* Header Bar */}
      <header className="w-full px-6 py-5 border-b bg-background/60 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-base shadow-sm transition-transform group-hover:scale-105">
              R
            </div>
            <span className="text-xl font-bold tracking-tight">
              Refine<span className="text-primary font-black">AI</span>
            </span>
          </Link>
          <Link
            to="/"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="mx-auto my-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 items-center">
          {/* Left Side: Brand Showcase (Hidden on small mobile, visible on lg screens) */}
          <div className="lg:col-span-6 space-y-6 text-left hidden lg:block">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>ATS Resume Builder &amp; Optimizer</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl leading-tight">
              Turn your experience into{" "}
              <span className="bg-gradient-to-r from-primary via-indigo-600 to-sky-500 bg-clip-text text-transparent">
                interview callbacks.
              </span>
            </h1>

            <p className="text-muted-foreground text-base leading-relaxed max-w-lg">
              Join thousands of job seekers using RefineAI to build single-column ATS templates,
              score resumes against target JDs, and download high-resolution PDFs directly.
            </p>

            <div className="space-y-3 pt-2">
              {[
                "100% Grounded AI suggestions that never invent fake facts",
                "Deterministic ATS scoring rule engine with zero hallucinations",
                "Direct 1-click browser PDF export with zero print dialogs",
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-3 text-sm font-medium">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-border/60 flex items-center gap-6">
              <div>
                <div className="text-2xl font-black text-foreground">99.4%</div>
                <div className="text-xs text-muted-foreground">ATS Parse Rate</div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <div className="text-2xl font-black text-foreground">12,000+</div>
                <div className="text-xs text-muted-foreground">Resumes Crafted</div>
              </div>
            </div>
          </div>

          {/* Right Side / Centered Card: Auth Card */}
          <div className="lg:col-span-6 mx-auto w-full max-w-md">
            <div className="rounded-2xl border bg-card p-7 shadow-2xl backdrop-blur-xl">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold tracking-tight">
                  {activeTab === "signin" ? "Welcome back" : "Create your account"}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {activeTab === "signin"
                    ? "Sign in to access your saved resume versions"
                    : "Get started in 30 seconds — no credit card needed"}
                </p>
              </div>

              {/* Google OAuth Button */}
              <Button
                variant="outline"
                className="w-full h-11 text-sm font-semibold transition-all hover:bg-accent border-border/80"
                onClick={handleGoogle}
                disabled={busy}
              >
                <svg className="mr-2.5 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Continue with Google
              </Button>

              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                <span>or continue with email</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as "signin" | "signup")}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 h-11 p-1 bg-muted/60 rounded-xl">
                  <TabsTrigger value="signin" className="rounded-lg text-xs font-semibold">
                    Sign in
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="rounded-lg text-xs font-semibold">
                    Sign up
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="mt-4 space-y-4">
                  {verificationNoticeEmail && (
                    <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-xs text-blue-900 dark:text-blue-200 animate-in fade-in">
                      <div className="flex items-start gap-3">
                        <MailCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-sm">Verification email sent!</p>
                          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                            We sent a verification link to{" "}
                            <strong className="text-foreground">{verificationNoticeEmail}</strong>.
                            Please confirm your email before signing in below.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-1.5 text-left">
                      <Label htmlFor="e1" className="text-xs font-semibold">
                        Email Address
                      </Label>
                      <Input
                        id="e1"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-10 text-sm focus-visible:ring-primary"
                      />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <Label htmlFor="p1" className="text-xs font-semibold">
                        Password
                      </Label>
                      <Input
                        id="p1"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-10 text-sm focus-visible:ring-primary"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-11 font-semibold text-sm shadow-md transition-all hover:scale-[1.01]"
                      disabled={busy}
                    >
                      Sign In to RefineAI <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="mt-4 space-y-4">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-1.5 text-left">
                      <Label htmlFor="n2" className="text-xs font-semibold">
                        Full Name
                      </Label>
                      <Input
                        id="n2"
                        placeholder="Alex Morgan"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="h-10 text-sm focus-visible:ring-primary"
                      />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <Label htmlFor="e2" className="text-xs font-semibold">
                        Email Address
                      </Label>
                      <Input
                        id="e2"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-10 text-sm focus-visible:ring-primary"
                      />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <Label htmlFor="p2" className="text-xs font-semibold">
                        Password (6+ characters)
                      </Label>
                      <Input
                        id="p2"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                        required
                        className="h-10 text-sm focus-visible:ring-primary"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-11 font-semibold text-sm shadow-md transition-all hover:scale-[1.01]"
                      disabled={busy}
                    >
                      Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-6 py-4 border-t bg-background/60 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} RefineAI. All rights reserved. Secure Supabase Auth &amp; RLS
        Data Protection.
      </footer>
    </div>
  );
}
