/**
 * The questionnaire registry, and what the form catalog claims about it.
 *
 * The registry is DERIVED from the seeded definitions rather than listed by
 * hand, so it cannot drift from what is actually seeded and quietly turn every
 * check below into a pass.
 */
import {
  QUESTIONNAIRE_IDS,
  isQuestionnaireId,
  getQuestionnaireFieldIds,
  questionnaireHasField,
  resolveQuestionnaireLinks,
} from "@/lib/questionnaires/registry"
import { SEED_QUESTIONNAIRES } from "@/lib/questionnaires/seed-structures"
import { ILLINOIS_COURT_FORMS } from "@/lib/forms/illinois-court-forms"

describe("questionnaire registry", () => {
  it("is derived from the seeded definitions, not a hand-written list", () => {
    expect([...QUESTIONNAIRE_IDS].sort()).toEqual(SEED_QUESTIONNAIRES.map((q) => q.type).sort())
  })

  it("names the four questionnaires this product actually defines", () => {
    expect([...QUESTIONNAIRE_IDS].sort()).toEqual([
      "financial_affidavit",
      "marital_settlement",
      "parenting_plan",
      "petition",
    ])
  })

  it("rejects ids it does not define", () => {
    expect(isQuestionnaireId("petition")).toBe(true)
    expect(isQuestionnaireId("basic-information")).toBe(false)
    expect(isQuestionnaireId("")).toBe(false)
  })

  it("returns null field ids for an unknown questionnaire rather than an empty list", () => {
    // An empty list would read as "this questionnaire has no fields" and would
    // make `questionnaireHasField` answer a question about something that does
    // not exist.
    expect(getQuestionnaireFieldIds("basic-information")).toBeNull()
    expect(getQuestionnaireFieldIds("petition")).toEqual(expect.arrayContaining(["petitioner-first-name"]))
  })

  it("answers field membership per questionnaire, not across all of them", () => {
    expect(questionnaireHasField("petition", "petitioner-first-name")).toBe(true)
    // A real field, but it belongs to the financial affidavit.
    expect(questionnaireHasField("petition", "gross-monthly-salary")).toBe(false)
    expect(questionnaireHasField("financial_affidavit", "gross-monthly-salary")).toBe(true)
    expect(questionnaireHasField("basic-information", "petitioner-first-name")).toBe(false)
  })
})

describe("catalog `relatedQuestionnaires` against the registry", () => {
  const declared = [...new Set(ILLINOIS_COURT_FORMS.flatMap((f) => f.relatedQuestionnaires))]

  it("declares at least one link, so the assertions below are not vacuous", () => {
    expect(declared.length).toBeGreaterThan(0)
  })

  it("resolves every declared link to a real questionnaire", () => {
    for (const id of declared) {
      expect(isQuestionnaireId(id)).toBe(true)
    }
  })

  it("splits resolved from unresolved instead of silently dropping either", () => {
    const { resolved, unresolved } = resolveQuestionnaireLinks(["petition", "basic-information"])
    expect(resolved).toEqual(["petition"])
    expect(unresolved).toEqual(["basic-information"])
  })

  it("reports every catalog row's links as resolved", () => {
    for (const form of ILLINOIS_COURT_FORMS) {
      const { resolved, unresolved } = resolveQuestionnaireLinks(form.relatedQuestionnaires)
      expect(resolved).toEqual(form.relatedQuestionnaires)
      expect(unresolved).toEqual([])
    }
  })

  it("does not reuse form ids or legal-article slugs as questionnaire ids", () => {
    const formIds = new Set(ILLINOIS_COURT_FORMS.map((form) => form.id))
    for (const id of declared) {
      expect(formIds.has(id)).toBe(false)
      expect(id).not.toBe("property-division")
    }
  })
})
