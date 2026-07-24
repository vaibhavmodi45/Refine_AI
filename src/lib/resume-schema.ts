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
