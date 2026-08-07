import { z } from "zod";

export const linkSchema = z.object({
  label: z.string().min(1),
  url: z.string().min(1),
});

export const educationSchema = z.object({
  institution: z.string().min(1),
  degree: z.string().min(1),
  field: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  gpa: z.string().optional(),
});

export const experienceSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  location: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  bullets: z.array(z.string()).default([]),
});

export const projectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  techStack: z.array(z.string()).optional(),
  bullets: z.array(z.string()).default([]),
  link: z.string().optional(),
});

export const skillGroupSchema = z.object({
  category: z.string().min(1),
  items: z.array(z.string()).default([]),
});

export const certificationSchema = z.object({
  name: z.string().min(1),
  issuer: z.string().optional(),
  date: z.string().optional(),
});

export const languageSchema = z.object({
  name: z.string().min(1),
  proficiency: z.string().optional(),
});

export const resumeDataSchema = z.object({
  personalInfo: z.object({
    fullName: z.string().min(1),
    email: z.string().email().or(z.literal("")),
    phone: z.string().optional(),
    location: z.string().optional(),
    links: z.array(linkSchema).default([]),
  }),
  summary: z.string().optional(),
  education: z.array(educationSchema).default([]),
  experience: z.array(experienceSchema).default([]),
  projects: z.array(projectSchema).default([]),
  skills: z.array(skillGroupSchema).default([]),
  certifications: z.array(certificationSchema).default([]),
  achievements: z.array(z.string()).default([]),
  languages: z.array(languageSchema).default([]),
});

export type ResumeData = z.infer<typeof resumeDataSchema>;

export const TEMPLATES = ["classic", "modern", "fresher"] as const;
export type TemplateId = (typeof TEMPLATES)[number];
export const TEMPLATE_LABELS: Record<TemplateId, string> = {
  classic: "Professional Classic",
  modern: "Modern Professional",
  fresher: "Fresher Graduate",
};

export function emptyResume(): ResumeData {
  return {
    personalInfo: { fullName: "", email: "", phone: "", location: "", links: [] },
    summary: "",
    education: [],
    experience: [],
    projects: [],
    skills: [],
    certifications: [],
    achievements: [],
    languages: [],
  };
}

export function sanitizeResumeData(data: Partial<ResumeData>): ResumeData {
  const empty = emptyResume();
  const info = data.personalInfo ?? empty.personalInfo;
  return {
    personalInfo: {
      fullName: info.fullName?.trim() || "Full Name",
      email: info.email?.trim() || "",
      phone: info.phone?.trim() || "",
      location: info.location?.trim() || "",
      links: Array.isArray(info.links)
        ? info.links
            .filter((l) => l && typeof l === "object")
            .map((l) => ({ label: l.label?.trim() || "Link", url: l.url?.trim() || "" }))
        : [],
    },
    summary: data.summary?.trim() || "",
    education: Array.isArray(data.education)
      ? data.education.map((e) => ({
          institution: e.institution?.trim() || "University",
          degree: e.degree?.trim() || "Degree",
          field: e.field?.trim() || "",
          startDate: e.startDate?.trim() || "",
          endDate: e.endDate?.trim() || "",
          gpa: e.gpa?.trim() || "",
        }))
      : [],
    experience: Array.isArray(data.experience)
      ? data.experience.map((e) => ({
          company: e.company?.trim() || "Company",
          role: e.role?.trim() || "Position",
          location: e.location?.trim() || "",
          startDate: e.startDate?.trim() || "2023",
          endDate: e.endDate?.trim() || "",
          bullets: Array.isArray(e.bullets)
            ? e.bullets.filter((b): b is string => typeof b === "string" && b.trim().length > 0)
            : [],
        }))
      : [],
    projects: Array.isArray(data.projects)
      ? data.projects.map((p) => ({
          name: p.name?.trim() || "Project",
          description: p.description?.trim() || "",
          techStack: Array.isArray(p.techStack)
            ? p.techStack.filter((t): t is string => typeof t === "string" && t.trim().length > 0)
            : [],
          bullets: Array.isArray(p.bullets)
            ? p.bullets.filter((b): b is string => typeof b === "string" && b.trim().length > 0)
            : [],
          link: p.link?.trim() || "",
        }))
      : [],
    skills: Array.isArray(data.skills)
      ? data.skills.map((s) => ({
          category: s.category?.trim() || "Skills",
          items: Array.isArray(s.items)
            ? s.items.filter((i): i is string => typeof i === "string" && i.trim().length > 0)
            : [],
        }))
      : [],
    certifications: Array.isArray(data.certifications)
      ? data.certifications.map((c) => ({
          name: c.name?.trim() || "Certification",
          issuer: c.issuer?.trim() || "",
          date: c.date?.trim() || "",
        }))
      : [],
    languages: Array.isArray(data.languages)
      ? data.languages.map((l) => ({
          name: l.name?.trim() || "Language",
          proficiency: l.proficiency?.trim() || "",
        }))
      : [],
    achievements: Array.isArray(data.achievements)
      ? data.achievements.filter((a): a is string => typeof a === "string" && a.trim().length > 0)
      : [],
  };
}

