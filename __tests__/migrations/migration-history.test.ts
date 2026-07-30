/**
 * Offline migration-history regression — pure filesystem, NO database access.
 *
 * Guards the two failure classes uncovered in the 2026-07-30 reconciliation
 * (docs/audits/2026-07-30-migration-history-reconciliation.md):
 *
 *  1. A checked-in migration set that is not internally deploy-safe — e.g. two
 *     migrations that both `CREATE TABLE "stripe_events"` (exactly the flaw in
 *     the untracked historical drafts) would fail on a fresh `migrate deploy`.
 *  2. Silent drift between the authoritative production migration history and
 *     the repository — a historical migration directory recorded in production
 *     but missing from the repo, undocumented.
 *
 * This test contacts no database and reads only the filesystem, so it runs in
 * every environment (including CI without TEST_DATABASE_URL).
 */
import { readdirSync, readFileSync, existsSync, statSync } from "fs"
import { join } from "path"

const MIGRATIONS_DIR = join(__dirname, "..", "..", "prisma", "migrations")

/**
 * Authoritative migration directories recorded as applied in PRODUCTION
 * (per the completed one-time-checkout release evidence). This list is the
 * contract the repository is reconciled against.
 */
const RECONCILED_PRODUCTION_MIGRATIONS = [
  "20260419000001_add_stripe_events_idempotency",
  "20260419000002_add_missing_schema_tables",
  "20260506140500_enable_rls_remaining_public_tables",
  "20260518161000_add_checklist_subscriber_followup_columns",
  "20260729150000_harden_one_time_checkout",
] as const

const RECONCILED_PRODUCTION_THROUGH = "20260729150000_harden_one_time_checkout"

/**
 * Historical migrations recorded in production but NOT yet present in the repo,
 * pending proven-provenance reconciliation. This is the explicit, tracked drift
 * ledger — reducing it requires adding the exact migration SQL with proven
 * provenance (see the audit doc). It exists so the gap is asserted and visible
 * rather than silent; the test still fails loudly if the gap changes shape.
 */
const KNOWN_MISSING_HISTORICAL = new Map<string, string>([
  [
    "20260419000001_add_stripe_events_idempotency",
    "ee564e6d82bb4b05cdb3ff95c78c5d4aaa0a3b4f46dd50a89cc763df5b5d849c",
  ],
  [
    "20260419000002_add_missing_schema_tables",
    "779b528d4db5fbe1f9daa3e720d038ab441cd6cd2161fb30c363fb12de6c81e0",
  ],
])

function migrationDirs(): string[] {
  if (!existsSync(MIGRATIONS_DIR)) return []
  return readdirSync(MIGRATIONS_DIR).filter((name) => {
    const p = join(MIGRATIONS_DIR, name)
    return statSync(p).isDirectory() && existsSync(join(p, "migration.sql"))
  })
}

function createdTables(sql: string): string[] {
  // Match `CREATE TABLE "name"` but NOT `CREATE TABLE IF NOT EXISTS "name"`
  // (an idempotent create is not a hard duplicate).
  const out: string[] = []
  const re = /CREATE\s+TABLE\s+(?!IF\s+NOT\s+EXISTS)"([^"]+)"/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(sql)) !== null) out.push(m[1])
  return out
}

describe("prisma migration history (offline)", () => {
  const present = migrationDirs()

  it("historical migrations through the reconciliation cutoff are accounted for", () => {
    const reconciled = new Set<string>(RECONCILED_PRODUCTION_MIGRATIONS)
    const unexpectedHistorical = present.filter(
      (d) => d <= RECONCILED_PRODUCTION_THROUGH && !reconciled.has(d),
    )
    // Forward migrations newer than the cutoff are expected to be committed
    // before production applies them. Only unexplained history at/before the
    // reconciled cutoff is rejected.
    expect(unexpectedHistorical).toEqual([])
  })

  it("every reconciled production migration is present or tracked as known-missing", () => {
    const presentSet = new Set(present)
    const undocumentedMissing = RECONCILED_PRODUCTION_MIGRATIONS.filter(
      (d) => !presentSet.has(d) && !KNOWN_MISSING_HISTORICAL.has(d),
    )
    // A production migration directory absent from the repo AND not recorded in
    // the drift ledger is silent history drift — fail loudly with the names.
    expect(undocumentedMissing).toEqual([])
  })

  it("the known-missing drift ledger only lists migrations that are genuinely absent", () => {
    const presentSet = new Set(present)
    const staleLedgerEntries = [...KNOWN_MISSING_HISTORICAL.keys()].filter((d) =>
      presentSet.has(d),
    )
    // If a known-missing migration has been added back to the repo, it must be
    // removed from KNOWN_MISSING_HISTORICAL (and covered by the tests above),
    // so the ledger never masks a now-present migration.
    expect(staleLedgerEntries).toEqual([])
  })

  it("records production checksums for every known-missing historical migration", () => {
    for (const checksum of KNOWN_MISSING_HISTORICAL.values()) {
      expect(checksum).toMatch(/^[0-9a-f]{64}$/)
    }
  })

  it("has no plainly duplicated non-idempotent CREATE TABLE statements", () => {
    const owners = new Map<string, string[]>()
    for (const dir of present) {
      const sql = readFileSync(join(MIGRATIONS_DIR, dir, "migration.sql"), "utf8")
      for (const table of createdTables(sql)) {
        owners.set(table, [...(owners.get(table) ?? []), dir])
      }
    }
    const duplicated = [...owners.entries()].filter(([, dirs]) => dirs.length > 1)
    // This is a narrow static tripwire, not proof that the full migration set can
    // recreate the schema. It catches the exact historical-pair defect:
    // 000002 re-creates 000001's stripe_events table.
    expect(duplicated).toEqual([])
  })
})
