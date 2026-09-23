/**
 * @jest-environment node
 *
 * S5 — the bounded constant evaluator, and the fail-closed contract around it.
 *
 * The guard proves absence of permissive untrusted recipes only within
 * constant-foldable SQL. Everything else that executes text is BLOCKED, not
 * skipped: a header can be split across fragments (`'CREATE POL' || v || 'ICY'`)
 * so no "mentions POLICY" substring gate would survive.
 */
import { analyzeCode } from "@/lib/security/rls-recipe/analyzer"
import { spawnSync } from "child_process"
import {
  MAX_EVALUATED_CHARS,
  MAX_FORMAT_ARGS,
  MAX_TRACKED_VARIABLES,
} from "@/lib/security/rls-recipe/bounds"
import { lex } from "@/lib/security/rls-recipe/lexer"
import { VariableEnvironment, foldExpression } from "@/lib/security/rls-recipe/dynamic-sql"
import { identityText, lineAt, lineStartsOf } from "@/lib/security/rls-recipe/source-text"

const fold = (expression: string) => {
  const text = identityText(expression)
  const result = lex(text)
  if (!result.ok) throw new Error(`unexpected lex error: ${result.reason}`)
  return foldExpression(result.tokens, new VariableEnvironment(new Map()), text)
}

const folded = (expression: string) => {
  const result = fold(expression)
  if (!result.ok) throw new Error(`unexpectedly unfoldable: ${result.reason}`)
  return result
}

const sites = (sql: string): string[] => {
  const lineStarts = lineStartsOf(sql)
  return analyzeCode(identityText(sql), 0).map(
    finding => `${lineAt(lineStarts, finding.offset)}:${finding.kind}`
  )
}

const RECIPE = "permissive-untrusted-recipe"
const DYNAMIC = "unsupported-dynamic-sql"

describe("literals, concatenation and casts", () => {
  it.each([
    [`'a'`, "a"],
    [`$$a$$`, "a"],
    [`'a' || 'b'`, "ab"],
    [`'a' || 'b' || 'c'`, "abc"],
    [`('a' || 'b')`, "ab"],
    [`('a' || 'b')::text`, "ab"],
    [`'a'::varchar`, "a"],
    [`'a'::name`, "a"],
    [`1`, "1"],
    [`'a' || 1`, "a1"],
    ["'a'\n'b'", "ab"],
  ])("folds %s to %s", (expression, expected) => {
    expect(folded(expression).text.value).toBe(expected)
  })

  it.each([[`'a' || null`], [`null`], [`'a'::int`], [`'a' || v`], [`v`], [`r.cmd`], [`'a' + 'b'`]])(
    "refuses to fold %s",
    expression => {
      expect(fold(expression).ok).toBe(false)
    }
  )

  it("keeps the source origin of every folded character", () => {
    const expression = `'CREATE' || ' POLICY'`
    const result = folded(expression)
    expect(result.text.originAt(0)).toBe(expression.indexOf("CREATE"))
    expect(result.text.originAt(result.text.value.indexOf("POLICY"))).toBe(
      expression.indexOf("POLICY")
    )
  })
})

describe("format() substitution", () => {
  it.each([
    [`format('%s-%s', 'a', 'b')`, "a-b"],
    [`format('%2$s%1$s', 'a', 'b')`, "ba"],
    [`format('100%%')`, "100%"],
    [`format('%s', null)`, ""],
    [`format('%I', 'a b')`, `"a b"`],
    [`format('%I', 'a"b')`, `"a""b"`],
    [`format('%L', 'it''s')`, `'it''s'`],
    [`format('%L', null)`, "NULL"],
    [`format('%1$I ok', 'x')`, `"x" ok`],
    [`format('%s', format('%s', 'nested'))`, "nested"],
  ])("folds %s to %s", (expression, expected) => {
    expect(folded(expression).text.value).toBe(expected)
  })

  it.each([
    [`format('%s', v)`],
    [`format('%-10s', 'a')`],
    [`format('%10s', 'a')`],
    [`format('%3$s', 'a', 'b')`],
    [`format('%s')`],
    [`format('%q', 'a')`],
    [`format('%I', null)`],
    [`format(v, 'a')`],
  ])("refuses to fold %s", expression => {
    expect(fold(expression).ok).toBe(false)
  })

  it("turns an unknown %I argument into an identifier-shaped hole", () => {
    const result = folded(`format('%I', v)`)
    expect(result.text.holes).toHaveLength(1)
    expect(result.text.holes[0].kind).toBe("I")
  })

  it("turns an unknown %L argument into a literal-shaped hole", () => {
    const result = folded(`format('%L', v)`)
    expect(result.text.holes).toHaveLength(1)
    expect(result.text.holes[0].kind).toBe("L")
  })

  it("keeps the source origin of a substituted argument", () => {
    const expression = `format('%s POLICY', 'CREATE')`
    const result = folded(expression)
    expect(result.text.originAt(0)).toBe(expression.indexOf("CREATE"))
  })
})