export function sampleResume(): ResumeData {
  return {
    personalInfo: {
      fullName: "Alex Morgan",
      email: "alex.morgan@example.com",
      phone: "+1 (555) 123-4567",
      location: "San Francisco, CA",
      links: [
        { label: "LinkedIn", url: "linkedin.com/in/alexmorgan" },
        { label: "GitHub", url: "github.com/alexmorgan" },
      ],
    },
    summary:
      "Full-stack engineer with 5+ years building scalable web applications in TypeScript, React, and Node.js. Focused on performance, accessibility, and clean architecture.",
    education: [
      {
        institution: "University of California, Berkeley",
        degree: "B.S.",
        field: "Computer Science",
        startDate: "Aug 2016",
        endDate: "May 2020",
        gpa: "3.8",
      },
    ],
    experience: [
      {
        company: "Acme Corp",
        role: "Senior Software Engineer",
        location: "San Francisco, CA",
        startDate: "Jun 2022",
        endDate: "Present",
        bullets: [
          "Led migration of monolith to service-oriented architecture, reducing p95 latency by 42%.",
          "Shipped design-system library adopted by 8 product teams; cut UI review cycles by 30%.",
          "Mentored 4 engineers; ran weekly architecture reviews.",
        ],
      },
      {
        company: "Beta Labs",
        role: "Software Engineer",
        location: "Remote",
        startDate: "Jul 2020",
        endDate: "May 2022",
        bullets: [
          "Built React + GraphQL dashboards for 50k+ monthly active users.",
          "Owned CI/CD pipeline; reduced deploy time from 22 to 6 minutes.",
        ],
      },
    ],
    projects: [
      {
        name: "OpenScore",
        description: "Deterministic ATS scoring toolkit.",
        techStack: ["TypeScript", "Node.js"],
        bullets: ["Rule-based analyzer for job/resume keyword overlap.", "1.2k stars on GitHub."],
        link: "github.com/alexmorgan/openscore",
      },
    ],
    skills: [
      { category: "Languages", items: ["TypeScript", "JavaScript", "Python", "SQL"] },
      { category: "Frameworks", items: ["React", "Node.js", "Next.js", "TanStack"] },
      { category: "Tools", items: ["PostgreSQL", "Docker", "AWS", "Git"] },
    ],
    certifications: [{ name: "AWS Solutions Architect – Associate", issuer: "AWS", date: "2023" }],
    achievements: ["Speaker at ReactConf 2024 — 'Type-safe forms at scale'."],
    languages: [
      { name: "English", proficiency: "Native" },
      { name: "Spanish", proficiency: "Professional" },
    ],
  };
}
