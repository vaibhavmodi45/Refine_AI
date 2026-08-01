import { emptyResume, type ResumeData } from "./resume-schema";

/** Extract raw text from a PDF file using pdfjs-dist. */
export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const workerMod = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")) as {
    default: string;
  };
  pdfjs.GlobalWorkerOptions.workerSrc = workerMod.default;
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const parts: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    // Group items by y coordinate to keep line breaks reasonable.
    let lastY: number | null = null;
    const lineParts: string[] = [];
    for (const item of content.items as Array<{ str: string; transform: number[] }>) {
      const y = Math.round(item.transform[5]);
      if (lastY !== null && Math.abs(y - lastY) > 2) lineParts.push("\n");
      else if (lineParts.length) lineParts.push(" ");
      lineParts.push(item.str);
      lastY = y;
    }
    parts.push(lineParts.join(""));
    parts.push("\n");
  }
  return parts.join("\n");
}

export async function extractDocxText(file: File): Promise<string> {
  const mammoth = (await import(/* @vite-ignore */ "mammoth/mammoth.browser.js")) as {
    extractRawText: (o: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
  };
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value ?? "";
}

const SECTION_MAP: Array<{ key: SectionKey; patterns: RegExp[] }> = [
  {
    key: "summary",
    patterns: [/^(professional\s+)?summary$/i, /^objective$/i, /^profile$/i, /^about( me)?$/i],
  },
  {
    key: "experience",
    patterns: [
      /^(work\s+|professional\s+)?experience$/i,
      /^employment( history)?$/i,
      /^work history$/i,
    ],
  },
  { key: "education", patterns: [/^education$/i, /^academic( background)?$/i] },
  { key: "projects", patterns: [/^projects?$/i, /^selected projects$/i, /^personal projects$/i] },
  {
    key: "skills",
    patterns: [/^(technical\s+)?skills$/i, /^core competencies$/i, /^technologies$/i],
  },
  { key: "certifications", patterns: [/^certifications?$/i, /^licenses?$/i] },
  { key: "achievements", patterns: [/^achievements?$/i, /^awards?$/i, /^honou?rs?$/i] },
  { key: "languages", patterns: [/^languages?$/i] },
];

type SectionKey =
  | "summary"
  | "experience"
  | "education"
  | "projects"
  | "skills"
  | "certifications"
  | "achievements"
  | "languages";

function detectSection(line: string): SectionKey | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 40) return null;
  for (const s of SECTION_MAP) {
    for (const p of s.patterns) if (p.test(trimmed)) return s.key;
  }
  // Bare uppercase heuristic e.g. "EXPERIENCE"
  if (/^[A-Z][A-Z\s&]{2,30}$/.test(trimmed)) {
    for (const s of SECTION_MAP) {
      for (const p of s.patterns) if (p.test(trimmed.toLowerCase())) return s.key;
    }
  }
  return null;
}

const DATE_RE =
  /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}|\d{1,2}\/\d{4}|\d{4})/g;

