import type { ResumeData } from "./resume-schema";

const STOPWORDS = new Set(
  "a about above after again against all am an and any are as at be because been before being below between both but by can did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not now of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with you your yours yourself yourselves solutions solution team teams experience experienced experiences responsible responsibility responsibilities strong excellent proven demonstrated ability abilities skill skills work working works knowledge understanding etc various multiple several including include includes included ensure ensures ensured across within throughout using use used uses new existing overall able capable required requires requirement requirements plus preferred nice must candidate candidates role roles position positions company companies industry industries business businesses stakeholder stakeholders customer customers client clients user users product products project projects development developing develop developed manage managed managing management lead leads leading led environment environments year years month months day days full part time based good great fast quick clear effective efficient successful successfully high highly deep broad complex simple standard modern legacy end-to-end hands-on hands cross cross-functional day-to-day".split(
    /\s+/,
  ),
);

// Words that look "technical" (contain punctuation) but are NOT skills.
// Degrees, honorifics, generic abbreviations. Never surface as missing skills.
const NON_SKILL_TOKENS = new Set(
  "b.tech b.s. b.a. b.e. m.s. m.a. m.e. ph.d. ph.d bsc msc mba btech mtech u.s. u.k. e.g. i.e. etc. a.m. p.m. inc. corp. ltd. co. jr. sr. no. vs. mr. ms. dr. approx. incl. mgr.".split(
    /\s+/,
  ),
);

// Common tech / role skill markers used to prioritize weighting.
const SKILL_HINTS = new Set(
  "javascript typescript python java go rust ruby php scala kotlin swift react vue angular svelte next nextjs node nodejs express nestjs graphql rest api sql nosql postgres postgresql mysql mongodb redis elasticsearch aws gcp azure docker kubernetes terraform ansible ci cd git jenkins github gitlab linux bash figma agile scrum jira kanban product design ux ui accessibility a11y seo html css tailwind sass scss less tanstack vite webpack rollup esbuild jest vitest playwright cypress fastapi django flask rails spring dotnet firebase supabase snowflake bigquery airflow spark hadoop kafka rabbitmq websocket restful microservices oauth jwt saml oidc security tdd bdd analytics tableau powerbi excel machine-learning ml ai nlp llm rag pytorch tensorflow numpy pandas scikit-learn opencv redux zustand nextauth prisma sequelize typeorm drizzle mongoose serverless lambda ec2 s3 rds cloudfront cloudflare vercel netlify heroku datadog sentry grafana prometheus splunk okta auth0 stripe twilio sendgrid mailgun figma sketch storybook chromatic swagger openapi grpc protobuf websockets webrtc pwa spa ssr ssg csr rxjs mobx recoil apollo urql tRPC hasura strapi contentful sanity wordpress shopify magento salesforce hubspot workday sap oracle jira confluence notion slack asana monday intellij vscode xcode android-studio flutter dart ionic reactnative react-native expo unity unreal blender solidity ethereum web3 solana rust-lang perl haskell elixir erlang lua julia matlab r sas stata".split(
    /\s+/,
  ),
);
// Multi-punct programming tokens that are legitimate skills.
const PUNCT_SKILL_TOKENS = new Set([
  "c++", "c#", ".net", "node.js", "next.js", "vue.js", "d3.js", "three.js", "f#", "objective-c",
]);

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9+#.\-]+/g) ?? [])
    .map((t) => t.replace(/^[.\-]+|[.\-]+$/g, "")) // strip leading/trailing dots/dashes ("solutions." -> "solutions")
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function resumeText(r: ResumeData): string {
  const bits: string[] = [
    r.personalInfo.fullName,
    r.summary ?? "",
    ...r.experience.flatMap((e) => [e.role, e.company, ...(e.bullets ?? [])]),
    ...r.projects.flatMap((p) => [p.name, p.description ?? "", ...(p.bullets ?? []), ...(p.techStack ?? [])]),
    ...r.skills.flatMap((s) => [s.category, ...s.items]),
    ...(r.certifications ?? []).map((c) => c.name),
    ...(r.achievements ?? []),
    ...r.education.map((e) => `${e.institution} ${e.degree} ${e.field ?? ""}`),
  ];
  return bits.join(" \n ");
}

