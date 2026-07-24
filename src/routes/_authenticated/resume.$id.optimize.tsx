import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getResume } from "@/lib/resume.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Target } from "lucide-react";
import { resumeDataSchema, type ResumeData } from "@/lib/resume-schema";
import { scoreResumeAgainstJob } from "@/lib/scoring";

export const Route = createFileRoute("/_authenticated/resume/$id/optimize")({
  head: () => ({ meta: [{ title: "Optimize resume — Refine" }, { name: "robots", content: "noindex" }] }),
  component: OptimizePage,
});

function OptimizePage() {
  const { id } = Route.useParams();
  const get = useServerFn(getResume);
  const q = useQuery({ queryKey: ["resume", id], queryFn: () => get({ data: { resumeId: id } }) });
  const [jd, setJd] = useState("");

  const current = q.data?.versions.find((v) => v.is_current) ?? q.data?.versions[0];
  const parsed = current ? resumeDataSchema.safeParse(current.structured_data) : null;
  const data: ResumeData | null = parsed?.success ? parsed.data : (current?.structured_data as ResumeData) ?? null;

  const result = data && jd.trim() ? scoreResumeAgainstJob(data, jd) : null;

  return (
    <div className="space-y-4">
      <Link to="/resume/$id/edit" params={{ id }}>
        <Button size="sm" variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" /> Back to editor</Button>
      </Link>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-base font-semibold">Job description</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste the JD you're targeting. Scoring is deterministic — no AI required.
          </p>
          <Textarea
            className="mt-3 min-h-[380px]"
            placeholder="Paste job description here…"
            value={jd}
            onChange={(e) => setJd(e.target.value)}
          />
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <h2 className="text-base font-semibold">Scores & report</h2>
          </div>
          {!result ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Paste a job description to see your ATS score, match score, keyword coverage, and
              missing skills.
            </p>
          ) : (
            <div className="mt-4 space-y-5">
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span>ATS score</span>
                  <span className="font-semibold">{result.atsScore}/100</span>
                </div>
                <Progress value={result.atsScore} />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span>Match score</span>
                  <span className="font-semibold">{result.matchScore}/100</span>
                </div>
                <Progress value={result.matchScore} />
              </div>
              <div>
                <div className="mb-2 text-sm font-medium">Keywords found</div>
                <div className="flex flex-wrap gap-1">
                  {result.keywordsFound.slice(0, 40).map((k) => (
                    <Badge key={k} variant="secondary">{k}</Badge>
                  ))}
                  {result.keywordsFound.length === 0 && (
                    <span className="text-xs text-muted-foreground">None yet.</span>
                  )}
                </div>
              </div>
              <div>
                <div className="mb-2 text-sm font-medium">Missing skills</div>
                <div className="flex flex-wrap gap-1">
                  {result.missingSkills.slice(0, 40).map((k) => (
                    <Badge key={k} variant="outline" className="border-destructive/60 text-destructive">
                      {k}
                    </Badge>
                  ))}
                  {result.missingSkills.length === 0 && (
                    <span className="text-xs text-muted-foreground">Nothing obvious missing.</span>
                  )}
                </div>
              </div>
              <div>
                <div className="mb-2 text-sm font-medium">ATS checks</div>
                <ul className="space-y-1 text-sm">
                  {result.checks.map((c) => (
                    <li key={c.label} className="flex items-center gap-2">
                      <span
                        className={
                          "inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-primary-foreground " +
                          (c.pass ? "bg-primary" : "bg-destructive")
                        }
                      >
                        {c.pass ? "✓" : "!"}
                      </span>
                      <span>{c.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-xs text-muted-foreground">
                Optional AI wording suggestions will appear per-section in a follow-up update —
                and they will never invent new facts, employers, dates, or metrics.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
