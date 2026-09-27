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
 *   4. invisible format controls (\p{Cf}) are handled BOTH ways — removed
 *      (`offi<U+200B>cial` -> `official`) and read as a space
 *      (`court<U+200B>ready` -> `court ready`) — and every variant is scanned;
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
