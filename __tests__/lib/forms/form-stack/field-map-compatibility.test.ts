/**
 * @jest-environment node
 *
 * CC-05 PR-4 — field-map compatibility.
 *
 * A field map is only compatible with the exact artifact it was proven against:
 * same bytes, same field inventory, same mapping version, same source identity.
 * The pinned binding set is EMPTY — no map in this snapshot has been proven
 * against an official artifact — so every production query fails closed. The
 * synthetic fixtures below prove the checks themselves.
 */
import {
  PINNED_FIELD_MAP_BINDINGS,
  checkFieldMapCompatibility,
  fieldInventorySha256,
  type FieldMapBinding,
} from "@/lib/forms/form-stack/field-map-compatibility"
import { SOURCE_CATALOG, type ClassifiedSource } from "@/lib/forms/form-stack/source-classification"

const INVENTORY_A = ["Petitioner Name", "Respondent Name", "County", "Marriage Date"]
const INVENTORY_B = ["Obligor Name", "Employer Name", "Amount"]

const ARTIFACT_A: ClassifiedSource = {
  sha256: "a".repeat(64),
  bytes: 1000,
  mediaType: "application/pdf",
  formId: "synthetic-form-a",
  sourceClass: "official_current",
  receiptId: "synthetic-receipt-a",
}
const ARTIFACT_B: ClassifiedSource = {
  ...ARTIFACT_A,
  sha256: "b".repeat(64),
  bytes: 2000,
  formId: "synthetic-form-b",
  receiptId: "synthetic-receipt-b",
}
const CATALOG = [...SOURCE_CATALOG, ARTIFACT_A, ARTIFACT_B]

const BINDING_A: FieldMapBinding = {
  mappingId: "map-a",
  mappingVersion: "1",
  formId: ARTIFACT_A.formId,
  artifactPath: "private/official-forms/synthetic-a.pdf",
  artifactSha256: ARTIFACT_A.sha256,
  artifactBytes: ARTIFACT_A.bytes,
  sourceReceiptId: ARTIFACT_A.receiptId,
  fieldInventory: INVENTORY_A,
  fieldInventorySha256: fieldInventorySha256(INVENTORY_A),
  criticalFields: ["Petitioner Name", "Respondent Name", "County"],
  mappedFields: ["Petitioner Name", "Respondent Name", "County", "Marriage Date"],
}

const observedA = () => ({
  formId: ARTIFACT_A.formId,
  path: BINDING_A.artifactPath,
  sha256: ARTIFACT_A.sha256,
  bytes: ARTIFACT_A.bytes,
  mediaType: "application/pdf",
  fieldInventory: [...INVENTORY_A],
})

const deps = { bindings: [BINDING_A], catalog: CATALOG }
const check = (over: Partial<ReturnType<typeof observedA>> = {}, q: Record<string, string> = {}) =>
  checkFieldMapCompatibility(
    { mappingId: "map-a", mappingVersion: "1", ...q, artifact: { ...observedA(), ...over } },
    deps
  )

describe("PR-4 pinned state", () => {
  it("has no proven binding, so every production query fails closed", () => {
    expect(PINNED_FIELD_MAP_BINDINGS).toEqual([])
    const r = checkFieldMapCompatibility({
      mappingId: "petition-no-children",
      mappingVersion: "any",
      artifact: { ...observedA(), formId: "petition-no-children" },
    })
    expect(r.compatible).toBe(false)
    expect(r.reasons).toContain("no_bound_mapping")
  })

  it("inventory hash is order- and duplicate-insensitive", () => {
    expect(fieldInventorySha256(["b", "a", "a"])).toBe(fieldInventorySha256(["a", "b"]))
    expect(fieldInventorySha256(["a"])).not.toBe(fieldInventorySha256(["a", "b"]))
  })
})

