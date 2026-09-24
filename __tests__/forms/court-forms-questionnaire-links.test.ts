/**
 * @jest-environment node
 *
 * What the Court Forms read model is allowed to say about questionnaires, and
 * what it is allowed to send to a browser.
 *
 * `relatedQuestionnaires` names only questionnaire response objects read by an
 * evidence-bound field map for that catalog row. Five rows have that evidence;
 * the other sixteen are empty. Unsupported legacy slugs never reach the DTO.
 */
import {
  getCourtFormsReadModel,
  getUnresolvedQuestionnaireLinkAudit,
} from "@/lib/forms/court-forms-read-model"
import {
  ILLINOIS_COURT_FORMS,
  getFormsForQuestionnaire,
} from "@/lib/forms/illinois-court-forms"
import { isQuestionnaireId } from "@/lib/questionnaires/registry"

const model = () => getCourtFormsReadModel({ countyId: "" })

describe("rendered questionnaire links", () => {
  it("renders at least one form, so the assertions below are not vacuous", () => {
    expect(model().forms.length).toBeGreaterThan(0)
  })

  it("never renders a questionnaire this product does not define", () => {
    for (const form of model().forms) {
      for (const link of form.relatedQuestionnaires) {
        expect(isQuestionnaireId(link)).toBe(true)
      }
    }
  })

  it("preserves each evidence-supported mapping in the DTO", () => {
    const expected = {
      "petition-no-children": ["petition"],
      "petition-with-children": ["petition"],
      summons: ["petition"],
      "financial-affidavit": ["financial_affidavit"],
      "parenting-plan": ["parenting_plan"],
    }
    for (const [formId, questionnaireIds] of Object.entries(expected)) {
      expect(model().forms.find((form) => form.id === formId)?.relatedQuestionnaires).toEqual(
        questionnaireIds,
      )
    }
  })

  it("retires the field on all other catalog rows", () => {
    const mapped = new Set([
      "petition-no-children",
      "petition-with-children",
      "summons",
      "financial-affidavit",
      "parenting-plan",
    ])
    for (const form of ILLINOIS_COURT_FORMS) {
      if (!mapped.has(form.id)) expect(form.relatedQuestionnaires).toEqual([])
    }
  })
})

describe("nothing unsupported reaches the browser", () => {
  const unresolvedSlugs = [
    ...new Set(
      ILLINOIS_COURT_FORMS.flatMap((f) => f.relatedQuestionnaires).filter((s) => !isQuestionnaireId(s)),
    ),
  ]

  it("has retired every unsupported slug", () => {
    expect(unresolvedSlugs).toEqual([])
  })

  it("carries no unresolved-link field on the DTO at all", () => {
    // `page.tsx` hands the DTO array straight to a client component, so a field
    // that merely goes unrendered is still shipped in the serialized props.
    for (const dto of model().forms) {
      expect(Object.keys(dto)).not.toContain("unresolvedQuestionnaireLinks")
    }
  })

  it("serializes no unresolved-link field into the client payload", () => {
    expect(JSON.stringify(model())).not.toContain("unresolvedQuestionnaireLinks")
  })

  it("serializes none of the unsupported slugs into the client payload", () => {
    const payload = JSON.stringify(model())
    for (const slug of [
      "basic-information",
      "financial-information",
      "assets-debts",
      "marriage-details",
      "children-information",
      "income-employment",
      "property-division",
    ]) {
      expect(payload).not.toContain(slug)
    }
  })
})

describe("reverse questionnaire lookup", () => {
  it("returns exactly the evidence-supported rows", () => {
    expect(getFormsForQuestionnaire("petition").map((form) => form.id)).toEqual([
      "petition-no-children",
      "petition-with-children",
      "summons",
    ])
    expect(getFormsForQuestionnaire("financial_affidavit").map((form) => form.id)).toEqual([
      "financial-affidavit",
    ])
    expect(getFormsForQuestionnaire("parenting_plan").map((form) => form.id)).toEqual([
      "parenting-plan",
    ])
    expect(getFormsForQuestionnaire("marital_settlement")).toEqual([])
  })

  it("does not resurrect any retired legacy slug", () => {
    for (const slug of [
      "basic-information",
      "financial-information",
      "assets-debts",
      "marriage-details",
      "children-information",
      "parenting-plan",
      "income-employment",
      "property-division",
    ]) {
      expect(getFormsForQuestionnaire(slug)).toEqual([])
    }
  })
})

describe("the server-side audit", () => {
  it("is empty after every unsupported declaration is retired", () => {
    expect(getUnresolvedQuestionnaireLinkAudit()).toEqual([])
  })
})
