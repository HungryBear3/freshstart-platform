# Row Level Security (RLS) — current position

**Status as of 2026-09-07.** Supersedes the previous version of this guide, whose
instruction to paste `prisma/enable_rls.sql` into the SQL Editor is **retracted**.
`RLS-SCRIPT-RETRACTED-2026-09-07`

## Summary

- Row level security is **already enabled on every public table** in Production.
- RLS for this project is governed by **tracked Prisma migrations** under
  `prisma/migrations/`, not by ad-hoc SQL Editor scripts.
- `prisma/enable_rls.sql` is **retracted** and is now an empty tombstone. It was
  never applied to Production. It must not be reinstated — see the notice inside
  the file for the full reasoning.

## Why the old script was withdrawn

It created, on 31 tables, policies of the shape
`FOR ALL USING (true) WITH CHECK (true)` **with no `TO` clause**.

PostgreSQL stores a policy with no `TO` clause as a grant to PUBLIC. On a
Supabase project PUBLIC includes the unauthenticated `anon` role, and Supabase's
default `GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated` is
already in place. Running the script would therefore have granted
unauthenticated read **and write** on `users`, `documents`, `financial_data`,
`children`, `payments` and 26 other tables to anyone able to reach the project's
Data API.

The script's own header claimed its policies "check for service_role or NULL".
They did not; nothing in it ever named a role. That gap between the stated and
the actual behaviour is why this guide now states the mechanism explicitly.

## What was actually verified

A controller-run, **SELECT-only** catalog snapshot of Production was taken on
2026-09-07. It establishes, for the `public` schema:

| Fact | Result |
|---|---|
| Public tables | 42 |
| Public tables with row level security enabled | 42 |
| Policies whose grantee is PUBLIC | 0 |
| Policies created by the retracted script | 0 (it was never applied) |

Every policy present names exactly one of `anon`, `authenticated` or
`service_role`. No database change was made by that snapshot, and none is
required by this retraction.

Nothing here is a claim about the Supabase security-advisor UI. That surface was
not read, and this repository makes no assertion about what it displays.

## What RLS does and does not protect here

**It restricts the Supabase Data API.** A request arriving over PostgREST with
the project's `anon` or `authenticated` key is subject to the policies on the
table.

**It does not scope this application's access.** The Next.js app reaches the
database through Prisma on the Postgres **owner** connection, and a table owner
bypasses RLS unless `FORCE ROW LEVEL SECURITY` is set on the table. It is not
set, and the tracked migrations deliberately do not set it.

Per-user authorization for application traffic is therefore enforced **in
application code** — session checks plus `userId` ownership verification on
every route — not by RLS. Treat RLS as a second perimeter around a different
door, not as a backstop for a missing authorization check.

## Adding or changing a policy

1. Write it as a new migration under `prisma/migrations/`. Do not use the SQL
   Editor for a change you intend to keep.
2. **Always name the grantee.** An omitted `TO` clause is a grant to PUBLIC —
   the dangerous default, not a neutral one.
3. Follow the shape already tracked in
   `20260506140500_enable_rls_remaining_public_tables` and
   `20260804201000_enable_rls_checkout_security_tables`:

   ```sql
   ALTER TABLE IF EXISTS public.example ENABLE ROW LEVEL SECURITY;

   DROP POLICY IF EXISTS service_role_full_example ON public.example;
   CREATE POLICY service_role_full_example
     ON public.example
     FOR ALL
     TO service_role
     USING (true)
     WITH CHECK (true);
   ```

4. Scope any `authenticated` policy to the row's owner, e.g.
   `USING ((auth.uid())::text = "userId")`. An unconditional `authenticated`
   policy is a cross-tenant read.
5. Never write an unconditional policy for `anon` or PUBLIC. Note that an
   INSERT-only policy has no `USING` clause at all, so
   `FOR INSERT TO anon WITH CHECK (true)` is fully open despite looking narrow.

## Guards

Two offline tests enforce the above. Neither contacts a database.

- `__tests__/security/no-permissive-public-rls-recipe.test.ts` — fails the build
  if any tracked `.sql` or `.md` file contains a policy recipe granting
  unconditional permissive access to PUBLIC or `anon`.
- `__tests__/security/rls-doc-attestations.test.ts` — fails the build if the
  retracted script regains executable content or is presented as something to
  run, or if any tracked document asserts an outcome in the Supabase
  security-advisor UI.

## Open items

These are recorded, not resolved:

- Whether the Supabase Data API (PostgREST) is enabled on this project is
  unconfirmed. It determines whether the `anon` policies are reachable at all.
- The blanket `GRANT ALL ... TO anon, authenticated` means RLS is currently the
  only control between the Data API and every row. Narrowing those grants is a
  separate, un-started change.
- Some policies present in Production have no tracked-migration provenance.
  Reconciling them is a separate change. Until then, no migration may sweep
  policies by table list — it cannot distinguish an undocumented legitimate
  policy from a dangerous one.