function parseDateRange(line: string): { start?: string; end?: string; rest: string } {
  const matches = line.match(DATE_RE);
  const presentMatch = /\bpresent\b|\bcurrent\b/i.test(line);
  let rest = line;
  let start: string | undefined;
  let end: string | undefined;
  if (matches && matches.length) {
    start = matches[0];
    end = matches[1] ?? (presentMatch ? "Present" : undefined);
    // strip date substring and dashes
    for (const m of matches) rest = rest.replace(m, "");
    rest = rest
      .replace(/\bpresent\b|\bcurrent\b/i, "")
      .replace(/[–—-]\s*$/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    rest = rest
      .replace(/[|·•]/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
  }
  return { start, end, rest };
}

function isBullet(line: string): boolean {
  return /^\s*(?:[•●◦▪◆■\-*·]|\d+\.)\s+/.test(line);
}
function stripBullet(line: string): string {
  return line.replace(/^\s*(?:[•●◦▪◆■\-*·]|\d+\.)\s+/, "").trim();
}

/** Deterministic rule-based text -> ResumeData segmenter. */
export function segmentToResume(text: string): ResumeData {
  const resume = emptyResume();

  const rawLines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((l) =>
      l
        .replace(/\u00A0/g, " ")
        .replace(/[\t ]+/g, " ")
        .trimEnd(),
    );

  // ---- Header extraction (before first section) ----
  const emailRe = /[\w.+-]+@[\w-]+\.[\w.-]+/;
  const phoneRe = /(\+?\d[\d\s().-]{7,}\d)/;
  const urlRe = /((?:https?:\/\/|www\.)?[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s]*)?)/i;

  let headerEnd = rawLines.length;
  for (let i = 0; i < rawLines.length; i++) {
    if (detectSection(rawLines[i])) {
      headerEnd = i;
      break;
    }
  }
  const headerLines = rawLines.slice(0, headerEnd).filter((l) => l.trim());
  for (const l of headerLines) {
    const email = l.match(emailRe);
    if (email && !resume.personalInfo.email) resume.personalInfo.email = email[0];
    const phone = l.match(phoneRe);
    if (phone && !resume.personalInfo.phone) resume.personalInfo.phone = phone[0].trim();
    const url = l.match(urlRe);
    if (url && !/@/.test(l)) {
      const u = url[0];
      const label = /linkedin/i.test(u)
        ? "LinkedIn"
        : /github/i.test(u)
          ? "GitHub"
          : /portfolio|\.dev|\.me|\.io/i.test(u)
            ? "Portfolio"
            : "Link";
      if (!resume.personalInfo.links.some((x) => x.url === u)) {
        resume.personalInfo.links.push({ label, url: u });
      }
    }
  }
  // Name: first non-empty line that isn't contact info
  for (const l of headerLines) {
    const t = l.trim();
    if (!t) continue;
    if (emailRe.test(t) || phoneRe.test(t)) continue;
    if (/^[A-Za-z][A-Za-z .'-]{1,60}$/.test(t) && t.split(/\s+/).length <= 6) {
      resume.personalInfo.fullName = t;
      break;
    }
  }
  // Location: line with comma near top that isn't a URL/email/phone
  for (const l of headerLines) {
    if (/,/.test(l) && !emailRe.test(l) && !phoneRe.test(l) && !urlRe.test(l) && l.length < 60) {
      if (l.trim() !== resume.personalInfo.fullName) {
        resume.personalInfo.location = l.trim();
        break;
      }
    }
  }

  // ---- Section chunking ----
  const sections: Record<SectionKey, string[]> = {
    summary: [],
    experience: [],
    education: [],
    projects: [],
    skills: [],
    certifications: [],
    achievements: [],
    languages: [],
  };
  let current: SectionKey | null = null;
  for (let i = headerEnd; i < rawLines.length; i++) {
    const line = rawLines[i];
    const sect = detectSection(line);
    if (sect) {
      current = sect;
      continue;
    }
    if (current) sections[current].push(line);
  }

  // Summary
  resume.summary = sections.summary.join(" ").replace(/\s+/g, " ").trim();

  // Experience
  resume.experience = parseExperienceLike(sections.experience).map((b) => ({
    role: b.role,
    company: b.company,
    location: b.location,
    startDate: b.start ?? "",
    endDate: b.end,
    bullets: b.bullets,
  }));

  // Projects — similar structure
  resume.projects = parseExperienceLike(sections.projects).map((b) => ({
    name: b.role || b.company || "Project",
    description: undefined,
    techStack: [],
    bullets: b.bullets,
    link: undefined,
  }));

  // Education
  resume.education = parseEducation(sections.education);

  // Skills — split by category "Category: item, item"
  resume.skills = parseSkills(sections.skills);

  // Certifications
  resume.certifications = sections.certifications
    .filter((l) => l.trim())
    .map((l) => {
      const parts = l
        .split(/[|·•\-–—]/)
        .map((p) => p.trim())
        .filter(Boolean);
      return { name: parts[0] ?? l.trim(), issuer: parts[1], date: parts[2] };
    });

  // Achievements
  resume.achievements = sections.achievements
    .map((l) => (isBullet(l) ? stripBullet(l) : l.trim()))
    .filter(Boolean);

  // Languages: "English (Native), Spanish (Professional)"
  const langText = sections.languages.join(", ");
  resume.languages = langText
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const m = s.match(/^(.+?)\s*\((.+)\)$/);
      return m ? { name: m[1].trim(), proficiency: m[2].trim() } : { name: s };
    });

  return resume;
}

