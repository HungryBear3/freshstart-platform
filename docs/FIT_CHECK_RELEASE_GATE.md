# Pre-Payment Fit Check Release Gate

This change is **migration-first**. The database migration must be applied and verified **before** the application code is deployed.

## Why the order is not negotiable

The one-time checkout route (`app/api/stripe/create-checkout-session/route.ts`) reads `fit_check_assessments` on **every** checkout attempt, before any Stripe work, and **fails closed**. A successful lookup that finds no current `fit` assessment returns `fit_check_required` or `fit_check_blocked`; a lookup that throws reaches the route's outer error handler and returns HTTP 500 with no fit-check code.

So if the application ships first, the table does not exist yet, every read raises `relation "fit_check_assessments" does not exist`, and **every one-time checkout fails with HTTP 500** until the migration lands. There is no degraded mode — the gate is closed for everyone.

The reverse order is safe. Both migrations are additive:

- nothing that already exists is created, altered, or dropped;
- the currently deployed Prisma Client has no `FitCheckAssessment` model, so it never reads or writes the new table;
- the table therefore stays inert between the migration and the deploy, for as long as that window lasts.

## Approval boundary

Production migration and deployment require Alexy's explicit approval. Do not run these steps from tests, previews, or local review. Nothing in this repository applies these migrations automatically.

## Phase 0 — exact artifact and environment

1. Start from a clean release worktree at the reviewed commit hash.
2. Confirm the target Vercel project and production database explicitly; do not infer them from the current shell.
3. Back up the production database using the project's established provider workflow.
4. Confirm both migration files exist:
   - `prisma/migrations/20260921120000_add_fit_check_assessments/migration.sql`
   - `prisma/migrations/20260921120100_enable_rls_fit_check_assessments/migration.sql`
5. Run local gates from the exact commit: Prisma validation/generation, focused tests, full tests, and production build.
6. Before applying anything, run `npx prisma migrate status` and a read-only catalog check:
   - if the migrations are unapplied, `fit_check_assessments` must not already exist;
   - if Prisma records them as applied, every object listed in Phase 1 must exist and the migrations must not be rerun;
   - any mixed/partial state is a hard stop requiring a separately reviewed recovery plan.

## Phase 1 — additive database migration only

1. Keep the currently deployed application version active. **Do not deploy code in this phase.**
2. Apply migrations to the explicitly confirmed production database with the established migration runner:
   `npx prisma migrate deploy`.
3. Require a zero exit code. If migration fails, stop; do not deploy application code.
4. Verify `npx prisma migrate status` reports no pending migration.
5. Verify read-only database metadata shows:
   - table `fit_check_assessments` with columns `id`, `userId`, `policyVersion`, `result`, `answers`, `reasons`, `createdAt`, `expiresAt`;
   - the `reasons` column default `ARRAY[]::text[]`, matching `@default([])` in `prisma/schema.prisma`;
   - the `CHECK ("result" IN ('fit', 'review_required', 'out_of_scope'))` constraint;
   - the `userId` foreign key to `users(id)` with `ON DELETE CASCADE`;
   - index `fit_check_assessments_userId_createdAt_idx`;
   - row-level security enabled with exactly one policy, `service_role_full_fit_check_assessments`.
6. Verify the table is empty. The old application does not write it.

Both migrations are wrapped in PostgreSQL transactions. On failure, verify both Prisma migration status and the catalog again. Never resolve or rerun a failed migration until the catalog proves whether PostgreSQL rolled it back.

## Phase 2 — application deployment

Only after Phase 1 is verified:

1. Before cutover, enumerate production `checkout_obligations` rows with `status = 'OPEN'` and a non-null `stripeSessionId`, then read those sessions from Stripe. Record the count of provider sessions that remain `open`. Do not expire, mutate, or replay them automatically. If any remain open, disclose the bounded pre-gate payment window and monitor them through expiry; payment completion must still use the existing webhook reconciliation path.
2. Deploy the reviewed commit.
3. Confirm `/fit-check` renders and `POST /api/fit-check` records an assessment for a signed-in test account.
4. Confirm a one-time checkout attempt without a current `fit` assessment is refused with HTTP 409 and code `fit_check_required`, and that no Stripe Customer, Checkout Session, or `checkout_obligations` row was created for it.
5. Confirm a checkout attempt after a `fit` assessment reaches Stripe Checkout unchanged.

## Rollback

Roll back the **application only**. Redeploy the previous version; the table returns to being inert because the older Prisma Client never touches it.

Do not drop `fit_check_assessments` as part of an application rollback. Dropping it would destroy the assessments users have already answered, and it is not required for the old code to work. Removal, if ever wanted, belongs in a separately reviewed cleanup migration.

## What is stored

Bounded choice values (`yes` / `no` / `not_sure`) for the five policy questions, bounded reason codes, the policy version, and timestamps. No free text, no case facts, no contact details, and nothing is copied into Stripe metadata.
