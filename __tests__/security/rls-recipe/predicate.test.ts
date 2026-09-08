/**
 * @jest-environment node
 *
 * S3a — the predicate lattice, ported unchanged in semantics onto kind-aware
 * helpers. The tables below are the semantic probes the integration suite runs
 * as whole `CREATE POLICY` statements, re-expressed at the level they actually
 * decide: one expression in, one classification out.
 */
import { MAX_EXPRESSION_DEPTH } from "@/lib/security/rls-recipe/bounds"
import { lex } from "@/lib/security/rls-recipe/lexer"
import { classifyPredicate } from "@/lib/security/rls-recipe/predicate"
import { TextAssembler, identityText } from "@/lib/security/rls-recipe/source-text"

const classify = (expression: string) => {
  const result = lex(identityText(expression))
  if (!result.ok) throw new Error(`unexpected lex error: ${result.reason}`)
  return classifyPredicate(result.tokens)
}

describe("expressions that leave access unconditional", () => {
  it.each([
    [`true`, "constant-true"],
    [`(true)`, "constant-true"],
    [`((true))`, "constant-true"],
    [`true::boolean`, "constant-true"],
    [`true::bool`, "constant-true"],
    [`NOT false`, "constant-true"],
    [`NOT NOT true`, "constant-true"],
    [`NOT (NOT true)`, "constant-true"],
    [`NOT (1 = 0)`, "constant-true"],
    [`NOT (false OR false)`, "constant-true"],
    [`NOT (false AND owner_id = auth.uid())`, "constant-true"],
    [`true IS TRUE`, "constant-true"],
    [`true OR owner_id = auth.uid()`, "constant-true"],
    [`true = true`, "constant-true"],
    [`1 = 1`, "constant-true"],
    [`1 <= 1`, "constant-true"],
    [`'a' <> 'b'`, "constant-true"],
    [`$$a$$ <> $$b$$`, "constant-true"],
    [`COALESCE(true, owner_id = auth.uid())`, "constant-true"],
    [`CASE WHEN true THEN true ELSE owner_id = auth.uid() END`, "constant-true"],
  ])("classifies %s as %s", (expression, expected) => {
    expect(classify(expression)).toBe(expected)
  })
})

describe("expressions a literal or quoted parenthesis must not truncate", () => {
  // The cycle-2 escape: `')'` decremented paren depth, the analysed slice was
  // cut at the literal, and the `OR true` that makes the predicate total was
  // never examined.
  it.each([
    [`a = ')' OR true`, "constant-true"],
    [`note <> ')' OR true`, "constant-true"],
    [`"x" <> ")" OR true`, "constant-true"],
    [`a = '(' OR owner_id = auth.uid()`, "row-dependent"],
    [`a = ')' AND owner_id = auth.uid()`, "row-dependent"],
  ])("classifies %s as %s", (expression, expected) => {
    expect(classify(expression)).toBe(expected)
  })
})

describe("expressions that still constrain access", () => {
  it.each([
    [`false`, "constant-false"],
    [`false::boolean`, "constant-false"],
    [`'a' = 'b'`, "constant-false"],
    [`$$a$$ = $$b$$`, "constant-false"],
    [`NOT (owner_id = auth.uid())`, "row-dependent"],
    [`NULL`, "constant-null"],
    [`NULL = NULL`, "constant-null"],
    [`NULL::boolean = NULL::boolean`, "constant-null"],
    [`NULL IS NOT NULL`, "constant-false"],
    [`NULL IS DISTINCT FROM NULL`, "constant-false"],
    [`deleted_at IS NULL`, "row-dependent"],
    [`tenant_id IS NOT DISTINCT FROM auth.uid()`, "row-dependent"],
    [`account_id BETWEEN 1 AND 10`, "row-dependent"],
    [`owner_id::text = auth.uid()::text`, "row-dependent"],
    [`visibility IN ('public', 'unlisted')`, "row-dependent"],
    [`owner_id = auth.uid() AND deleted_at IS NULL`, "row-dependent"],
    [`CASE WHEN true THEN false ELSE false END`, "constant-false"],
    [`CASE WHEN owner_id = auth.uid() THEN true ELSE false END`, "row-dependent"],
    [`COALESCE(owner_id = auth.uid(), false)`, "row-dependent"],
    [`auth.jwt() ->> 'role' = 'admin'`, "row-dependent"],
    [`auth.uid() IS NOT NULL`, "row-dependent"],
    [`(auth.uid())::text = "userId"`, "row-dependent"],
    [`tenant_id = current_setting('app.tenant_id')`, "row-dependent"],
    [
      `EXISTS (SELECT 1 FROM memberships m WHERE m.doc_id = documents.id AND m.user_id = auth.uid())`,
      "row-dependent",
    ],
  ])("classifies %s as %s", (expression, expected) => {
    expect(classify(expression)).toBe(expected)
  })
})

describe("expressions the lattice cannot decide fail closed as uncertain", () => {
  it.each([
    [`current_date > current_date - 1`],
    [`current_user <> ''`],
    [`pg_catalog.current_database() <> ''`],
    [`1 = '1'`],
    [`true = 'true'`],
  ])("classifies %s as uncertain", expression => {
    expect(classify(expression)).toBe("uncertain")
  })
})

describe("a quoted function call is not a demonstrable row reference", () => {
  it('treats "f"() with no other reference as uncertain, not row-dependent', () => {
    expect(classify(`"f"() <> ''`)).toBe("uncertain")
  })
})

describe("format holes inside a predicate", () => {
  it("keeps a row-dependent comparison against an unknown %L literal row-dependent", () => {
    // `format('... USING (kind = %L)', v)` with v unknown: the column reference
    // still constrains the predicate, so this must NOT be reported.
    const assembler = new TextAssembler()
    assembler.appendRaw("kind = ", 0)
    assembler.appendHole("L", 7)
    const result = lex(assembler.build(8))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(classifyPredicate(result.tokens)).toBe("row-dependent")
  })

  it("gives an unknown %L literal no constant value of its own", () => {
    const assembler = new TextAssembler()
    assembler.appendHole("L", 0)
    const result = lex(assembler.build(1))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(classifyPredicate(result.tokens)).toBe("uncertain")
  })
})

describe("MAX_EXPRESSION_DEPTH", () => {
  it("answers uncertain rather than recursing past the bound", () => {
    const negations = `NOT `.repeat(MAX_EXPRESSION_DEPTH + 2)
    expect(classify(`${negations}true`)).toBe("uncertain")
    expect(classify(`${`NOT `.repeat(2)}true`)).toBe("constant-true")
  })
})