function extractSkillTokens(r: ResumeData): Set<string> {
  const set = new Set<string>();
  r.skills.forEach((g) => g.items.forEach((i) => tokenize(i).forEach((t) => set.add(t))));
  r.projects.forEach((p) => (p.techStack ?? []).forEach((i) => tokenize(i).forEach((t) => set.add(t))));
  return set;
}

export interface ScoringResult {
  atsScore: number;
  matchScore: number;
  keywordsFound: string[];
  missingSkills: string[];
  checks: { label: string; pass: boolean }[];
}

export function scoreResumeAgainstJob(resume: ResumeData, jd: string): ScoringResult {
  const rText = resumeText(resume).toLowerCase();
  const rTokens = new Set(tokenize(rText));
  const jdTokens = tokenize(jd);
  const jdUnique = Array.from(new Set(jdTokens));

  const found: string[] = [];
  const missing: string[] = [];
  let weighted = 0;
  let weightTotal = 0;
  for (const t of jdUnique) {
    if (NON_SKILL_TOKENS.has(t)) continue;
    const isSkill = SKILL_HINTS.has(t) || PUNCT_SKILL_TOKENS.has(t);
    const w = isSkill ? 3 : 1;
    weightTotal += w;
    if (rTokens.has(t)) {
      weighted += w;
      found.push(t);
    } else if (isSkill) {
      missing.push(t);
    }
  }

  const matchScore = weightTotal ? Math.round((weighted / weightTotal) * 100) : 0;

  // Deterministic ATS checks
  const hasEmail = !!resume.personalInfo.email;
  const hasPhone = !!resume.personalInfo.phone;
  const hasName = !!resume.personalInfo.fullName;
  const hasSummary = !!(resume.summary && resume.summary.trim().length > 40);
  const hasExperience = resume.experience.length > 0;
  const hasSkills = resume.skills.length > 0 && resume.skills.some((s) => s.items.length);
  const hasEducation = resume.education.length > 0;
  const bulletCount = resume.experience.reduce((n, e) => n + e.bullets.length, 0);
  const enoughBullets = bulletCount >= Math.max(3, resume.experience.length * 2);
  const wordCount = rText.split(/\s+/).filter(Boolean).length;
  const reasonableLength = wordCount >= 200 && wordCount <= 1200;
  const consistentDates = (() => {
    const patt = resume.experience.map((e) => datePattern(e.startDate));
    return new Set(patt).size <= 1;
  })();

  const checks = [
    { label: "Full name present", pass: hasName },
    { label: "Email address present", pass: hasEmail },
    { label: "Phone number present", pass: hasPhone },
    { label: "Summary (40+ chars)", pass: hasSummary },
    { label: "Experience section present", pass: hasExperience },
    { label: "Skills section populated", pass: hasSkills },
    { label: "Education section present", pass: hasEducation },
    { label: "Bullet points used in experience", pass: enoughBullets },
    { label: "Reasonable length (200–1200 words)", pass: reasonableLength },
    { label: "Consistent date format", pass: consistentDates },
  ];

  const atsScore = Math.round((checks.filter((c) => c.pass).length / checks.length) * 100);

  // Enrich missing with skill tokens the resume lacks
  const resumeSkills = extractSkillTokens(resume);
  const enrichedMissing = Array.from(new Set(missing.filter((m) => !resumeSkills.has(m))));

  return {
    atsScore,
    matchScore,
    keywordsFound: found,
    missingSkills: enrichedMissing,
    checks,
  };
}

function datePattern(s: string): string {
  if (!s) return "empty";
  if (/^\d{4}$/.test(s)) return "YYYY";
  if (/^\d{2}\/\d{4}$/.test(s)) return "MM/YYYY";
  if (/^[A-Za-z]{3,9}\s+\d{4}$/.test(s)) return "Mon YYYY";
  return "other";
}