describe("bounds", () => {
  it("refuses more than MAX_FORMAT_ARGS arguments", () => {
    const inRange = Array.from({ length: MAX_FORMAT_ARGS }, () => `'x'`).join(", ")
    const overRange = Array.from({ length: MAX_FORMAT_ARGS + 1 }, () => `'x'`).join(", ")
    expect(fold(`format('%s', ${inRange})`).ok).toBe(true)
    expect(fold(`format('%s', ${overRange})`).ok).toBe(false)
  })

  it("refuses a result longer than MAX_EVALUATED_CHARS", () => {
    const half = "x".repeat(Math.ceil(MAX_EVALUATED_CHARS / 2) + 1)
    expect(fold(`'${half}'`).ok).toBe(true)
    expect(fold(`'${half}' || '${half}'`).ok).toBe(false)
  })

  it("stops nested format expansion before allocating past MAX_EVALUATED_CHARS", () => {
    const script = String.raw`
      const { VariableEnvironment, foldExpression } = require('./lib/security/rls-recipe/dynamic-sql.ts')
      const { lex } = require('./lib/security/rls-recipe/lexer.ts')
      const { identityText } = require('./lib/security/rls-recipe/source-text.ts')
      let expression = "'AAAA'"
      for (let depth = 0; depth < 4; depth += 1) {
        expression = "format('" + '%1$s'.repeat(40) + "', " + expression + ')'
      }
      const text = identityText(expression)
      const tokens = lex(text)
      if (!tokens.ok) process.exit(2)
      const result = foldExpression(tokens.tokens, new VariableEnvironment(new Map()), text)
      process.stdout.write(String(result.ok))
    `
    const child = spawnSync(
      process.execPath,
      ["--max-old-space-size=96", "--import", "tsx", "--eval", script],
      { cwd: process.cwd(), encoding: "utf8", timeout: 15_000, maxBuffer: 1024 * 1024 }
    )

    expect(child.error).toBeUndefined()
    expect(child.signal).toBeNull()
    expect(child.status).toBe(0)
    expect(child.stdout).toBe("false")
    expect(child.stderr).not.toMatch(/heap limit|out of memory/i)
  })

  it("stops tracking variables past MAX_TRACKED_VARIABLES", () => {
    const declarations = Array.from(
      { length: MAX_TRACKED_VARIABLES + 1 },
      (_, index) => `v${index} text := 'CREATE POLICY p${index} ON t FOR ALL USING (true)';`
    ).join(" ")
    // Every lookup is Unknown once the bound is breached, so the EXECUTE blocks
    // rather than silently reporting nothing.
    expect(sites(`DO $$ DECLARE ${declarations} BEGIN EXECUTE v0; END $$;`)).toEqual([
      `1:${DYNAMIC}`,
    ])
  })
})

describe("straight-line variables", () => {
  it("folds a variable assigned once at a straight-line position", () => {
    expect(
      sites(
        `DO $$ DECLARE stmt text; BEGIN stmt := 'CREATE POLICY p ON public.users FOR ALL USING (true) WITH CHECK (true)'; EXECUTE stmt; END $$;`
      )
    ).toEqual([`1:${RECIPE}`])
  })

  it("folds a DECLARE default", () => {
    expect(
      sites(
        `DO $$ DECLARE stmt text := 'CREATE POLICY p ON public.users FOR ALL USING (true)'; BEGIN EXECUTE stmt; END $$;`
      )
    ).toEqual([`1:${RECIPE}`])
  })

  it("folds R16, where the statement is built up by concatenation", () => {
    expect(
      sites(
        `DO $$ DECLARE s text; BEGIN s := 'CREATE POLICY p ON public.users FOR ALL TO anon USING (owner_id = auth.uid())'; s := s || ' WITH CHECK (true)'; EXECUTE s; END $$;`
      )
    ).toEqual([`1:${RECIPE}`])
  })

  it("blocks a lookup in an EXCEPTION handler of a twice-assigned variable", () => {
    expect(
      sites(
        `DO $$ DECLARE v text; BEGIN v := 'SELECT 1'; EXECUTE 'SELECT 1'; v := 'SELECT 2'; EXCEPTION WHEN others THEN EXECUTE v; END $$;`
      )
    ).toEqual([`1:${DYNAMIC}`])
  })

  it.each([
    { overwrite: `SELECT source INTO STRICT stmt FROM cfg`, name: "INTO STRICT" },
    {
      overwrite: `SELECT first, source INTO other, stmt FROM cfg`,
      name: "multi-target INTO",
    },
    { overwrite: `EXECUTE 'SELECT 1' INTO stmt`, name: "EXECUTE INTO" },
    {
      overwrite: `INSERT INTO log(value) VALUES (source) RETURNING value INTO stmt`,
      name: "RETURNING INTO",
    },
    { overwrite: `FOREACH stmt IN ARRAY values LOOP NULL; END LOOP`, name: "FOREACH" },
    { overwrite: `CALL mutate(stmt)`, name: "CALL with an INOUT/OUT argument" },
    { overwrite: `GET DIAGNOSTICS stmt = PG_CONTEXT`, name: "GET DIAGNOSTICS" },
  ])("invalidates a tracked value after an unsupported $name write", ({ overwrite }) => {
    const sql = `DO $$ DECLARE stmt text; source text; other text; values text[]; BEGIN stmt := 'SELECT 1'; source := 'CREATE POLICY p ON public.users FOR ALL USING (true) WITH CHECK (true)'; ${overwrite}; EXECUTE stmt; END $$;`
    expect(sites(sql)).toContain(`1:${DYNAMIC}`)
  })
})

