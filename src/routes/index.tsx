import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { CheckCircle2, FileText, Sparkles, Target, Upload } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Refine — AI-powered ATS resume builder" },
      {
        name: "description",
        content:
          "Build ATS-friendly resumes, score them against any job description, and export a pixel-perfect PDF. Deterministic scoring, optional AI wording.",
      },
      { property: "og:title", content: "Refine — AI-powered ATS resume builder" },
      {
        property: "og:description",
        content: "Build, optimize, and export ATS-friendly resumes tailored to any job.",
      },
    ],
  }),
  component: Landing,
});

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
    <div className="rounded-xl border bg-card p-6">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-bold tracking-tight">
            Refine
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-accent/50 px-3 py-1 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5" /> Deterministic scoring · optional AI
          </div>
          <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl">
            The ATS-friendly resume builder that respects the facts.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-lg text-muted-foreground">
            Refine helps you build, optimize, and export resumes tailored to specific job
            descriptions. Rule-based scoring you can trust — AI only rewords, never invents.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Build my resume</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#how">How it works</a>
            </Button>
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Feature icon={FileText} title="3 ATS-safe templates">
            Classic, Modern, Fresher. Single-column, semantic, printer-friendly.
          </Feature>
          <Feature icon={Upload} title="Upload & parse">
            Import a PDF or DOCX and edit it as structured sections.
          </Feature>
          <Feature icon={Target} title="Deterministic scoring">
            Rule-based ATS and match scoring. No black boxes.
          </Feature>
          <Feature icon={Sparkles} title="Opt-in AI wording">
            Rephrase bullets without inventing new facts, orgs, dates, or metrics.
          </Feature>
        </div>
      </section>

      <section className="border-t bg-muted/40">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 sm:grid-cols-3">
          {[
            "ATS-friendly structure by default",
            "Multiple named versions per resume",
            "Live preview = exported PDF",
            "Keyword & missing-skills report",
            "Google & email sign-in",
            "Your data, RLS-protected",
          ].map((t) => (
            <div key={t} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
              <span>{t}</span>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-8 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Refine
        </div>
      </footer>
    </div>
  );
}
