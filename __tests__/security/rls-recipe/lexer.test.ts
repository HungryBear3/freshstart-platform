/**
 * @jest-environment node
 *
 * S2 — the kind invariant. The cycle-2 escape was six independent paren-depth
 * counters comparing `.text` on tokens of ANY kind, so a literal `')'` or a
 * quoted `")"` closed a predicate early. Here the union makes `.text` a type
 * error on `literal` and `quoted`, and `isOpen`/`isClose` check the kind first.
 */
import { TextAssembler, identityText } from "@/lib/security/rls-recipe/source-text"
import { isClose, isOpen, lex, literalValue } from "@/lib/security/rls-recipe/lexer"

const tokensOf = (sql: string) => {
  const result = lex(identityText(sql))
  if (!result.ok) throw new Error(`unexpected lex error: ${result.reason}`)
  return result.tokens
}

const kinds = (sql: string) => tokensOf(sql).map(token => token.kind)

describe("literal and quoted tokens never steer structure", () => {
  it("lexes a literal holding a close paren as one literal token", () => {
    const tokens = tokensOf(`(a = ')')`)
    expect(kinds(`(a = ')')`)).toEqual(["symbol", "word", "symbol", "literal", "symbol"])
    expect(literalValue(tokens[3])).toBe(")")
    expect(isClose(tokens[3])).toBe(false)
    expect(isClose(tokens[4])).toBe(true)
  })

  it("lexes a quoted identifier holding a close paren as one quoted token", () => {
    const tokens = tokensOf(`("x" <> ")")`)
    expect(tokens.map(token => token.kind)).toEqual([
      "symbol",
      "quoted",
      "symbol",
      "quoted",
      "symbol",
    ])
    expect(tokens[3].kind === "quoted" && tokens[3].name).toBe(")")
    expect(isClose(tokens[3])).toBe(false)
    expect(isOpen(tokens[0])).toBe(true)
  })

  it("keeps a doubled double-quote inside one quoted identifier", () => {
    const tokens = tokensOf(`"AS ""RESTRICTIVE"""`)
    expect(tokens).toHaveLength(1)
    expect(tokens[0].kind === "quoted" && tokens[0].name).toBe(`AS "RESTRICTIVE"`)
  })
})

describe("comments", () => {
  it("produces no tokens for line or block comments", () => {
    expect(tokensOf(`-- all of it\n/* and this */`)).toEqual([])
  })

  it("makes CREATE and POLICY adjacent words across a block comment", () => {
    expect(tokensOf(`CREATE/**/POLICY`).map(token => token.kind === "word" && token.text)).toEqual([
      "create",
      "policy",
    ])
  })

  it("tracks nested block comments", () => {
    expect(tokensOf(`a /* one /* two */ still */ b`).map(token => token.kind)).toEqual([
      "word",
      "word",
    ])
  })

  it("ends the stream with an unterminated token for an unclosed block comment", () => {
    const tokens = tokensOf(`a /* never closed`)
    expect(tokens.map(token => token.kind)).toEqual(["word", "unterminated"])
  })
})

describe("literal forms", () => {
  it("does not read E as an escape-string prefix when it continues an identifier", () => {
    expect(tokensOf(`notE'x'`).map(token => token.kind)).toEqual(["word", "literal"])
  })

  it("applies backslash escapes only to an escape string", () => {
    expect(literalValue(tokensOf(String.raw`E'a\nb'`)[0])).toBe("a\nb")
    expect(literalValue(tokensOf(String.raw`'a\nb'`)[0])).toBe(String.raw`a\nb`)
  })

  it("lexes a tagged dollar string as one literal, terminator and quote included", () => {
    expect(literalValue(tokensOf(`$tag$it's a;b$tag$`)[0])).toBe("it's a;b")
  })

  it("reports an unclosed literal, quoted identifier or dollar body as unterminated", () => {
    expect(kinds(`a 'never closed`)).toEqual(["word", "unterminated"])
    expect(kinds(`a "never closed`)).toEqual(["word", "unterminated"])
    expect(kinds(`a $x$ never closed`)).toEqual(["word", "unterminated"])
  })
})

describe("symbols", () => {
  it.each([`::`, `||`, `:=`, `->>`, `->`, `<=`, `>=`, `<>`, `!=`])(
    "lexes %s as a single symbol token",
    symbol => {
      const tokens = tokensOf(`a ${symbol} b`)
      expect(tokens.map(token => token.kind)).toEqual(["word", "symbol", "word"])
      expect(tokens[1].kind === "symbol" && tokens[1].text).toBe(symbol)
    }
  )

  it("lexes a positional parameter as a symbol and a number", () => {
    const tokens = tokensOf(`$1`)
    expect(tokens.map(token => token.kind)).toEqual(["symbol", "number"])
  })
})

describe("spans and ranges", () => {
  it("reports original source offsets for every token", () => {
    const text = identityText(`CREATE POLICY`, 100)
    const result = lex(text)
    expect(result.ok && result.tokens.map(token => token.span.start)).toEqual([100, 107])
    expect(result.ok && result.tokens.map(token => token.range.start)).toEqual([0, 7])
  })
})

describe("format holes", () => {
  const holeText = (before: string, kind: "I" | "L", after: string) => {
    const assembler = new TextAssembler()
    assembler.appendRaw(before, 0)
    assembler.appendHole(kind, before.length)
    assembler.appendRaw(after, before.length + 1)
    return assembler.build(before.length + 1 + after.length)
  }

  it("emits a nameless quoted token for an %I hole in code position", () => {
    const result = lex(holeText("TO ", "I", " USING"))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.tokens.map(token => token.kind)).toEqual(["word", "quoted", "word"])
    expect(result.tokens[1].kind === "quoted" && result.tokens[1].name).toBeUndefined()
  })

  it("emits a valueless literal token for an %L hole in code position", () => {
    const result = lex(holeText("kind = ", "L", ""))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.tokens.map(token => token.kind)).toEqual(["word", "symbol", "literal"])
    expect(literalValue(result.tokens[2])).toBeUndefined()
  })

  it("fails the lex when a hole lands inside a literal", () => {
    const result = lex(holeText("a = '", "L", "'"))
    expect(result.ok).toBe(false)
  })

  it("fails the lex when a hole lands inside a comment", () => {
    const result = lex(holeText("a /* ", "I", " */"))
    expect(result.ok).toBe(false)
  })
})

describe("isOpen and isClose", () => {
  it("answer false for every non-symbol kind", () => {
    for (const token of tokensOf(`( ')' ")" 1 word )`)) {
      expect(isOpen(token) || isClose(token)).toBe(token.kind === "symbol")
    }
  })
})
