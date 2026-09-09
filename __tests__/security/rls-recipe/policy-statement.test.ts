/**
 * @jest-environment node
 *
 * S3b — statement bounding and the clause model. Every truncation, grantee and
 * RESTRICTIVE rule the cycle-2 detector enforced is preserved here; what changes
 * is that structure is read from kind-aware tokens instead of a masked window.
 */
import { MAX_STATEMENT_CHARS } from "@/lib/security/rls-recipe/bounds"
import { lex, type Token } from "@/lib/security/rls-recipe/lexer"
import {
  commandOf,
  granteesOf,
  isDangerous,
  isPermissive,
  policyHeaderIndices,
  policyStatementAt,
  predicateTokens,
} from "@/lib/security/rls-recipe/policy-statement"
import { identityText } from "@/lib/security/rls-recipe/source-text"

const lexed = (sql: string): Token[] => {
  const result = lex(identityText(sql))
  if (!result.ok) throw new Error(`unexpected lex error: ${result.reason}`)
  return result.tokens
}

const statementsOf = (sql: string) => {
  const tokens = lexed(sql)
  return policyHeaderIndices(tokens).map(index => policyStatementAt(tokens, index, sql.length))
}

const onlyStatement = (sql: string) => {
  const statements = statementsOf(sql)
  expect(statements).toHaveLength(1)
  return statements[0]
}

describe("header discovery", () => {
  it("finds CREATE POLICY and ALTER POLICY anywhere in the stream", () => {
    expect(
      policyHeaderIndices(lexed(`SELECT 1; CREATE POLICY a ON t; ALTER POLICY b ON t;`))
    ).toEqual([3, 9])
  })

  it("finds a header whose keywords are separated only by a comment", () => {
    expect(policyHeaderIndices(lexed(`CREATE/**/POLICY p ON t;`))).toEqual([0])
    expect(policyHeaderIndices(lexed(`CREATE -- sep\nPOLICY p ON t;`))).toEqual([0])
  })

  it("does not treat DROP POLICY or a bare CREATE as a header", () => {
    expect(policyHeaderIndices(lexed(`DROP POLICY p ON t; CREATE TABLE policy ();`))).toEqual([])
  })
})

describe("statement bounding", () => {
  it("ends at a depth-0 semicolon without swallowing the next statement", () => {
    const statements = statementsOf(
      `CREATE POLICY a ON t FOR ALL TO anon USING (x = 1);\nCREATE POLICY b ON t FOR ALL USING (true);`
    )
    expect(statements).toHaveLength(2)
    expect(statements[0].truncated).toBe(false)
    expect(statements[0].tokens.some(token => token.kind === "word" && token.text === "b")).toBe(
      false
    )
  })

  it("does not end the statement at a semicolon inside a literal", () => {
    const statement = onlyStatement(
      `CREATE POLICY p ON t FOR ALL TO anon USING (note = 'a;b') WITH CHECK (true);`
    )
    expect(statement.truncated).toBe(false)
    expect(statement.check).toBe("constant-true")
  })

  it("reports a statement with no terminator as truncated", () => {
    expect(onlyStatement(`CREATE POLICY p ON public.users`).truncated).toBe(true)
  })

  it("reports an unterminated literal inside the statement as truncated", () => {
    expect(onlyStatement(`CREATE POLICY p ON t FOR ALL USING ($x$ TO service_role`).truncated).toBe(
      true
    )
  })

  it("truncates and clips at MAX_STATEMENT_CHARS value characters from the header", () => {
    const padding = "org_id <> 0 AND ".repeat(60)
    const statement = onlyStatement(
      `CREATE POLICY p ON t FOR ALL TO anon USING (${padding}org_id = 1) WITH CHECK (true);`
    )
    expect(padding.length).toBeGreaterThan(MAX_STATEMENT_CHARS)
    expect(statement.truncated).toBe(true)
    expect(statement.clipped).toBe(true)
  })

  it("does not treat trailing file content after the terminator as clipping the statement", () => {
    const statement = onlyStatement(
      `CREATE POLICY p ON t FOR ALL TO service_role;\n/* ${"x".repeat(MAX_STATEMENT_CHARS)} */`
    )
    expect(statement.truncated).toBe(false)
    expect(isDangerous(statement)).toBe(false)
  })
})

