/**
 * @jest-environment node
 *
 * What the Court Forms read model is allowed to say about questionnaires, and
 * what it is allowed to send to a browser.
 *
 * The catalog's `relatedQuestionnaires` names eight questionnaires — including
 * `basic-information` and `marriage-details` — that this product has never
 * defined; the four it defines are `petition`, `financial_affidavit`,
 * `parenting_plan` and `marital_settlement`. Those names travelled unchecked
 * into the rendered DTO, where the client joins and displays them to a customer
 * as the questionnaires that feed the form.
 *
 * Resolving them server-side is not enough on its own: `page.tsx` passes the
 * whole DTO array to a client component, so anything left on the DTO is
 * serialized into the page whether it is rendered or not. The unresolved claims
 * are therefore kept off the DTO entirely and exposed only to server callers.
 *
 * F4 of docs/legal-audit/fs-field-map-compatibility-ledger-2026-09-23.md. The
 * catalog rows are deliberately NOT remapped to the real ids here: which
 * questionnaire feeds which official artifact is the mapping question this lane
 * cannot prove.
 */
import {
  getCourtFormsReadModel,
  getUnresolvedQuestionnaireLinkAudit,
} from "@/lib/forms/court-forms-read-model"
import { ILLINOIS_COURT_FORMS, getFormById } from "@/lib/forms/illinois-court-forms"
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

  it("resolves nothing today, so no form carries a questionnaire link", () => {
    // Derived from the rendered rows, not from the whole catalog: a form whose
    // gate is closed — the federal IWO here — is removed from `forms` entirely.
    const dtos = model().forms
    expect(dtos.flatMap((dto) => getFormById(dto.id)!.relatedQuestionnaires).length).toBeGreaterThan(0)
    expect(dtos.flatMap((f) => f.relatedQuestionnaires)).toEqual([])
  })
})

describe("nothing unsupported reaches the browser", () => {
  const unresolvedSlugs = [
    ...new Set(
      ILLINOIS_COURT_FORMS.flatMap((f) => f.relatedQuestionnaires).filter((s) => !isQuestionnaireId(s)),
    ),
  ]

  it("has unresolved slugs to keep out, so this suite is not vacuous", () => {
    expect(unresolvedSlugs.length).toBeGreaterThan(0)
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
    // Scanned as raw substrings, so slugs that are ALSO legitimate strings
    // elsewhere in the payload are excluded rather than asserted falsely:
    // "parenting-plan" is a catalog id and a filename stem as well as an
    // unresolved questionnaire claim. The remaining slugs appear nowhere but as
    // questionnaire claims, so finding one is finding a leak.
    const catalogIds = new Set(ILLINOIS_COURT_FORMS.map((f) => f.id))
    const scannable = unresolvedSlugs.filter((slug) => !catalogIds.has(slug))
    expect(scannable.length).toBeGreaterThan(0)

    const payload = JSON.stringify(model())
    for (const slug of scannable) {
      expect(payload).not.toContain(slug)
    }
  })
})

describe("the server-side audit", () => {
  it("reports every catalog row whose links do not resolve", () => {
    const audit = getUnresolvedQuestionnaireLinkAudit()
    const expected = ILLINOIS_COURT_FORMS.filter(
      (f) => f.relatedQuestionnaires.some((s) => !isQuestionnaireId(s)),
    )
    expect(audit.map((a) => a.formId).sort()).toEqual(expected.map((f) => f.id).sort())
  })

  it("names the unresolved links themselves, not just a count", () => {
    for (const entry of getUnresolvedQuestionnaireLinkAudit()) {
      const raw = getFormById(entry.formId)!.relatedQuestionnaires
      expect(entry.unresolved).toEqual(raw.filter((s) => !isQuestionnaireId(s)))
      expect(entry.unresolved.length).toBeGreaterThan(0)
    }
  })

  it("includes rows the read model withholds, so a closed gate does not hide a claim", () => {
    // The federal IWO is absent from `forms` whenever its gate is closed. Its
    // catalog row still claims questionnaires that do not exist.
    expect(getUnresolvedQuestionnaireLinkAudit().map((a) => a.formId)).toContain(
      "income-withholding-order",
    )
  })
})
