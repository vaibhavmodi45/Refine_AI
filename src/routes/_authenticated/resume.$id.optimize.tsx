import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { getResume, saveResumeVersion } from "@/lib/resume.functions";
import { aiEnhanceAnalysis, type AiEnhanceResult } from "@/lib/ai-enhance.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Sparkles,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Wand2,
  Loader2,
  Brain,
  LayoutDashboard,
  ChevronRight,
} from "lucide-react";
import { resumeDataSchema, type ResumeData, type TemplateId } from "@/lib/resume-schema";
import { scoreResumeAgainstJob, type ScoringResult } from "@/lib/scoring";
import {
  applySuggestions,
  generateSuggestions,
  verifyTypeASafety,
  type ConfirmedTypeB,
  type Suggestion,
  type SuggestionA,
  type SectionGroup,
} from "@/lib/suggestions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/resume/$id/optimize")({
  head: () => ({
    meta: [{ title: "Optimize — RefineAI" }, { name: "robots", content: "noindex" }],
  }),
  component: OptimizePage,
});

type BConfirm = {
  confirmed: boolean;
  placement: "skills" | "experience_bullet";
  category?: string;
  expIndex?: number;
  wording: string;
};

function OptimizePage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const get = useServerFn(getResume);
  const save = useServerFn(saveResumeVersion);
  const q = useQuery({ queryKey: ["resume", id], queryFn: () => get({ data: { resumeId: id } }) });

  const [jd, setJd] = useState("");
  const [includeA, setIncludeA] = useState<Record<string, boolean>>({});
  const [bState, setBState] = useState<Record<string, BConfirm>>({});
  const [saveOpen, setSaveOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [postSaveScore, setPostSaveScore] = useState<ScoringResult | null>(null);
  const [beforeScore, setBeforeScore] = useState<ScoringResult | null>(null);
  const [confirmBOpen, setConfirmBOpen] = useState<string | null>(null);
  // AI-enhanced analysis (opt-in)
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiEnhanceResult | null>(null);
  const runAi = useServerFn(aiEnhanceAnalysis);

  const current = q.data?.versions.find((v) => v.is_current) ?? q.data?.versions[0];
  const template: TemplateId = (current?.template as TemplateId) ?? "classic";
  const parsed = current ? resumeDataSchema.safeParse(current.structured_data) : null;
  const data: ResumeData | null = parsed?.success
    ? parsed.data
    : ((current?.structured_data as ResumeData) ?? null);

  const result = useMemo(
    () => (data && jd.trim() ? scoreResumeAgainstJob(data, jd) : null),
    [data, jd],
  );

  const suggestions = useMemo(
    () => (data && jd.trim() ? generateSuggestions(data, jd) : []),
    [data, jd],
  );

  // Default toggle state when suggestions change
  useMemo(() => {
    const nextA: Record<string, boolean> = {};
    const nextB: Record<string, BConfirm> = {};
    for (const s of suggestions) {
      if (s.type === "A") nextA[s.id] = includeA[s.id] ?? true;
      else
        nextB[s.id] = bState[s.id] ?? {
          confirmed: false,
          placement: "skills",
          wording: s.keyword,
        };
    }
    setIncludeA(nextA);
    setBState(nextB);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestions.map((s) => s.id).join(",")]);

  // Semantic matches AI found — used to visually strike-through Type B / missing skills.
  const aiCoveredSet = useMemo(() => {
    const s = new Set<string>();
    (aiResult?.semanticMatches ?? []).forEach((m) => s.add(m.jdTerm.toLowerCase()));
    return s;
  }, [aiResult]);

  const displayedSuggestions = useMemo(() => {
    if (!aiEnabled || !aiResult) return suggestions;
    // Hide Type B suggestions that AI reports as semantically already covered.
    return suggestions.filter(
      (s) => !(s.type === "B" && aiCoveredSet.has(s.keyword.toLowerCase())),
    );
  }, [suggestions, aiEnabled, aiResult, aiCoveredSet]);

  const grouped = useMemo(() => {
    const g: Record<SectionGroup, Suggestion[]> = {
      Summary: [],
      Experience: [],
      Projects: [],
      Skills: [],
    };
    for (const s of displayedSuggestions) g[s.section].push(s);
    return g;
  }, [displayedSuggestions]);

  const selectedACount = displayedSuggestions.filter(
    (s) => s.type === "A" && includeA[s.id],
  ).length;
  const confirmedBCount = displayedSuggestions.filter(
    (s) => s.type === "B" && bState[s.id]?.confirmed && bState[s.id]?.wording.trim(),
  ).length;
  const totalSelected = selectedACount + confirmedBCount;

  // Debounced AI call when enabled and JD changes.
  useEffect(() => {
    if (!aiEnabled || !data || !jd.trim() || jd.trim().length < 40) {
      setAiResult(null);
      return;
    }
    const missing = result?.missingSkills ?? [];
    let cancelled = false;
    setAiLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await runAi({ data: { resume: data, jd, missingSkills: missing } });
        if (!cancelled) setAiResult(res);
      } catch (e) {
        if (!cancelled) {
          setAiResult(null);
          toast.error(
            "AI-enhanced analysis is unavailable right now — showing deterministic results.",
          );
          console.error("AI enhance failed:", e);
        }
      } finally {
        if (!cancelled) setAiLoading(false);
      }
    }, 900);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiEnabled, jd, current?.id]);

  async function doSave(mode: "overwrite" | "new") {
    if (!data || !current) return;
    setSaving(true);
    try {
      const selectedA = displayedSuggestions.filter(
        (s): s is SuggestionA => s.type === "A" && !!includeA[s.id],
      );
      const safety = verifyTypeASafety(data, selectedA);
      if (!safety.ok) {
        toast.error(`Blocked unsafe suggestion: ${safety.violations[0]}`);
        setSaving(false);
        return;
      }
      const confirmedB: ConfirmedTypeB[] = displayedSuggestions
        .filter((s): s is Extract<Suggestion, { type: "B" }> => s.type === "B")
        .filter((s) => bState[s.id]?.confirmed && bState[s.id]?.wording.trim())
        .map((s) => {
          const st = bState[s.id];
          return {
            keyword: s.keyword,
            placement: st.placement,
            category: st.category,
            expIndex: st.expIndex,
            wording: st.wording.trim(),
          };
        });
      const before = scoreResumeAgainstJob(data, jd);
      const updated = applySuggestions(data, selectedA, confirmedB);
      const after = scoreResumeAgainstJob(updated, jd);

      await save({
        data: {
          resumeId: id,
          versionId: mode === "overwrite" ? current.id : undefined,
          template,
          data: updated,
          mode,
          label: mode === "new" ? `Tailored ${new Date().toLocaleDateString()}` : undefined,
        },
      });

      setBeforeScore(before);
      setPostSaveScore(after);
      setSaveOpen(false);
      // Reset selections so re-runs start fresh
      setIncludeA({});
      setBState({});
      toast.success(mode === "new" ? "Saved as a new version" : "Overwrote current version");
      router.invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (q.isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!data)
    return <div className="text-sm text-muted-foreground">No resume version available.</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 hover:text-foreground font-medium transition-colors"
          >
            <LayoutDashboard className="h-4 w-4 text-primary" /> Dashboard
          </Link>
          <ChevronRight className="h-3.5 w-3.5 opacity-50" />
          <Link
            to="/resume/$id/edit"
            params={{ id }}
            className="hover:text-foreground font-medium transition-colors max-w-[200px] truncate"
          >
            {q.data?.resume.title || "Resume"}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 opacity-50" />
          <span className="font-semibold text-foreground">ATS Target Optimizer</span>
        </nav>
        {totalSelected > 0 && (
          <Button size="sm" onClick={() => setSaveOpen(true)}>
            <Wand2 className="mr-2 h-4 w-4" /> Apply {totalSelected} selected
          </Button>
        )}
      </div>

      {postSaveScore && beforeScore && (
        <Card className="border-primary/40 bg-primary/5 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">Suggestions applied — new scores</div>
              <div className="mt-1 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>
                  ATS:{" "}
                  <b className="text-foreground">
                    {beforeScore.atsScore} → {postSaveScore.atsScore}
                  </b>
                </span>
                <span>
                  Match:{" "}
                  <b className="text-foreground">
                    {beforeScore.matchScore} → {postSaveScore.matchScore}
                  </b>
                </span>
                <span>
                  Missing skills:{" "}
                  <b className="text-foreground">
                    {beforeScore.missingSkills.length} → {postSaveScore.missingSkills.length}
                  </b>
                </span>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setPostSaveScore(null);
                setBeforeScore(null);
              }}
            >
              Dismiss
            </Button>
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-base font-semibold">Job description</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Core scoring is always deterministic and rule-based. AI-enhanced analysis is available
            as an optional layer on top — it never adds skills to your resume on its own.
          </p>
          <div className="mt-3 flex items-center justify-between rounded-md border bg-muted/40 p-3">
            <div className="flex items-start gap-2">
              <Brain className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <div className="text-sm font-medium">AI-enhanced analysis (optional)</div>
                <div className="text-xs text-muted-foreground">
                  Catches semantic matches the string-matcher misses and refines rewordings. Type B
                  confirmation is still required for any new skill.
                </div>
              </div>
            </div>
            <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
          </div>
          <Textarea
            className="mt-3 min-h-[340px]"
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
            <div className="mt-6 flex flex-col items-center justify-center py-10 text-center text-sm text-muted-foreground">
              <Sparkles className="mb-3 h-8 w-8 opacity-50" />
              Paste a job description to see your ATS score, match score, and tailored suggestions.
            </div>
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
                <div className="mb-2 text-sm font-medium">
                  Keywords found ({result.keywordsFound.length})
                </div>
                <div className="flex flex-wrap gap-1">
                  {result.keywordsFound.slice(0, 40).map((k) => (
                    <Badge key={k} variant="secondary">
                      {k}
                    </Badge>
                  ))}
                  {result.keywordsFound.length === 0 && (
                    <span className="text-xs text-muted-foreground">None yet.</span>
                  )}
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <span>
                    Missing skills (
                    {result.missingSkills.filter((k) => !aiCoveredSet.has(k.toLowerCase())).length})
                  </span>
                  {aiEnabled && aiResult && aiResult.semanticMatches.length > 0 && (
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                      <Brain className="mr-1 h-3 w-3" /> AI found {aiResult.semanticMatches.length}{" "}
                      additional match{aiResult.semanticMatches.length === 1 ? "" : "es"}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {result.missingSkills.slice(0, 40).map((k) => {
                    const covered = aiCoveredSet.has(k.toLowerCase());
                    return (
                      <Badge
                        key={k}
                        variant="outline"
                        className={
                          covered
                            ? "border-primary/40 text-primary line-through opacity-70"
                            : "border-destructive/60 text-destructive"
                        }
                        title={
                          covered
                            ? "AI: your resume already covers this via different wording"
                            : undefined
                        }
                      >
                        {k}
                      </Badge>
                    );
                  })}
                  {result.missingSkills.length === 0 && (
                    <span className="text-xs text-muted-foreground">Nothing obvious missing.</span>
                  )}
                </div>
              </div>
              <div>
                <div className="mb-2 text-sm font-medium">ATS checks</div>
                <ul className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
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
            </div>
          )}
        </Card>
      </div>

      {aiEnabled && (aiLoading || aiResult) && (
        <Card className="border-primary/30 bg-primary/5 p-5">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">AI-enhanced analysis</h2>
            {aiLoading && (
              <Loader2 className="ml-1 h-3.5 w-3.5 animate-spin text-muted-foreground" />
            )}
          </div>
          {!aiLoading && aiResult && (
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div>
                <div className="mb-2 text-sm font-medium">
                  Semantic matches ({aiResult.semanticMatches.length})
                </div>
                {aiResult.semanticMatches.length === 0 ? (
                  <div className="text-xs text-muted-foreground">
                    No additional matches beyond keyword search.
                  </div>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {aiResult.semanticMatches.slice(0, 8).map((m, i) => (
                      <li key={i} className="rounded-md border bg-background/60 p-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="font-mono text-xs">
                            {m.jdTerm}
                          </Badge>
                          <span className="text-xs text-muted-foreground">covered by</span>
                          <span className="text-xs font-medium">"{m.evidence}"</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <div className="mb-2 text-sm font-medium">
                  AI rewording ideas ({aiResult.enhancedRewordings.length})
                </div>
                {aiResult.enhancedRewordings.length === 0 ? (
                  <div className="text-xs text-muted-foreground">
                    No safe rewording opportunities found.
                  </div>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {aiResult.enhancedRewordings.slice(0, 6).map((r, i) => (
                      <li key={i} className="rounded-md border bg-background/60 p-2 text-xs">
                        <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                          {r.section}
                        </div>
                        <div className="text-muted-foreground line-through">{r.before}</div>
                        <div className="mt-1 font-medium">{r.after}</div>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-2 text-[11px] text-muted-foreground">
                  Ideas only — apply manually in the editor. AI never adds new facts.
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {result && (
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <h2 className="text-base font-semibold">Suggestions ({suggestions.length})</h2>
            </div>
            <div className="text-xs text-muted-foreground">
              <span className="mr-3">
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-primary" /> Type A: safe
                rewording
              </span>
              <span>
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-destructive" /> Type B:
                needs your confirmation
              </span>
            </div>
          </div>

          {suggestions.length === 0 ? (
            <div className="mt-6 flex flex-col items-center py-8 text-center text-sm text-muted-foreground">
              <CheckCircle2 className="mb-2 h-8 w-8 text-primary" />
              Your resume already covers this JD well — no suggestions.
            </div>
          ) : (
            <Accordion
              type="multiple"
              defaultValue={["Skills", "Experience", "Projects", "Summary"]}
              className="mt-4"
            >
              {(["Summary", "Experience", "Projects", "Skills"] as SectionGroup[]).map((sec) => {
                const items = grouped[sec];
                if (!items.length) return null;
                return (
                  <AccordionItem key={sec} value={sec}>
                    <AccordionTrigger>
                      {sec}{" "}
                      <Badge variant="secondary" className="ml-2">
                        {items.length}
                      </Badge>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      {items.map((s) =>
                        s.type === "A" ? (
                          <SuggestionACard
                            key={s.id}
                            s={s}
                            checked={!!includeA[s.id]}
                            onToggle={(v) => setIncludeA((p) => ({ ...p, [s.id]: v }))}
                          />
                        ) : (
                          <SuggestionBCard
                            key={s.id}
                            s={s}
                            state={
                              bState[s.id] ?? {
                                confirmed: false,
                                placement: "skills",
                                wording: s.keyword,
                              }
                            }
                            resume={data}
                            onOpenConfirm={() => setConfirmBOpen(s.id)}
                            onUpdate={(patch) =>
                              setBState((p) => ({ ...p, [s.id]: { ...p[s.id], ...patch } }))
                            }
                          />
                        ),
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </Card>
      )}

      {/* Type B confirm dialog */}
      {confirmBOpen &&
        (() => {
          const s = suggestions.find((x) => x.id === confirmBOpen);
          if (!s || s.type !== "B") return null;
          const st = bState[s.id] ?? {
            confirmed: false,
            placement: "skills" as const,
            wording: s.keyword,
          };
          return (
            <Dialog open onOpenChange={(o) => !o && setConfirmBOpen(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Do you have "{s.keyword}"?</DialogTitle>
                  <DialogDescription>
                    The JD mentions this but it isn't in your resume. Only confirm if you actually
                    have the skill — Refine will never add it otherwise.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Where should this go?</label>
                    <Select
                      value={st.placement}
                      onValueChange={(v) =>
                        setBState((p) => ({
                          ...p,
                          [s.id]: { ...st, placement: v as "skills" | "experience_bullet" },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skills">Skills section</SelectItem>
                        <SelectItem value="experience_bullet" disabled={!data.experience.length}>
                          As a bullet under an experience
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {st.placement === "skills" && data.skills.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Skill category</label>
                      <Select
                        value={st.category ?? data.skills[0].category}
                        onValueChange={(v) =>
                          setBState((p) => ({ ...p, [s.id]: { ...st, category: v } }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {data.skills.map((g) => (
                            <SelectItem key={g.category} value={g.category}>
                              {g.category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {st.placement === "experience_bullet" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Add as bullet under</label>
                      <Select
                        value={String(st.expIndex ?? 0)}
                        onValueChange={(v) =>
                          setBState((p) => ({ ...p, [s.id]: { ...st, expIndex: Number(v) } }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {data.experience.map((e, i) => (
                            <SelectItem key={i} value={String(i)}>
                              {e.role} — {e.company}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {st.placement === "skills" ? "Exact wording for the skill" : "Bullet wording"}
                    </label>
                    {st.placement === "skills" ? (
                      <Input
                        value={st.wording}
                        onChange={(e) =>
                          setBState((p) => ({ ...p, [s.id]: { ...st, wording: e.target.value } }))
                        }
                      />
                    ) : (
                      <Textarea
                        rows={2}
                        value={st.wording}
                        onChange={(e) =>
                          setBState((p) => ({ ...p, [s.id]: { ...st, wording: e.target.value } }))
                        }
                        placeholder={`Describe your ${s.keyword} experience honestly…`}
                      />
                    )}
                    <p className="text-xs text-muted-foreground">
                      You control the exact wording. Refine will never invent phrasing for skills
                      you haven't confirmed.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setConfirmBOpen(null)}>
                    I don't have this
                  </Button>
                  <Button
                    onClick={() => {
                      if (!st.wording.trim()) {
                        toast.error("Please enter wording before confirming.");
                        return;
                      }
                      setBState((p) => ({
                        ...p,
                        [s.id]: {
                          ...st,
                          confirmed: true,
                          category: st.category ?? data.skills[0]?.category ?? "Skills",
                          expIndex: st.expIndex ?? 0,
                        },
                      }));
                      setConfirmBOpen(null);
                    }}
                  >
                    Yes, I have this
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          );
        })()}

      {/* Save mode confirm */}
      <AlertDialog open={saveOpen} onOpenChange={setSaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Apply {totalSelected} suggestion{totalSelected === 1 ? "" : "s"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Save the changes as a new version (recommended — keeps the current one untouched) or
              overwrite the current version.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="outline" disabled={saving} onClick={() => doSave("overwrite")}>
              Overwrite current
            </Button>
            <AlertDialogAction disabled={saving} onClick={() => doSave("new")}>
              Save as new version
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SuggestionACard({
  s,
  checked,
  onToggle,
}: {
  s: SuggestionA;
  checked: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="flex items-start gap-3">
        <Checkbox checked={checked} onCheckedChange={(v) => onToggle(!!v)} className="mt-1" />
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-primary text-primary-foreground">Type A · safe</Badge>
            <Badge variant="outline">
              {s.kind === "add_to_skills" ? "Add to Skills" : "Match JD casing"}
            </Badge>
            <span className="text-sm font-medium">{s.keyword}</span>
          </div>
          <p className="text-xs text-muted-foreground">{s.rationale}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded border bg-muted/40 p-2 text-xs">
              <div className="mb-1 font-semibold text-muted-foreground">Before</div>
              <div className="whitespace-pre-wrap break-words">{s.before}</div>
            </div>
            <div className="rounded border border-primary/40 bg-primary/5 p-2 text-xs">
              <div className="mb-1 font-semibold text-primary">After</div>
              <div className="whitespace-pre-wrap break-words">
                <HighlightedDiff before={s.before} after={s.after} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuggestionBCard({
  s,
  state,
  resume,
  onOpenConfirm,
  onUpdate,
}: {
  s: Extract<Suggestion, { type: "B" }>;
  state: BConfirm;
  resume: ResumeData;
  onOpenConfirm: () => void;
  onUpdate: (patch: Partial<BConfirm>) => void;
}) {
  void resume;
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
      <div className="flex items-start gap-3">
        <Checkbox
          checked={state.confirmed}
          onCheckedChange={(v) => {
            if (v) onOpenConfirm();
            else onUpdate({ confirmed: false });
          }}
          className="mt-1"
        />
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-destructive/50 text-destructive">
              Type B · needs confirmation
            </Badge>
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium">{s.keyword}</span>
          </div>
          <p className="text-xs text-muted-foreground">{s.rationale}</p>
          {state.confirmed ? (
            <div className="rounded border border-primary/40 bg-primary/5 p-2 text-xs">
              <div className="mb-1 font-semibold text-primary">Will add</div>
              <div className="break-words">
                {state.placement === "skills"
                  ? `"${state.wording}" under Skills · ${state.category ?? "?"}`
                  : `Bullet under experience #${(state.expIndex ?? 0) + 1}: "${state.wording}"`}
              </div>
              <button type="button" onClick={onOpenConfirm} className="mt-2 text-[11px] underline">
                Edit
              </button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={onOpenConfirm}>
              I have this — confirm
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function HighlightedDiff({ before, after }: { before: string; after: string }) {
  // Show `after` with tokens that differ from `before` (case-insensitive) highlighted.
  const beforeTokens = new Set(before.split(/\s+/));
  const parts = after.split(/(\s+)/);
  return (
    <>
      {parts.map((p, i) =>
        /\s+/.test(p) || beforeTokens.has(p) ? (
          <span key={i}>{p}</span>
        ) : (
          <mark key={i} className="rounded bg-primary/20 px-0.5 text-primary">
            {p}
          </mark>
        ),
      )}
    </>
  );
}
