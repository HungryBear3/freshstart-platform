/**
 * CC-05 R1 — detection-only text canonicalization.
 *
 * Marker detection on raw text is bypassable: a tab, a no-break space, U+2011
 * (non-breaking hyphen), a ligature such as U+FB03, a Cyrillic lookalike or a
 * zero-width character each defeated the blocked renderer's regexes. Every
 * marker and advice check therefore runs on canonical text built here:
 *
 *   1. NFKC (ligatures, fullwidth and compatibility forms collapse);
 *   2. case fold, then NFKD + strip combining marks (diacritic fold);
 *   3. a small confusable fold for Cyrillic/Greek letters that look Latin;
 *   4. invisible format controls (\p{Cf}): EACH one may read as nothing
 *      (`offi<U+200B>cial` -> `official`) or as a space
 *      (`court<U+200B>ready` -> `court ready`), independently of every other
 *      (B4: `CIR<U+200B>CUIT<U+200B>COURT` needs one of each). Markers are
 *      matched with `canonicalizeWithSlots` + `slotTolerant`, which represent
 *      that choice per position in one linear pass — never by enumerating
 *      2^N variants. `canonicalizeForDetection` still returns the two
 *      whole-string readings for the chrome comparison;
 *   5. every Unicode whitespace, control and line/paragraph separator -> " ";
 *   6. dash-like punctuation -> "-", connector punctuation -> "_";
 *   7. spaces around a dash are dropped and runs of spaces collapse.
 *
 * The output is for DETECTION ONLY and is never shown to anyone. Display text
 * is a separate question: `findDisplayTextDefects` refuses anything that is not
 * already plain, canonical, single-script text, so what a customer sees is the
 * original string, and only after it has passed.
 *
 * Homoglyph coverage is a deliberate subset, not Unicode TR39: the fold covers
 * the Cyrillic/Greek letters that render as Latin in common fonts, and display
 * text mixing Latin with those scripts in one token is refused outright.
 *
 * No I/O.
 */

export const DETECTION_CANONICALIZATION_VERSION = "cc05-2026-09-26.r1"

// Every pattern is built from an ASCII string so no raw separator or invisible
// character ever sits in this source file (SWC also rejects raw U+2028/U+2029
// inside regex literals).
const INVISIBLE = new RegExp("\\p{Cf}", "gu")
const WHITESPACE_OR_CONTROL = new RegExp("[\\s\\p{Cc}\\p{Z}]+", "gu")
const DASHES = new RegExp("[\\p{Pd}\\u2212\\u2043\\ufe63\\uff0d]", "gu")
const CONNECTORS = new RegExp("\\p{Pc}", "gu")
const MARKS = new RegExp("\\p{M}", "gu")
const SPACED_DASH = / ?- ?/g

/**
 * Lowercase Cyrillic (U+04xx/U+05xx), Latin-extended (U+0131, U+0261) and Greek
 * (U+03xx) letters that render as Latin ones. Applied after case fold. Written
 * as escapes so this source stays ASCII.
 */
const CONFUSABLES: ReadonlyMap<string, string> = new Map([
  ["\u0430", "a"],
  ["\u0435", "e"],
  ["\u043e", "o"],
  ["\u0440", "p"],
  ["\u0441", "c"],
  ["\u0443", "y"],
  ["\u0445", "x"],
  ["\u0456", "i"],
  ["\u0458", "j"],
  ["\u0455", "s"],
  ["\u0501", "d"],
  ["\u04bb", "h"],
  ["\u0261", "g"],
  ["\u0131", "i"],
  ["\u03bf", "o"],
  ["\u03b1", "a"],
  ["\u03b9", "i"],
  ["\u03bd", "v"],
  ["\u03ba", "k"],
  ["\u03c4", "t"],
  ["\u03c1", "p"],
  ["\u03b5", "e"],
])
const CONFUSABLE = new RegExp(`[${[...CONFUSABLES.keys()].join("")}]`, "gu")

function fold(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .normalize("NFKD")
    .replace(MARKS, "")
    .normalize("NFKC")
    .replace(CONFUSABLE, c => CONFUSABLES.get(c) ?? c)
}

function finish(text: string): string {
  return text
    .replace(WHITESPACE_OR_CONTROL, " ")
    .replace(DASHES, "-")
    .replace(CONNECTORS, "_")
    .replace(SPACED_DASH, "-")
    .replace(/ {2,}/g, " ")
    .trim()
}

/**
 * Canonical detection variants of `text`, deduplicated. Scan ALL of them: the
 * first removes invisible characters, the second reads them as a space.
 */
export function canonicalizeForDetection(text: string): string[] {
  const folded = fold(String(text))
  const joined = finish(folded.replace(INVISIBLE, ""))
  const spaced = finish(folded.replace(INVISIBLE, " "))
  return joined === spaced ? [joined] : [joined, spaced]
}

const SLOT = "\ue000"
const SLOT_CHAR = new RegExp("\\ue000", "g")
const INVISIBLE_RUN = new RegExp("\\p{Cf}+", "gu")
const SLOT_NEIGHBOUR = "[\\s\\p{Cc}\\p{Z}\\p{Pd}\\u2212\\u2043\\ufe63\\uff0d]"
const REDUNDANT_SLOT = new RegExp(
  `^\\ue000|\\ue000$|\\ue000(?=${SLOT_NEIGHBOUR})|(?<=${SLOT_NEIGHBOUR})\\ue000`,
  "gu"
)
/** The slot as a regex escape, so no raw U+E000 sits in a pattern source. */
const SLOT_ESC = "\\ue000"

