/**
 * The single lexer. One pass over a `Text`, producing spanned tokens.
 *
 * THE KIND INVARIANT: a `literal` and a `quoted` token carry no `text` field, so
 * `token.text === "("` is a compile error on them. Parenthesis structure may
 * only ever be tested through `isOpen`/`isClose`, which check `kind === "symbol"`
 * first. That is what stops a predicate such as `USING (a = ')' OR true)` from
 * having its analysed slice cut short at the literal.
 */
import { type Hole, type Span, type Text, decodeLiteral, decodeQuoted } from "./source-text"

export type Token =
  /** Always lowercased: SQL folds unquoted identifiers and keywords to lower case. */
  | { kind: "word"; text: string; span: Span; range: Span }
  /** `name` is undefined for an `%I` hole. Case is significant, so it is preserved. */
  | { kind: "quoted"; name?: string; span: Span; range: Span }
  /** `decoded` is undefined for an `%L` hole. `decoded.value` is the packet's `value`. */
  | { kind: "literal"; decoded?: Text; span: Span; range: Span }
  | { kind: "number"; text: string; span: Span; range: Span }
  | { kind: "symbol"; text: string; span: Span; range: Span }
  /** Unclosed literal, quoted identifier, dollar body or block comment. Always last. */
  | { kind: "unterminated"; span: Span; range: Span }

export type LexResult =
  | { ok: true; tokens: Token[] }
  | { ok: false; reason: "hole-outside-code-position" }

export const isOpen = (token: Token | undefined): boolean =>
  token?.kind === "symbol" && token.text === "("

export const isClose = (token: Token | undefined): boolean =>
  token?.kind === "symbol" && token.text === ")"

export const isWord = (token: Token | undefined, text: string): boolean =>
  token?.kind === "word" && token.text === text

export const isSymbol = (token: Token | undefined, text: string): boolean =>
  token?.kind === "symbol" && token.text === text

export const wordTextOf = (token: Token | undefined): string | undefined =>
  token?.kind === "word" ? token.text : undefined

export const literalText = (token: Token | undefined): Text | undefined =>
  token?.kind === "literal" ? token.decoded : undefined

export const literalValue = (token: Token | undefined): string | undefined =>
  literalText(token)?.value

export const isIdentifierStart = (char: string | undefined): boolean =>
  char !== undefined && (/[A-Za-z_]/.test(char) || char.charCodeAt(0) >= 0x80)

export const isIdentifierContinuation = (char: string | undefined): boolean =>
  char !== undefined && (/[A-Za-z0-9_$]/.test(char) || char.charCodeAt(0) >= 0x80)

/**
 * PostgreSQL dollar tags use the unquoted-identifier character class, except
 * that `$` itself cannot occur inside the tag. PostgreSQL's scanner accepts
 * non-ASCII bytes as identifier characters, so this does too.
 */
export const dollarQuoteDelimiterAt = (value: string, start: number): string | null => {
  if (value[start] !== "$") return null
  if (value[start + 1] === "$") return "$$"
  if (!isIdentifierStart(value[start + 1])) return null

  let end = start + 2
  while (isIdentifierContinuation(value[end]) && value[end] !== "$") end += 1
  return value[end] === "$" ? value.slice(start, end + 1) : null
}

/** Longest first, so `->>` never lexes as `->` plus `>`. */
const MULTI_CHARACTER_SYMBOLS = ["->>", "->", "::", ":=", "||", "<=", ">=", "<>", "!="]

/** Index just past the closing quote, or -1 when the literal is never closed. */
const endOfSingleQuoted = (value: string, quote: number, escapeBackslashes: boolean): number => {
  let cursor = quote + 1
  while (cursor < value.length) {
    if (escapeBackslashes && value[cursor] === "\\") cursor += 2
    else if (value[cursor] === "'" && value[cursor + 1] === "'") cursor += 2
    else if (value[cursor] === "'") return cursor + 1
    else cursor += 1
  }
  return -1
}

const endOfDoubleQuoted = (value: string, quote: number): number => {
  let cursor = quote + 1
  while (cursor < value.length) {
    if (value[cursor] === '"' && value[cursor + 1] === '"') cursor += 2
    else if (value[cursor] === '"') return cursor + 1
    else cursor += 1
  }
  return -1
}

/**
 * Lex `text`. Fails only when a `format()` hole did not land in a code position
 * — inside a literal, a quoted identifier, or a comment — which the analyzer
 * turns into a blocking `unsupported dynamic SQL` finding.
 */
