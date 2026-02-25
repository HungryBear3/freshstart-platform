# AGENTS.md

## Cursor Cloud specific instructions

### Overview

FreshStart IL is a full-stack Next.js 16 monolith (App Router) — a divorce guidance platform for Illinois residents. It uses PostgreSQL via Prisma, NextAuth for auth (JWT/credentials), Stripe for payments (optional), and Jest for testing.

### Running the app

- **Dev server:** `npm run dev` (port 3000)
- **Lint:** `npm run lint` (pre-existing lint errors in the codebase — do not fix unless specifically asked)
- **Tests:** `npm test` (some pre-existing test failures due to type coercion and missing XSS sanitization)
- **Type check:** `npm run type-check`
- See `package.json` `scripts` for the full list (db:push, seed:*, etc.)

### Database

- PostgreSQL 16 is installed locally. Start with `sudo pg_ctlcluster 16 main start`.
- Dev database: `freshstart_dev` with user `devuser` / password `devpass` on `localhost:5432`.
- Schema sync: `npx prisma db push` (no migration history exists; use `db push` for dev).
- Prisma client regeneration: `npx prisma generate` (also runs automatically on `npm install` via `postinstall`).
- The `.env.local` file at the repo root contains all required env vars (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `AUTH_SECRET`, `ENCRYPTION_KEY`).

### Gotchas

- The Husky `prepare` script fails because `husky.install()` was removed in Husky v9. Use `CI=true npm install` to skip it, or set `CI=true` before running `npm install`.
- The pre-commit hook (`.husky/pre-commit`) runs `npm test`. Some tests fail due to pre-existing bugs — this does not indicate a broken setup.
- Stripe env vars (`STRIPE_SECRET_KEY`, etc.) are optional. The app starts and functions without them; Stripe features will warn/fail gracefully.
- SMTP is optional — emails log to console in development when `SMTP_USER`/`SMTP_PASSWORD` are not set.
- `prisma.config.ts` loads `.env.local` automatically for Prisma CLI commands.