describe("PR-4 exact binding", () => {
  it("accepts only the exact artifact, inventory, version and source", () => {
    const r = check()
    expect(r.reasons).toEqual([])
    expect(r.compatible).toBe(true)
    expect(r.generationAuthorized).toBe(false)
  })

  it("rejects a stale mapping version", () => {
    expect(check({}, { mappingVersion: "0" }).reasons).toContain("mapping_version_mismatch")
  })

  it("rejects a drifted artifact at the correct path", () => {
    const r = check({ sha256: "c".repeat(64) })
    expect(r.compatible).toBe(false)
    expect(r.reasons).toContain("artifact_sha256_mismatch")
  })

  it("rejects hash-correct bytes presented as a different form or path", () => {
    const r = check({ formId: "synthetic-form-b", path: "private/official-forms/other.pdf" })
    expect(r.compatible).toBe(false)
    expect(r.reasons).toEqual(
      expect.arrayContaining(["form_id_mismatch", "artifact_path_mismatch"])
    )
  })

  it("rejects a mapping from one artifact applied to another", () => {
    const r = check({
      formId: ARTIFACT_B.formId,
      sha256: ARTIFACT_B.sha256,
      bytes: ARTIFACT_B.bytes,
      fieldInventory: [...INVENTORY_B],
    })
    expect(r.compatible).toBe(false)
    expect(r.reasons).toContain("mapping_bound_to_different_artifact")
  })

  it("rejects a missing critical field", () => {
    const r = check({ fieldInventory: INVENTORY_A.filter(f => f !== "County") })
    expect(r.reasons).toEqual(
      expect.arrayContaining(["field_inventory_drift", "missing_critical_field:County"])
    )
  })

  it("rejects an unexpected extra field", () => {
    const r = check({ fieldInventory: [...INVENTORY_A, "Signature of Judge"] })
    expect(r.reasons).toEqual(
      expect.arrayContaining(["field_inventory_drift", "unexpected_field:Signature of Judge"])
    )
  })

  it("rejects a binding whose own inventory hash does not match its inventory", () => {
    const bad = { ...BINDING_A, fieldInventorySha256: "d".repeat(64) }
    const r = checkFieldMapCompatibility(
      { mappingId: "map-a", mappingVersion: "1", artifact: observedA() },
      { bindings: [bad], catalog: CATALOG }
    )
    expect(r.reasons).toContain("binding_inventory_hash_invalid")
  })

  it("rejects a binding whose critical field is not mapped", () => {
    const bad = { ...BINDING_A, mappedFields: ["Petitioner Name"] }
    const r = checkFieldMapCompatibility(
      { mappingId: "map-a", mappingVersion: "1", artifact: observedA() },
      { bindings: [bad], catalog: CATALOG }
    )
    expect(r.reasons).toContain("critical_field_unmapped:Respondent Name")
  })

  it("rejects a binding with no critical fields", () => {
    const bad = { ...BINDING_A, criticalFields: [] }
    const r = checkFieldMapCompatibility(
      { mappingId: "map-a", mappingVersion: "1", artifact: observedA() },
      { bindings: [bad], catalog: CATALOG }
    )
    expect(r.reasons).toContain("binding_incomplete")
  })

  it("rejects a mapping onto an artifact the catalog does not know", () => {
    const r = checkFieldMapCompatibility(
      { mappingId: "map-a", mappingVersion: "1", artifact: observedA() },
      { bindings: [BINDING_A], catalog: SOURCE_CATALOG }
    )
    expect(r.reasons).toContain("source_not_mappable:unknown")
  })

  it("rejects a binding whose source receipt differs from the catalog identity", () => {
    const bad = { ...BINDING_A, sourceReceiptId: "someone-else" }
    const r = checkFieldMapCompatibility(
      { mappingId: "map-a", mappingVersion: "1", artifact: observedA() },
      { bindings: [bad], catalog: CATALOG }
    )
    expect(r.reasons).toContain("source_identity_mismatch")
  })

  it("never maps onto the revised successor DOCX", () => {
    const succ = SOURCE_CATALOG.find(s => s.sourceClass === "official_successor_not_shippable")!
    const binding = {
      ...BINDING_A,
      formId: succ.formId,
      artifactSha256: succ.sha256,
      artifactBytes: succ.bytes,
      sourceReceiptId: succ.receiptId,
    }
    const r = checkFieldMapCompatibility(
      {
        mappingId: "map-a",
        mappingVersion: "1",
        artifact: {
          ...observedA(),
          formId: succ.formId,
          sha256: succ.sha256,
          bytes: succ.bytes,
          mediaType: succ.mediaType,
        },
      },
      { bindings: [binding], catalog: SOURCE_CATALOG }
    )
    expect(r.compatible).toBe(false)
    expect(r.reasons).toContain("source_not_mappable:official_successor_not_shippable")
  })
})