describe("the clause model", () => {
  it("reaches past a literal close paren when slicing a predicate", () => {
    const tokens = lexed(`CREATE POLICY p ON t FOR SELECT TO anon USING (a = ')' OR true);`)
    const slice = predicateTokens(policyStatementAt(tokens, 0, 0).tokens, "using")
    expect(Array.isArray(slice)).toBe(true)
    if (!Array.isArray(slice)) return
    expect(slice.filter(token => token.kind === "word").map(token => token.text)).toEqual([
      "a",
      "or",
      "true",
    ])
  })

  it("reports a predicate with no parentheses as malformed", () => {
    const tokens = lexed(`CREATE POLICY p ON t FOR ALL TO anon USING true;`)
    expect(predicateTokens(policyStatementAt(tokens, 0, 0).tokens, "using")).toBe("malformed")
  })

  it("reads an omitted TO clause as PostgreSQL's PUBLIC default", () => {
    expect(granteesOf(lexed(`CREATE POLICY p ON t FOR ALL USING (true);`))).toEqual({
      roles: ["public"],
      unknown: false,
    })
  })

  it("keeps a quoted grantee's case and lowercases an unquoted one", () => {
    expect(
      granteesOf(lexed(`CREATE POLICY p ON t FOR ALL TO PUBLIC, "Anon" USING (true);`))
    ).toEqual({ roles: ["public", "Anon"], unknown: false })
  })

  it("marks the grantee list unknown when it holds an %I hole", () => {
    const tokens = lexed(`CREATE POLICY p ON t FOR ALL TO x USING (true);`)
    const holed = tokens.map((token, index) =>
      index === 8 ? ({ kind: "quoted", span: token.span, range: token.range } as Token) : token
    )
    expect(granteesOf(holed)).toEqual({ roles: [], unknown: true })
  })

  it("defaults an unrecognised or absent FOR clause to ALL", () => {
    expect(commandOf(lexed(`CREATE POLICY p ON t TO anon USING (true);`))).toBe("all")
    expect(commandOf(lexed(`CREATE POLICY p ON t FOR`))).toBe("all")
    expect(commandOf(lexed(`CREATE POLICY p ON t FOR INSERT TO anon WITH CHECK (true);`))).toBe(
      "insert"
    )
  })

  it("reads AS RESTRICTIVE as non-permissive and anything else as permissive", () => {
    expect(isPermissive(lexed(`CREATE POLICY p ON t AS RESTRICTIVE FOR ALL USING (true);`))).toBe(
      false
    )
    expect(isPermissive(lexed(`CREATE POLICY p ON t AS PERMISSIVE FOR ALL USING (true);`))).toBe(
      true
    )
    expect(isPermissive(lexed(`CREATE POLICY p ON t FOR ALL USING (true);`))).toBe(true)
  })

  it("is not fooled by a policy name containing the word 'to'", () => {
    expect(
      granteesOf(lexed(`CREATE POLICY "Allow all access to users" ON t FOR ALL USING (true);`))
    ).toEqual({ roles: ["public"], unknown: false })
  })
})

describe("the danger decision", () => {
  it.each([
    [`CREATE POLICY p ON t FOR ALL USING (true) WITH CHECK (true);`, true],
    [`CREATE POLICY p ON t FOR SELECT TO anon USING (true);`, true],
    [`CREATE POLICY p ON t FOR ALL TO "anon" USING (true);`, true],
    [`CREATE POLICY p ON t FOR ALL TO service_role USING (true) WITH CHECK (true);`, false],
    [`CREATE POLICY p ON t AS RESTRICTIVE FOR ALL TO PUBLIC USING (true);`, false],
    [`CREATE POLICY p ON t FOR SELECT TO anon USING (a = ')' OR true);`, true],
    [`CREATE POLICY p ON t FOR SELECT TO anon USING (a = ')' AND owner_id = auth.uid());`, false],
  ])("decides %s is dangerous=%s", (sql, expected) => {
    expect(isDangerous(onlyStatement(sql))).toBe(expected)
  })

  it("fails closed when a truncated grantee list may still continue with anon", () => {
    const padding = Array.from({ length: 100 }, (_, index) => `role_${index}`).join(", ")
    expect(
      isDangerous(
        onlyStatement(
          `CREATE POLICY p ON t FOR ALL TO service_role, ${padding}, anon USING (true) WITH CHECK (true);`
        )
      )
    ).toBe(true)
  })

  it("does not report a truncated service_role policy, which is trusted however long", () => {
    expect(
      isDangerous(onlyStatement(`CREATE POLICY svc ON t FOR ALL TO service_role USING (true)`))
    ).toBe(false)
  })

  it("treats an unknown %I grantee as untrusted", () => {
    const tokens = lexed(`CREATE POLICY p ON t FOR ALL TO x USING (true);`)
    const holed = tokens.map((token, index) =>
      index === 8 ? ({ kind: "quoted", span: token.span, range: token.range } as Token) : token
    )
    expect(isDangerous(policyStatementAt(holed, 0, 0))).toBe(true)
  })
})