describe("reconstructed dynamic policy statements", () => {
  it.each([
    [
      "R1, the retracted runbook's own loop in a single-quoted body",
      `DO 'DECLARE t text; BEGIN FOR t IN SELECT tablename FROM pg_tables LOOP EXECUTE format(''CREATE POLICY p ON %I FOR ALL USING (true) WITH CHECK (true)'', t); END LOOP; END';`,
    ],
    [
      "a header split across a concatenation",
      `DO $$ BEGIN EXECUTE 'CREATE ' || 'POLICY p ON public.users FOR ALL USING (true)'; END $$;`,
    ],
    [
      "a header supplied through %s",
      `DO $$ BEGIN EXECUTE format('%s POLICY p ON public.users FOR ALL USING (true)', 'CREATE'); END $$;`,
    ],
    [
      "a header supplied through a positional %s",
      `DO $$ BEGIN EXECUTE format('%2$s POLICY p ON public.users FOR ALL TO %1$I USING (true)', 'anon', 'CREATE'); END $$;`,
    ],
    [
      "a clause supplied through %s",
      `DO $$ BEGIN EXECUTE format('CREATE POLICY p ON %I FOR ALL %s', 'users', 'USING (true)'); END $$;`,
    ],
    [
      "an unknown %I grantee, which cannot be shown to be trusted",
      `DO $$ BEGIN EXECUTE format('CREATE POLICY p ON public.t FOR ALL TO %I USING (true)', r.role); END $$;`,
    ],
  ])("flags %s", (_name, sql) => {
    expect(sites(sql)).toEqual([`1:${RECIPE}`])
  })

  it.each([
    [
      "a row-dependent predicate whose value arrives through %L",
      `DO $$ BEGIN EXECUTE format('CREATE POLICY p ON public.t FOR SELECT TO anon USING (kind = %L)', 'note'); END $$;`,
    ],
    [
      "an unknown %L value that still leaves the column reference in place",
      `DO $$ BEGIN EXECUTE format('CREATE POLICY p ON public.t FOR SELECT TO anon USING (kind = %L)', r.kind); END $$;`,
    ],
    [
      "a service_role policy with unknown %I names",
      `DO $$ BEGIN EXECUTE format('CREATE POLICY %I ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)', p, t); END $$;`,
    ],
    [
      "the tracked migration's DROP POLICY shape",
      `DO $$ BEGIN EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename); END $$;`,
    ],
    [
      "the tracked runbook's ALTER TABLE shape",
      `DO $$ BEGIN EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl_name); END $$;`,
    ],
  ])("does not flag %s", (_name, sql) => {
    expect(sites(sql)).toEqual([])
  })
})

describe("non-foldable EXECUTE is blocked, never skipped", () => {
  it.each([
    [`DO $$ BEGIN EXECUTE format('%s', cmd); END $$;`],
    [`DO $$ BEGIN EXECUTE r.cmd; END $$;`],
    [`DO $$ BEGIN EXECUTE 'DROP POLICY ' || name; END $$;`],
    [`DO $$ BEGIN EXECUTE 'CREATE POL' || v || 'ICY p ON t FOR ALL USING (true)'; END $$;`],
  ])("blocks %s", sql => {
    expect(sites(sql)).toEqual([`1:${DYNAMIC}`])
  })

  it("blocks a hole that lands inside a literal in the reconstructed text", () => {
    expect(sites(`DO $$ BEGIN EXECUTE format('SELECT ''%I''', v); END $$;`)).toEqual([
      `1:${DYNAMIC}`,
    ])
  })
})
