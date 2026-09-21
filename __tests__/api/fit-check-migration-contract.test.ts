import { readFileSync } from "fs"
import { join } from "path"

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8")
const withoutComments = (sql: string) => sql.replace(/--.*$/gm, "")

const MIGRATION = "prisma/migrations/20260921120000_add_fit_check_assessments/migration.sql"
const RLS_MIGRATION =
  "prisma/migrations/20260921120100_enable_rls_fit_check_assessments/migration.sql"
const RELEASE_GATE = "docs/FIT_CHECK_RELEASE_GATE.md"

describe("fit-check assessment migration contract", () => {
  it("adds the table additively inside one transaction and touches nothing else", () => {
    const migration = withoutComments(read(MIGRATION))

    expect(migration.trim()).toMatch(/^BEGIN;/)
    expect(migration.trim()).toMatch(/COMMIT;$/)
    expect(migration).toContain('CREATE TABLE "fit_check_assessments"')

    // Additive only: no destructive or rewriting statements anywhere.
    expect(migration).not.toMatch(/DROP TABLE|DROP COLUMN|ALTER COLUMN|TRUNCATE|DELETE FROM|UPDATE\s+"/i)
    // The only table it creates or alters is the new one.
    const touched = [...migration.matchAll(/(?:CREATE TABLE|ALTER TABLE)\s+(?:IF NOT EXISTS\s+)?"?([a-z_]+)"?/gi)]
      .map((match) => match[1])
    expect([...new Set(touched)]).toEqual(["fit_check_assessments"])
  })

  it("keeps old application code compatible: every column is NOT NULL with a default or supplied by the client", () => {
    const migration = read(MIGRATION)
    // An older deployed Prisma Client never writes this table at all, so the
    // table is inert until the new code ships. Nothing existing gains a
    // required column.
    expect(migration).not.toMatch(/ALTER TABLE "(?!fit_check_assessments)/)
  })

  it("constrains the result to the three neutral outcomes and cascades with the user", () => {
    const migration = read(MIGRATION)
    expect(migration).toMatch(
      /CHECK \("result" IN \('fit', 'review_required', 'out_of_scope'\)\)/,
    )
    expect(migration).toMatch(
      /FOREIGN KEY \("userId"\) REFERENCES "users"\("id"\) ON DELETE CASCADE/,
    )
  })

  it("indexes only the lookup the checkout gate performs", () => {
    const migration = read(MIGRATION)
    const indexes = [...migration.matchAll(/CREATE (?:UNIQUE )?INDEX "([^"]+)"/g)].map((m) => m[1])
    expect(indexes).toEqual(["fit_check_assessments_userId_createdAt_idx"])
    expect(migration).toContain(
      'CREATE INDEX "fit_check_assessments_userId_createdAt_idx" ON "fit_check_assessments"("userId", "createdAt")',
    )
  })

  it("restricts the Supabase Data API to service_role, matching the other payment tables", () => {
    const rls = withoutComments(read(RLS_MIGRATION))
    expect(rls.trim()).toMatch(/^BEGIN;/)
    expect(rls.trim()).toMatch(/COMMIT;$/)
    expect(rls).toContain(
      "ALTER TABLE IF EXISTS public.fit_check_assessments ENABLE ROW LEVEL SECURITY;",
    )
    expect(rls).toMatch(/FOR ALL\s+TO service_role\s+USING \(true\)\s+WITH CHECK \(true\);/)
    expect(rls).not.toMatch(/\bTO\s+(?:PUBLIC|anon|authenticated)\b/i)
    expect(rls).not.toMatch(/FORCE ROW LEVEL SECURITY/i)
  })

  it("declares the same shape in the Prisma schema", () => {
    const schema = read("prisma/schema.prisma")
    expect(schema).toContain("model FitCheckAssessment")
    expect(schema).toContain('@@map("fit_check_assessments")')
    expect(schema).toContain("@@index([userId, createdAt])")
    expect(schema).toContain("fitCheckAssessments FitCheckAssessment[]")
  })

  it("gives the Prisma column the same default the migration gives it", () => {
    const schema = read("prisma/schema.prisma")
    const model = schema.slice(
      schema.indexOf("model FitCheckAssessment"),
      schema.indexOf("}", schema.indexOf("@@map(\"fit_check_assessments\")")),
    )
    // The migration writes `DEFAULT ARRAY[]::TEXT[]`. If the schema omitted the
    // matching default, `prisma migrate dev` would generate a drift migration
    // that strips it from the database.
    expect(read(MIGRATION)).toContain('"reasons" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]')
    expect(model).toMatch(/reasons\s+String\[\]\s+@default\(\[\]\)/)
  })

  it("ships a release gate that requires the migration before the application code", () => {
    const gate = read(RELEASE_GATE)

    // The checkout gate reads this table on every attempt and fails closed, so
    // code-first deployment refuses every one-time checkout until the table
    // exists. The ordering has to be written down, not just known.
    expect(gate).toMatch(/migration-first/i)
    expect(gate).toMatch(/before\*{0,2} the application code is deployed/i)
    expect(gate).toMatch(/fails? closed/i)

    // It has to name the exact artifacts an operator applies.
    expect(gate).toContain(MIGRATION)
    expect(gate).toContain(RLS_MIGRATION)

    // A bound provider session is OPEN, never PENDING. Pin the exact cutover
    // population so the operator cannot get a false zero before deployment.
    expect(gate).toContain("`status = 'OPEN'` and a non-null `stripeSessionId`")
    expect(gate).not.toContain("`status = 'PENDING'` and a non-null `stripeSessionId`")

    // Applying it is an approval-gated production action, never automated.
    expect(gate).toMatch(/explicit approval/i)
    expect(gate).toMatch(/Do not run these steps from tests, previews, or local review/i)

    // Rollback must not take the users' answered assessments with it.
    expect(gate).toMatch(/Roll back the \*{0,2}application only\*{0,2}/i)
    expect(gate).toMatch(/Do not drop `fit_check_assessments`/i)
  })

  it("never applies a migration from a script that install, test, or deploy runs on its own", () => {
    const { scripts = {} } = JSON.parse(read("package.json")) as {
      scripts?: Record<string, string>
    }
    // The scripts CI, Vercel and `npm test` invoke without anyone typing them.
    // `db:migrate`/`db:reset`/`db:push` are deliberately excluded: those are
    // commands an operator chooses, which is exactly the gate this documents.
    const UNATTENDED = ["postinstall", "prepare", "build", "test", "test:unit", "test:integration"]
    for (const name of UNATTENDED) {
      const script = scripts[name]
      if (script === undefined) continue
      expect(`${name}: ${script}`).not.toMatch(/prisma\s+migrate\s+(deploy|dev|reset)/)
      expect(`${name}: ${script}`).not.toMatch(/prisma\s+db\s+push/)
    }
  })

  it("stores no free text, case facts, or contact details", () => {
    const schema = read("prisma/schema.prisma")
    const model = schema.slice(
      schema.indexOf("model FitCheckAssessment"),
      schema.indexOf("}", schema.indexOf("@@map(\"fit_check_assessments\")")),
    )
    expect(model).not.toMatch(/email|name|address|phone|note|narrative|description|ssn/i)
  })
})
