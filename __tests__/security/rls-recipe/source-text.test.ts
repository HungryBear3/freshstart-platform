/**
 * @jest-environment node
 *
 * S1 — span/provenance. Every later phase reports `path:line` computed from an
 * ORIGINAL source offset, so decoding a literal must never lose the mapping
 * from a decoded character back to the byte that produced it.
 */
import {
  TextAssembler,
  decodeLiteral,
  decodeQuoted,
  identityText,
  lineAt,
  lineStartsOf,
} from "@/lib/security/rls-recipe/source-text"

const sourceText = (sql: string) => identityText(sql, 0)

describe("identity text", () => {
  it("maps every index, including the end sentinel, through the base offset", () => {
    const text = identityText("abc", 10)
    expect(text.value).toBe("abc")
    expect([0, 1, 2, 3].map(index => text.originAt(index))).toEqual([10, 11, 12, 13])
    expect(text.holes).toEqual([])
  })
})

describe("decodeLiteral", () => {
  it("collapses a doubled quote and keeps the origin of the character after it", () => {
    const sql = `SELECT 'O''Brien';`
    const decoded = decodeLiteral(sourceText(sql), 8, 16, "single")
    expect(decoded.value).toBe("O'Brien")
    expect(decoded.originAt(decoded.value.indexOf("B"))).toBe(sql.indexOf("B"))
  })

  it("maps a decoded escape-string quote to the backslash that produced it", () => {
    const sql = String.raw`E'\''`
    const decoded = decodeLiteral(sourceText(sql), 2, 4, "escape")
    expect(decoded.value).toBe("'")
    expect(decoded.originAt(0)).toBe(2)
  })

  it("decodes the standard backslash escapes an E-string supports", () => {
    const sql = String.raw`E'a\nb\x41B\101'`
    const decoded = decodeLiteral(sourceText(sql), 2, sql.length - 1, "escape")
    expect(decoded.value).toBe("a\nbABA")
  })

  it("treats a dollar-quoted body as identity text over the source", () => {
    const sql = `SELECT $$a;b$$;`
    const decoded = decodeLiteral(sourceText(sql), 9, 12, "dollar")
    expect(decoded.value).toBe("a;b")
    expect([0, 1, 2, 3].map(index => decoded.originAt(index))).toEqual([9, 10, 11, 12])
  })

  it("chains provenance so a literal decoded from a decoded body still maps to source", () => {
    // `DO $$ EXECUTE 'a''b' $$` — the inner literal is decoded twice over.
    const sql = `DO $$ EXECUTE 'a''b' $$;`
    const body = decodeLiteral(sourceText(sql), 5, 21, "dollar")
    const innerStart = body.value.indexOf("'") + 1
    const inner = decodeLiteral(body, innerStart, body.value.lastIndexOf("'"), "single")
    expect(inner.value).toBe("a'b")
    expect(inner.originAt(inner.value.indexOf("b"))).toBe(sql.indexOf("b'"))
  })
})

describe("decodeQuoted", () => {
  it("collapses a doubled double-quote and preserves case", () => {
    const sql = `"AS ""RESTRICTIVE"""`
    const decoded = decodeQuoted(sourceText(sql), 1, sql.length - 1)
    expect(decoded.value).toBe(`AS "RESTRICTIVE"`)
    expect(decoded.originAt(0)).toBe(1)
  })
})

describe("TextAssembler", () => {
  it("preserves the origins of appended texts and records hole ranges", () => {
    const sql = `format('a%Ib', v)`
    const template = decodeLiteral(sourceText(sql), 8, 12, "single")
    const assembler = new TextAssembler()
    assembler.appendSlice(template, 0, 1)
    assembler.appendHole("I", 9)
    assembler.appendSlice(template, 3, 4)
    const built = assembler.build(13)

    expect(built.value.length).toBe(3)
    expect(built.originAt(0)).toBe(8)
    expect(built.originAt(2)).toBe(11)
    expect(built.originAt(3)).toBe(13)
    expect(built.holes).toEqual([{ range: { start: 1, end: 2 }, kind: "I" }])
  })

  it("maps every character of a raw run to the single origin it was injected at", () => {
    const assembler = new TextAssembler()
    assembler.appendRaw(`"x"`, 42)
    const built = assembler.build(43)
    expect(built.value).toBe(`"x"`)
    expect([0, 1, 2].map(index => built.originAt(index))).toEqual([42, 42, 42])
  })
})

describe("lineAt", () => {
  it("returns 1-based lines across newline boundaries, including empty lines", () => {
    const starts = lineStartsOf("a\nbb\n\nc")
    expect([0, 1, 2, 4, 5, 6].map(offset => lineAt(starts, offset))).toEqual([1, 1, 2, 2, 3, 4])
  })
})
