/**
 * @jest-environment node
 *
 * Offline RLS-recipe guard — pure filesystem + `git ls-files`. NO database
 * connection, NO network, NO reading of the production catalog.
 *
 * Guards the defect found in the 2026-09-07 live-catalog review: the repository
 * shipped an operator runbook whose script created, on 31 tables, policies of
 * the shape
 *
 *     CREATE POLICY <name> ON <table> FOR ALL USING (true) WITH CHECK (true)
 *
 * A `CREATE POLICY` with no `TO` clause is stored by PostgreSQL as a grant to
 * PUBLIC. Combined with Supabase's default `GRANT ALL ... TO anon,
 * authenticated`, that shape hands unauthenticated read AND write on the table
 * to anyone who can reach the Data API. The script was never applied to
 * Production, so the exposure was always a *repository* exposure: a runbook one
 * copy-paste away from creating it. This test closes that vector permanently.
 *
 * Scope boundary, stated honestly: this scans operator-runnable SQL — tracked
 * `.sql` files and SQL fenced inside tracked `.md` runbooks. It does not parse
 * TypeScript, and it makes no claim about the live database's actual policies.
 *
 * Failures report `path:line` only.
 */
import { execFileSync } from "child_process"
import { readFileSync, statSync } from "fs"
import { extname, join } from "path"

const REPO_ROOT = join(__dirname, "..", "..")

/** Operator-runnable SQL lives in `.sql` files and in fenced blocks in runbooks. */
const SCANNED_EXTENSIONS = [".sql", ".md"]

/** Skip anything too large to be a hand-written runbook or migration. */
const MAX_SCANNED_BYTES = 2 * 1024 * 1024

/**
 * Grantees that must never hold an unconditional PERMISSIVE policy.
 *
 * `public` is listed because an omitted `TO` clause IS a grant to PUBLIC — the
 * dangerous default, not a neutral one. `anon` is Supabase's unauthenticated
 * Data API role.
 */
const UNTRUSTED_GRANTEES = ["public", "anon"]

/**
 * How far past `CREATE POLICY` to read when no statement terminator is found.
 * Truncation is deliberately fail-closed: a clipped statement loses its `TO`
 * clause and its predicates, so it is classified untrusted AND unconditional
 * and gets reported rather than silently skipped.
 */
const MAX_STATEMENT_CHARS = 800

/**
 * Sites that are permitted to hold an unconditional untrusted recipe, as
 * `path:line`. Deliberately EMPTY: after the 2026-09-07 remediation no tracked
 * file needs one, and adding an entry must be a visible, reviewed act.
 */
const ALLOWED_UNCONDITIONAL_UNTRUSTED_RECIPES: string[] = []

const NUL = String.fromCharCode(0)

const trackedFiles = (): string[] =>
  execFileSync("git", ["ls-files", "-z"], { cwd: REPO_ROOT, maxBuffer: 64 * 1024 * 1024 })
    .toString("utf8")
    .split(NUL)
    .filter(Boolean)
    .filter(file => SCANNED_EXTENSIONS.includes(extname(file).toLowerCase()))

type TrackedFileReader = (file: string) => string | null

const readTrackedFile: TrackedFileReader = file => {
  try {
    if (statSync(join(REPO_ROOT, file)).size > MAX_SCANNED_BYTES) return null
    return readFileSync(join(REPO_ROOT, file), "utf8")
  } catch {
    return null
  }
}

/**
 * The statement beginning at `start`, ending at the first `;` (literal SQL) or
 * the first `'` (a SQL string being assembled for `EXECUTE format(...)`, which
 * is how the retracted script built its recipe).
 */
