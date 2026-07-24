# Refine — Build Plan

An AI-assisted ATS resume builder with deterministic scoring, upload/parse, versioning, and pixel-matched PDF export.

## Stack alignment
Your spec says "React + Vite + React Router + Supabase Edge Functions". This project is on **TanStack Start** with **Lovable Cloud** (Supabase under the hood). I'll keep every capability you asked for, with these equivalent mappings:
- **Routing**: TanStack Router file-based routes under `src/routes/` (not React Router DOM).
- **Backend logic**: TanStack **server functions** (`createServerFn`) instead of Supabase Edge Functions — same Postgres, same Auth, same Storage, same RLS. Faster, same-origin, no CORS.
- **Auth**: Lovable Cloud email/password + Google OAuth via the managed broker.
- **AI**: Lovable AI Gateway (free-tier Gemini models) rather than OpenRouter — no key management for you.
- Everything else (React Hook Form + Zod, shadcn/ui, Tailwind, deterministic scorer, client-side PDF) stays exactly as specified.

## Design direction
Calm neutrals, single accent (deep indigo), Inter for UI + serif accent for resume templates. High-contrast, dense, utilitarian — like Linear meets a print doc.

## Data model (Postgres, RLS on every table)
- `profiles` (id → auth.users, email, full_name)
- `resumes` (id, user_id, title, timestamps)
- `resume_versions` (id, resume_id, version_number, label, structured_data jsonb, is_current, created_at)
- `job_descriptions` (id, user_id, title, description, created_at)
- `analyses` (id, resume_version_id, job_description_id, ats_score, match_score, keyword_report jsonb, missing_skills jsonb, improvements jsonb, created_at)

RLS: owner-only via `user_id` (child tables via join to parent's `user_id`). Storage buckets: `resume-uploads` (private), `resume-exports` (private).

## Structured schema
Single Zod schema `ResumeData` used by templates, parser, scorer, and AI layer — exactly the interface you provided.

## Routes
- `/` landing
- `/auth` sign in / sign up
- `/_authenticated/dashboard` resumes + versions
- `/_authenticated/resume/new` template picker
- `/_authenticated/resume/$id/edit` section editor + live preview + template switcher + "save as new version"
- `/_authenticated/resume/$id/upload` upload → parsed preview → confirm
- `/_authenticated/resume/$id/optimize` JD paste → scores + reports + per-section "improve wording"
- `/_authenticated/resume/$id/export` final preview + PDF download

## Templates (3, ATS-safe)
Single-column, no tables/images, semantic headings, consistent date format. Same React components render both the live preview and the PDF source — no divergence.
1. **Professional Classic** — serif headings, uppercase section rules
2. **Modern Professional** — sans, thin dividers, subtle accent
3. **Fresher Graduate** — education-first ordering, projects prominent

## Build phases (each verified before next)

**Phase 1 — Auth + shell**
Enable Lovable Cloud; profiles table + trigger; email/password + Google OAuth; `_authenticated` gate (managed); dashboard shell with empty state.

**Phase 2 — Builder core**
`ResumeData` Zod schema; sectioned RHF forms (personal, summary, education, experience, projects, skills, certs, achievements, languages, links); live preview pane rendering the 3 templates from the same JSON; `resume_versions` CRUD with "save as new version" and `is_current` toggle.

**Phase 3 — PDF export**
Client-side export using `@react-pdf/renderer` with template components that mirror the on-screen renderer 1:1 (shared layout constants). Download + optional save to `resume-exports` bucket.

**Phase 4 — Upload & parse**
Upload PDF/DOCX to `resume-uploads`. Server function extracts text (`pdfjs-dist` for PDF, `mammoth` for DOCX — both Worker-safe), runs deterministic segmenter (header regex, date heuristics, bullet detection) → `ResumeData`. Review/confirm screen before it becomes a version.

**Phase 5 — Scoring**
Pure TS scorer (client + server-callable):
- ATS score: section presence, contact completeness, bullet ratio, date-format consistency, length band, structural cleanliness.
- Match score: tokenize + stopword strip + stem; weighted overlap (skills 3×, experience/projects 1×).
- Reports: keywords found/missing, likely-skill missing list.
Zero LLM calls.

**Phase 6 — Optional AI wording**
`improveWording` server function → Lovable AI Gateway (`google/gemini-2.5-flash`) with strict system prompt: rephrase only, no new facts. Response validated by diffing entities (numbers, org names, dates, emails, URLs) vs input — reject if any new entity appears. UI shows before/after diff; user must explicitly accept per bullet/section.

## Technical notes
- Server functions live in `src/lib/*.functions.ts`; text extraction helpers in `*.server.ts`.
- Preview and PDF share a `<TemplateRenderer template variant data />` component so "what you see is what exports".
- All destructive actions (overwrite version, apply AI suggestions, delete) go through a shadcn `AlertDialog` confirm.
- No `og:image` set on protected routes; landing gets proper SEO metadata.

## What I'll ship in the first pass
Phases 1–3 end-to-end (auth, dashboard, builder with all sections + 3 templates + live preview, PDF export). Then phases 4–6 in follow-up turns so each is verified before the next lands. This keeps the first delivery reviewable rather than a 30-file blob.

Approve to start with Phase 1 + 2 + 3.
