# LCWU Past Papers

Browse Computer Science past papers by course and exam year — download PDFs, upload new ones from Admin.

Built for LCWU BSCS (2023–27 scheme) · 46 courses · Next.js + MySQL.

---

## Quick start

```bash
npm install
cp .env.local.example .env.local
# edit .env.local — DATABASE_URL + ADMIN_PASSWORD
npm run db:setup
npm run db:seed-courses
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Route | What it does |
|-------|----------------|
| `/` | Search & browse all courses |
| `/courses/[slug]` | Papers for one course, by year |
| `/admin` | Upload a PDF (password protected) |

## Environment

Copy `.env.local.example` → `.env.local`:

- `DATABASE_URL` — Aiven (or any) MySQL URL  
- `ADMIN_PASSWORD` — password for `/admin`  
- `USE_MOCK_DATA=false` — use the real database  

## Scripts

```bash
npm run db:setup          # create tables
npm run db:seed-courses   # seed all 46 BSCS courses
npm run db:seed-real      # seed sample paper rows (optional)
```

## Stack

Next.js 16 · React 19 · Tailwind CSS 4 · MySQL (`mysql2`) · Vercel-ready

---

[MIT](LICENSE) · [@Aminaa-Ashraf](https://github.com/Aminaa-Ashraf)
