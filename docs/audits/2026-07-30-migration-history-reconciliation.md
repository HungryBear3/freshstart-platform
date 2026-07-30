# Migration-history reconciliation — 2026-07-30

**Worktree:** `/Users/abigailclaw/cc-worktrees/fs-migration-baseline-20260730`
**Branch:** `cc/fs-migration-baseline-20260730`
**Base:** `origin/main` @ `7debbfd2e0f5dd9b343776db455c29b22e48b078`

## Scope and evidence boundaries

The CC lane performed offline repository reconciliation only: no database connection, `migrate deploy`, `migrate resolve`, `db push`, or DB mutation.

After that lane completed, Rex performed a separately authorized **SELECT-only controller verification** against production `_prisma_migrations`. Rex read migration names, checksums, timestamps, and `applied_steps_count`; no database state was changed.

## Outcome

The two missing 2026-04-19 migration files are now authenticated as exact historical artifacts: each local SQL file's SHA-256 equals the checksum stored in its production `_prisma_migrations` row. Both production rows report `applied_steps_count = 0`, establishing that they were metadata-resolved rather than executed by Prisma.

They are still **not safe to add to executable migration history as-is**. The second file repeats a plain `CREATE TABLE "stripe_events"` from the first file. A fresh sequential migration run would fail on the duplicate relation. No migration directories were added.

## Repository history versus production history

Tracked in `prisma/migrations/` at the base:

- `20260506140500_enable_rls_remaining_public_tables`
- `20260518161000_add_checklist_subscriber_followup_columns`
- `20260729150000_harden_one_time_checkout`

Recorded in production but missing from the repository:

| Migration | Production checksum | Applied steps | Local exact-checksum match |
|---|---|---:|---|
| `20260419000001_add_stripe_events_idempotency` | `ee564e6d82bb4b05cdb3ff95c78c5d4aaa0a3b4f46dd50a89cc763df5b5d849c` | 0 | Yes |
| `20260419000002_add_missing_schema_tables` | `779b528d4db5fbe1f9daa3e720d038ab441cd6cd2161fb30c363fb12de6c81e0` | 0 | Yes |

The exact matching copies are untracked under the main checkout's `prisma/migrations/`. They do not appear in any commit, tag, branch, reflog, stash, archive, or sibling worktree inspected by CC.

## Historical SQL contents

- `000001`: creates `stripe_events` and its unique `stripeEventId` index.
- `000002`: adds `users.hasCompletedOnboarding`; creates `user_badges`, `case_invitations`, `case_collaborators`, and `marketing_links`; then creates `stripe_events` again without `IF NOT EXISTS`.

### Execution-history conclusion

The checksum match proves file identity. The production rows' zero applied-step counts prove these exact artifacts were metadata-resolved. Therefore the duplicate create is not evidence that the files are fabricated; it is evidence that they were not a coherent executable pair and were not run by Prisma in production.

The current tracked migration set also cannot be treated as proof of fresh-database reproducibility. It omits foundational schema creation while later migrations alter or harden objects that must already exist. Establishing a clean bootstrap/squash strategy is a separate migration-design task.

## Schema corroboration

The objects named by the historical SQL exist in `prisma/schema.prisma` but are created by no tracked migration:

- `users.hasCompletedOnboarding`
- `user_badges`
- `case_invitations`
- `case_collaborators`
- `marketing_links`
- `stripe_events`

The tracked May 6 RLS migration uses guarded operations against these objects, corroborating that they predate the tracked migration set. It does not make the historical pair executable.

## Offline regression added

`__tests__/migrations/migration-history.test.ts` is filesystem-only and runs without `TEST_DATABASE_URL`. It asserts:

1. Every migration at or before the reconciled production cutoff is either checked in or explicitly present in the known-missing ledger.
2. New forward migrations after the cutoff are allowed to be committed before production applies them.
3. Every known-missing historical entry carries a 64-character production checksum.
4. Ledger entries must be removed if their directories are later added.
5. Checked-in migrations contain no plainly duplicated non-idempotent `CREATE TABLE` statements.

The fifth assertion is a narrow static tripwire for the observed duplicate-create defect. It is **not** proof that the full migration set can recreate the schema.

## Recommended reconciliation

1. Preserve these exact SQL bytes and production checksums as historical evidence. Do not silently edit either historical file; editing would break checksum identity.
2. Do not copy the pair directly into executable `prisma/migrations/` while the duplicate create remains.
3. Design and test an explicit fresh-database bootstrap or squashed-baseline strategy in an isolated database. Account for all schema objects, not only the two missing directories.
4. Keep production migration metadata unchanged unless a separately reviewed migration-recovery plan explicitly requires a mutation.
5. After a bootstrap strategy is proven, update the known-missing ledger and its reconciliation cutoff in the same reviewed change.

## Side-effect attestation

CC's candidate work was offline. Rex's controller follow-up was SELECT-only. No `migrate deploy`, `migrate resolve`, `db push`, migration application, DB write, commit, push, PR, or deploy occurred. The main checkout remained read-only.
