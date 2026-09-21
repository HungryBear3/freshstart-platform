/**
 * @jest-environment node
 *
 * The fit-check policy is the single classifier both the `/api/fit-check`
 * route and the checkout gate depend on. It answers one product-scope
 * question — "does the current FreshStart workflow support these answers?" —
 * and it must fail closed on anything it was not given.
 */
import {
  FIT_CHECK_POLICY_VERSION,
  FIT_CHECK_QUESTIONS,
  FIT_CHECK_VALIDITY_MS,
  classifyFitCheck,
  isFitCheckAnswerSet,
} from "@/lib/fit-check/policy"

const ALL_YES = {
  illinoisMatter: "yes",
  bothSpousesAgreeToDivorce: "yes",
  agreementOnAllKeyIssues: "yes",
  spouseWillSignAndParticipate: "yes",
  safetyOrEmergency: "no",
} as const

describe("fit-check policy", () => {
  it("publishes a stable policy version and a bounded validity window", () => {
    expect(FIT_CHECK_POLICY_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}\.\d+$/)
    expect(FIT_CHECK_VALIDITY_MS).toBe(30 * 24 * 60 * 60 * 1000)
  })

  it("asks only bounded-choice product-scope questions with an explicit not-sure path", () => {
    expect(FIT_CHECK_QUESTIONS.length).toBeGreaterThanOrEqual(5)
    for (const question of FIT_CHECK_QUESTIONS) {
      expect(question.choices.map((choice) => choice.value).sort()).toEqual([
        "no",
        "not_sure",
        "yes",
      ])
      expect(question.id).toMatch(/^[a-zA-Z]+$/)
      expect(typeof question.prompt).toBe("string")
    }
    const ids = FIT_CHECK_QUESTIONS.map((question) => question.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toEqual(expect.arrayContaining([
      "illinoisMatter",
      "bothSpousesAgreeToDivorce",
      "agreementOnAllKeyIssues",
      "spouseWillSignAndParticipate",
      "safetyOrEmergency",
    ]))
  })

  it("does not phrase any question or outcome as a legal conclusion", () => {
    const copy = FIT_CHECK_QUESTIONS.map((q) => `${q.prompt} ${q.help ?? ""}`).join("\n")
    expect(copy).not.toMatch(/eligible|ineligible|qualify|qualifies|legally entitled|you must|we advise/i)
  })

  it("returns fit only when every supported answer is given", () => {
    expect(classifyFitCheck(ALL_YES)).toEqual({ result: "fit", reasons: [] })
  })

  it.each([
    "illinoisMatter",
    "bothSpousesAgreeToDivorce",
    "agreementOnAllKeyIssues",
    "spouseWillSignAndParticipate",
  ])("treats a definite no on %s as out of scope", (id) => {
    const classified = classifyFitCheck({ ...ALL_YES, [id]: "no" })
    expect(classified.result).toBe("out_of_scope")
    expect(classified.reasons).toContain(`unsupported:${id}`)
  })

  it("routes an emergency or safety answer to review_required, never to checkout", () => {
    const classified = classifyFitCheck({ ...ALL_YES, safetyOrEmergency: "yes" })
    expect(classified.result).toBe("review_required")
    expect(classified.reasons).toContain("safety_support_needed")
  })

  it("keeps the safety answer authoritative over an unrelated out-of-scope answer", () => {
    const classified = classifyFitCheck({
      ...ALL_YES,
      safetyOrEmergency: "yes",
      bothSpousesAgreeToDivorce: "no",
    })
    expect(classified.result).toBe("review_required")
    expect(classified.reasons).toContain("safety_support_needed")
  })

  it("treats an unknown safety answer as review_required rather than out of scope", () => {
    const classified = classifyFitCheck({
      ...ALL_YES,
      safetyOrEmergency: "not_sure",
      illinoisMatter: "no",
    })
    expect(classified.result).toBe("review_required")
    expect(classified.reasons).toContain("unknown:safetyOrEmergency")
  })

  it.each([
    "illinoisMatter",
    "bothSpousesAgreeToDivorce",
    "agreementOnAllKeyIssues",
    "spouseWillSignAndParticipate",
  ])("treats not_sure on %s as review_required", (id) => {
    const classified = classifyFitCheck({ ...ALL_YES, [id]: "not_sure" })
    expect(classified.result).toBe("review_required")
    expect(classified.reasons).toContain(`unknown:${id}`)
  })

  it("prefers the definite unsupported answer when nothing is unknown", () => {
    const classified = classifyFitCheck({
      ...ALL_YES,
      bothSpousesAgreeToDivorce: "no",
      agreementOnAllKeyIssues: "no",
    })
    expect(classified.result).toBe("out_of_scope")
    expect(classified.reasons).toEqual([
      "unsupported:bothSpousesAgreeToDivorce",
      "unsupported:agreementOnAllKeyIssues",
    ])
  })

  it.each([
    ["a missing answer", { ...ALL_YES, agreementOnAllKeyIssues: undefined }],
    ["an unrecognised answer value", { ...ALL_YES, agreementOnAllKeyIssues: "maybe" }],
    ["a free-text answer", { ...ALL_YES, agreementOnAllKeyIssues: "we mostly agree about the house" }],
    ["an empty object", {}],
    ["null", null],
    ["a string", "yes"],
    ["an array", ["yes"]],
  ])("never returns fit for %s", (_label, answers) => {
    const classified = classifyFitCheck(answers)
    expect(classified.result).not.toBe("fit")
    expect(classified.reasons.length).toBeGreaterThan(0)
  })

  it("reports a missing required answer as review_required", () => {
    const classified = classifyFitCheck({ ...ALL_YES, agreementOnAllKeyIssues: undefined })
    expect(classified.result).toBe("review_required")
    expect(classified.reasons).toContain("missing:agreementOnAllKeyIssues")
  })

  it("recognises only a complete bounded answer set", () => {
    expect(isFitCheckAnswerSet(ALL_YES)).toBe(true)
    expect(isFitCheckAnswerSet({ ...ALL_YES, extraNote: "anything" })).toBe(false)
    expect(isFitCheckAnswerSet({ ...ALL_YES, safetyOrEmergency: "maybe" })).toBe(false)
    expect(isFitCheckAnswerSet({})).toBe(false)
    expect(isFitCheckAnswerSet(null)).toBe(false)
  })

  it("emits only bounded reason codes, never echoed input", () => {
    const classified = classifyFitCheck({
      ...ALL_YES,
      agreementOnAllKeyIssues: "my spouse lives at 123 Main Street",
    })
    for (const reason of classified.reasons) {
      expect(reason).toMatch(/^(safety_support_needed|(unsupported|unknown|missing):[a-zA-Z]+)$/)
    }
  })
})
