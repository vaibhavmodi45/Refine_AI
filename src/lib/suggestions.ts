import type { ResumeData } from "./resume-schema";
import { scoreResumeAgainstJob } from "./scoring";

// Reuse the same tokenizer/skill hints as scoring for consistency.
const STOPWORDS = new Set(
  "a about above after again against all am an and any are as at be because been before being below between both but by can did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not now of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with you your yours yourself yourselves solutions solution team teams experience experienced experiences responsible responsibility responsibilities strong excellent proven demonstrated ability abilities skill skills work working works knowledge understanding etc various multiple several including include includes included ensure ensures ensured across within throughout using use used uses new existing overall able capable required requires requirement requirements plus preferred nice must candidate candidates role roles position positions company companies industry industries business businesses stakeholder stakeholders customer customers client clients user users product products project projects development developing develop developed manage managed managing management lead leads leading led environment environments year years month months day days full part time based good great fast quick clear effective efficient successful successfully high highly deep broad complex simple standard modern legacy end-to-end hands-on hands cross cross-functional day-to-day".split(
    /\s+/,
  ),
);

const NON_SKILL_TOKENS = new Set(
  "b.tech b.s. b.a. b.e. m.s. m.a. m.e. ph.d. ph.d bsc msc mba btech mtech u.s. u.k. e.g. i.e. etc. a.m. p.m. inc. corp. ltd. co. jr. sr. no. vs. mr. ms. dr. approx. incl. mgr.".split(
    /\s+/,
  ),
);

const SKILL_HINTS = new Set(
  "javascript typescript python java go rust ruby php scala kotlin swift react vue angular svelte next nextjs node nodejs express nestjs graphql rest api sql nosql postgres postgresql mysql mongodb redis elasticsearch aws gcp azure docker kubernetes terraform ansible ci cd git jenkins github gitlab linux bash figma agile scrum jira kanban product design ux ui accessibility a11y seo html css tailwind sass scss less tanstack vite webpack rollup esbuild jest vitest playwright cypress fastapi django flask rails spring dotnet firebase supabase snowflake bigquery airflow spark hadoop kafka rabbitmq websocket restful microservices oauth jwt saml oidc security tdd bdd analytics tableau powerbi excel machine-learning ml ai nlp llm rag pytorch tensorflow numpy pandas scikit-learn opencv redux zustand nextauth prisma sequelize typeorm drizzle mongoose serverless lambda ec2 s3 rds cloudfront cloudflare vercel netlify heroku datadog sentry grafana prometheus splunk okta auth0 stripe twilio sendgrid mailgun sketch storybook chromatic swagger openapi grpc protobuf websockets webrtc pwa spa ssr ssg csr rxjs mobx recoil apollo urql trpc hasura strapi contentful sanity wordpress shopify magento salesforce hubspot workday sap oracle notion asana intellij vscode xcode android-studio flutter dart ionic expo unity unreal blender solidity ethereum web3 solana perl haskell elixir erlang lua julia matlab".split(
    /\s+/,
  ),
);
const PUNCT_SKILL_TOKENS = new Set([
  "c++", "c#", ".net", "node.js", "next.js", "vue.js", "d3.js", "three.js", "f#", "objective-c",
]);

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9+#.\-]+/g) ?? [])
    .map((t) => t.replace(/^[.\-]+|[.\-]+$/g, ""))
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function isRealSkill(t: string): boolean {
  if (NON_SKILL_TOKENS.has(t)) return false;
  return SKILL_HINTS.has(t) || PUNCT_SKILL_TOKENS.has(t);
}

// Find the exact-case form of a keyword as it appears in the JD (preferred casing).
function preferredCase(jd: string, keyword: string): string {
  const re = new RegExp(`\\b(${keyword.replace(/[.+#-]/g, "\\$&")})\\b`, "i");
  const m = jd.match(re);
  return m ? m[1] : keyword;
}

function resumeSkillItems(r: ResumeData): string[] {
  return r.skills.flatMap((g) => g.items);
}

function resumeFullText(r: ResumeData): string {
  return [
    r.personalInfo.fullName,
    r.summary ?? "",
    ...r.experience.flatMap((e) => [e.role, e.company, ...(e.bullets ?? [])]),
    ...r.projects.flatMap((p) => [p.name, p.description ?? "", ...(p.bullets ?? []), ...(p.techStack ?? [])]),
    ...r.skills.flatMap((s) => [s.category, ...s.items]),
    ...(r.certifications ?? []).map((c) => c.name),
    ...(r.achievements ?? []),
  ].join(" \n ");
}

export type SectionGroup = "Skills" | "Summary" | "Experience" | "Projects";

export interface SuggestionBase {
  id: string;
  keyword: string;
  section: SectionGroup;
  rationale: string;
}

