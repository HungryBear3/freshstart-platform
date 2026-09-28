/**
 * @jest-environment node
 *
 * CC-05 R7 — dual gate. PR-4 supplements main's field-map controls; it never
 * replaces them. Main's two canonical answers are mocked open here ONLY to
 * reach the positive path and prove that BOTH halves are required: every
 * other main control (catalog row, pinned artifact, authority class, automation
 * status, county composability, main's own mapping) is the real code.
 */
jest.mock("@/lib/forms/field-map-compatibility", () => ({
  ...jest.requireActual("@/lib/forms/field-map-compatibility"),
  isFieldMapCompatibilityProven: jest.fn(() => true),
}))
jest.mock("@/lib/document-generation/official-forms/template-source", () => ({
  resolveOfficialFormTemplateSource: jest.fn(() => "synthetic-approved-location"),
}))

import { isFieldMapCompatibilityProven } from "@/lib/forms/field-map-compatibility"
import { resolveOfficialFormTemplateSource } from "@/lib/document-generation/official-forms/template-source"
import { PETITION_NO_CHILDREN_FIELD_MAP } from "@/lib/document-generation/official-forms/field-mappings"
import {
  checkFieldMapCompatibility,
  fieldInventorySha256,
  type FieldMapBinding,
} from "@/lib/forms/form-stack/field-map-compatibility"
import { SOURCE_CATALOG, type ClassifiedSource } from "@/lib/forms/form-stack/source-classification"
import { getFormById } from "@/lib/forms/illinois-court-forms"

const PNC = getFormById("petition-no-children")!
const MAIN_FIELDS = [...new Set(PETITION_NO_CHILDREN_FIELD_MAP.map(m => m.pdfField))]
const INVENTORY = [...MAIN_FIELDS, "Synthetic Unmapped Field"]

const CURRENT: ClassifiedSource = {
  sha256: PNC.provenance!.sha256,
  bytes: PNC.provenance!.bytes,
  mediaType: "application/pdf",
  formId: PNC.id,
  sourceClass: "official_current",
  receiptId: "synthetic-current-receipt",
}
const BINDING: FieldMapBinding = {
  mappingId: "PETITION_NO_CHILDREN_FIELD_MAP",
  mappingVersion: "1",
  formId: PNC.id,
  artifactPath: `private/official-forms/${PNC.filename}`,
  artifactSha256: CURRENT.sha256,
  artifactBytes: CURRENT.bytes,
  sourceReceiptId: CURRENT.receiptId,
  fieldInventory: INVENTORY,
  fieldInventorySha256: fieldInventorySha256(INVENTORY),
  criticalFields: MAIN_FIELDS.slice(0, 3),
  mappedFields: MAIN_FIELDS,
}
const deps = { bindings: [BINDING], catalog: [...SOURCE_CATALOG, CURRENT] }
const query = (over: Record<string, unknown> = {}) => ({
  mappingId: BINDING.mappingId,
  mappingVersion: "1",
  countyId: "cook",
  artifact: {
    formId: PNC.id,
    path: BINDING.artifactPath,
    sha256: CURRENT.sha256,
    bytes: CURRENT.bytes,
    mediaType: "application/pdf",
    fieldInventory: [...INVENTORY],
  },
  ...over,
})

beforeEach(() => {
  jest.mocked(isFieldMapCompatibilityProven).mockReturnValue(true)
  jest.mocked(resolveOfficialFormTemplateSource).mockReturnValue("synthetic-approved-location")
})

describe("R7 both halves must pass", () => {
  it("compatible only when main's gates AND the exact binding agree", () => {
    const r = checkFieldMapCompatibility(query(), deps)
    expect(r.reasons).toEqual([])
    expect(r.compatible).toBe(true)
    expect(r.generationAuthorized).toBe(false)
  })

  it("main's isFieldMapCompatibilityProven=false refuses a perfect binding", () => {
    jest.mocked(isFieldMapCompatibilityProven).mockReturnValue(false)
    const r = checkFieldMapCompatibility(query(), deps)
    expect(r.compatible).toBe(false)
    expect(r.reasons).toEqual(["main_field_map_not_proven"])
  })

  it("main's template resolver refusing refuses a perfect binding", () => {
    jest.mocked(resolveOfficialFormTemplateSource).mockImplementation(() => {
      throw new Error("no approved template location")
    })
    const r = checkFieldMapCompatibility(query(), deps)
    expect(r.reasons).toEqual(["main_template_source_unavailable"])
  })

  it("a county context that is missing or not canonical is refused", () => {
    for (const countyId of ["", "Cook", "not-a-county", undefined]) {
      const r = checkFieldMapCompatibility(query({ countyId }) as never, deps)
      expect(r.reasons).toContain("main_invalid_county_context")
    }
  })

  it("a binding whose name or fields contradict main's own map is refused", () => {
    const renamed = { ...BINDING, mappingId: "SOME_OTHER_MAP" }
    const r1 = checkFieldMapCompatibility(query({ mappingId: "SOME_OTHER_MAP" }), {
      ...deps,
      bindings: [renamed],
    })
    expect(r1.reasons).toContain("main_mapping_name_mismatch")

    const fewer = { ...BINDING, mappedFields: MAIN_FIELDS.slice(0, 5) }
    const r2 = checkFieldMapCompatibility(query(), { ...deps, bindings: [fewer] })
    expect(r2.reasons).toContain("main_mapping_fields_differ")
  })

  it("a binding whose source receipt differs from the catalog identity is refused", () => {
    const r = checkFieldMapCompatibility(query(), {
      ...deps,
      bindings: [{ ...BINDING, sourceReceiptId: "someone-else" }],
    })
    expect(r.reasons).toEqual(["source_identity_mismatch"])
  })

  it("the federal IWO is never mappable here, even with main's gates open", () => {
    const iwo = getFormById("income-withholding-order")!
    const b = {
      ...BINDING,
      formId: iwo.id,
      artifactSha256: iwo.provenance!.sha256,
      artifactBytes: iwo.provenance!.bytes,
      sourceReceiptId: "acf_legacy_iwo_pdf_20260901",
    }
    const r = checkFieldMapCompatibility(
      query({
        artifact: {
          ...query().artifact,
          formId: iwo.id,
          sha256: iwo.provenance!.sha256,
          bytes: iwo.provenance!.bytes,
        },
      }),
      { bindings: [b], catalog: SOURCE_CATALOG }
    )
    expect(r.compatible).toBe(false)
    expect(r.reasons).toContain("main_automation_status_excluded:separately_guarded")
  })
})
