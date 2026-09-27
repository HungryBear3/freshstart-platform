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
  ["no-break space", " "],
  ["line separator", " "],
  ["paragraph separator", " "],
  ["ideographic space", "　"],
  ["thin space", " "],
  ["zero-width space", "​"],
  ["double space", "  "],
]
const INVISIBLES: [string, string][] = [
  ["zero-width space", "​"],
  ["ZWNJ", "‌"],
  ["ZWJ", "‍"],
  ["word joiner", "⁠"],
  ["soft hyphen", "­"],
  ["BOM", "﻿"],
  ["RLO", "‮"],
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
    ["Your court‑ready packet", "completion_or_acceptance_claim"],
    ["Your oﬃcial form", "official_claim"],
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
  it.each(["‐", "‑", "‒", "–", "—", "―", "−", "﹣", "－", "⁃"])(
    "court%sready is a completion claim",
    dash => {
      expect(findOfficialMarkers(`court${dash}ready`)).toContain("completion_or_acceptance_claim")
    }
  )

  it("folds Cyrillic/Greek lookalikes and diacritics before matching", () => {
    expect(findOfficialMarkers("Оfficial form")).toContain("official_claim") // Cyrillic О
    expect(findOfficialMarkers("οfficial form")).toContain("official_claim") // Greek ο
    expect(findOfficialMarkers("Officiál form")).toContain("official_claim")
    expect(findOfficialMarkers("Officıal form")).toContain("official_claim") // dotless ı
  })

  it("court - ready with spaced dash is still a claim", () => {
    expect(findOfficialMarkers("court – ready")).toContain("completion_or_acceptance_claim")
  })
})

describe("R1 canonicalizer contract", () => {
  it("is versioned and returns joined and spaced detection variants", () => {
    expect(DETECTION_CANONICALIZATION_VERSION).toMatch(/^cc05-/)
    const v = canonicalizeForDetection("Of​ficial\tCOURT‑ready")
    expect(v).toContain("official court-ready")
    expect(v).toContain("of ficial court-ready")
  })

  it("never returns raw separators, controls or invisible characters", () => {
    const v = canonicalizeForDetection("a b\u0000c​d e")
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
    ["zero-width", "Co​ok", "display_text_invalid_character"],
    ["bidi", "‮Cook", "display_text_invalid_character"],
    ["no-break space", "Cook County", "display_text_invalid_character"],
    ["ligature", "oﬃce", "display_text_not_canonical"],
    ["fullwidth", "Ｃook", "display_text_not_canonical"],
    ["mixed script", "Cоok", "display_text_mixed_script"],
  ])("%s → %s", (_n, text, code) => {
    expect(findDisplayTextDefects(text)).toContain(code)
  })

  it("accepts ordinary Latin text, including accented names", () => {
    expect(findDisplayTextDefects("Cook")).toEqual([])
    expect(findDisplayTextDefects("José Peña")).toEqual([])
  })
})
