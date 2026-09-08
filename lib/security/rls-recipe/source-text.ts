/**
 * Span- and provenance-preserving text.
 *
 * The guard reports `path:line` and nothing else, so a reported offset must
 * always be an offset into the ORIGINAL file — never an index into a decoded
 * literal, a concatenation, or a `format()` result. `Text` carries that mapping:
 * `value` is what the next phase reads, and `originAt(i)` is the source offset
 * of the byte that produced `value[i]`. Every transformation in this library
 * goes through `Text`, so the mapping cannot drift.
 */

/** Half-open range. Coordinates are stated by the field that holds it. */
export type Span = { start: number; end: number }

/** A `format()` placeholder whose argument could not be folded to a constant. */
export type HoleKind = "I" | "L"

/** `range` is in `Text.value` coordinates. */
export type Hole = { range: Span; kind: HoleKind }

export type Text = {
  readonly value: string
  /** Source offset that produced `value[index]`; `index === value.length` is the end sentinel. */
  originAt(index: number): number
  /** Non-overlapping, sorted. Only ever produced by `format()`. */
  readonly holes: readonly Hole[]
}

/**
 * The one character a hole occupies in `value`. It is deliberately a character
 * no SQL lexeme can hold, so a hole the lexer fails to consume as a hole token
 * stays visible instead of being absorbed as whitespace.
 */
export const HOLE_PLACEHOLDER = String.fromCharCode(0)

/** A tracked file plus the line index used to render `path:line`. */
export type Source = { path: string; text: string; lineStarts: number[] }

/** A region of a file that maps to the source one-for-one from `base`. */
export const identityText = (value: string, base = 0): Text => ({
  value,
  originAt: index => base + index,
  holes: [],
})

const mappedText = (
  value: string,
  origins: Int32Array,
  endOrigin: number,
  holes: Hole[]
): Text => ({
  value,
  originAt: index => (index < origins.length ? origins[index] : endOrigin),
  holes,
})

/**
 * Builds a `Text` out of slices of other texts, raw injected runs, and holes.
 * Used by literal decoding and by the `format()`/`||` evaluator.
 */
export class TextAssembler {
  private chunks: string[] = []
  private origins: number[] = []
  private holes: Hole[] = []

  get length(): number {
    return this.origins.length
  }

  /** Append `source.value[start, end)`, carrying each character's origin and hole identity. */
  appendSlice(source: Text, start: number, end: number): void {
    const outputStart = this.origins.length
    for (let index = start; index < end; index += 1) {
      this.chunks.push(source.value[index])
      this.origins.push(source.originAt(index))
    }
    for (const hole of source.holes) {
      if (hole.range.start < start || hole.range.end > end) continue
      this.holes.push({
        kind: hole.kind,
        range: {
          start: outputStart + hole.range.start - start,
          end: outputStart + hole.range.end - start,
        },
      })
    }
  }

  appendText(source: Text): void {
    this.appendSlice(source, 0, source.value.length)
  }

  /** Append characters this library injected (quotes, a folded `NULL`), all at one origin. */
  appendRaw(characters: string, origin: number): void {
    for (let index = 0; index < characters.length; index += 1) {
      this.chunks.push(characters[index])
      this.origins.push(origin)
    }
  }

  appendHole(kind: HoleKind, origin: number): void {
    const start = this.origins.length
    this.chunks.push(HOLE_PLACEHOLDER)
    this.origins.push(origin)
    this.holes.push({ range: { start, end: start + 1 }, kind })
  }

  build(endOrigin: number): Text {
    return mappedText(
      this.chunks.join(""),
      Int32Array.from(this.origins),
      endOrigin,
      this.holes.slice()
    )
  }
}

export type LiteralForm = "single" | "escape" | "dollar"

const HEX = /^[0-9A-Fa-f]$/
const OCTAL = /^[0-7]$/