export interface SuggestionA extends SuggestionBase {
  type: "A";
  kind: "add_to_skills" | "reword_casing";
  before: string;
  after: string;
  // Location metadata for apply step
  target:
    | { kind: "skills"; category: string }
    | { kind: "experience_bullet"; expIndex: number; bulletIndex: number }
    | { kind: "project_bullet"; projIndex: number; bulletIndex: number }
    | { kind: "summary" };
}

export interface SuggestionB extends SuggestionBase {
  type: "B";
  kind: "missing_skill";
}

export type Suggestion = SuggestionA | SuggestionB;

function bestSkillCategory(r: ResumeData, keyword: string): string {
  // Heuristic: put dev-language-y things in the largest existing group
  if (!r.skills.length) return "Skills";
  // Find category whose items share most tokens with keyword
  const kw = keyword.toLowerCase();
  const lang = ["javascript", "typescript", "python", "java", "go", "rust", "c++", "c#", "ruby", "php", "scala", "kotlin", "swift"];
  const frame = ["react", "vue", "angular", "svelte", "next", "node", "express", "nestjs", "graphql", "django", "flask", "rails", "spring", "tanstack"];
  if (lang.includes(kw)) return r.skills.find((s) => /lang/i.test(s.category))?.category ?? r.skills[0].category;
  if (frame.includes(kw)) return r.skills.find((s) => /(framework|library|stack)/i.test(s.category))?.category ?? r.skills[0].category;
  return r.skills.find((s) => /(tool|other|tech)/i.test(s.category))?.category ?? r.skills[0].category;
}

