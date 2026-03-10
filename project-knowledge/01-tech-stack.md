# BuildSupply — Tech Stack & Architecture

## Project Overview
Full-stack B2B e-commerce platform for industrial/construction supplies. Think Home Depot Pro — SKU-heavy catalog, quote system, bulk ordering, careers portal, and a full CMS.

## Core Stack
- **Framework:** Next.js (App Router, Server Actions, Server Components)
- **Database:** Neon Postgres (serverless)
- **Hosting:** Vercel
- **Email:** Resend (transactional + contact form replies)
- **Auth:** Custom session-based auth (no NextAuth)
- **Styling:** Inline styles throughout (no Tailwind, no CSS modules)

## Key Patterns
- Server Actions for all mutations (no API routes except file serving)
- `safe()` wrapper utility for DB query error handling
- Explicit column lists in all SELECT queries (no SELECT *)
- Base64 DB storage for file uploads (resumes) — no external blob storage
- CSS variables for admin theme (`--ad-bg`, `--ad-surface`, etc.)

## Directory Structure
```
src/
  app/
    actions/        ← All server actions (auth, products, orders, careers, etc.)
    admin/          ← All admin pages
    api/            ← File-serving routes (resume download, upload endpoint)
    products/       ← Public PDP ([slug]/page.tsx)
    careers/        ← Public careers + application form
    blog/           ← Public blog
    ...
  components/       ← Shared components (admin-sidebar, admin-theme-wrapper, etc.)
  lib/
    db.ts           ← Neon DB connection
    auth.ts         ← Session utilities, SessionUser type
    products.ts     ← Product type + DB mapRow helper
```

## Database
- **Provider:** Neon (serverless Postgres)
- **Migrations:** Run via standalone Node scripts (e.g., `migrate_specs.js`, `migrate_pipeline.js`)
- **No ORM** — raw SQL via `@neondatabase/serverless`

## Environment Variables
- `DATABASE_URL` — Neon connection string
- `RESEND_API_KEY` — Email sending
- `SESSION_SECRET` — Auth cookie signing
