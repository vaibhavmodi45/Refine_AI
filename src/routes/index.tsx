import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  CheckCircle2,
  FileText,
  Sparkles,
  Target,
  Upload,
  Menu,
  Check,
  X,
  GraduationCap,
  Briefcase,
  Repeat,
  ShieldCheck,
  FileDown,
  ArrowRight,
  TrendingUp,
  Zap,
  Star,
  CheckCircle,
  Layers,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RefineAI — AI-Powered ATS Resume Builder & Analyzer" },
      {
        name: "description",
        content:
          "Build ATS-friendly resumes, paste any job description, and get rule-based scoring plus safe, grounded suggestions with RefineAI. Export a pixel-perfect PDF directly.",
      },
      { property: "og:title", content: "RefineAI — AI-Powered ATS Resume Builder & Analyzer" },
      {
        property: "og:description",
        content:
          "Deterministic ATS scoring, JD-specific suggestions that never invent facts, and direct PDF download.",
      },
    ],
  }),
  component: Landing,
});

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#who", label: "Who it's for" },
  { href: "#compare", label: "Compare" },
  { href: "#faq", label: "FAQ" },
];

// Interactive Demo presets for the Hero Section Sandbox
const DEMO_PRESETS = [
  {
    role: "Senior Full-Stack Engineer",
    score: 96,
    matchedKeywords: ["TypeScript", "React", "Node.js", "GraphQL", "CI/CD", "TailwindCSS"],
    missingKeywords: ["Docker"],
    originalBullet: "Worked on frontend and backend features for the web application.",
    refinedBullet:
      "Engineered scalable React & Node.js microservices, cutting p95 API latency by 42% for 50k+ daily active users.",
  },
  {
    role: "AI Product Manager",
    score: 92,
    matchedKeywords: [
      "Roadmap",
      "Agile",
      "User Research",
      "A/B Testing",
      "SQL",
      "Product Analytics",
    ],
    missingKeywords: ["Jira Admin"],
    originalBullet: "Helped team improve user retention on the onboarding flow.",
    refinedBullet:
      "Spearheaded core AI onboarding redesign, boosting 30-day user retention by 28% across 6 sprint cycles.",
  },
  {
    role: "Lead Data Scientist",
    score: 89,
    matchedKeywords: ["Python", "SQL", "PyTorch", "Snowflake", "dbt", "Airflow"],
    missingKeywords: ["Kubernetes"],
    originalBullet: "Built machine learning models to analyze data pipelines.",
    refinedBullet:
      "Deployed automated PyTorch prediction pipelines processing 2TB daily streaming analytics on Snowflake.",
  },
];

/**
 * Scroll Reveal Hook to fade & slide elements on viewport intersection
 */
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );

    const elements = document.querySelectorAll(".reveal-on-scroll");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);
}

