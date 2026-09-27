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
import crypto from "node:crypto"

import {
  FIELD_INVENTORY_SERIALIZATION,
  PINNED_FIELD_MAP_BINDINGS,
  canonicalFieldInventory,
  checkFieldMapCompatibility,
  fieldInventorySha256,
  validateFieldInventory,
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
    {
      mappingId: "map-a",
      mappingVersion: "1",
      countyId: "cook",
      ...q,
      artifact: { ...observedA(), ...over },
    },
    deps
  )

describe("PR-4 pinned state", () => {
  it("has no proven binding, so every production query fails closed", () => {
    expect(PINNED_FIELD_MAP_BINDINGS).toEqual([])
    const r = checkFieldMapCompatibility({
      mappingId: "petition-no-children",
      mappingVersion: "any",
      countyId: "cook",
      artifact: { ...observedA(), formId: "petition-no-children" },
    })
    expect(r.compatible).toBe(false)
    expect(r.reasons).toContain("no_bound_mapping")
  })

  it("inventory hash is order-insensitive but never duplicate-insensitive", () => {
    expect(fieldInventorySha256(["b", "a"])).toBe(fieldInventorySha256(["a", "b"]))
    expect(fieldInventorySha256(["a"])).not.toBe(fieldInventorySha256(["a", "b"]))
    expect(() => fieldInventorySha256(["b", "a", "a"])).toThrow(/duplicate_field_name/)
  })
})

describe("R2 unambiguous inventory serialization", () => {
  it("hashes typed, versioned canonical JSON — not newline-joined names", () => {
    expect(FIELD_INVENTORY_SERIALIZATION).toEqual({
      type: "fs.acroform-field-inventory",
      version: 1,
    })
    const canonical = canonicalFieldInventory(["b", "a"])
    expect(canonical).toBe('{"fields":["a","b"],"type":"fs.acroform-field-inventory","version":1}')
    expect(fieldInventorySha256(["b", "a"])).toBe(
      crypto.createHash("sha256").update(canonical).digest("hex")
    )
    expect(fieldInventorySha256(["a", "b"])).not.toBe(
      crypto.createHash("sha256").update("a\nb").digest("hex")
    )
  })

  it("['A','B'] and ['A\\nB'] never collide: the second is not a valid inventory", () => {
    expect(validateFieldInventory(["A", "B"])).toEqual([])
    expect(validateFieldInventory(["A\nB"])).toContain("field_name_control_character")
    expect(() => fieldInventorySha256(["A\nB"])).toThrow(/field_name_control_character/)
  })

  it.each([
    ["duplicate", ["A", "A"], "duplicate_field_name"],
    ["empty name", ["A", ""], "empty_field_name"],
    ["tab", ["A\tB"], "field_name_control_character"],
    ["NUL", ["A\u0000"], "field_name_control_character"],
    ["line separator", ["A\u2028B"], "field_name_control_character"],
    ["zero-width space", ["A\u200bB"], "field_name_control_character"],
    ["bidi override", ["\u202eA"], "field_name_control_character"],
    ["non-string", ["A", 7 as unknown as string], "field_name_not_string"],
    ["overlong", ["x".repeat(257)], "field_name_too_long"],
  ])("rejects an inventory with a %s", (_name, fields, code) => {
    expect(validateFieldInventory(fields)).toContain(code)
  })

  it("rejects a non-array inventory", () => {
    expect(validateFieldInventory("A,B" as unknown as string[])).toContain("inventory_not_array")
  })
})

