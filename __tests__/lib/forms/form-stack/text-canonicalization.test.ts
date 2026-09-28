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
import {
  findLegalAdviceContent,
  findOfficialMarkers,
} from "@/lib/forms/form-stack/non-official-output"

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

describe("B4 each format control independently reads as nothing or as a separator", () => {
  const MIXED_CAPTION = "IN THE CIR\u200bCUIT\u200bCOURT OF COOK COUNTY"
  const CONTROLS = INVISIBLES.map(([, c]) => c)
  const control = (k: number) => CONTROLS[k % CONTROLS.length]

  /** Every space becomes a control AND a control sits inside every token. */
  const mixEverywhere = (text: string) => {
    let k = 0
    return text
      .split(" ")
      .map(tok => {
        const mid = Math.floor(tok.length / 2)
        return tok.length >= 2 ? `${tok.slice(0, mid)}${control(k++)}${tok.slice(mid)}` : tok
      })
      .join(control(3))
  }
  /** Space `i` becomes a control and the token before it gets a control inside. */
  const mixAt = (text: string, i: number) => {
    const toks = text.split(" ")
    const t = toks[i]
    const mid = Math.floor(t.length / 2)
    toks[i] = t.length >= 2 ? `${t.slice(0, mid)}\u200c${t.slice(mid)}` : t
    return toks.slice(0, i + 1).join(" ") + "\u2060" + toks.slice(i + 1).join(" ")
  }
  const MULTIWORD = MARKER_EXAMPLES.filter(([t]) => t.includes(" "))

  it("the reviewed counterexample CIR<ZWSP>CUIT<ZWSP>COURT is a court caption", () => {
    expect(findOfficialMarkers(MIXED_CAPTION)).toContain("court_caption")
  })

  it.each(MULTIWORD)("%j with a control in every token and at every space → %s", (text, code) => {
    expect(findOfficialMarkers(mixEverywhere(text))).toContain(code)
  })

  it.each(
    MULTIWORD.flatMap(([text, code]) =>
      text
        .split(" ")
        .slice(0, -1)
        .map((_, i) => [`${text} @ space ${i}`, mixAt(text, i), code])
    )
  )("%s: one control joins, another separates", (_n, text, code) => {
    expect(findOfficialMarkers(text)).toContain(code)
  })

  it("controls next to spaces, dashes and either end are harmless and still detected", () => {
    expect(
      findOfficialMarkers("\u200bIN THE\u200b \u2060CIRCUIT\u200d COURT OF COOK COUNTY\ufeff")
    ).toContain("court_caption")
    expect(findOfficialMarkers("court\u200b-\u200cready")).toContain(
      "completion_or_acceptance_claim"
    )
    expect(findOfficialMarkers("court\u200b\u200c\u200d\u2060ready")).toContain(
      "completion_or_acceptance_claim"
    )
  })

  it("controls never manufacture a marker out of safe text", () => {
    for (const safe of [
      "Not a court form. Not for filing. Not legal advice.",
      "FRESH START PERSONAL ORGANIZER — NOT A COURT FORM — NOT FOR FILING",
      "Cook County",
      "Ask the circuit clerk's office which forms your county expects.",
    ]) {
      expect(findOfficialMarkers(mixEverywhere(safe))).toEqual([])
      expect(findOfficialMarkers(`\u200b${safe}\u200b`)).toEqual([])
    }
  })

  it("advice detection shares the same per-control reading", () => {
    expect(findLegalAdviceContent("you sho\u200buld\u200csettle")).toEqual(
      expect.arrayContaining(["prescriptive", "settlement"])
    )
  })

  // Oracle: resolve every control independently (2^N strings, N small) and
  // union the markers the ORIGINAL control-free detector finds. The detector
  // under test must find exactly that union on the unresolved string.
  const seeded = (seed: number) => () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const oracle = (text: string): string[] => {
    const parts = text.split(/[\u200b\u200c\u200d\u2060\u00ad\ufeff\u202e]/)
    const found = new Set<string>()
    for (let mask = 0; mask < 1 << (parts.length - 1); mask++) {
      const resolved = parts.reduce(
        (acc, p, i) => (i === 0 ? p : acc + (mask & (1 << (i - 1)) ? " " : "") + p),
        ""
      )
      for (const m of findOfficialMarkers(resolved)) found.add(m)
    }
    return [...found].sort()
  }
  it("matches a brute-force per-control oracle on 400 seeded mixed strings", () => {
    const rand = seeded(20260927)
    const sources = [...MARKER_EXAMPLES.map(([t]) => t), "Not a court form. Not for filing."]
    for (let n = 0; n < 400; n++) {
      const src = sources[Math.floor(rand() * sources.length)]
      let text = ""
      let inserted = 0
      for (const ch of src) {
        if (ch === " " && inserted < 7 && rand() < 0.5) {
          text += control(inserted++)
          continue
        }
        text += ch
        if (inserted < 7 && rand() < 0.15) text += control(inserted++)
      }
      expect([text, [...findOfficialMarkers(text)].sort()]).toEqual([text, oracle(text)])
    }
  })

  it("stays bounded on 50,000 interleaved controls (no per-variant enumeration)", () => {
    const text = `${MIXED_CAPTION} ${"a\u200bb\u200c ".repeat(12_500)}`
    const started = Date.now()
    expect(findOfficialMarkers(text)).toContain("court_caption")
    expect(findOfficialMarkers("x\u200b".repeat(50_000))).toEqual([])
    expect(Date.now() - started).toBeLessThan(5_000)
  })

  it("display validation still refuses the mixed string on its own", () => {
    expect(findDisplayTextDefects(MIXED_CAPTION)).toContain("display_text_invalid_character")
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
