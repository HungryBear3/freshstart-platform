/**
 * @jest-environment node
 *
 * CC-05 R1 — detection-only canonicalization.
 *
 * The blocked renderer matched markers against raw text, so a tab, a
 * non-breaking hyphen, a ligature or a zero-width character slipped a court
 * caption or a completion claim straight past it. Every marker check now runs
 * on canonical text: NFKC, case fold, diacritic fold, confusable fold, all
 * Unicode whitespace/separators collapsed, dash-like punctuation unified, and
 * invisible format controls both removed and treated as a space.
 */
import {
  DETECTION_CANONICALIZATION_VERSION,
  canonicalizeForDetection,
  findDisplayTextDefects,
} from "@/lib/forms/form-stack/text-canonicalization"
import { findOfficialMarkers } from "@/lib/forms/form-stack/non-official-output"

// One positive example per marker family, as the blocked suite used them.
const MARKER_EXAMPLES: [string, string][] = [
  ["IN THE CIRCUIT COURT OF COOK COUNTY", "court_caption"],
  ["In re the Marriage of A and B", "court_caption"],
  ["Case No. 2026D001234", "case_number"],
  ["Use OMB 0970-0154", "official_form_number"],
  ["Fill out ATJ 129.5", "official_form_number"],
  ["Signature of Petitioner", "signature"],
  ["Sign here: ________", "signature"],
  ["Under penalties of perjury", "signature"],
  ["Your court-ready packet", "completion_or_acceptance_claim"],
  ["Form ready documents", "completion_or_acceptance_claim"],
  ["This is ready to file", "completion_or_acceptance_claim"],
  ["Your completed forms", "completion_or_acceptance_claim"],
  ["We prepared your forms", "completion_or_acceptance_claim"],
  ["Accepted by the clerk", "completion_or_acceptance_claim"],
  ["Guaranteed approval", "completion_or_acceptance_claim"],
  ["Official divorce form", "official_claim"],
]

const SEPARATORS: [string, string][] = [
  ["tab", "\t"],
  ["newline", "\n"],
  ["CRLF", "\r\n"],
  ["vertical tab", "\u000b"],
  ["form feed", "\f"],
  ["NEL", "\u0085"],
  ["no-break space", "\u00a0"],
  ["line separator", "\u2028"],
  ["paragraph separator", "\u2029"],
  ["ideographic space", "\u3000"],
  ["thin space", "\u2009"],
  ["zero-width space", "\u200b"],
  ["double space", "  "],
]
const INVISIBLES: [string, string][] = [
  ["zero-width space", "\u200b"],
  ["ZWNJ", "\u200c"],
  ["ZWJ", "\u200d"],
  ["word joiner", "\u2060"],
  ["soft hyphen", "\u00ad"],
  ["BOM", "\ufeff"],
  ["RLO", "\u202e"],
]

/** Replace the first ASCII space with `sep`, or append `sep` + text when none. */
const withSeparator = (text: string, sep: string) =>
  text.includes(" ") ? text.replace(" ", sep) : `${sep}${text}`
/** Insert `inv` inside the first word of at least 4 letters. */
const withInvisible = (text: string, inv: string) =>
  text.replace(/([A-Za-z]{2})([A-Za-z]{2,})/, `$1${inv}$2`)

describe("R1 required rejections", () => {
  it.each([
    ["IN THE CIRCUIT\tCOURT OF COOK COUNTY", "court_caption"],
    ["Your court\u2011ready packet", "completion_or_acceptance_claim"],
    ["Your o\ufb03cial form", "official_claim"],
  ])("%j → %s", (text, code) => {
    expect(findOfficialMarkers(text)).toContain(code)
  })
})

describe("R1 every marker, every separator, every invisible", () => {
  const cases = MARKER_EXAMPLES.flatMap(([text, code]) => [
    ...SEPARATORS.map(([n, sep]) => [`${text} / ${n}`, withSeparator(text, sep), code]),
    ...INVISIBLES.map(([n, inv]) => [`${text} / ${n}`, withInvisible(text, inv), code]),
    [
      `${text} / fullwidth`,
      text.replace(/[A-Za-z]/g, c => String.fromCharCode(c.charCodeAt(0) + 0xfee0)),
      code,
    ],
    [`${text} / uppercase`, text.toUpperCase(), code],
  ])

  it.each(cases)("%s", (_name, text, code) => {
    expect(findOfficialMarkers(text)).toContain(code)
  })
})

describe("R1 dash-like punctuation and confusables", () => {
  it.each([
    "\u2010",
    "\u2011",
    "\u2012",
    "\u2013",
    "—",
    "\u2015",
    "\u2212",
    "\ufe63",
    "\uff0d",
    "\u2043",
  ])("court%sready is a completion claim", dash => {
    expect(findOfficialMarkers(`court${dash}ready`)).toContain("completion_or_acceptance_claim")
  })

  it("folds Cyrillic/Greek lookalikes and diacritics before matching", () => {
    expect(findOfficialMarkers("\u041efficial form")).toContain("official_claim") // Cyrillic \u041e
    expect(findOfficialMarkers("\u03bffficial form")).toContain("official_claim") // Greek \u03bf
    expect(findOfficialMarkers("Offici\u00e1l form")).toContain("official_claim")
    expect(findOfficialMarkers("Offic\u0131al form")).toContain("official_claim") // dotless \u0131
  })

  it("court - ready with spaced dash is still a claim", () => {
    expect(findOfficialMarkers("court \u2013 ready")).toContain("completion_or_acceptance_claim")
  })
})

describe("R1 canonicalizer contract", () => {
  it("is versioned and returns joined and spaced detection variants", () => {
    expect(DETECTION_CANONICALIZATION_VERSION).toMatch(/^cc05-/)
    const v = canonicalizeForDetection("Of\u200bficial\tCOURT\u2011ready")
    expect(v).toContain("official court-ready")
    expect(v).toContain("of ficial court-ready")
  })

  it("never returns raw separators, controls or invisible characters", () => {
    const v = canonicalizeForDetection("a\u2028b\u0000c\u200bd\u00a0e")
    for (const s of v) expect(s).toMatch(/^[\x20-\x7e]*$/)
  })

  it("does not flag the fixed disclaimer phrasing", () => {
    expect(findOfficialMarkers("Not a court form. Not for filing. Not legal advice.")).toEqual([])
  })
})

describe("R1 display text is validated before it is ever rendered", () => {
  it.each([
    ["tab", "Cook\tCounty", "display_text_invalid_character"],
    ["newline", "Cook\nCounty", "display_text_invalid_character"],
    ["NUL", "Cook\u0000", "display_text_invalid_character"],
    ["zero-width", "Co\u200bok", "display_text_invalid_character"],
    ["bidi", "\u202eCook", "display_text_invalid_character"],
    ["no-break space", "Cook\u00a0County", "display_text_invalid_character"],
    ["ligature", "o\ufb03ce", "display_text_not_canonical"],
    ["fullwidth", "\uff23ook", "display_text_not_canonical"],
    ["mixed script", "C\u043eok", "display_text_mixed_script"],
  ])("%s → %s", (_n, text, code) => {
    expect(findDisplayTextDefects(text)).toContain(code)
  })

  it("accepts ordinary Latin text, including accented names", () => {
    expect(findDisplayTextDefects("Cook")).toEqual([])
    expect(findDisplayTextDefects("Jos\u00e9 Pe\u00f1a")).toEqual([])
  })
})