describe("R2 set checks are unconditional", () => {
  const BINDING_AB: FieldMapBinding = {
    ...BINDING_A,
    fieldInventory: ["A", "B"],
    fieldInventorySha256: fieldInventorySha256(["A", "B"]),
    criticalFields: ["A", "B"],
    mappedFields: ["A", "B"],
  }
  const run = (binding: FieldMapBinding, fieldInventory: string[]) =>
    checkFieldMapCompatibility(
      {
        mappingId: "map-a",
        mappingVersion: "1",
        countyId: "cook",
        artifact: { ...observedA(), fieldInventory },
      },
      { bindings: [binding], catalog: CATALOG }
    )

  it("an observed ['A\\nB'] is refused against a bound ['A','B']", () => {
    const r = run(BINDING_AB, ["A\nB"])
    expect(r.compatible).toBe(false)
    expect(r.reasons).toEqual(
      expect.arrayContaining([
        "observed_inventory_invalid:field_name_control_character",
        "missing_critical_field:A",
        "missing_critical_field:B",
      ])
    )
  })

  it("compares exact sets even when the declared hash matches the observed hash", () => {
    // The binding declares the OBSERVED hash but lists a different inventory.
    const forged = { ...BINDING_AB, fieldInventorySha256: fieldInventorySha256(["A"]) }
    const r = run(forged, ["A"])
    expect(r.compatible).toBe(false)
    expect(r.reasons).toEqual(
      expect.arrayContaining([
        "binding_inventory_hash_invalid",
        "missing_critical_field:B",
        "inventory_set_mismatch",
      ])
    )
  })

  it("verifies every mapped and critical field is observed, every time", () => {
    const r = run({ ...BINDING_AB, mappedFields: ["A", "B"], criticalFields: ["A"] }, ["A"])
    expect(r.reasons).toEqual(
      expect.arrayContaining(["missing_mapped_field:B", "inventory_set_mismatch"])
    )
  })

  it("an invalid binding inventory is a binding defect, never hashed", () => {
    const bad = { ...BINDING_AB, fieldInventory: ["A", "A", "B"] }
    const r = run(bad, ["A", "B"])
    expect(r.reasons).toContain("binding_inventory_invalid:duplicate_field_name")
  })
})

describe("PR-4 exact binding", () => {
  it("supplemental checks passing is not enough — main's gates still refuse", () => {
    const r = check()
    expect(r.compatible).toBe(false)
    expect(r.generationAuthorized).toBe(false)
    // Every supplemental check passed; only main's canonical gates refuse.
    expect(r.reasons.every(x => x.startsWith("main_") || x.startsWith("classification:"))).toBe(
      true
    )
    expect(r.reasons).toEqual(
      expect.arrayContaining([
        "classification:main_catalog_unknown_form",
        "main_field_map_not_proven",
        "main_template_source_unavailable",
        "main_has_no_field_map",
      ])
    )
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
      { mappingId: "map-a", mappingVersion: "1", countyId: "cook", artifact: observedA() },
      { bindings: [bad], catalog: CATALOG }
    )
    expect(r.reasons).toContain("binding_inventory_hash_invalid")
  })

  it("rejects a binding whose critical field is not mapped", () => {
    const bad = { ...BINDING_A, mappedFields: ["Petitioner Name"] }
    const r = checkFieldMapCompatibility(
      { mappingId: "map-a", mappingVersion: "1", countyId: "cook", artifact: observedA() },
      { bindings: [bad], catalog: CATALOG }
    )
    expect(r.reasons).toContain("critical_field_unmapped:Respondent Name")
  })

  it("rejects a binding with no critical fields", () => {
    const bad = { ...BINDING_A, criticalFields: [] }
    const r = checkFieldMapCompatibility(
      { mappingId: "map-a", mappingVersion: "1", countyId: "cook", artifact: observedA() },
      { bindings: [bad], catalog: CATALOG }
    )
    expect(r.reasons).toContain("binding_incomplete")
  })

  it("rejects a mapping onto an artifact the catalog does not know", () => {
    const r = checkFieldMapCompatibility(
      { mappingId: "map-a", mappingVersion: "1", countyId: "cook", artifact: observedA() },
      { bindings: [BINDING_A], catalog: SOURCE_CATALOG }
    )
    expect(r.reasons).toContain("source_not_mappable:unknown")
  })

  it("rejects a binding whose source receipt differs from the catalog identity", () => {
    const bad = { ...BINDING_A, sourceReceiptId: "someone-else" }
    const r = checkFieldMapCompatibility(
      { mappingId: "map-a", mappingVersion: "1", countyId: "cook", artifact: observedA() },
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
        countyId: "cook",
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
