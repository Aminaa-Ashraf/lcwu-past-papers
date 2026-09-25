# LCWU Past Papers

Past papers for LCWU Computer Science (BSCS) — browse by course and exam year, download PDFs, upload new ones from Admin.

Live: [lcwu-past-papers.vercel.app](https://lcwu-past-papers.vercel.app) · 46 courses from the 2023–27 scheme · Next.js + Firebase

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
| Database | Firebase Firestore |
| Files | Firebase Storage |
| Hosting | Vercel |

## Run locally

```bash
npm install
cp .env.local.example .env.local
# add Firebase service account values
npm run db:seed-firebase
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Vercel

Production is [lcwu-past-papers.vercel.app](https://lcwu-past-papers.vercel.app). Pushes to `main` deploy automatically.

Set these in the Vercel project (Production / Preview / Development):

| Name | Purpose |
|------|---------|
| `ADMIN_PASSWORD` | Admin upload page |
| `FIREBASE_PROJECT_ID` | Firestore project |
| `FIREBASE_CLIENT_EMAIL` | Admin SDK service account |
| `FIREBASE_PRIVATE_KEY` | Admin SDK private key |
| `FIREBASE_STORAGE_BUCKET` | New PDF uploads |

The live app uses Firebase only.

## Pages

| Path | Purpose |
|------|---------|
| `/` | Search and browse courses |
| `/courses/[slug]` | Papers for one course, by year |
| `/admin` | Upload a PDF |

## License

[MIT](LICENSE) · [@Aminaa-Ashraf](https://github.com/Aminaa-Ashraf)