function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activePreset, setActivePreset] = useState(0);
  const [showRefined, setShowRefined] = useState(true);

  useScrollReveal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const demo = DEMO_PRESETS[activePreset];

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary overflow-x-hidden">
      {/* Glassmorphic Sticky Navbar with Fixed Spacing */}
      <header
        className={
          "sticky top-0 z-50 w-full border-b transition-all duration-300 " +
          (scrolled
            ? "bg-background/80 backdrop-blur-md border-border/60 shadow-xs py-2.5"
            : "bg-transparent border-transparent py-4")
        }
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-base shadow-sm transition-transform group-hover:scale-105">
              R
            </div>
            <span className="text-xl font-bold tracking-tight">
              Refine<span className="text-primary font-black">AI</span>
            </span>
          </Link>

          {/* Navigation Links with Proper Spacing & Gaps */}
          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-muted-foreground transition-all hover:text-foreground hover:scale-105"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Button asChild variant="ghost" size="sm" className="font-medium text-sm">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="shadow-sm font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all px-5"
            >
              <Link to="/auth">
                Get Started Free <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button size="icon" variant="ghost" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="mt-6 flex flex-col gap-3">
                  {NAV_LINKS.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-md px-3 py-2.5 text-base font-medium hover:bg-accent"
                    >
                      {l.label}
                    </a>
                  ))}
                  <div className="mt-6 grid gap-2.5">
                    <Button asChild variant="outline" className="w-full">
                      <Link to="/auth" onClick={() => setMobileOpen(false)}>
                        Sign in
                      </Link>
                    </Button>
                    <Button asChild className="w-full">
                      <Link to="/auth" onClick={() => setMobileOpen(false)}>
                        Get Started Free
                      </Link>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-20 sm:pt-16 sm:pb-28 bg-grid-pattern">
        {/* Glowing Background Spheres */}
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/10 blur-[140px]" />
        <div className="pointer-events-none absolute right-10 top-1/3 -z-10 h-[350px] w-[450px] rounded-full bg-indigo-500/10 blur-[120px]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Pill Badge */}
            <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary backdrop-blur-md shadow-xs animate-in fade-in duration-500">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Deterministic ATS Scoring &amp; Zero Hallucination Engine v2.0</span>
            </div>

            <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl leading-[1.1]">
              Build resumes that pass the{" "}
              <span className="bg-gradient-to-r from-primary via-indigo-600 to-sky-500 bg-clip-text text-transparent">
                ATS scanner
              </span>{" "}
              every time.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground leading-relaxed">
              RefineAI parses your resume, scores it against target job descriptions in real-time,
              and provides grounded bullet improvements using facts already in your experience.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="h-12 px-8 text-base shadow-lg hover:shadow-xl hover:scale-[1.03] active:scale-[0.98] transition-all font-semibold"
              >
                <Link to="/auth">
                  Build My Resume <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 px-7 text-base hover:bg-accent transition-all font-medium"
              >
                <a href="#how">See How It Works</a>
              </Button>
            </div>

            {/* Social Proof */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Free export
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Direct 1-Click PDF download
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> No credit card required
              </div>
            </div>
          </div>

          {/* Interactive Live ATS Showcase Card */}
          <div className="mt-14 overflow-hidden rounded-2xl border bg-card/80 p-4 sm:p-7 shadow-2xl backdrop-blur-xl transition-all reveal-on-scroll">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Live ATS Interactive Sandbox
                </span>
              </div>

              {/* Role Preset Tabs */}
              <div className="flex items-center gap-2 rounded-xl bg-muted/80 p-1.5 text-xs">
                {DEMO_PRESETS.map((p, idx) => (
                  <button
                    key={p.role}
                    onClick={() => setActivePreset(idx)}
                    className={
                      "rounded-lg px-3.5 py-1.5 font-medium transition-all cursor-pointer " +
                      (activePreset === idx
                        ? "bg-background text-foreground shadow-sm font-bold"
                        : "text-muted-foreground hover:text-foreground")
                    }
                  >
                    {p.role}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
              {/* Left Column: Sample Resume Card */}
              <div className="lg:col-span-7 rounded-xl border bg-background p-6 text-left shadow-xs">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-bold text-foreground text-base">Alex Morgan</h3>
                    <p className="text-xs text-muted-foreground">
                      San Francisco, CA · alex.morgan@example.com
                    </p>
                  </div>
                  <span className="rounded-md bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground border">
                    Classic ATS Template
                  </span>
                </div>

                {/* Grounded Bullet Improver Sandbox */}
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Bullet Optimization Comparison
                    </span>
                    <button
                      onClick={() => setShowRefined(!showRefined)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary/20 transition-all cursor-pointer"
                    >
                      <SlidersHorizontal className="h-3 w-3" /> Toggle{" "}
                      {showRefined ? "Original" : "Optimized"}
                    </button>
                  </div>

                  <div className="rounded-lg border bg-muted/20 p-3 text-xs leading-relaxed transition-all">
                    {showRefined ? (
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                          <Sparkles className="h-3 w-3" /> RefineAI Grounded Optimization
                        </div>
                        <p className="text-foreground font-medium">{demo.refinedBullet}</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground mb-1">
                          Original Draft
                        </div>
                        <p className="text-muted-foreground">{demo.originalBullet}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Matched Keywords ({demo.matchedKeywords.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {demo.matchedKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 text-[11px] font-semibold border border-emerald-500/20"
                      >
                        ✓ {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: ATS Match Gauge & Analysis */}
              <div className="lg:col-span-5 flex flex-col justify-between rounded-xl border bg-accent/30 p-6 text-left">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      ATS Match Score
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="h-3.5 w-3.5" /> High Match
                    </span>
                  </div>

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-5xl font-extrabold tracking-tight text-foreground">
                      {demo.score}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Compatibility with Job Posting
                    </span>
                  </div>

                  {/* Animated Score Progress Bar */}
                  <div className="mt-3 h-3 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-primary transition-all duration-700 ease-out"
                      style={{ width: `${demo.score}%` }}
                    />
                  </div>

                  <div className="mt-6 space-y-2">
                    <div className="text-xs font-bold text-foreground">Optimization Breakdown</div>
                    <div className="rounded-lg border bg-background/90 p-3.5 text-xs space-y-2">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <Check className="h-4 w-4" /> 100% Grounded in your experience
                      </div>
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold">
                        <Zap className="h-4 w-4" /> Missing keyword alert:{" "}
                        {demo.missingKeywords.join(", ")}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <Button asChild className="w-full h-11 font-semibold shadow-xs">
                    <Link to="/auth">Analyze My Resume Now</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Features Section */}
      <section id="features" className="py-20 border-t bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="mx-auto max-w-2xl text-center reveal-on-scroll">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
              Engineered for candidates who want callbacks.
            </h2>
            <p className="mt-4 text-muted-foreground text-balance text-base">
              Unlike generic AI writers that invent fake accomplishments, RefineAI uses
              deterministic ATS scoring and strict factual grounding.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="group rounded-2xl border bg-card p-6 shadow-xs transition-all hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 reveal-on-scroll">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">3 ATS-Safe Templates</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Classic, Modern, and Fresher templates designed in single-column semantic HTML to
                pass every ATS parser cleanly.
              </p>
            </div>

            <div className="group rounded-2xl border bg-card p-6 shadow-xs transition-all hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 reveal-on-scroll">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <Upload className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">PDF &amp; DOCX Import</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Upload your existing resume file. RefineAI extracts experience, education, and
                skills automatically without manual copy-pasting.
              </p>
            </div>

            <div className="group rounded-2xl border bg-card p-6 shadow-xs transition-all hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 reveal-on-scroll">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">Deterministic ATS Scoring</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Clear rule-based algorithm checks keyword density, formatting hygiene, and section
                completeness with 100% transparency.
              </p>
            </div>

            <div className="group rounded-2xl border bg-card p-6 shadow-xs transition-all hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 reveal-on-scroll">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <FileDown className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">Direct 1-Click PDF Download</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Download high-resolution PDF files directly to your device with 1 click — no print
                dialogs, no formatting glitches.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Step-by-Step */}
      <section id="how" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="mx-auto max-w-2xl text-center reveal-on-scroll">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              How RefineAI Works
            </h2>
            <p className="mt-3 text-muted-foreground">
              Five simple steps to turn any resume into a job-matched magnet.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            {[
              {
                step: "01",
                title: "Build or Upload",
                desc: "Start from scratch or upload your existing PDF/DOCX resume.",
              },
              {
                step: "02",
                title: "Paste Job Posting",
                desc: "Target any specific role by pasting the job posting requirements.",
              },
              {
                step: "03",
                title: "Review Suggestions",
                desc: "Get safe bullet improvements and missing keyword alerts.",
              },
              {
                step: "04",
                title: "Confirm & Apply",
                desc: "Approve improvements and create tailored resume versions easily.",
              },
              {
                step: "05",
                title: "Direct Download",
                desc: "Export crisp, pixel-perfect PDF files directly to your device.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative rounded-2xl border bg-card p-6 shadow-xs transition-all hover:border-primary/40 hover:shadow-md reveal-on-scroll"
              >
                <div className="text-3xl font-black text-primary/30 mb-2">{item.step}</div>
                <h3 className="text-base font-bold text-foreground">{item.title}</h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Target Audiences */}
      <section id="who" className="py-20 border-t bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="mx-auto max-w-2xl text-center reveal-on-scroll">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Tailored for Every Stage
            </h2>
            <p className="mt-3 text-muted-foreground">
              Built for professionals who need results, not generic templates.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border bg-card p-7 shadow-xs reveal-on-scroll">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">Students &amp; Fresh Grads</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Use our Fresher template to highlight projects, coursework, and internships in clean
                ATS format.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-7 shadow-xs reveal-on-scroll">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Briefcase className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">Experienced Professionals</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Maintain one master profile and generate customized versions for senior, lead, or
                manager roles in seconds.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-7 shadow-xs reveal-on-scroll">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Repeat className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">Career Switchers</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Reframe existing accomplishments into the vocabulary of target industries without
                embellishment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section id="compare" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="mx-auto max-w-2xl text-center reveal-on-scroll">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              RefineAI vs. Typical Builders
            </h2>
            <p className="mt-3 text-muted-foreground">
              Most resume builders focus on vanity designs. We focus on getting you hired.
            </p>
          </div>

          <div className="mt-12 overflow-hidden rounded-2xl border bg-card shadow-xs reveal-on-scroll">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="p-4 sm:p-5">Capability</th>
                    <th className="p-4 sm:p-5">Generic Resume Builder</th>
                    <th className="p-4 sm:p-5 text-primary">RefineAI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ["ATS-Verified Single Column Layouts", true, true],
                    ["PDF & DOCX Parsing into Structured Data", false, true],
                    ["Transparent, Rule-Based Keyword Match", false, true],
                    ["Zero Hallucination Bullet Optimization", false, true],
                    ["Multiple Target Versions Per Resume", false, true],
                    ["Direct 1-Click Browser PDF Download", false, true],
                  ].map(([cap, typical, refine]) => (
                    <tr key={cap as string} className="hover:bg-accent/40 transition-colors">
                      <td className="p-4 sm:p-5 font-semibold text-foreground">{cap}</td>
                      <td className="p-4 sm:p-5">
                        {typical ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground" />
                        )}
                      </td>
                      <td className="p-4 sm:p-5">
                        {refine ? (
                          <Check className="h-4 w-4 text-primary font-bold" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 border-t bg-muted/20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center reveal-on-scroll">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-muted-foreground">
              Everything you need to know about RefineAI.
            </p>
          </div>

          <Accordion type="single" collapsible className="mt-12 space-y-3 reveal-on-scroll">
            <AccordionItem value="q1" className="rounded-xl border bg-card px-5 py-1">
              <AccordionTrigger className="font-semibold text-left">
                Will RefineAI invent fake experience?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                No. RefineAI operates on strict factual grounding. Suggestions reword and emphasize
                existing accomplishments from your resume to match job description phrasing without
                hallucinating fake jobs or metrics.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2" className="rounded-xl border bg-card px-5 py-1">
              <AccordionTrigger className="font-semibold text-left">
                How does PDF downloading work?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Our PDF engine rasterizes your resume template directly on the client side into a
                crisp A4 vector document and initiates a direct file download straight into your
                browser's download folder.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3" className="rounded-xl border bg-card px-5 py-1">
              <AccordionTrigger className="font-semibold text-left">
                Is my personal data secure?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Yes. All your resume records and target job descriptions are protected by database
                Row-Level Security (RLS). Only your authenticated account can access or modify your
                files.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="relative overflow-hidden py-20 bg-primary/5 border-t">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center reveal-on-scroll">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
            Ready to build a job-winning ATS resume?
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Join thousands of job seekers optimizing their resumes for real results today.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="h-12 px-8 text-base shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all font-semibold"
            >
              <Link to="/auth">
                Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 py-12">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 font-bold text-foreground text-base">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-black">
                  R
                </span>
                RefineAI
              </div>
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                The ATS-friendly resume builder that respects the facts.
              </p>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-foreground">
                Product
              </div>
              <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                <li>
                  <a href="#features" className="hover:text-foreground">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how" className="hover:text-foreground">
                    How it works
                  </a>
                </li>
                <li>
                  <a href="#compare" className="hover:text-foreground">
                    Compare
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-foreground">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-foreground">
                Account
              </div>
              <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                <li>
                  <Link to="/auth" className="hover:text-foreground">
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link to="/auth" className="hover:text-foreground">
                    Create account
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-foreground">
                Security &amp; Legal
              </div>
              <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                <li>
                  <span>RLS Database Protection</span>
                </li>
                <li>
                  <span>Client-Side PDF Processing</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />© {new Date().getFullYear()}{" "}
              RefineAI. All rights reserved.
            </div>
            <div>Designed and Developed by Vaibhav Modi</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
