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

/**
 * True when every predicate the statement actually carries is the tautology
 * `true`. A missing predicate counts as unconditional — an INSERT-only policy
 * has no `USING` clause at all, and `FOR INSERT TO anon WITH CHECK (true)` is
 * exactly as open as `FOR ALL ... USING (true)`.
 */
const isUnconditional = (statement: string): boolean => {
  const sql = withoutQuotedIdentifiers(statement)

  const usingPresent = /\bUSING\s*\(/i.test(sql)
  const usingIsTautology = /\bUSING\s*\(\s*true\s*\)/i.test(sql)
  const checkPresent = /\bWITH\s+CHECK\s*\(/i.test(sql)
  const checkIsTautology = /\bWITH\s+CHECK\s*\(\s*true\s*\)/i.test(sql)

  return (!usingPresent || usingIsTautology) && (!checkPresent || checkIsTautology)
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
