/**
 * @jest-environment node
 *
 * S4 — the single recursion entry.
 *
 * Cycle 2 recursed into a procedural body only from the dollar-quote branch, so
 * `DO '...'`, `DO E'...'` and `CREATE FUNCTION ... AS '...'` were never scanned
 * (review reproducers R1–R5). It also handed later phases transformed strings,
 * so reported offsets drifted past every decoded `''`, and the same site could
 * be discovered twice (R13). Here every body reaches `analyzeCode` through one
 * path, carrying original source offsets.
 */
import { analyzeCode } from "@/lib/security/rls-recipe/analyzer"
import { MAX_NESTING_DEPTH } from "@/lib/security/rls-recipe/bounds"
import { identityText, lineAt, lineStartsOf } from "@/lib/security/rls-recipe/source-text"

/** `line:kind` for every finding — the shape the reported site is built from. */
const sites = (sql: string): string[] => {
  const lineStarts = lineStartsOf(sql)
  return analyzeCode(identityText(sql), 0).map(
    finding => `${lineAt(lineStarts, finding.offset)}:${finding.kind}`
  )
}

const RECIPE = "permissive-untrusted-recipe"
const DYNAMIC = "unsupported-dynamic-sql"
const LANGUAGE = "unsupported-procedural-language"

describe("every procedural body quoting form reaches the recursion", () => {
  it.each([
    [
      "R2 single-quoted DO body",
      `DO 'BEGIN CREATE POLICY p ON public.users FOR ALL USING (true) WITH CHECK (true); END';`,
    ],
    [
      "R3 single-quoted DO body with LANGUAGE",
      `DO LANGUAGE plpgsql 'BEGIN CREATE POLICY p ON public.users FOR ALL TO anon USING (true) WITH CHECK (true); END';`,
    ],
    [
      "R4 escape-string DO body",
      `DO E'BEGIN CREATE POLICY p ON public.users FOR ALL USING (true) WITH CHECK (true); END';`,
    ],
    [
      "R5 single-quoted function body",
      `CREATE FUNCTION f() RETURNS void LANGUAGE plpgsql AS 'BEGIN CREATE POLICY p ON public.users FOR ALL USING (true) WITH CHECK (true); END';`,
    ],
    [
      "dollar-quoted DO body",
      `DO $$ BEGIN CREATE POLICY p ON public.users FOR ALL USING (true) WITH CHECK (true); END $$;`,
    ],
    [
      "dollar-quoted function body",
      `CREATE OR REPLACE FUNCTION f() RETURNS void AS $$ BEGIN CREATE POLICY p ON public.users FOR ALL USING (true) WITH CHECK (true); END $$ LANGUAGE plpgsql;`,
    ],
    [
      "LANGUAGE sql body",
      `DO LANGUAGE sql 'CREATE POLICY p ON public.users FOR ALL USING (true) WITH CHECK (true);';`,
    ],
  ])("flags the recipe inside a %s", (_name, sql) => {
    expect(sites(sql)).toEqual([`1:${RECIPE}`])
  })

  it("does not flag a trusted grantee inside a single-quoted DO body", () => {
    expect(
      sites(
        `DO 'BEGIN CREATE POLICY p ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true); END';`
      )
    ).toEqual([])
  })
})

describe("original source offsets survive decoding", () => {
  it("reports the line the recipe occupies in the file, not in the decoded body", () => {
    expect(
      sites(`DO E'\nBEGIN\n CREATE POLICY p ON public.users FOR ALL USING (true); END';`)
    ).toEqual([`3:${RECIPE}`])
  })

  it("does not drift past a doubled quote decoded inside an EXECUTE literal", () => {
    expect(
      sites(
        `EXECUTE 'SELECT ''x'';\nCREATE POLICY p ON public.users FOR ALL USING (true) WITH CHECK (true)';`
      )
    ).toEqual([`2:${RECIPE}`])
  })
})

describe("dedup by original source identity", () => {
  it("reports one finding when nested discovery reaches the same policy twice (R13)", () => {
    expect(
      sites(
        `DO $o$ BEGIN EXECUTE 'x'; DO $i$ BEGIN CREATE POLICY p ON public.users FOR ALL USING (true) WITH CHECK (true); END $i$; END $o$;`
      )
    ).toEqual([`1:${RECIPE}`])
  })

  it("keeps two distinct policies on the same line as two findings", () => {
    expect(
      sites(
        `CREATE POLICY a ON public.t FOR ALL USING (true); CREATE POLICY b ON public.t FOR ALL USING (true);`
      )
    ).toEqual([`1:${RECIPE}`, `1:${RECIPE}`])
  })
})

describe("the procedural language rule", () => {
  it("blocks a DO body in a language this guard cannot read", () => {
    expect(
      sites(`DO LANGUAGE plpython3u $$ plpy.execute("CREATE POLICY p ON t USING (true)") $$;`)
    ).toEqual([`1:${LANGUAGE}`])
  })

  it("blocks a function body in a language this guard cannot read", () => {
    expect(sites(`CREATE FUNCTION f() RETURNS void LANGUAGE c AS 'lib', 'sym';`)).toEqual([
      `1:${LANGUAGE}`,
    ])
  })

  it("reads a trailing LANGUAGE clause after the body", () => {
    expect(sites(`DO $$ SELECT 1 $$ LANGUAGE plperl;`)).toEqual([`1:${LANGUAGE}`])
  })
})

describe("non-foldable dynamic SQL is blocked unconditionally", () => {
  it("blocks an EXECUTE of a record field", () => {
    expect(sites(`DO $$ BEGIN EXECUTE r.cmd; END $$;`)).toEqual([`1:${DYNAMIC}`])
  })

  it("ignores the prepared-statement EXECUTE form at file level", () => {
    // PREPARE cannot hold DDL, so `EXECUTE plan(1)` outside a body is not dynamic SQL.
    expect(sites(`EXECUTE install_plan(1);`)).toEqual([])
  })

  it("does not ignore the same shape inside a procedural body, where it is a call", () => {
    expect(sites(`DO $$ BEGIN EXECUTE build_sql(1); END $$;`)).toEqual([`1:${DYNAMIC}`])
  })
})

describe("MAX_NESTING_DEPTH", () => {
  it("blocks rather than recurses past the bound", () => {
    const deepest = `DO $e$ BEGIN SELECT 1; END $e$;`
    const nested = `DO $c$ BEGIN EXECUTE $d$ ${deepest} $d$; END $c$;`
    const sql = `DO $a$ BEGIN EXECUTE $b$ ${nested} $b$; END $a$;`
    expect(MAX_NESTING_DEPTH).toBe(4)
    expect(sites(sql)).toEqual([`1:${DYNAMIC}`])
  })
})

describe("inert CREATE POLICY text is still not executable", () => {
  it.each([
    `-- CREATE POLICY p ON public.users FOR SELECT TO anon USING (true);`,
    `/* CREATE POLICY p ON public.users FOR SELECT TO anon USING (true); */`,
    `SELECT $$CREATE POLICY p ON public.users FOR SELECT TO anon USING (true);$$;`,
    `SELECT 'CREATE POLICY p ON public.users FOR SELECT TO anon USING (true);';`,
  ])("does not flag %s", sql => {
    expect(sites(sql)).toEqual([])
  })
})