const SIMPLE_ESCAPES: Record<string, string> = {
  b: "\b",
  f: "\f",
  n: "\n",
  r: "\r",
  t: "\t",
}

/**
 * Decode a literal body that lives at `[bodyStart, bodyEnd)` in `parent.value`,
 * returning a `Text` whose origins chain back through `parent` to the file.
 *
 * A dollar-quoted body has no escapes at all, so it is a straight slice.
 */
export const decodeLiteral = (
  parent: Text,
  bodyStart: number,
  bodyEnd: number,
  form: LiteralForm
): Text => {
  const assembler = new TextAssembler()
  let index = bodyStart

  while (index < bodyEnd) {
    const character = parent.value[index]

    if (form !== "dollar" && character === "'" && parent.value[index + 1] === "'") {
      assembler.appendSlice(parent, index, index + 1)
      index += 2
      continue
    }

    if (form === "escape" && character === "\\" && index + 1 < bodyEnd) {
      const origin = parent.originAt(index)
      const escaped = parent.value[index + 1]

      if (escaped in SIMPLE_ESCAPES) {
        assembler.appendRaw(SIMPLE_ESCAPES[escaped], origin)
        index += 2
        continue
      }

      if (escaped === "x") {
        let digits = ""
        while (digits.length < 2 && HEX.test(parent.value[index + 2 + digits.length] ?? "")) {
          digits += parent.value[index + 2 + digits.length]
        }
        if (digits.length > 0) {
          assembler.appendRaw(String.fromCodePoint(parseInt(digits, 16)), origin)
          index += 2 + digits.length
          continue
        }
      }

      if (escaped === "u" || escaped === "U") {
        const width = escaped === "u" ? 4 : 8
        let digits = ""
        while (digits.length < width && HEX.test(parent.value[index + 2 + digits.length] ?? "")) {
          digits += parent.value[index + 2 + digits.length]
        }
        const codePoint = digits.length === width ? parseInt(digits, 16) : Number.NaN
        if (Number.isFinite(codePoint) && codePoint <= 0x10ffff) {
          assembler.appendRaw(String.fromCodePoint(codePoint), origin)
          index += 2 + width
          continue
        }
      }

      if (OCTAL.test(escaped)) {
        let digits = ""
        while (digits.length < 3 && OCTAL.test(parent.value[index + 1 + digits.length] ?? "")) {
          digits += parent.value[index + 1 + digits.length]
        }
        assembler.appendRaw(String.fromCodePoint(parseInt(digits, 8)), origin)
        index += 1 + digits.length
        continue
      }

      // Any other escaped character stands for itself, at the backslash's origin.
      assembler.appendRaw(escaped, origin)
      index += 2
      continue
    }

    assembler.appendSlice(parent, index, index + 1)
    index += 1
  }

  return assembler.build(parent.originAt(bodyEnd))
}

/** Decode a double-quoted identifier body. Case is significant and preserved. */
export const decodeQuoted = (parent: Text, bodyStart: number, bodyEnd: number): Text => {
  const assembler = new TextAssembler()
  let index = bodyStart

  while (index < bodyEnd) {
    assembler.appendSlice(parent, index, index + 1)
    index += parent.value[index] === '"' && parent.value[index + 1] === '"' ? 2 : 1
  }

  return assembler.build(parent.originAt(bodyEnd))
}

export const lineStartsOf = (text: string): number[] => {
  const starts = [0]
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === "\r") {
      if (text[index + 1] === "\n") index += 1
      starts.push(index + 1)
    } else if (text[index] === "\n") starts.push(index + 1)
  }
  return starts
}

/** 1-based line number of `offset`, by binary search over `lineStartsOf` output. */
export const lineAt = (lineStarts: number[], offset: number): number => {
  let low = 0
  let high = lineStarts.length - 1
  while (low < high) {
    const middle = Math.ceil((low + high) / 2)
    if (lineStarts[middle] <= offset) low = middle
    else high = middle - 1
  }
  return low + 1
}