/**
 * B4: detection text in which each run of invisible format controls is ONE
 * slot character (U+E000; any U+E000 already in the input becomes U+FFFD
 * first). A run is one slot because a run of spaces collapses to one space.
 * A slot next to whitespace, a dash or either end is dropped: reading it as a
 * space there collapses to the same text as reading it as nothing. So every
 * slot that survives sits between two visible characters, where the two
 * readings genuinely differ. Linear in the input.
 */
export function canonicalizeWithSlots(text: string): string {
  return finish(
    fold(String(text))
      .replace(SLOT_CHAR, "\ufffd")
      .replace(INVISIBLE_RUN, SLOT)
      .replace(REDUNDANT_SLOT, "")
  )
}

/**
 * B4: rewrite a detection pattern for slotted text. An optional slot may sit
 * between any two consecutive consuming atoms (the slot read as nothing), and
 * every literal space also accepts a slot (the slot read as a separator). The
 * choice is made per slot by the ordinary regex match, so mixed placements
 * need no enumeration. `\b` sees a slot as a non-word character — right for
 * the separator reading, and never wrong otherwise, because every marker
 * places `\b` only at the edge of an alternative.
 *
 * Supports exactly the subset the marker and advice tables use: literals,
 * escaped punctuation, `\w \d \s \b`, positive classes, groups, alternation
 * and quantifiers. Anything that could match a slot on its own (`.`, negated
 * classes, `\W \D \S`) or reorder the reading (lookaround, backreferences)
 * throws at module load, so a new pattern cannot silently lose coverage.
 */
export function slotTolerant(re: RegExp): RegExp {
  const src = re.source
  let i = 0
  const unsupported = (): never => {
    throw new Error(`slotTolerant: unsupported pattern syntax at ${i} in /${src}/`)
  }
  const quantifier = (): string => {
    let q = ""
    if ("*+?".includes(src[i] ?? "x")) q = src[i++]
    else if (src[i] === "{") {
      const end = src.indexOf("}", i)
      if (end < 0) unsupported()
      q = src.slice(i, end + 1)
      i = end + 1
    }
    if (q && src[i] === "?") q += src[i++]
    return q
  }
  // [text, consumes-a-character]
  const atom = (): [string, boolean] => {
    const c = src[i]
    if (c === "(") {
      if (src.startsWith("(?:", i)) i += 3
      else if (src[i + 1] === "?") unsupported()
      else i += 1
      const inner = alternation()
      if (src[i] !== ")") unsupported()
      i += 1
      return [`(?:${inner})`, true]
    }
    if (c === "[") {
      let j = i + 1
      if (src[j] === "^") unsupported()
      while (j < src.length && src[j] !== "]") j += src[j] === "\\" ? 2 : 1
      const body = src.slice(i + 1, j)
      if (j >= src.length || /\\[WDSBu\d]/.test(body)) unsupported()
      i = j + 1
      return [`[${body}${/ |\\s/.test(body) ? SLOT_ESC : ""}]`, true]
    }
    if (c === "\\") {
      const e = src[i + 1]
      i += 2
      if (e === "b" || e === "B") return [`\\${e}`, false]
      if (e === "w" || e === "d") return [`\\${e}`, true]
      if (e === "s") return [`[\\s${SLOT_ESC}]`, true]
      if (e === undefined || /[A-Za-z0-9]/.test(e)) unsupported()
      return [`\\${e}`, true]
    }
    if (c === "^" || c === "$") {
      i += 1
      return [c, false]
    }
    if (c === "." || "*+?{}]".includes(c)) unsupported()
    i += 1
    return c === " " ? [`[ ${SLOT_ESC}]`, true] : [c, true]
  }
  const sequence = (): string => {
    let out = ""
    let previousConsumed = false
    while (i < src.length && src[i] !== "|" && src[i] !== ")") {
      const [text, consumes] = atom()
      const q = quantifier()
      if (!consumes) {
        if (q) unsupported()
        out += text
        previousConsumed = false
        continue
      }
      if (previousConsumed) out += `${SLOT_ESC}?`
      // A repeated atom may carry a slot after each repetition.
      out += q && q[0] !== "?" ? `(?:${text}${SLOT_ESC}?)${q}` : `${text}${q}`
      previousConsumed = true
    }
    return out
  }
  const alternation = (): string => {
    const alts = [sequence()]
    while (src[i] === "|") {
      i += 1
      alts.push(sequence())
    }
    return alts.join("|")
  }
  const rewritten = alternation()
  if (i !== src.length) unsupported()
  return new RegExp(rewritten, re.flags)
}
// Display text may use U+0020 as its only whitespace and no control, invisible
// or separator character of any kind.
const DISPLAY_FORBIDDEN = new RegExp("[\\p{Cc}\\p{Cf}\\p{Zl}\\p{Zp}]|(?! )[\\s\\p{Zs}]", "u")
const LATIN = new RegExp("\\p{Script=Latin}", "u")
const LOOKALIKE_SCRIPT = new RegExp("[\\p{Script=Cyrillic}\\p{Script=Greek}]", "u")

/** Defect codes for a string that would be SHOWN. Empty array = displayable. */
export function findDisplayTextDefects(text: string): string[] {
  const out: string[] = []
  if (DISPLAY_FORBIDDEN.test(text)) out.push("display_text_invalid_character")
  if (text.normalize("NFKC") !== text) out.push("display_text_not_canonical")
  if (text.split(" ").some(tok => LATIN.test(tok) && LOOKALIKE_SCRIPT.test(tok))) {
    out.push("display_text_mixed_script")
  }
  return out
}