const statementAt = (contents: string, start: number): string => {
  const window = contents.slice(start, start + MAX_STATEMENT_CHARS)
  const terminator = window.search(/[;']/)
  return terminator === -1 ? window : window.slice(0, terminator)
}

/**
 * Double-quoted identifiers are removed before clause analysis so that a policy
 * or table NAME can never be mistaken for a clause keyword — e.g. a policy
 * literally named "Allow all access to users" must not register a `TO` clause.
 */
const withoutQuotedIdentifiers = (statement: string): string => statement.replace(/"[^"]*"/g, '""')

const granteesOf = (statement: string): string[] => {
  const match = /\bTO\s+((?:[A-Za-z_][A-Za-z0-9_]*\s*,\s*)*[A-Za-z_][A-Za-z0-9_]*)/i.exec(
    withoutQuotedIdentifiers(statement)
  )
  // No `TO` clause at all is a grant to PUBLIC.
  if (!match) return ["public"]
  return match[1].split(",").map(role => role.trim().toLowerCase())
}

/** The commands a policy can govern; PostgreSQL defaults an omitted `FOR` to `ALL`. */
type PolicyCommand = "all" | "select" | "insert" | "update" | "delete"

/**
 * The command the statement governs. Anything unrecognised — including a `FOR`
 * clause clipped away by truncation — falls back to `ALL`, the widest and so the
 * fail-closed reading.
 */
const commandOf = (statement: string): PolicyCommand => {
  const match = /\bFOR\s+(ALL|SELECT|INSERT|UPDATE|DELETE)\b/i.exec(
    withoutQuotedIdentifiers(statement)
  )
  return match ? (match[1].toLowerCase() as PolicyCommand) : "all"
}

/**
 * True when the statement leaves at least one operation it governs
 * unconditionally open.
 *
 * PostgreSQL applies the two predicates to disjoint halves of a policy: `USING`
 * decides which existing rows are visible (SELECT, DELETE, and the read half of
 * UPDATE/ALL), `WITH CHECK` decides which new rows may be written (INSERT and
 * the write half of UPDATE/ALL). They are combined per-operation and never
 * ANDed across both halves: `FOR ALL TO anon USING (true) WITH CHECK (owner =
 * auth.uid())` scopes writes yet still hands every row to anonymous readers, and
 * an AND would have called that safe.
 *
 * A predicate that governs an operation but is absent counts as unconditional:
 * PostgreSQL stores no qual for it and filters nothing, and a statement clipped
 * at MAX_STATEMENT_CHARS loses its predicates the same way. When `WITH CHECK` is
 * omitted PostgreSQL reuses `USING` as the check, so the write half inherits it.
 */
const isUnconditional = (statement: string): boolean => {
  const sql = withoutQuotedIdentifiers(statement)

  const usingPresent = /\bUSING\s*\(/i.test(sql)
  const usingIsTautology = /\bUSING\s*\(\s*true\s*\)/i.test(sql)
  const checkPresent = /\bWITH\s+CHECK\s*\(/i.test(sql)
  const checkIsTautology = /\bWITH\s+CHECK\s*\(\s*true\s*\)/i.test(sql)

  const readsUnconditionally = !usingPresent || usingIsTautology
  const writesUnconditionally = checkPresent ? checkIsTautology : readsUnconditionally

  switch (commandOf(statement)) {
    case "select":
    case "delete":
      return readsUnconditionally
    case "insert":
      return writesUnconditionally
    default:
      // UPDATE and ALL span both halves, so neither predicate can mask the other.
      return readsUnconditionally || writesUnconditionally
  }
}

/** RESTRICTIVE policies can only ever narrow access, so they are never a grant. */
const isPermissive = (statement: string): boolean =>
  !/\bAS\s+RESTRICTIVE\b/i.test(withoutQuotedIdentifiers(statement))

const isDangerous = (statement: string): boolean =>
  isPermissive(statement) &&
  isUnconditional(statement) &&
  granteesOf(statement).some(role => UNTRUSTED_GRANTEES.includes(role))

/**
 * Returns `path:line` for every tracked SQL recipe that would grant
 * unconditional PERMISSIVE access to PUBLIC or `anon`.
 *
 * The file list and reader are injectable so the detector can be exercised
 * against synthetic fixtures without writing SQL to disk.
 */
const permissiveUntrustedRecipeSites = (
  files: string[] = trackedFiles(),
  read: TrackedFileReader = readTrackedFile
): string[] => {
  const sites: string[] = []

  for (const file of files) {
    const contents = read(file)
    if (contents === null || !/CREATE\s+POLICY/i.test(contents)) continue

    const finder = /CREATE\s+POLICY\b/gi
    let match: RegExpExecArray | null
    while ((match = finder.exec(contents)) !== null) {
      if (!isDangerous(statementAt(contents, match.index))) continue
      const line = contents.slice(0, match.index).split("\n").length
      sites.push(`${file}:${line}`)
    }
  }

  return sites
}

describe("no permissive PUBLIC/anon RLS recipe in tracked SQL", () => {
  it("tracks no SQL recipe granting unconditional permissive access to PUBLIC or anon", () => {
    // Reported as `path:line` only.
    const offending = permissiveUntrustedRecipeSites().filter(
      site => !ALLOWED_UNCONDITIONAL_UNTRUSTED_RECIPES.includes(site)
    )
    expect(offending).toEqual([])
  })

  it("carries no stale allowlist entry", () => {
    const live = new Set(permissiveUntrustedRecipeSites())
    const stale = ALLOWED_UNCONDITIONAL_UNTRUSTED_RECIPES.filter(site => !live.has(site))
    expect(stale).toEqual([])
  })
})

describe("unconditional untrusted-grantee detector", () => {
  const scan = (sql: string) => permissiveUntrustedRecipeSites(["fixture.sql"], () => sql)

  it("flags a CREATE POLICY with no TO clause, which PostgreSQL stores as PUBLIC", () => {
    expect(scan(`CREATE POLICY p ON public.users FOR ALL USING (true) WITH CHECK (true);`)).toEqual(
      ["fixture.sql:1"]
    )
  })

  it("flags the format()-templated recipe shape the retracted script used", () => {
    expect(
      scan(
        `EXECUTE format(\n  'CREATE POLICY %I ON %I FOR ALL USING (true) WITH CHECK (true)',\n  pol_name, tbl_name\n);`
      )
    ).toEqual(["fixture.sql:2"])
  })

  it("flags an unconditional anon policy", () => {
    expect(scan(`CREATE POLICY p ON public.users FOR SELECT TO anon USING (true);`)).toEqual([
      "fixture.sql:1",
    ])
  })

  it("flags an INSERT-only anon policy whose sole predicate is WITH CHECK (true)", () => {
    // No USING clause exists on an INSERT policy; treating "absent" as
    // "conditional" would let this shape through.
    expect(
      scan(`CREATE POLICY p ON public.verification_tokens FOR INSERT TO anon WITH CHECK (true);`)
    ).toEqual(["fixture.sql:1"])
  })

  it("is not fooled by a policy name that contains the word 'to'", () => {
    expect(
      scan(`CREATE POLICY "Allow all access to users" ON public.users FOR ALL USING (true);`)
    ).toEqual(["fixture.sql:1"])
  })

  it("allows an unconditional service_role policy", () => {
    expect(
      scan(
        `CREATE POLICY service_role_full_users ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);`
      )
    ).toEqual([])
  })

  it("allows a row-scoped authenticated policy", () => {
    expect(
      scan(
        `CREATE POLICY auth_own_documents ON public.documents FOR ALL TO authenticated USING ((auth.uid())::text = "userId") WITH CHECK ((auth.uid())::text = "userId");`
      )
    ).toEqual([])
  })

  it("allows a RESTRICTIVE PUBLIC policy, which can only narrow access", () => {
    expect(
      scan(`CREATE POLICY p ON public.users AS RESTRICTIVE FOR ALL TO PUBLIC USING (true);`)
    ).toEqual([])
  })

  it("reports a truncated statement rather than skipping it", () => {
    // Fail-closed: an unterminated statement loses its TO clause and predicates.
    expect(scan(`CREATE POLICY p ON public.users`)).toEqual(["fixture.sql:1"])
  })
})

/**
 * PostgreSQL applies the two predicates to disjoint halves of a policy: `USING`
 * decides which existing rows are visible, `WITH CHECK` decides which new rows
 * may be written. A detector that requires BOTH to be tautologies can therefore
 * be talked out of a real exposure by a single row-scoped predicate on the half
 * the attacker does not need — the evasion recorded as review advisory A2.
 */
describe("operation-aware exposure: one tautological predicate is enough", () => {
  const scan = (sql: string) => permissiveUntrustedRecipeSites(["fixture.sql"], () => sql)

  /** A genuinely row-scoped predicate, free of the `'` that ends a statement. */
  const OWNER_SCOPED = `((auth.uid())::text = "userId")`

  it("flags FOR ALL TO anon USING (true) even when WITH CHECK is row-scoped", () => {
    // Writes are scoped; every row of the table is still readable by anon.
    expect(
      scan(
        `CREATE POLICY p ON public.users FOR ALL TO anon USING (true) WITH CHECK ${OWNER_SCOPED};`
      )
    ).toEqual(["fixture.sql:1"])
  })

  it("flags FOR ALL TO anon WITH CHECK (true) even when USING is row-scoped", () => {
    // Reads are scoped; anon can still write arbitrary rows.
    expect(
      scan(
        `CREATE POLICY p ON public.users FOR ALL TO anon USING ${OWNER_SCOPED} WITH CHECK (true);`
      )
    ).toEqual(["fixture.sql:1"])
  })

  it("flags a FOR ALL recipe with no TO clause whose USING is the tautology", () => {
    // The omitted `TO` makes this PUBLIC — the shape the retracted runbook used,
    // one row-scoped WITH CHECK away from evading the old AND.
    expect(
      scan(`CREATE POLICY p ON public.users FOR ALL USING (true) WITH CHECK ${OWNER_SCOPED};`)
    ).toEqual(["fixture.sql:1"])
  })

  it("flags FOR UPDATE TO anon USING (true) even when WITH CHECK is row-scoped", () => {
    expect(
      scan(
        `CREATE POLICY p ON public.documents FOR UPDATE TO anon USING (true) WITH CHECK ${OWNER_SCOPED};`
      )
    ).toEqual(["fixture.sql:1"])
  })

  it("flags FOR UPDATE TO anon WITH CHECK (true) even when USING is row-scoped", () => {
    expect(
      scan(
        `CREATE POLICY p ON public.documents FOR UPDATE TO anon USING ${OWNER_SCOPED} WITH CHECK (true);`
      )
    ).toEqual(["fixture.sql:1"])
  })

  it("flags FOR SELECT TO anon USING (true) even when a WITH CHECK is appended", () => {
    // SELECT exposure is decided by USING alone; a trailing WITH CHECK is not a
    // mitigation, and PostgreSQL would reject it outright.
    expect(
      scan(
        `CREATE POLICY p ON public.users FOR SELECT TO anon USING (true) WITH CHECK ${OWNER_SCOPED};`
      )
    ).toEqual(["fixture.sql:1"])
  })

  it("flags FOR DELETE TO anon USING (true) even when a WITH CHECK is appended", () => {
    expect(
      scan(
        `CREATE POLICY p ON public.users FOR DELETE TO anon USING (true) WITH CHECK ${OWNER_SCOPED};`
      )
    ).toEqual(["fixture.sql:1"])
  })

  it("flags FOR INSERT TO anon WITH CHECK (true) even when a USING is appended", () => {
    // INSERT exposure is decided by WITH CHECK alone.
    expect(
      scan(
        `CREATE POLICY p ON public.users FOR INSERT TO anon USING ${OWNER_SCOPED} WITH CHECK (true);`
      )
    ).toEqual(["fixture.sql:1"])
  })

  it("allows a FOR ALL anon policy whose predicates are both row-scoped", () => {
    expect(
      scan(
        `CREATE POLICY p ON public.documents FOR ALL TO anon USING ${OWNER_SCOPED} WITH CHECK ${OWNER_SCOPED};`
      )
    ).toEqual([])
  })

  it("allows a FOR ALL anon policy that scopes USING and omits WITH CHECK", () => {
    // PostgreSQL reuses USING as the check when WITH CHECK is omitted, so the
    // write half is scoped too.
    expect(
      scan(`CREATE POLICY p ON public.documents FOR ALL TO anon USING ${OWNER_SCOPED};`)
    ).toEqual([])
  })

  it("allows a row-scoped SELECT policy for anon", () => {
    expect(
      scan(`CREATE POLICY p ON public.documents FOR SELECT TO anon USING ${OWNER_SCOPED};`)
    ).toEqual([])
  })

  it("allows a row-scoped INSERT policy for anon", () => {
    expect(
      scan(`CREATE POLICY p ON public.documents FOR INSERT TO anon WITH CHECK ${OWNER_SCOPED};`)
    ).toEqual([])
  })

  it("still allows a service_role policy that mixes a tautology with a scoped predicate", () => {
    expect(
      scan(
        `CREATE POLICY svc ON public.users FOR ALL TO service_role USING (true) WITH CHECK ${OWNER_SCOPED};`
      )
    ).toEqual([])
  })

  it("still allows a RESTRICTIVE anon policy with a tautological USING", () => {
    expect(
      scan(
        `CREATE POLICY p ON public.users AS RESTRICTIVE FOR ALL TO anon USING (true) WITH CHECK ${OWNER_SCOPED};`
      )
    ).toEqual([])
  })

  it("falls back to ALL when truncation clips the FOR clause away", () => {
    expect(scan(`CREATE POLICY p ON public.users TO anon USING (true)`)).toEqual(["fixture.sql:1"])
  })

  it("treats a missing FOR clause as ALL, so a tautological WITH CHECK still counts", () => {
    // An omitted FOR clause IS `FOR ALL` in PostgreSQL. Reading the default as a
    // narrower command would let the write half through unexamined.
    expect(
      scan(`CREATE POLICY p ON public.users TO anon USING ${OWNER_SCOPED} WITH CHECK (true);`)
    ).toEqual(["fixture.sql:1"])
  })

  it("reports an INSERT recipe truncated before its WITH CHECK rather than skipping it", () => {
    // Fail-closed: with no WITH CHECK to read, the write half inherits USING —
    // and USING is absent here too, so nothing constrains the insert.
    expect(scan(`CREATE POLICY p ON public.verification_tokens FOR INSERT TO anon`)).toEqual([
      "fixture.sql:1",
    ])
  })
})
