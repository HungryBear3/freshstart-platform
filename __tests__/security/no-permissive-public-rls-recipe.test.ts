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
import { MAX_SCANNED_BYTES, MAX_STATEMENT_CHARS } from "@/lib/security/rls-recipe/bounds"
import { scanFiles } from "@/lib/security/rls-recipe"

const REPO_ROOT = join(__dirname, "..", "..")

/** Operator-runnable SQL lives in `.sql` files and in fenced blocks in runbooks. */
const SCANNED_EXTENSIONS = [".sql", ".md"]

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

const permissiveUntrustedRecipeSites = (
  files: string[] = trackedFiles(),
  read: TrackedFileReader = readTrackedFile
): string[] => scanFiles(files, read)

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

  it("allows a quoted service_role grantee", () => {
    expect(
      scan(
        `CREATE POLICY service_role_full_users ON public.users FOR ALL TO "service_role" USING (true) WITH CHECK (true);`
      )
    ).toEqual([])
  })

  it("still flags a quoted anon grantee", () => {
    expect(scan(`CREATE POLICY p ON public.users FOR SELECT TO "anon" USING (true);`)).toEqual([
      "fixture.sql:1",
    ])
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

/**
 * Statement extraction used to end a statement at the first `;` OR the first
 * `'`. A scoped `USING` that mentions any string literal therefore clipped the
 * statement mid-predicate, throwing away the `WITH CHECK (true)` that followed —
 * and what remained looked like a properly scoped policy. Review finding F1.
 *
 * The same clip happens at a `;` that is not a terminator at all, e.g. one
 * inside a dollar-quoted body or a comment.
 *
 * These cases fix the parser contract: a statement ends at a semicolon that is
 * outside every literal and comment, or not at all.
 */
describe("statement extraction is quote- and comment-aware", () => {
  const scan = (sql: string) => permissiveUntrustedRecipeSites(["fixture.sql"], () => sql)

  /** A row-scoped predicate that mentions a string literal, as real ones do. */
  const SCOPED_WITH_LITERAL = `(tenant_id = current_setting('app.tenant_id'))`

  // ---- The four shapes named in the review -------------------------------

  it("flags FOR ALL TO anon whose scoped USING holds a literal and whose WITH CHECK is true", () => {
    expect(
      scan(
        `CREATE POLICY p ON public.users FOR ALL TO anon USING ${SCOPED_WITH_LITERAL} WITH CHECK (true);`
      )
    ).toEqual(["fixture.sql:1"])
  })

  it("flags the same FOR ALL shape with no TO clause, which PostgreSQL stores as PUBLIC", () => {
    expect(
      scan(
        `CREATE POLICY p ON public.users FOR ALL USING ${SCOPED_WITH_LITERAL} WITH CHECK (true);`
      )
    ).toEqual(["fixture.sql:1"])
  })

  it("flags FOR UPDATE TO anon whose scoped USING holds a literal and whose WITH CHECK is true", () => {
    expect(
      scan(
        `CREATE POLICY p ON public.documents FOR UPDATE TO anon USING (status <> 'archived') WITH CHECK (true);`
      )
    ).toEqual(["fixture.sql:1"])
  })

  it("flags the same FOR UPDATE shape with no TO clause", () => {
    expect(
      scan(
        `CREATE POLICY p ON public.documents FOR UPDATE USING (status <> 'archived') WITH CHECK (true);`
      )
    ).toEqual(["fixture.sql:1"])
  })

  // ---- The literal forms the scanner has to understand --------------------

  it("does not end the statement at a semicolon inside a string literal", () => {
    expect(
      scan(
        `CREATE POLICY p ON public.users FOR ALL TO anon USING (note = 'a;b') WITH CHECK (true);`
      )
    ).toEqual(["fixture.sql:1"])
  })

  it("does not end the statement at a semicolon inside a double-quoted identifier", () => {
    expect(
      scan(`CREATE POLICY p ON public.users FOR ALL TO anon USING ("a;b" = x) WITH CHECK (true);`)
    ).toEqual(["fixture.sql:1"])
  })

  it("keeps a doubled quote inside one double-quoted identifier", () => {
    expect(
      scan(
        `CREATE POLICY p ON public.users FOR ALL TO anon USING ("AS ""RESTRICTIVE""" = note) WITH CHECK (true);`
      )
    ).toEqual(["fixture.sql:1"])
  })

  it("does not end the statement at a semicolon inside a block comment", () => {
    expect(
      scan(
        `CREATE POLICY p ON public.users FOR ALL TO anon USING (org_id = 1) /* step; two */ WITH CHECK (true);`
      )
    ).toEqual(["fixture.sql:1"])
  })

  it("does not end the statement at a semicolon inside a nested block comment", () => {
    expect(
      scan(
        `CREATE POLICY p ON public.users FOR ALL TO anon USING (status = 'public') /* outer /* inner */ ; still outer */ WITH CHECK (true);`
      )
    ).toEqual(["fixture.sql:1"])
  })

  it("tracks block-comment nesting beyond one inner level", () => {
    expect(
      scan(
        `CREATE POLICY p ON public.users FOR ALL TO anon USING (status = 'public') /* one /* two /* three */ two */ ; one */ WITH CHECK (true);`
      )
    ).toEqual(["fixture.sql:1"])
  })

  it("reports an unclosed nested block comment as a truncated untrusted policy", () => {
    expect(
      scan(
        `CREATE POLICY p ON public.users FOR ALL TO anon USING (status = 'public') /* outer /* inner */ still outer`
      )
    ).toEqual(["fixture.sql:1"])
  })

  it("does not end the statement at a doubled-quote escape inside a string literal", () => {
    expect(
      scan(
        `CREATE POLICY p ON public.users FOR ALL TO anon USING (surname = 'O''Brien') WITH CHECK (true);`
      )
    ).toEqual(["fixture.sql:1"])
  })

  it("does not end the statement at a semicolon inside a dollar-quoted literal", () => {
    expect(
      scan(
        `CREATE POLICY p ON public.users FOR ALL TO anon USING (note = $$a;b$$) WITH CHECK (true);`
      )
    ).toEqual(["fixture.sql:1"])
  })

  it("does not end the statement at a semicolon inside a tagged dollar-quoted literal", () => {
    expect(
      scan(
        `CREATE POLICY p ON public.users FOR ALL TO anon USING (note = $tag$a;b$tag$) WITH CHECK (true);`
      )
    ).toEqual(["fixture.sql:1"])
  })

  it("does not end the statement at a quote inside a tagged dollar-quoted literal", () => {
    expect(
      scan(
        `CREATE POLICY p ON public.users FOR ALL TO anon USING (note = $tag$it's fine$tag$) WITH CHECK (true);`
      )
    ).toEqual(["fixture.sql:1"])
  })

  it("does not end the statement at an apostrophe inside a double-quoted identifier", () => {
    expect(
      scan(
        `CREATE POLICY p ON public.users FOR ALL TO anon USING ("O'Brien" = surname) WITH CHECK (true);`
      )
    ).toEqual(["fixture.sql:1"])
  })

  it("does not end the statement at an apostrophe inside a line comment", () => {
    expect(
      scan(
        `CREATE POLICY p ON public.users FOR ALL TO anon\n  USING ((auth.uid())::text = "userId") -- doesn't apply here\n  WITH CHECK (true);`
      )
    ).toEqual(["fixture.sql:1"])
  })

  it("does not end the statement at a semicolon inside a line comment", () => {
    expect(
      scan(
        `CREATE POLICY p ON public.users FOR ALL TO anon\n  USING ((auth.uid())::text = "userId") -- see runbook; step 3\n  WITH CHECK (true);`
      )
    ).toEqual(["fixture.sql:1"])
  })

  it("does not end the statement at a quote or semicolon inside a block comment", () => {
    expect(
      scan(
        `CREATE POLICY p ON public.users FOR ALL TO anon USING ((auth.uid())::text = "userId") /* it's fine; really */ WITH CHECK (true);`
      )
    ).toEqual(["fixture.sql:1"])
  })

  it("reports a statement whose WITH CHECK is padded past MAX_STATEMENT_CHARS", () => {
    // Fail-closed: a predicate long enough to push the rest of the statement out
    // of the window must not be readable as a scoped policy. The padding carries
    // no quote, comment or semicolon, so only the length limit is under test.
    const padding = "org_id <> 0 AND ".repeat(60)
    expect(
      scan(
        `CREATE POLICY p ON public.users FOR ALL TO anon USING (${padding}org_id = 1) WITH CHECK (true);`
      )
    ).toEqual(["fixture.sql:1"])
  })

  // ---- Safe recipes must not become false positives ----------------------

  it("allows an anon policy whose USING holds a literal and whose WITH CHECK is row-scoped", () => {
    expect(
      scan(
        `CREATE POLICY p ON public.documents FOR ALL TO anon USING ${SCOPED_WITH_LITERAL} WITH CHECK ((auth.uid())::text = "userId");`
      )
    ).toEqual([])
  })

  it("allows a row-scoped SELECT policy whose USING holds a literal", () => {
    expect(
      scan(`CREATE POLICY p ON public.documents FOR SELECT TO anon USING (kind = 'note');`)
    ).toEqual([])
  })

  it("still allows a service_role policy whose USING holds a literal", () => {
    expect(
      scan(
        `CREATE POLICY svc ON public.users FOR ALL TO service_role USING (tenant_id = current_setting('app.tenant_id')) WITH CHECK (true);`
      )
    ).toEqual([])
  })

  it("still allows a RESTRICTIVE anon policy whose USING holds a literal", () => {
    expect(
      scan(
        `CREATE POLICY p ON public.users AS RESTRICTIVE FOR ALL TO anon USING (kind = 'note') WITH CHECK (true);`
      )
    ).toEqual([])
  })

  it("allows a service_role policy containing a nested block comment", () => {
    expect(
      scan(
        `CREATE POLICY svc ON public.users FOR ALL TO service_role USING (true) /* outer /* inner; */ outer */ WITH CHECK (true);`
      )
    ).toEqual([])
  })

  it("allows a RESTRICTIVE anon policy containing a nested block comment", () => {
    expect(
      scan(
        `CREATE POLICY p ON public.users AS RESTRICTIVE FOR ALL TO anon USING (true) /* outer /* inner; */ outer */ WITH CHECK (true);`
      )
    ).toEqual([])
  })

  it("allows a fully row-scoped anon policy containing a nested block comment", () => {
    expect(
      scan(
        `CREATE POLICY p ON public.users FOR ALL TO anon USING (kind = 'note') /* outer /* inner; */ outer */ WITH CHECK (kind = 'note');`
      )
    ).toEqual([])
  })

  it("does not report a truncated service_role policy, which is trusted however long", () => {
    // Truncation forces "unconditional", never "untrusted": the grantee that was
    // actually read still decides.
    expect(
      scan(
        `CREATE POLICY svc ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true)`
      )
    ).toEqual([])
  })

  it("does not report a truncated RESTRICTIVE policy, which can only narrow access", () => {
    expect(
      scan(`CREATE POLICY p ON public.users AS RESTRICTIVE FOR ALL TO anon USING (true)`)
    ).toEqual([])
  })

  it("stops at the terminating semicolon instead of swallowing the next statement", () => {
    // If extraction ran past the first statement's `;` it would inherit the
    // second statement's tautologies and report line 1 as well.
    expect(
      scan(
        `CREATE POLICY safe ON public.documents FOR ALL TO anon USING (kind = 'note') WITH CHECK (kind = 'note');\nCREATE POLICY danger ON public.users FOR ALL USING (true) WITH CHECK (true);`
      )
    ).toEqual(["fixture.sql:2"])
  })
})

describe("independent adversarial lexical review", () => {
  const scanAdversarial = (sql: string) =>
    permissiveUntrustedRecipeSites(["fixture.sql"], () => sql)

  test.each([
    [
      "exact nested-comment reproducer",
      `CREATE POLICY p ON public.users FOR ALL TO anon USING (status = 'public') /* outer /* inner */ ; still outer */ WITH CHECK (true);`,
    ],
    [
      "block-comment fake trusted grantee",
      `CREATE POLICY p ON public.users FOR ALL /* TO service_role */ USING (true) WITH CHECK (true);`,
    ],
    [
      "line-comment fake trusted grantee",
      `CREATE POLICY p ON public.users FOR ALL -- TO service_role
USING (true) WITH CHECK (true);`,
    ],
    [
      "block-comment fake restrictive mode",
      `CREATE POLICY p ON public.users /* AS RESTRICTIVE */ FOR ALL TO anon USING (true) WITH CHECK (true);`,
    ],
    [
      "dollar-string fake restrictive mode",
      `CREATE POLICY p ON public.users FOR ALL TO anon USING (note = $$AS RESTRICTIVE$$) WITH CHECK (true);`,
    ],
    [
      "dollar-string fake trusted grantee",
      `CREATE POLICY p ON public.users FOR ALL USING (note = $$TO service_role$$) WITH CHECK (true);`,
    ],
    [
      "Unicode-tagged dollar string with internal terminator",
      `CREATE POLICY p ON public.users FOR ALL TO anon USING (note = $é$a;b$é$) WITH CHECK (true);`,
    ],
    [
      "escape string with escaped quote and internal terminator",
      `CREATE POLICY p ON public.users FOR ALL TO anon USING (note = E'a\\';b') WITH CHECK (true);`,
    ],
    [
      "single-string fake SELECT command",
      `CREATE POLICY p ON public.users TO anon USING (note = 'FOR SELECT') WITH CHECK (true);`,
    ],
    [
      "block-comment fake SELECT command",
      `CREATE POLICY p ON public.users TO anon USING (owner_id = auth.uid() /* FOR SELECT */) WITH CHECK (true);`,
    ],
    [
      "commented tautology",
      `CREATE POLICY p ON public.users FOR SELECT TO anon USING (true /* harmless */);`,
    ],
    [
      "nested-parenthesis tautology",
      `CREATE POLICY p ON public.users FOR SELECT TO anon USING ((true));`,
    ],
    ["equivalent tautology", `CREATE POLICY p ON public.users FOR SELECT TO anon USING (1 = 1);`],
    [
      "unclosed block-comment fake trusted grantee",
      `CREATE POLICY p ON public.users FOR ALL /* TO service_role`,
    ],
    [
      "unclosed dollar-string fake trusted grantee",
      `CREATE POLICY p ON public.users FOR ALL USING ($x$ TO service_role`,
    ],
  ])("flags dangerous %s", (_name, sql) => {
    expect(scanAdversarial(sql)).toEqual(["fixture.sql:1"])
  })

  test.each([
    [
      "service_role with nested comments",
      `CREATE POLICY svc ON public.users FOR ALL TO service_role USING (true) /* outer /* inner */ outer */ WITH CHECK (true);`,
    ],
    [
      "actual restrictive with lexical noise",
      `CREATE POLICY p ON public.users AS RESTRICTIVE FOR ALL TO anon USING (note = $$FOR SELECT; TO service_role$$) WITH CHECK (true);`,
    ],
    [
      "scoped anon with commented fake tautology",
      `CREATE POLICY p ON public.users FOR ALL TO anon USING (owner_id = auth.uid() /* USING (true) */) WITH CHECK (owner_id = auth.uid());`,
    ],
    [
      "scoped anon with string fake tautology",
      `CREATE POLICY p ON public.users FOR ALL TO anon USING (note = 'USING (true)') WITH CHECK (owner_id = auth.uid());`,
    ],
    [
      "real statement termination",
      `CREATE POLICY safe ON public.users FOR ALL TO anon USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid()); CREATE POLICY svc ON public.users FOR ALL TO service_role USING (true);`,
    ],
  ])("does not flag safe %s", (_name, sql) => {
    expect(scanAdversarial(sql)).toEqual([])
  })
})

describe("independent hostile probes", () => {
  const scanProbe = (sql: string) => permissiveUntrustedRecipeSites(["fixture.sql"], () => sql)
  const scanMarkdown = (markdown: string) =>
    permissiveUntrustedRecipeSites(["fixture.md"], () => markdown)

  it("scans SQL fences without letting Markdown prose apostrophes blind discovery", () => {
    expect(
      scanMarkdown(
        "Use Option B if the table doesn't exist.\n\n```sql\nCREATE POLICY p ON public.users FOR ALL USING (true) WITH CHECK (true);\n```"
      )
    ).toEqual(["fixture.md:4"])
  })

  it("does not execute an RLS anti-pattern merely documented in Markdown prose", () => {
    expect(
      scanMarkdown("Never write CREATE POLICY p ON public.users FOR ALL USING (true);")
    ).toEqual([])
  })

  it("fails closed when a truncated grantee list may continue with anon", () => {
    const padding = Array.from({ length: 100 }, (_, i) => `role_${i}`).join(", ")
    expect(
      scanProbe(
        `CREATE POLICY p ON public.users FOR ALL TO service_role, ${padding}, anon USING (true) WITH CHECK (true);`
      )
    ).toEqual(["fixture.sql:1"])
  })

  it("finds the real WITH CHECK after a nested WITH in USING", () => {
    expect(
      scanProbe(
        `CREATE POLICY p ON public.users FOR ALL TO anon USING (EXISTS (WITH owned AS (SELECT 1) SELECT 1 FROM owned WHERE owner_id = auth.uid())) WITH CHECK (true);`
      )
    ).toEqual(["fixture.sql:1"])
  })

  test.each([
    `CREATE/* separator */POLICY p ON public.users FOR SELECT TO anon USING (true);`,
    `CREATE -- separator\nPOLICY p ON public.users FOR SELECT TO anon USING (true);`,
  ])("recognizes comments separating CREATE and POLICY: %s", sql => {
    expect(scanProbe(sql)).toEqual(["fixture.sql:1"])
  })

  test.each([
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (true::boolean);`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (NOT false);`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (true IS TRUE);`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (true OR owner_id = auth.uid());`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (true = true);`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (1 <= 1);`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (COALESCE(true, owner_id = auth.uid()));`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (CASE WHEN true THEN true ELSE owner_id = auth.uid() END);`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (NOT NOT true);`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (NOT (NOT true));`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (NOT (1 = 0));`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (NOT (false OR false));`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (NOT (false AND owner_id = auth.uid()));`,
    `CREATE POLICY p ON public.users FOR ALL TO anon USING (current_date > current_date - 1) WITH CHECK (current_date > current_date - 1);`,
    `CREATE POLICY p ON public.users FOR ALL TO anon USING (current_user <> '') WITH CHECK (current_user <> '');`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (owner_id = auth.uid() OR session_user <> '');`,
    `CREATE POLICY p ON public.users FOR ALL USING (localtimestamp > localtimestamp - interval '1 day') WITH CHECK (localtimestamp > localtimestamp - interval '1 day');`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (current_time > current_time - interval '1 minute');`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (current_timestamp > current_timestamp - interval '1 minute');`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (localtime > localtime - interval '1 minute');`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (current_role <> '');`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (current_catalog <> '');`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (current_schema <> '');`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (user <> '');`,
    `DO $$ BEGIN EXECUTE format('CREATE%sPOLICY p ON public.users FOR SELECT TO anon USING (true)', ' '); END $$;`,
    String.raw`DO $$ BEGIN EXECUTE format(E'CREATE%sPOLICY p ON public.users FOR SELECT TO anon USING (true)', ' '); END $$;`,
    `DO $$ BEGIN EXECUTE format($fmt$CREATE%sPOLICY p ON public.users FOR SELECT TO anon USING (true)$fmt$, ' '); END $$;`,
    `DO $$ BEGIN EXECUTE $sql$CREATE POLICY p ON public.users FOR SELECT TO anon USING (true)$sql$; END $$;`,
    `DO LANGUAGE plpgsql $$ BEGIN CREATE POLICY p ON public.users FOR SELECT TO anon USING (true); END $$;`,
    `DO $$ DECLARE stmt text; BEGIN stmt := 'CREATE POLICY p ON public.users FOR ALL USING (true) WITH CHECK (true)'; EXECUTE stmt; END $$;`,
    `CREATE POLICY p ON public.users FOR ALL TO anon USING ('a' <> 'b');`,
    `CREATE POLICY p ON public.users FOR ALL TO anon USING ($$a$$ <> $$b$$);`,
    `CREATE POLICY p ON public.users FOR ALL TO anon USING (1 = '1');`,
    `CREATE POLICY p ON public.users FOR ALL TO anon USING (true = 'true');`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (pg_catalog.current_database() <> '');`,
    `ALTER POLICY p ON public.users TO anon USING (true) WITH CHECK (true);`,
  ])("flags a semantically unconditional predicate: %s", sql => {
    expect(scanProbe(sql)).toEqual(["fixture.sql:1"])
  })

  it("does not treat trailing file content as statement clipping", () => {
    const trailingComment = `/* ${"x".repeat(MAX_STATEMENT_CHARS)} */`
    expect(
      scanProbe(`CREATE POLICY p ON public.users FOR ALL TO service_role;\n${trailingComment}`)
    ).toEqual([])
  })

  test.each([
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (false);`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (NOT (owner_id = auth.uid()));`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (NULL);`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (false::boolean);`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (NULL = NULL);`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (NULL::boolean = NULL::boolean);`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (NULL IS NOT NULL);`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (NULL IS DISTINCT FROM NULL);`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING ('a' = 'b');`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING ($$a$$ = $$b$$);`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (deleted_at IS NULL);`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (tenant_id IS NOT DISTINCT FROM auth.uid());`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (account_id BETWEEN 1 AND 10);`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (owner_id::text = auth.uid()::text);`,
    `CREATE POLICY member_read ON public.documents FOR SELECT USING (EXISTS (SELECT 1 FROM memberships m WHERE m.doc_id = documents.id AND m.user_id = auth.uid()));`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (visibility IN ('public', 'unlisted'));`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (owner_id = auth.uid() AND deleted_at IS NULL);`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (CASE WHEN true THEN false ELSE false END);`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (CASE WHEN owner_id = auth.uid() THEN true ELSE false END);`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (COALESCE(owner_id = auth.uid(), false));`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (auth.jwt() ->> 'role' = 'admin');`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (auth.uid() IS NOT NULL);`,
    `DO $$ BEGIN EXECUTE format('CREATE POLICY %I ON %I FOR ALL TO anon USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid())', p, t); END $$;`,
  ])("does not flag a predicate that still constrains access: %s", sql => {
    expect(scanProbe(sql)).toEqual([])
  })

  test.each([
    `-- CREATE POLICY p ON public.users FOR SELECT TO anon USING (true);`,
    `/* CREATE POLICY p ON public.users FOR SELECT TO anon USING (true); */`,
    `SELECT $$CREATE POLICY p ON public.users FOR SELECT TO anon USING (true);$$;`,
    `SELECT $body$CREATE POLICY p ON public.users FOR SELECT TO anon USING (true);$body$;`,
    `SELECT 'CREATE POLICY p ON public.users FOR SELECT TO anon USING (true);';`,
  ])("does not flag non-executable CREATE POLICY text: %s", sql => {
    expect(scanProbe(sql)).toEqual([])
  })

  it("fails closed when a tracked file cannot be read or exceeds the reader limit", () => {
    expect(permissiveUntrustedRecipeSites(["unreadable.sql", "oversized.md"], () => null)).toEqual([
      "unreadable.sql:unreadable",
      "oversized.md:unreadable",
    ])
  })
})

describe("span-preserving procedural and dynamic SQL architecture", () => {
  const scan = (sql: string) => permissiveUntrustedRecipeSites(["fixture.sql"], () => sql)

  test.each([
    [
      "single-quoted DO body",
      `DO 'BEGIN CREATE POLICY p ON public.users FOR ALL USING (true) WITH CHECK (true); END';`,
    ],
    [
      "single-quoted DO body with LANGUAGE",
      `DO LANGUAGE plpgsql 'BEGIN CREATE POLICY p ON public.users FOR ALL USING (true) WITH CHECK (true); END';`,
    ],
    [
      "escape-string DO body",
      `DO E'BEGIN CREATE POLICY p ON public.users FOR ALL USING (true) WITH CHECK (true); END';`,
    ],
    [
      "single-quoted function body",
      `CREATE FUNCTION install_policy() RETURNS void LANGUAGE plpgsql AS 'BEGIN CREATE POLICY p ON public.users FOR ALL USING (true) WITH CHECK (true); END';`,
    ],
  ])("flags a dangerous policy inside a %s", (_name, sql) => {
    expect(scan(sql)).toEqual(["fixture.sql:1"])
  })

  test.each([
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (a = ')' OR true);`,
    `CREATE POLICY p ON public.users FOR SELECT USING (a = ')' OR true);`,
    `CREATE POLICY p ON public.users FOR SELECT TO anon USING (a = ")" OR true);`,
    `CREATE POLICY p ON public.users FOR SELECT USING (a = ")" OR true);`,
  ])(
    "ignores literal and quoted-identifier parentheses when finding predicate boundaries: %s",
    sql => {
      expect(scan(sql)).toEqual(["fixture.sql:1"])
    }
  )

  it("reports one source site when nested procedural discovery reaches the same policy twice", () => {
    expect(
      scan(
        `DO $o$ BEGIN EXECUTE 'x'; DO $i$ BEGIN CREATE POLICY p ON public.users FOR ALL USING (true) WITH CHECK (true); END $i$; END $o$;`
      )
    ).toEqual(["fixture.sql:1"])
  })

  it("reports the original source line after doubled-quote decoding inside an EXECUTE literal", () => {
    expect(
      scan(
        `EXECUTE 'SELECT ''x'';\nCREATE POLICY p ON public.users FOR ALL USING (true) WITH CHECK (true)';`
      )
    ).toEqual(["fixture.sql:2"])
  })

  test.each([
    `DO $$ BEGIN EXECUTE 'CREATE ' || 'POLICY p ON public.users FOR ALL USING (true) WITH CHECK (true)'; END $$;`,
    `DO $$ BEGIN EXECUTE format('%s POLICY p ON public.users FOR ALL USING (true) WITH CHECK (true)', 'CREATE'); END $$;`,
    `DO $$ BEGIN EXECUTE format('%2$s POLICY p ON public.users FOR ALL USING (true) WITH CHECK (true)', 'ignored', 'CREATE'); END $$;`,
  ])("reconstructs a bounded constant dynamic-policy expression: %s", sql => {
    expect(scan(sql)).toEqual(["fixture.sql:1"])
  })
})

describe("independent cycle-3 exact-manifest review regressions", () => {
  const scan = (sql: string) => permissiveUntrustedRecipeSites(["fixture.sql"], () => sql)

  test.each([
    [
      "mixed positional and sequential format placeholders",
      `DO $$ BEGIN EXECUTE format('%2$s%s p ON public.t FOR ALL USING (true)', 'DROP ', 'CREATE ', 'POLICY'); END $$;`,
      "fixture.sql:1",
    ],
    [
      "SELECT INTO invalidates a tracked constant",
      `DO $$ DECLARE stmt text := 'SELECT 1'; BEGIN SELECT 'CREATE POLICY p ON public.t FOR ALL USING (true)' INTO stmt; EXECUTE stmt; END $$;`,
      "fixture.sql:1 — unsupported dynamic SQL",
    ],
    [
      "a FOR query target invalidates a tracked constant",
      `DO $$ DECLARE stmt text := 'SELECT 1'; BEGIN FOR stmt IN SELECT 'CREATE POLICY p ON public.t FOR ALL USING (true)' LOOP NULL; END LOOP; EXECUTE stmt; END $$;`,
      "fixture.sql:1 — unsupported dynamic SQL",
    ],
    [
      "a quoted procedural language identifier",
      `DO LANGUAGE "plpgsql" $$ BEGIN CREATE POLICY p ON public.t FOR ALL USING (true); END $$;`,
      "fixture.sql:1",
    ],
    [
      "integer constants beyond JavaScript safe precision",
      `CREATE POLICY p ON public.t FOR SELECT TO anon USING (9007199254740992 <> 9007199254740993);`,
      "fixture.sql:1",
    ],
    [
      "an anon-wide auth.jwt existence predicate",
      `CREATE POLICY p ON public.t FOR SELECT TO anon USING (auth.jwt() IS NOT NULL);`,
      "fixture.sql:1",
    ],
    [
      "nullable-column excluded middle",
      `CREATE POLICY p ON public.t FOR SELECT TO anon USING (owner_id IS NULL OR owner_id IS NOT NULL);`,
      "fixture.sql:1",
    ],
    [
      "a SQL line comment terminated by CR",
      `-- comment\rCREATE POLICY p ON public.t FOR ALL USING (true);`,
      "fixture.sql:2",
    ],
  ])("flags %s", (_name, sql, expected) => {
    expect(scan(sql)).toEqual([expected])
  })

  it("scans CR-only Markdown SQL fences", () => {
    const markdown = "```sql\rCREATE POLICY p ON public.t FOR ALL USING (true);\r```\r"
    expect(permissiveUntrustedRecipeSites(["fixture.md"], () => markdown)).toEqual(["fixture.md:2"])
  })

  it("does not treat nullable self-equality as an unconditional predicate", () => {
    expect(
      scan(`CREATE POLICY p ON public.t FOR SELECT TO anon USING (owner_id = owner_id);`)
    ).toEqual([])
  })

  test.each([
    [
      "a Unicode escape-string DO body",
      `DO U&'BEGIN CREATE POLICY p ON public.t FOR ALL USING (true); END';`,
      "fixture.sql:1 — unsupported dynamic SQL",
    ],
    [
      "a national-character DO body",
      `DO N'BEGIN CREATE POLICY p ON public.t FOR ALL USING (true); END';`,
      "fixture.sql:1",
    ],
    [
      "a Unicode escape-string function body",
      `CREATE FUNCTION f() RETURNS void AS U&'BEGIN CREATE POLICY p ON public.t FOR ALL USING (true); END' LANGUAGE plpgsql;`,
      "fixture.sql:1 — unsupported dynamic SQL",
    ],
    [
      "an unconditional bit-string predicate",
      `CREATE POLICY p ON public.t FOR SELECT TO anon USING (B'1' = B'1');`,
      "fixture.sql:1",
    ],
    [
      "an unconditional hex-string predicate",
      `CREATE POLICY p ON public.t FOR SELECT TO anon USING (X'1' = X'1');`,
      "fixture.sql:1",
    ],
    [
      "a Unicode escaped untrusted grantee",
      `CREATE POLICY p ON public.t FOR SELECT TO U&"anon" USING (true);`,
      "fixture.sql:1",
    ],
    [
      "a Unicode escaped procedural-language identifier",
      `DO LANGUAGE U&"plpgsql" $$ BEGIN CREATE POLICY p ON public.t FOR ALL USING (true); END $$;`,
      "fixture.sql:1 — unsupported procedural language",
    ],
  ])("fails closed on %s", (_name, sql, expected) => {
    expect(scan(sql)).toEqual([expected])
  })
})