interface ExpBlock {
  role: string;
  company: string;
  location?: string;
  start?: string;
  end?: string;
  bullets: string[];
}

function parseExperienceLike(lines: string[]): ExpBlock[] {
  const blocks: ExpBlock[] = [];
  let cur: ExpBlock | null = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      if (cur && cur.bullets.length) {
        blocks.push(cur);
        cur = null;
      }
      continue;
    }
    if (isBullet(line)) {
      if (!cur) cur = { role: "", company: "", bullets: [] };
      cur.bullets.push(stripBullet(line));
      continue;
    }
    // Header-ish line — has a date or contains " - " / " — " / " at "
    const hasDate = DATE_RE.test(line);
    DATE_RE.lastIndex = 0;
    const looksLikeHeader = hasDate || /\s[-–—@|]\s|\bat\b/i.test(line);
    if (looksLikeHeader) {
      if (cur) blocks.push(cur);
      const { start, end, rest } = parseDateRange(line);
      const parts = rest
        .split(/\s[-–—@|]\s|\s+at\s+/i)
        .map((p) => p.trim())
        .filter(Boolean);
      const role = parts[0] ?? "";
      const company = parts[1] ?? "";
      const location = parts[2];
      cur = { role, company, location, start, end, bullets: [] };
      continue;
    }
    // Continuation — attach to current or start a description
    if (cur) {
      if (!cur.company) cur.company = line;
      else cur.bullets.push(line);
    } else {
      cur = { role: line, company: "", bullets: [] };
    }
  }
  if (cur) blocks.push(cur);
  return blocks;
}

function parseEducation(lines: string[]): ResumeData["education"] {
  const out: ResumeData["education"] = [];
  const blocks: string[][] = [];
  let cur: string[] = [];
  for (const l of lines) {
    if (!l.trim()) {
      if (cur.length) blocks.push(cur);
      cur = [];
      continue;
    }
    cur.push(l);
  }
  if (cur.length) blocks.push(cur);
  for (const b of blocks) {
    const joined = b.join(" | ");
    const { start, end, rest } = parseDateRange(joined);
    const gpaMatch = rest.match(/\bgpa[:\s]*([\d.]+)/i);
    const cleaned = rest.replace(/\bgpa[:\s]*[\d.]+/i, "").trim();
    const parts = cleaned
      .split(/\s*\|\s*|,\s+/)
      .map((p) => p.trim())
      .filter(Boolean);
    out.push({
      institution: parts[0] ?? cleaned,
      degree: parts[1] ?? "",
      field: parts[2],
      startDate: start,
      endDate: end,
      gpa: gpaMatch?.[1],
    });
  }
  return out;
}

function parseSkills(lines: string[]): ResumeData["skills"] {
  const out: ResumeData["skills"] = [];
  const flatItems: string[] = [];
  for (const raw of lines) {
    const line = isBullet(raw) ? stripBullet(raw) : raw.trim();
    if (!line) continue;
    const m = line.match(/^([A-Za-z][A-Za-z /&+]{1,30}?)\s*[:\-–—]\s*(.+)$/);
    if (m) {
      out.push({
        category: m[1].trim(),
        items: m[2]
          .split(/[,;•·|]/)
          .map((s) => s.trim())
          .filter(Boolean),
      });
    } else {
      flatItems.push(
        ...line
          .split(/[,;•·|]/)
          .map((s) => s.trim())
          .filter(Boolean),
      );
    }
  }
  if (flatItems.length && !out.length) {
    out.push({ category: "Skills", items: Array.from(new Set(flatItems)) });
  }
  return out;
}