export function generateSuggestions(resume: ResumeData, jd: string): Suggestion[] {
  if (!jd.trim()) return [];
  const score = scoreResumeAgainstJob(resume, jd);
  const resumeText = resumeFullText(resume);
  const resumeTextLower = resumeText.toLowerCase();
  const skillItemsLower = new Set(resumeSkillItems(resume).map((s) => s.toLowerCase()));

  const suggestions: Suggestion[] = [];
  let seq = 0;
  const uid = () => `s${++seq}`;

  // Deduplicate keywords
  const jdSkillKeywords = Array.from(
    new Set(
      tokenize(jd).filter((t) => SKILL_HINTS.has(t) || /[+#.]/.test(t)),
    ),
  );

  for (const kw of jdSkillKeywords) {
    const preferred = preferredCase(jd, kw);
    const inText = new RegExp(`\\b${kw.replace(/[.+#-]/g, "\\$&")}\\b`, "i").test(resumeText);
    const inSkills = skillItemsLower.has(kw);

    if (inText && !inSkills) {
      // Type A: skill is demonstrated in the resume but not listed under Skills.
      const category = bestSkillCategory(resume, kw);
      const existing = resume.skills.find((s) => s.category === category)?.items ?? [];
      suggestions.push({
        id: uid(),
        type: "A",
        kind: "add_to_skills",
        section: "Skills",
        keyword: preferred,
        rationale: `You already mention "${preferred}" in your resume, but it isn't listed under Skills. ATS filters often key off the Skills section.`,
        before: existing.join(", ") || "(empty)",
        after: [...existing, preferred].join(", "),
        target: { kind: "skills", category },
      });
    }
  }

  // Casing normalization for experience bullets & project bullets & summary.
  const brandKeywords = jdSkillKeywords.filter((k) => /[a-z]/.test(k) && SKILL_HINTS.has(k));
  function findCasingIssues(text: string): { kw: string; preferred: string; replacement: string } | null {
    for (const kw of brandKeywords) {
      const preferred = preferredCase(jd, kw);
      if (preferred === kw) continue; // JD lower-cased too
      const re = new RegExp(`\\b(${kw.replace(/[.+#-]/g, "\\$&")})\\b`, "g");
      let m: RegExpExecArray | null;
      let needsFix = false;
      while ((m = re.exec(text)) !== null) {
        if (m[1] !== preferred) needsFix = true;
      }
      if (needsFix) {
        const replaced = text.replace(re, preferred);
        return { kw, preferred, replacement: replaced };
      }
    }
    return null;
  }

  resume.experience.forEach((e, ei) =>
    e.bullets.forEach((b, bi) => {
      const fix = findCasingIssues(b);
      if (fix && fix.replacement !== b) {
        suggestions.push({
          id: uid(),
          type: "A",
          kind: "reword_casing",
          section: "Experience",
          keyword: fix.preferred,
          rationale: `The JD uses "${fix.preferred}" — matching that exact casing helps some ATS keyword filters.`,
          before: b,
          after: fix.replacement,
          target: { kind: "experience_bullet", expIndex: ei, bulletIndex: bi },
        });
      }
    }),
  );

  resume.projects.forEach((p, pi) =>
    p.bullets.forEach((b, bi) => {
      const fix = findCasingIssues(b);
      if (fix && fix.replacement !== b) {
        suggestions.push({
          id: uid(),
          type: "A",
          kind: "reword_casing",
          section: "Projects",
          keyword: fix.preferred,
          rationale: `The JD uses "${fix.preferred}" — matching that exact casing helps some ATS keyword filters.`,
          before: b,
          after: fix.replacement,
          target: { kind: "project_bullet", projIndex: pi, bulletIndex: bi },
        });
      }
    }),
  );

  if (resume.summary) {
    const fix = findCasingIssues(resume.summary);
    if (fix && fix.replacement !== resume.summary) {
      suggestions.push({
        id: uid(),
        type: "A",
        kind: "reword_casing",
        section: "Summary",
        keyword: fix.preferred,
        rationale: `The JD uses "${fix.preferred}" — matching that exact casing in your summary strengthens keyword match.`,
        before: resume.summary,
        after: fix.replacement,
        target: { kind: "summary" },
      });
    }
  }

  // Type B: missing skills (from scorer), never auto-add.
  for (const m of score.missingSkills) {
    // skip if we already have a Type A that covers it (already in text)
    if (resumeTextLower.includes(m.toLowerCase())) continue;
    suggestions.push({
      id: uid(),
      type: "B",
      kind: "missing_skill",
      section: "Skills",
      keyword: preferredCase(jd, m),
      rationale: `The JD mentions "${preferredCase(jd, m)}" but it doesn't appear anywhere in your resume.`,
    });
  }

  return suggestions;
}

export interface ConfirmedTypeB {
  keyword: string;
  placement: "skills" | "experience_bullet";
  category?: string; // for skills
  expIndex?: number; // for experience bullet
  wording: string; // final text
}

export function applySuggestions(
  resume: ResumeData,
  selectedA: SuggestionA[],
  confirmedB: ConfirmedTypeB[],
): ResumeData {
  // Deep-clone via JSON — resume data is plain
  const r: ResumeData = JSON.parse(JSON.stringify(resume));

  // Apply Type A
  for (const s of selectedA) {
    const t = s.target;
    if (t.kind === "skills" && s.kind === "add_to_skills") {
      let group = r.skills.find((g) => g.category === t.category);
      if (!group) {
        group = { category: t.category || "Skills", items: [] };
        r.skills.push(group);
      }
      if (!group.items.some((i) => i.toLowerCase() === s.keyword.toLowerCase())) {
        group.items.push(s.keyword);
      }
    } else if (t.kind === "experience_bullet" && s.kind === "reword_casing") {
      const exp = r.experience[t.expIndex];
      if (exp && exp.bullets[t.bulletIndex] !== undefined) {
        exp.bullets[t.bulletIndex] = s.after;
      }
    } else if (t.kind === "project_bullet" && s.kind === "reword_casing") {
      const p = r.projects[t.projIndex];
      if (p && p.bullets[t.bulletIndex] !== undefined) {
        p.bullets[t.bulletIndex] = s.after;
      }
    } else if (t.kind === "summary" && s.kind === "reword_casing") {
      r.summary = s.after;
    }
  }

  // Apply Type B (only after explicit confirmation)
  for (const c of confirmedB) {
    if (!c.wording.trim()) continue;
    if (c.placement === "skills") {
      const cat = c.category || "Skills";
      let group = r.skills.find((g) => g.category === cat);
      if (!group) {
        group = { category: cat, items: [] };
        r.skills.push(group);
      }
      if (!group.items.some((i) => i.toLowerCase() === c.wording.toLowerCase())) {
        group.items.push(c.wording);
      }
    } else if (c.placement === "experience_bullet" && c.expIndex !== undefined) {
      const exp = r.experience[c.expIndex];
      if (exp) exp.bullets.push(c.wording);
    }
  }

  return r;
}

// Safety check: no Type A suggestion may introduce content that isn't already in the resume.
// For casing changes this is inherently true; for skills add, the keyword must exist in resume text.
export function verifyTypeASafety(resume: ResumeData, suggestions: SuggestionA[]): { ok: boolean; violations: string[] } {
  const text = resumeFullText(resume).toLowerCase();
  const violations: string[] = [];
  for (const s of suggestions) {
    if (s.kind === "add_to_skills") {
      if (!text.includes(s.keyword.toLowerCase())) {
        violations.push(`"${s.keyword}" not present in resume text`);
      }
    } else if (s.kind === "reword_casing") {
      // The "after" string should only differ from "before" by casing.
      if (s.before.toLowerCase() !== s.after.toLowerCase()) {
        violations.push(`Casing rewrite altered content: ${s.before} → ${s.after}`);
      }
    }
  }
  return { ok: violations.length === 0, violations };
}
