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
  NON_OFFICIAL_TEMPLATES,
  findLegalAdviceContent,
  findOfficialMarkers,
  renderNonOfficialSummary,
  type NonOfficialInput,
} from "@/lib/forms/form-stack/non-official-output"

const input = (): NonOfficialInput => ({
  titleId: "divorce_organizer",
  summary: [
    { labelId: "county", value: "Cook" },
    { labelId: "children_under_18", value: "None" },
  ],
  checklist: [
    { itemId: "gather_tax_returns", done: true },
    { itemId: "list_bank_accounts", done: false },
  ],
  guidance: ["ask_clerk_which_forms"],
})

/** The only free text left in the input is a summary value. */
const withValue = (text: string): NonOfficialInput => {
  const i = input()
  i.summary[0].value = text
  return i
}

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
  const cases: [string, string, string][] = [
    ["court caption", "IN THE CIRCUIT COURT OF COOK COUNTY", "court_caption"],
    ["marriage caption", "In re the Marriage of A and B", "court_caption"],
    ["case number", "Case No. 2026D001234", "case_number"],
    ["OMB number", "Use OMB 0970-0154", "official_form_number"],
    ["state form code", "Fill out ATJ 129.5", "official_form_number"],
    ["signature", "Signature of Petitioner", "signature"],
    ["signature line", "Sign here: ________", "signature"],
    ["perjury verification", "Under penalties of perjury", "signature"],
    ["court-ready", "Your court-ready packet", "completion_or_acceptance_claim"],
    ["form-ready", "Form ready documents", "completion_or_acceptance_claim"],
    ["ready to file", "This is ready to file", "completion_or_acceptance_claim"],
    ["completed forms", "Your completed forms", "completion_or_acceptance_claim"],
    ["prepared forms", "We prepared your forms", "completion_or_acceptance_claim"],
    ["clerk acceptance", "Accepted by the clerk", "completion_or_acceptance_claim"],
    ["guarantee", "Guaranteed approval", "completion_or_acceptance_claim"],
    ["official", "Official divorce form", "official_claim"],
  ]

  it.each(cases)("%s → refused", (_name, text, code) => {
    const r = renderNonOfficialSummary(withValue(text))
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.violations.some(v => v.startsWith(code))).toBe(true)
  })

  it("refuses malformed input instead of coercing it", () => {
    const bad = input() as unknown as { summary: unknown[] }
    bad.summary.push({ labelId: "county", value: 42 })
    const r = renderNonOfficialSummary(bad as unknown as NonOfficialInput)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.violations).toContain("malformed_input")
  })

  it("refuses input that would forge the banner or a chrome line", () => {
    const r = renderNonOfficialSummary(withValue(NON_OFFICIAL_BANNER))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.violations).toContain("chrome_forgery")
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

describe("R5 no free-text guidance: every sentence we write is a reviewed template", () => {
  it("title, labels, checklist and guidance are template ids, never strings", () => {
    const r = renderNonOfficialSummary(input())
    if (!r.ok) throw new Error(r.violations.join(","))
    expect(r.document.text).toContain(NON_OFFICIAL_TEMPLATES.guidance.ask_clerk_which_forms)
    expect(r.document.text).toContain(NON_OFFICIAL_TEMPLATES.checklistItems.gather_tax_returns)
    expect(r.document.copyApproval).toBe("unapproved_pending_owner_review")
  })

  it("refuses an unknown or free-text guidance entry", () => {
    const i = input() as unknown as { guidance: string[] }
    i.guidance = ["You should waive maintenance and accept this settlement."]
    const r = renderNonOfficialSummary(i as unknown as NonOfficialInput)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.violations).toContain("unknown_template_id")
  })

  it("refuses unknown title, label and checklist ids", () => {
    for (const mutate of [
      (i: Record<string, unknown>) => (i.titleId = "Official divorce form"),
      (i: Record<string, unknown>) =>
        ((i.summary as { labelId: string }[])[0].labelId = "You should settle"),
      (i: Record<string, unknown>) =>
        ((i.checklist as { itemId: string }[])[0].itemId = "waive maintenance"),
      (i: Record<string, unknown>) => (i.guidance = ["constructor"]),
      (i: Record<string, unknown>) => (i.guidance = ["__proto__"]),
    ]) {
      const i = input() as unknown as Record<string, unknown>
      mutate(i)
      const r = renderNonOfficialSummary(i as unknown as NonOfficialInput)
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.violations).toContain("unknown_template_id")
    }
  })

  it("every shipped template passes the marker scan and the advice policy", () => {
    const all = [
      ...Object.values(NON_OFFICIAL_TEMPLATES.titles),
      ...Object.values(NON_OFFICIAL_TEMPLATES.summaryLabels),
      ...Object.values(NON_OFFICIAL_TEMPLATES.checklistItems),
      ...Object.values(NON_OFFICIAL_TEMPLATES.guidance),
    ]
    expect(all.length).toBeGreaterThan(0)
    for (const t of all) {
      expect(findOfficialMarkers(t)).toEqual([])
      expect(findLegalAdviceContent(t)).toEqual([])
    }
    expect(Object.isFrozen(NON_OFFICIAL_TEMPLATES.guidance)).toBe(true)
    expect(NON_OFFICIAL_TEMPLATES.approval).toBe("unapproved_pending_owner_review")
  })
})

