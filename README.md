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

## Quick start

```bash
npm install
cp .env.local.example .env.local
# set DATABASE_URL and ADMIN_PASSWORD in .env.local
npm run db:setup
npm run db:seed-courses
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Search and browse courses |
| `/courses/[slug]` | Papers for one course, by year |
| `/admin` | Upload a PDF (admin password) |
| `/api/health` | Database / app health check |

## Environment

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | MySQL URL |
| `ADMIN_PASSWORD` | Password for `/admin` |
| `USE_MOCK_DATA` | Set `false` for real DB |
| `DATABASE_SSL` | Usually `true` for cloud MySQL |

## Scripts

```bash
npm run db:setup          # create tables
npm run db:seed-courses   # seed all 46 BSCS courses
npm run db:seed-real      # optional sample paper rows
```

## License

[MIT](LICENSE) · [@Aminaa-Ashraf](https://github.com/Aminaa-Ashraf)
