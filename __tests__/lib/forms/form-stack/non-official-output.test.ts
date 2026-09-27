/**
 * @jest-environment node
 *
 * CC-05 PR-5 — non-official output boundary.
 *
 * The $149 offer delivers personalized NON-OFFICIAL summaries, a checklist and
 * filing guidance. These tests pin that the renderer is structurally incapable
 * of producing something that looks like, or claims to be, a court form: any
 * official marker in the input REFUSES the whole render (it is not stripped and
 * shipped), and the rendered text is re-scanned before it is returned.
 */
import {
  NON_OFFICIAL_BANNER,
  NON_OFFICIAL_OUTPUT_VERSION,
  findOfficialMarkers,
  renderNonOfficialSummary,
  type NonOfficialInput,
} from "@/lib/forms/form-stack/non-official-output"

const input = (): NonOfficialInput => ({
  title: "Your divorce organizer",
  summary: [
    { label: "County you told us", value: "Cook" },
    { label: "Children under 18", value: "None" },
  ],
  checklist: [
    { text: "Gather last two years of tax returns", done: true },
    { text: "List bank accounts and balances", done: false },
  ],
  guidance: ["Ask the circuit clerk's office which forms your county expects."],
})

describe("PR-5 rendered document", () => {
  it("renders a typed non-official document with the banner at top and bottom", () => {
    const r = renderNonOfficialSummary(input())
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const d = r.document
    expect(d.kind).toBe("fresh_start_non_official_summary")
    expect(d.officialForm).toBe(false)
    expect(d.filingReady).toBe(false)
    expect(d.version).toBe(NON_OFFICIAL_OUTPUT_VERSION)
    const lines = d.text.split("\n")
    expect(lines[0]).toBe(NON_OFFICIAL_BANNER)
    expect(lines[lines.length - 1]).toBe(NON_OFFICIAL_BANNER)
    expect(Object.isFrozen(d)).toBe(true)
  })

  it("is deterministic — same input, same bytes, same hash", () => {
    const a = renderNonOfficialSummary(input())
    const b = renderNonOfficialSummary(input())
    expect(a.ok && b.ok).toBe(true)
    if (!a.ok || !b.ok) return
    expect(a.document.text).toBe(b.document.text)
    expect(a.document.sha256).toMatch(/^[0-9a-f]{64}$/)
    expect(a.document.sha256).toBe(b.document.sha256)
  })

  it("the banner and fixed chrome carry no official marker themselves", () => {
    const r = renderNonOfficialSummary(input())
    if (!r.ok) throw new Error("render refused")
    expect(findOfficialMarkers(r.document.text)).toEqual([])
    expect(findOfficialMarkers(NON_OFFICIAL_BANNER)).toEqual([])
  })

  it("has no signature lines, blank fill lines or numbered form lines", () => {
    const r = renderNonOfficialSummary(input())
    if (!r.ok) throw new Error("render refused")
    expect(r.document.text).not.toMatch(/_{3,}/)
    expect(r.document.text).not.toMatch(/^\s*\d+\.\s/m)
  })
})

describe("PR-5 adversarial — official markers refuse the whole render", () => {
  const cases: [string, (i: NonOfficialInput) => void, string][] = [
    ["court caption", i => (i.title = "IN THE CIRCUIT COURT OF COOK COUNTY"), "court_caption"],
    ["marriage caption", i => (i.guidance = ["In re the Marriage of A and B"]), "court_caption"],
    ["case number", i => (i.summary[0].value = "Case No. 2026D001234"), "case_number"],
    ["OMB number", i => (i.guidance = ["Use OMB 0970-0154"]), "official_form_number"],
    ["state form code", i => (i.checklist[0].text = "Fill out ATJ 129.5"), "official_form_number"],
    ["signature", i => (i.checklist[1].text = "Signature of Petitioner"), "signature"],
    ["signature line", i => (i.guidance = ["Sign here: ________"]), "signature"],
    ["perjury verification", i => (i.guidance = ["Under penalties of perjury"]), "signature"],
    ["court-ready", i => (i.title = "Your court-ready packet"), "completion_or_acceptance_claim"],
    ["form-ready", i => (i.title = "Form ready documents"), "completion_or_acceptance_claim"],
    [
      "ready to file",
      i => (i.guidance = ["This is ready to file"]),
      "completion_or_acceptance_claim",
    ],
    [
      "completed forms",
      i => (i.guidance = ["Your completed forms"]),
      "completion_or_acceptance_claim",
    ],
    [
      "prepared forms",
      i => (i.guidance = ["We prepared your forms"]),
      "completion_or_acceptance_claim",
    ],
    [
      "clerk acceptance",
      i => (i.guidance = ["Accepted by the clerk"]),
      "completion_or_acceptance_claim",
    ],
    ["guarantee", i => (i.guidance = ["Guaranteed approval"]), "completion_or_acceptance_claim"],
    ["official", i => (i.title = "Official divorce form"), "official_claim"],
  ]

  it.each(cases)("%s → refused", (_name, mutate, code) => {
    const i = input()
    mutate(i)
    const r = renderNonOfficialSummary(i)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.violations.some(v => v.startsWith(code))).toBe(true)
  })

  it("refuses malformed input instead of coercing it", () => {
    const bad = input() as unknown as { summary: unknown[] }
    bad.summary.push({ label: "x", value: 42 })
    const r = renderNonOfficialSummary(bad as unknown as NonOfficialInput)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.violations).toContain("malformed_input")
  })

  it("refuses input that would forge the banner or a chrome line", () => {
    const i = input()
    i.guidance = [NON_OFFICIAL_BANNER]
    const r = renderNonOfficialSummary(i)
    expect(r.ok).toBe(false)
  })

  it("refuses multi-line values that could inject layout", () => {
    const i = input()
    i.summary[0].value = "Cook\nCIRCUIT COURT"
    expect(renderNonOfficialSummary(i).ok).toBe(false)
    const j = input()
    j.summary[0].value = "Cook\nextra line"
    const r = renderNonOfficialSummary(j)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.violations).toContain("multiline_value")
  })
})

describe("R1 renderer uses the hardened canonicalizer", () => {
  it.each([
    ["tab caption", "IN THE CIRCUIT\tCOURT OF COOK COUNTY", "court_caption"],
    ["U+2011 court-ready", "Your court\u2011ready packet", "completion_or_acceptance_claim"],
    ["ffi ligature", "Your o\ufb03cial form", "official_claim"],
    ["zero-width official", "Offi\u200bcial form", "official_claim"],
    ["NBSP caption", "circuit\u00a0court of Cook", "court_caption"],
    ["line-separator caption", "In re the\u2028Marriage of A", "court_caption"],
  ])("refuses a %s in customer text", (_n, text, code) => {
    const i = input()
    i.summary[0].value = text
    const r = renderNonOfficialSummary(i)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.violations).toContain(code)
  })

  it("refuses invisible or noncanonical display text even with no marker", () => {
    for (const value of ["Co\u200bok", "\uff23ook", "C\u043eok"]) {
      const i = input()
      i.summary[0].value = value
      expect(renderNonOfficialSummary(i).ok).toBe(false)
    }
  })

  it("refuses a spaced or unicode-dashed banner forgery", () => {
    const i = input()
    i.summary[0].value = "not\u00a0a court\u2011form"
    const r = renderNonOfficialSummary(i)
    expect(r.ok).toBe(false)
  })
})