export const lex = (text: Text): LexResult => {
  const { value } = text
  const tokens: Token[] = []
  const holesByStart = new Map<number, Hole>()
  for (const hole of text.holes) holesByStart.set(hole.range.start, hole)
  let consumedHoles = 0
  let index = 0

  const span = (start: number, end: number): Span => ({
    start: text.originAt(start),
    end: text.originAt(end),
  })

  const pushUnterminated = (start: number): void => {
    tokens.push({
      kind: "unterminated",
      span: span(start, value.length),
      range: { start, end: value.length },
    })
  }

  scan: while (index < value.length) {
    const hole = holesByStart.get(index)
    if (hole) {
      consumedHoles += 1
      const range = { start: hole.range.start, end: hole.range.end }
      const located = { span: span(range.start, range.end), range }
      tokens.push(
        hole.kind === "I" ? { kind: "quoted", ...located } : { kind: "literal", ...located }
      )
      index = hole.range.end
      continue
    }

    const character = value[index]

    if (/\s/.test(character)) {
      index += 1
      continue
    }

    if (character === "-" && value[index + 1] === "-") {
      index += 2
      while (index < value.length && value[index] !== "\n" && value[index] !== "\r") index += 1
      continue
    }

    if (character === "/" && value[index + 1] === "*") {
      const start = index
      let depth = 1
      index += 2
      while (index < value.length && depth > 0) {
        if (value[index] === "/" && value[index + 1] === "*") {
          depth += 1
          index += 2
        } else if (value[index] === "*" && value[index + 1] === "/") {
          depth -= 1
          index += 2
        } else index += 1
      }
      if (depth > 0) {
        pushUnterminated(start)
        break scan
      }
      continue
    }

    const prefix = character.toLowerCase()
    const prefixedAtBoundary = !isIdentifierContinuation(value[index - 1])

    if (
      prefixedAtBoundary &&
      prefix === "u" &&
      value[index + 1] === "&" &&
      value[index + 2] === "'"
    ) {
      const end = endOfSingleQuoted(value, index + 2, false)
      if (end === -1) {
        pushUnterminated(index)
        break scan
      }
      // Unicode escapes (and a possible UESCAPE clause) are deliberately not
      // decoded. One unresolved literal token makes security-sensitive uses
      // fail closed without misclassifying the U prefix as a row identifier.
      tokens.push({
        kind: "literal",
        span: span(index, end),
        range: { start: index, end },
      })
      index = end
      continue
    }

    if (
      prefixedAtBoundary &&
      prefix === "u" &&
      value[index + 1] === "&" &&
      value[index + 2] === '"'
    ) {
      const end = endOfDoubleQuoted(value, index + 2)
      if (end === -1) {
        pushUnterminated(index)
        break scan
      }
      tokens.push({
        kind: "quoted",
        span: span(index, end),
        range: { start: index, end },
      })
      index = end
      continue
    }

    if (prefixedAtBoundary && ["n", "b", "x"].includes(prefix) && value[index + 1] === "'") {
      const end = endOfSingleQuoted(value, index + 1, false)
      if (end === -1) {
        pushUnterminated(index)
        break scan
      }
      tokens.push({
        kind: "literal",
        decoded: prefix === "n" ? decodeLiteral(text, index + 2, end - 1, "single") : undefined,
        span: span(index, end),
        range: { start: index, end },
      })
      index = end
      continue
    }

    if (
      (character === "e" || character === "E") &&
      value[index + 1] === "'" &&
      !isIdentifierContinuation(value[index - 1])
    ) {
      const end = endOfSingleQuoted(value, index + 1, true)
      if (end === -1) {
        pushUnterminated(index)
        break scan
      }
      tokens.push({
        kind: "literal",
        decoded: decodeLiteral(text, index + 2, end - 1, "escape"),
        span: span(index, end),
        range: { start: index, end },
      })
      index = end
      continue
    }

    if (character === "'") {
      const end = endOfSingleQuoted(value, index, false)
      if (end === -1) {
        pushUnterminated(index)
        break scan
      }
      tokens.push({
        kind: "literal",
        decoded: decodeLiteral(text, index + 1, end - 1, "single"),
        span: span(index, end),
        range: { start: index, end },
      })
      index = end
      continue
    }

    const delimiter = dollarQuoteDelimiterAt(value, index)
    if (delimiter) {
      const bodyStart = index + delimiter.length
      const close = value.indexOf(delimiter, bodyStart)
      if (close === -1) {
        pushUnterminated(index)
        break scan
      }
      const end = close + delimiter.length
      tokens.push({
        kind: "literal",
        decoded: decodeLiteral(text, bodyStart, close, "dollar"),
        span: span(index, end),
        range: { start: index, end },
      })
      index = end
      continue
    }

    if (isIdentifierStart(character)) {
      const start = index
      index += 1
      while (isIdentifierContinuation(value[index])) index += 1
      tokens.push({
        kind: "word",
        text: value.slice(start, index).toLowerCase(),
        span: span(start, index),
        range: { start, end: index },
      })
      continue
    }

    if (character === '"') {
      const end = endOfDoubleQuoted(value, index)
      if (end === -1) {
        pushUnterminated(index)
        break scan
      }
      tokens.push({
        kind: "quoted",
        name: decodeQuoted(text, index + 1, end - 1).value,
        span: span(index, end),
        range: { start: index, end },
      })
      index = end
      continue
    }

    if (/[0-9]/.test(character)) {
      const start = index
      index += 1
      while (/[0-9]/.test(value[index] ?? "")) index += 1
      tokens.push({
        kind: "number",
        text: value.slice(start, index),
        span: span(start, index),
        range: { start, end: index },
      })
      continue
    }

    const symbol = MULTI_CHARACTER_SYMBOLS.find(candidate => value.startsWith(candidate, index))
    const text_ = symbol ?? character
    tokens.push({
      kind: "symbol",
      text: text_,
      span: span(index, index + text_.length),
      range: { start: index, end: index + text_.length },
    })
    index += text_.length
  }

  // A hole the scan never reached in code position landed inside a literal, a
  // quoted identifier, or a comment. Reconstructing that text is not possible.
  if (consumedHoles !== text.holes.length)
    return { ok: false, reason: "hole-outside-code-position" }

  return { ok: true, tokens }
}
