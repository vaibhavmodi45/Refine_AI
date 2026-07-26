import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { resumeDataSchema } from "./resume-schema";

/**
 * AI-enhanced analysis layer (opt-in).
 *
 * Uses the Lovable AI Gateway (OpenAI-compatible) — no user API key needed.
 * Falls back cleanly: on any error the caller shows deterministic-only results.
 *
 * The model is asked ONLY to:
 *   1. Point out JD keywords the resume already covers via different wording
 *      (semantic matches) — reduces false "missing skill" flags.
 *   2. Propose refined rewordings that use ONLY facts already in the resume.
 *
 * It never adds skills to the resume. Missing-skill confirmation still runs
 * through the existing Type B flow with explicit user confirmation.
 */

const inputSchema = z.object({
  resume: resumeDataSchema,
  jd: z.string().min(20).max(20000),
  missingSkills: z.array(z.string()).default([]),
  model: z.string().optional(),
});

export type AiEnhanceResult = {
  semanticMatches: { jdTerm: string; matchedIn: string; evidence: string }[];
  enhancedRewordings: {
    section: "Summary" | "Experience" | "Projects";
    before: string;
    after: string;
    rationale: string;
  }[];
  modelUsed: string;
};

const PRIMARY_MODEL = "google/gemini-2.5-flash-lite";
const FALLBACK_MODEL = "google/gemini-2.5-flash";

export const aiEnhanceAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data }): Promise<AiEnhanceResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const resumeCorpus = buildResumeCorpus(data.resume);

    const system = `You analyze a resume against a job description and return STRICT JSON.

Your job has two parts and NOTHING else:
1) semanticMatches: JD terms the resume already covers via different wording or a closely related skill.
   - Only include a term if the resume corpus provided actually contains supporting evidence text.
   - "evidence" MUST be an exact substring copied from the resume corpus.
   - Never claim a match for a skill the resume does not demonstrate.
2) enhancedRewordings: rephrase existing resume sentences to better mirror the JD's language.
   - You MAY reorder words, tighten phrasing, and swap vocabulary.
   - You MUST NOT invent new facts, numbers, employers, dates, tools, or skills that are not already in the resume corpus.
   - The "before" MUST be an exact substring from the resume corpus. The "after" MUST only use facts present in the corpus.
   - Skip anything if unsure.

Return this exact JSON shape and no prose:
{
  "semanticMatches": [{"jdTerm":"string","matchedIn":"Summary|Experience|Projects|Skills","evidence":"string"}],
  "enhancedRewordings": [{"section":"Summary|Experience|Projects","before":"string","after":"string","rationale":"string"}]
}`;

    const user = `RESUME CORPUS (only facts you may use):
"""
${resumeCorpus}
"""

JOB DESCRIPTION:
"""
${data.jd.slice(0, 8000)}
"""

Deterministic scorer already flagged these terms as MISSING — prioritize checking whether any are actually semantically covered by the resume:
${data.missingSkills.slice(0, 40).join(", ") || "(none)"}
`;

    const call = async (model: string) => {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`AI gateway ${res.status}: ${body.slice(0, 200)}`);
      }
      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = json.choices?.[0]?.message?.content ?? "{}";
      return JSON.parse(content) as unknown;
    };

    let raw: unknown;
    let modelUsed = data.model || PRIMARY_MODEL;
    try {
      raw = await call(modelUsed);
    } catch {
      modelUsed = FALLBACK_MODEL;
      raw = await call(modelUsed);
    }

    // Validate + sanitize. Drop anything not grounded in resume text.
    const parsed = z
      .object({
        semanticMatches: z
          .array(
            z.object({
              jdTerm: z.string(),
              matchedIn: z.string(),
              evidence: z.string(),
            }),
          )
          .default([]),
        enhancedRewordings: z
          .array(
            z.object({
              section: z.enum(["Summary", "Experience", "Projects"]),
              before: z.string(),
              after: z.string(),
              rationale: z.string(),
            }),
          )
          .default([]),
      })
      .parse(raw);

    const corpusLower = resumeCorpus.toLowerCase();
    const semanticMatches = parsed.semanticMatches
      .filter((m) => m.evidence && corpusLower.includes(m.evidence.toLowerCase().slice(0, 60)))
      .slice(0, 25);

    const enhancedRewordings = parsed.enhancedRewordings
      .filter((r) => r.before && r.after && corpusLower.includes(r.before.toLowerCase().slice(0, 40)))
      .filter((r) => afterIsGrounded(r.after, resumeCorpus))
      .slice(0, 15);

    return { semanticMatches, enhancedRewordings, modelUsed };
  });

function buildResumeCorpus(r: z.infer<typeof resumeDataSchema>): string {
  const parts: string[] = [];
  if (r.summary) parts.push(`SUMMARY: ${r.summary}`);
  r.experience.forEach((e) => {
    parts.push(`EXPERIENCE: ${e.role} @ ${e.company}`);
    e.bullets.forEach((b) => parts.push(`- ${b}`));
  });
  r.projects.forEach((p) => {
    parts.push(`PROJECT: ${p.name}${p.description ? ` - ${p.description}` : ""}`);
    (p.techStack ?? []).length && parts.push(`Tech: ${(p.techStack ?? []).join(", ")}`);
    p.bullets.forEach((b) => parts.push(`- ${b}`));
  });
  r.skills.forEach((s) => parts.push(`SKILLS ${s.category}: ${s.items.join(", ")}`));
  (r.certifications ?? []).forEach((c) => parts.push(`CERT: ${c.name}`));
  (r.achievements ?? []).forEach((a) => parts.push(`ACHIEVEMENT: ${a}`));
  return parts.join("\n");
}

// A rewording is "grounded" if the meaningful tokens in `after` mostly appear in the corpus.
// Cheap guard — the corpus filter above is the real safety net.
function afterIsGrounded(after: string, corpus: string): boolean {
  const corpusLower = corpus.toLowerCase();
  const tokens = (after.toLowerCase().match(/[a-z0-9+#.\-]{3,}/g) ?? []);
  if (!tokens.length) return false;
  let hits = 0;
  for (const t of tokens) if (corpusLower.includes(t)) hits++;
  return hits / tokens.length >= 0.6;
}
