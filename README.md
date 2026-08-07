# RefineAI — AI-Powered ATS Resume Builder

Build, optimize, and export ATS-friendly resumes tailored to any job description.

## Features

- **Three professional templates** — choose Modern, Classic, or Minimal layouts
- **Deterministic ATS scoring** — keyword match analysis and section-by-section scoring against any job description
- **AI-enhanced analysis** — optional Cerebras-powered wording suggestions (falls back to deterministic-only scoring if unavailable)
- **Resume upload & parse** — import existing resumes from PDF or DOCX files
- **Version management** — save, compare, and switch between resume versions
- **Pixel-perfect PDF export** — what you see in the live preview is what you get in the PDF
- **Google OAuth & email/password auth** — powered by Supabase Auth

## Tech Stack

| Layer           | Technology                                                                        |
| --------------- | --------------------------------------------------------------------------------- |
| Framework       | [TanStack Start](https://tanstack.com/start) (React 19, SSR, file-based routing)  |
| Styling         | [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| Auth & Database | [Supabase](https://supabase.com/) (PostgreSQL, Auth, Row Level Security)          |
| AI              | [Cerebras](https://cerebras.ai/) (fast inference for resume wording suggestions)  |
| PDF Export      | jsPDF + html2canvas                                                               |
| Deploy          | Vercel (via Nitro)                                                                |

## Getting Started

```sh
# 1. Clone
git clone https://github.com/vaibhavmodi45/Refine_AI.git
cd Refine_AI

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Open .env and fill in every value — each variable has instructions
# in .env.example explaining where to find it.

# 4. Run the dev server
npm run dev
```

### Environment Variables

See [`.env.example`](.env.example) for the full list with inline documentation. You'll need:

- **Supabase** — project URL, publishable key, service role key, and project ID (from your [Supabase dashboard](https://supabase.com/dashboard))
- **Cerebras** _(optional)_ — API key for AI-enhanced analysis (from [Cerebras Cloud](https://cloud.cerebras.ai))

### Google OAuth Setup

To enable "Sign in with Google", configure it in your Supabase dashboard:

1. Go to **Authentication → Providers → Google**
2. Enable it and add your Google OAuth client ID / secret
3. Set the redirect URL to your app's domain

## Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the development server         |
| `npm run build`   | Production build (Vercel preset)     |
| `npm run preview` | Preview the production build locally |
| `npm run lint`    | Run ESLint                           |
| `npm run format`  | Format code with Prettier            |

## License

Private — not licensed for redistribution.
