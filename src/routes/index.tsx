import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  ListChecks,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Refine — Tailor your resume to any job description" },
      {
        name: "description",
        content:
          "Build ATS-friendly resumes, paste any job description, and get rule-based scoring plus safe, grounded suggestions. Export a pixel-perfect PDF.",
      },
      { property: "og:title", content: "Refine — Tailor your resume to any job description" },
      {
        property: "og:description",
        content:
          "Deterministic ATS scoring, JD-specific suggestions that never invent facts, and PDF export that matches the preview exactly.",
      },
    ],
  }),
  component: Landing,
});

const NAV_LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#who", label: "Who it's for" },
  { href: "#compare", label: "Compare" },
  { href: "#faq", label: "FAQ" },
];

function Feature({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof FileText;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="relative rounded-xl border bg-card p-6 shadow-sm">
      <div className="absolute -top-3 left-6 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow">
        {n}
      </div>
      <h3 className="mt-2 text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

function Persona({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof GraduationCap;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen">
      <header
        className={
          "sticky top-0 z-40 w-full border-b transition-colors " +
          (scrolled ? "bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70" : "bg-background")
        }
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="text-lg font-bold tracking-tight">Refine</Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth">Get started</Link>
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
                <div className="mt-6 flex flex-col gap-1">
                  {NAV_LINKS.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-md px-3 py-2 text-sm hover:bg-accent"
                    >
                      {l.label}
                    </a>
                  ))}
                  <div className="mt-4 grid gap-2">
                    <Button asChild variant="outline">
                      <Link to="/auth" onClick={() => setMobileOpen(false)}>Sign in</Link>
                    </Button>
                    <Button asChild>
                      <Link to="/auth" onClick={() => setMobileOpen(false)}>Get started</Link>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-16 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-accent/50 px-3 py-1 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5" /> Deterministic scoring · grounded suggestions
          </div>
          <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl">
            The ATS-friendly resume builder that respects the facts.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-lg text-muted-foreground">
            Refine helps you build, upload, and tailor resumes to specific job descriptions. Rule-based
            scoring you can trust — and suggestions that only ever use the facts already in your resume.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Build my resume</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#how">See how it works</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section id="features" className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Feature icon={FileText} title="3 ATS-safe templates">
            Classic, Modern, Fresher. Single-column, semantic HTML, printer-friendly typography.
          </Feature>
          <Feature icon={Upload} title="Upload & parse">
            Import a PDF or DOCX resume and edit it as structured sections — no retyping.
          </Feature>
          <Feature icon={Target} title="Deterministic scoring">
            Rule-based ATS checks and keyword match. No black boxes, no hallucinated numbers.
          </Feature>
          <Feature icon={Sparkles} title="Grounded suggestions">
            Reword bullets, surface skills you already demonstrate, flag anything you don't have.
          </Feature>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How Refine works</h2>
            <p className="mt-3 text-muted-foreground">
              Five steps from a blank page (or an existing PDF) to a job-specific, ATS-scored resume.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
            <Step n={1} title="Build or upload">
              Start from a Classic, Modern, or Fresher template — or upload your existing PDF/DOCX and
              Refine parses it into editable sections.
            </Step>
            <Step n={2} title="Paste the JD">
              Drop the full job description into the Optimize screen for the resume version you're
              tailoring.
            </Step>
            <Step n={3} title="Review suggestions">
              See two kinds: safe rewording using words already in your resume, and honest flags for
              skills the JD wants that you don't have.
            </Step>
            <Step n={4} title="Confirm & apply">
              Toggle each suggestion, confirm any missing skills you actually do have, then apply the
              batch as a new version or overwrite the current one.
            </Step>
            <Step n={5} title="Score & export">
              Compare before/after ATS and match scores, then export a PDF that pixel-matches the live
              preview.
            </Step>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section id="who" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Who Refine is for</h2>
          <p className="mt-3 text-muted-foreground">
            Refine is built for people applying to real jobs, not for generic resume decoration.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <Persona icon={GraduationCap} title="Students & fresh graduates">
            Turn coursework, projects, and internships into an ATS-parseable first resume with the
            Fresher template, and check every application against the actual JD before sending.
          </Persona>
          <Persona icon={Briefcase} title="Experienced professionals">
            Keep one canonical resume and spin off tailored versions per role — surface the right
            skills, match the JD's phrasing, and export each one without breaking formatting.
          </Persona>
          <Persona icon={Repeat} title="Career switchers">
            Reframe existing bullets around the vocabulary of the new field. Refine flags gaps
            honestly so you can decide what to learn next rather than paper over what you don't know.
          </Persona>
        </div>
      </section>

      {/* Comparison */}
      <section id="compare" className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Refine vs. a typical resume builder
            </h2>
            <p className="mt-3 text-muted-foreground">
              Most builders stop at pretty templates. Refine is built around the job you're applying to.
            </p>
          </div>
          <div className="mt-10 overflow-x-auto rounded-xl border bg-card shadow-sm">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-4 font-medium">Capability</th>
                  <th className="p-4 font-medium">Typical builder</th>
                  <th className="p-4 font-medium text-primary">Refine</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  ["ATS-safe single-column templates", true, true],
                  ["Upload existing PDF/DOCX and edit as structured data", false, true],
                  ["Rule-based ATS score you can inspect", false, true],
                  ["Match score against a specific job description", false, true],
                  ["Suggestions grounded in your own resume text", false, true],
                  ["Explicit confirmation before adding a missing skill", false, true],
                  ["Multiple named versions per resume", false, true],
                  ["PDF export that exactly matches the live preview", false, true],
                ].map(([label, gen, refine]) => (
                  <tr key={label as string}>
                    <td className="p-4">{label}</td>
                    <td className="p-4">
                      {gen ? <Check className="h-4 w-4 text-primary" /> : <X className="h-4 w-4 text-muted-foreground" />}
                    </td>
                    <td className="p-4">
                      {refine ? <Check className="h-4 w-4 text-primary" /> : <X className="h-4 w-4 text-muted-foreground" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: ShieldCheck, title: "RLS-protected data", body: "Your resumes live in a database where row-level security means only you can read your own rows." },
            { icon: ListChecks, title: "Multiple versions", body: "Keep an original master and as many tailored versions as you need — mark one as current at a time." },
            { icon: FileDown, title: "Preview = PDF", body: "The exported PDF is generated from the same DOM as the on-screen preview, so what you see is what you send." },
            { icon: Sparkles, title: "Opt-in AI", body: "Core scoring and suggestions don't require any AI call. AI-assisted wording is optional and always grounded." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-3">
              <div className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">{title}</div>
                <div className="text-sm text-muted-foreground">{body}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Frequently asked questions</h2>
            <p className="mt-3 text-muted-foreground">
              Straight answers about how Refine actually behaves.
            </p>
          </div>
          <Accordion type="single" collapsible className="mt-10">
            <AccordionItem value="q1">
              <AccordionTrigger>Will the AI make up things I haven't done?</AccordionTrigger>
              <AccordionContent>
                No. Rewording suggestions are generated by rules that only use words already in your
                resume — most commonly, matching a JD's exact casing (e.g. "Typescript" → "TypeScript")
                or promoting a skill you already mention in a bullet into your Skills section. When the
                JD asks for something you don't have, Refine shows it as a Type B flag with a "Do you
                actually have this?" prompt. Nothing gets added to your resume without your explicit
                confirmation and your own wording.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2">
              <AccordionTrigger>What file formats can I upload?</AccordionTrigger>
              <AccordionContent>
                PDF and DOCX. Refine extracts the text client-side, runs a heuristic segmenter to map
                it into structured sections (Personal info, Experience, Education, Projects, Skills,
                etc.), and drops you into a review screen so you can fix any parsing mistakes before
                saving.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3">
              <AccordionTrigger>Is my resume data private?</AccordionTrigger>
              <AccordionContent>
                Yes. Every resume, version, and job description is stored behind row-level security —
                the database policies mean only the authenticated owner of a row can read or modify
                it. Refine's server code accesses your data using your own session, not an admin key.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q4">
              <AccordionTrigger>Do I need to use the AI features?</AccordionTrigger>
              <AccordionContent>
                No. ATS scoring, keyword reporting, and the entire suggestions engine are pure
                rule-based TypeScript. You can build, tailor, and export a full resume without any AI
                call ever happening. AI-assisted wording is a separate opt-in step layered on top.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q5">
              <AccordionTrigger>Can I keep multiple tailored versions of the same resume?</AccordionTrigger>
              <AccordionContent>
                Yes. Each resume can have any number of named versions. You can mark one as the
                current version, apply suggestions as a new version to keep the original untouched,
                and switch between versions from the editor at any time.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q6">
              <AccordionTrigger>Does the exported PDF really match the preview?</AccordionTrigger>
              <AccordionContent>
                Yes. The exporter renders the exact same template DOM node used for the on-screen
                preview and captures it into a PDF. There is no separate server-side render, so styles,
                spacing, and page breaks stay identical.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Stop sending the same resume everywhere.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Sign in, upload or build a resume, and tailor it to the next job you apply to — without
          inventing anything you can't back up in an interview.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/auth">Get started free</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#faq">Read the FAQ</a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <div className="text-base font-bold">Refine</div>
              <p className="mt-2 text-sm text-muted-foreground">
                An honest, ATS-friendly resume builder for people applying to real jobs.
              </p>
            </div>
            <div>
              <div className="text-sm font-semibold">Product</div>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground">Features</a></li>
                <li><a href="#how" className="hover:text-foreground">How it works</a></li>
                <li><a href="#compare" className="hover:text-foreground">Compare</a></li>
                <li><a href="#faq" className="hover:text-foreground">FAQ</a></li>
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold">Account</div>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><Link to="/auth" className="hover:text-foreground">Sign in</Link></li>
                <li><Link to="/auth" className="hover:text-foreground">Create account</Link></li>
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold">Legal</div>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><span>Privacy — your data is RLS-protected</span></li>
                <li><span>Terms — use at your own discretion</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              © {new Date().getFullYear()} Refine
            </div>
            <div>Designed and Developed by Vaibhav Modi</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