describe("R5 the advice policy refuses recommendations in customer text", () => {
  it("refuses the blocked counterexample", () => {
    const text = "You should waive maintenance and accept this settlement."
    expect(findLegalAdviceContent(text)).toEqual(
      expect.arrayContaining(["prescriptive", "waiver", "settlement"])
    )
    const r = renderNonOfficialSummary(withValue(text))
    expect(r.ok).toBe(false)
    if (!r.ok)
      expect(r.violations).toEqual(
        expect.arrayContaining([
          "legal_advice:prescriptive",
          "legal_advice:waiver",
          "legal_advice:settlement",
        ])
      )
  })

  it.each([
    ["should", "You should file in Cook", "prescriptive"],
    ["ought", "You ought to ask for the house", "prescriptive"],
    ["must", "You must ask for maintenance", "prescriptive"],
    ["recommend", "We recommend joint custody", "recommendation"],
    ["advise", "We advise against mediation", "recommendation"],
    ["best option", "Mediation is the best option", "recommendation"],
    ["waiver", "Sign the waiver", "waiver"],
    ["settle", "Settle before trial", "settlement"],
    ["accept offer", "Accept the offer from your spouse", "settlement"],
    ["outcome", "You will get the house", "outcome"],
    ["likely", "The judge will likely award support", "outcome"],
    ["chances", "Your chances of winning are high", "outcome"],
    ["rights", "Your rights to the pension", "rights"],
    ["entitled", "You are entitled to half", "rights"],
    ["strategy", "A good strategy is to delay", "strategy"],
    ["leverage", "Use the house as leverage", "strategy"],
    ["unicode should", "You sh\u200bould waive", "prescriptive"],
    ["fullwidth waive", "\uff37aive it", "waiver"],
  ])("%s → %s", (_n, text, code) => {
    expect(findLegalAdviceContent(text)).toContain(code)
    expect(renderNonOfficialSummary(withValue(text)).ok).toBe(false)
  })

  it("accepts plain facts, each in its own label's closed schema", () => {
    const facts: [NonOfficialInput["summary"][number]["labelId"], string][] = [
      ["county", "Cook"],
      ["county", "De Witt"],
      ["children_under_18", "None"],
      ["children_under_18", "2"],
      ["marriage_year", "2015"],
      ["separation_year", "2024"],
    ]
    for (const [labelId, value] of facts) {
      const i = input()
      i.summary = [{ labelId, value }]
      expect(findLegalAdviceContent(value)).toEqual([])
      expect(renderNonOfficialSummary(i).ok).toBe(true)
    }
  })

  it("re-applies the advice policy to the assembled document", () => {
    const r = renderNonOfficialSummary(input())
    if (!r.ok) throw new Error("render refused")
    expect(findLegalAdviceContent(r.document.text)).toEqual([])
  })
})

describe("R5 no free text at all: summary values are closed per-label schemas", () => {
  it.each([
    ["county", "Consider giving up maintenance"],
    ["county", "Take what they offer"],
    ["county", "Cook County, and let them keep the house"],
    ["county", "Springfield"],
    ["children_under_18", "two"],
    ["children_under_18", "20"],
    ["children_under_18", "None, give up custody"],
    ["marriage_year", "15"],
    ["marriage_year", "2015 (you should settle)"],
    ["separation_year", "1899"],
  ])("%s = %j is refused", (labelId, value) => {
    const i = input()
    i.summary = [{ labelId: labelId as never, value }]
    const r = renderNonOfficialSummary(i)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.violations).toContain(`summary_value_invalid:${labelId}`)
  })

  it("the blocked advice sentence cannot be placed anywhere in the input", () => {
    const text = "You should waive maintenance and accept this settlement."
    for (const labelId of ["county", "children_under_18", "marriage_year", "separation_year"]) {
      const i = input()
      i.summary = [{ labelId: labelId as never, value: text }]
      expect(renderNonOfficialSummary(i).ok).toBe(false)
    }
  })
})
