# LCWU Past Papers

Past papers for LCWU Computer Science (BSCS) — browse by course and exam year, download PDFs, upload new ones from Admin.

46 courses from the 2023–27 scheme · Next.js + MySQL

---

## What it does

- List all BSCS courses with paper counts and years
- Open a course and browse papers by exam year
- Preview and download PDFs
- Upload new papers from a password-protected Admin page

## Stack

| Layer | Choice |
|-------|--------|
| App | Next.js 16 (App Router), React 19 |
| UI | Tailwind CSS 4 |
| Database | MySQL (`mysql2`) |
| Hosting | Vercel-ready |

## Run locally

```bash
npm install
cp .env.local.example .env.local
npm run db:setup
npm run db:seed-courses
npm run dev
```

Copy `.env.local.example` into `.env.local` and fill in your own database and admin settings (that file stays on your machine — it is not committed).

Then open [http://localhost:3000](http://localhost:3000).

## Pages

| Path | Purpose |
|------|---------|
| `/` | Search and browse courses |
| `/courses/[slug]` | Papers for one course, by year |
| `/admin` | Upload a PDF |

## License

[MIT](LICENSE) · [@Aminaa-Ashraf](https://github.com/Aminaa-Ashraf)
