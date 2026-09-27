/**
 * @jest-environment node
 *
 * CC-05 PR-3 — catalog / source classification.
 *
 * Every artifact the form stack could ever touch is classified by its exact
 * bytes into one versioned class. Anything not positively identified is
 * `unknown`, every conflict fails closed, and no class — not even
 * `official_current` — is shippable from this module.
 */
import {
  SOURCE_CATALOG,
  SOURCE_CLASSES,
  SOURCE_CLASSIFICATION_VERSION,
  classifySource,
  validateCatalog,
  type ClassifiedSource,
} from "@/lib/forms/form-stack/source-classification"
import { getFormById } from "@/lib/forms/illinois-court-forms"

const LEGACY = {
  sha256: "2b15c02a46b66a7d0fa2bd80d4644d5d6d5e6798911225f8e0272b45fe20b551",
  bytes: 505412,
  mediaType: "application/pdf",
  formId: "income-withholding-order",
}
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
// A supplemental official_current entry that AGREES with main's pinned catalog row.
const PNC = getFormById("petition-no-children")!.provenance!
const MAIN_AGREEING: ClassifiedSource = {
  sha256: PNC.sha256,
  bytes: PNC.bytes,
  mediaType: "application/pdf",
  formId: "petition-no-children",
  sourceClass: "official_current",
  receiptId: "synthetic-current-receipt",
}
const SUCCESSOR = {
  sha256: "6cc4f2c57ae0b590591caad4b9335f2fbe55df4f663cdb1daa001b07e4b4e6e3",
  bytes: 50777,
  mediaType: DOCX,
  formId: "income-withholding-order-revised",
}

describe("PR-3 classification vocabulary", () => {
  it("is versioned and has exactly the five classes", () => {
    expect(SOURCE_CLASSIFICATION_VERSION).toMatch(/^cc05-\d{4}-\d{2}-\d{2}\.\d+$/)
    expect([...SOURCE_CLASSES].sort()).toEqual(
      [
        "local_guidance_only",
        "official_current",
        "official_legacy",
        "official_successor_not_shippable",
        "unknown",
      ].sort()
    )
  })

  it("pins no official_current artifact — there is no current-form evidence in this snapshot", () => {
    expect(SOURCE_CATALOG.filter(s => s.sourceClass === "official_current")).toEqual([])
  })

  it("the pinned catalog is internally consistent and frozen", () => {
    expect(validateCatalog(SOURCE_CATALOG)).toEqual([])
    expect(Object.isFrozen(SOURCE_CATALOG)).toBe(true)
  })
})

describe("PR-3 positive identification", () => {
  it("classifies the pinned legacy IWO as official_legacy, still not shippable", () => {
    const r = classifySource(LEGACY)
    expect(r.sourceClass).toBe("official_legacy")
    expect(r.reasons).toEqual([])
    expect(r.shippable).toBe(false)
    expect(r.version).toBe(SOURCE_CLASSIFICATION_VERSION)
  })

  it("classifies both revised DOCX containers as official_successor_not_shippable", () => {
    const r = classifySource(SUCCESSOR)
    expect(r.sourceClass).toBe("official_successor_not_shippable")
    expect(r.shippable).toBe(false)
  })

  it("classifies the Illinois companion instruction as local_guidance_only", () => {
    const r = classifySource({
      sha256: "a344ecbd7ff66f73e2ba1ebc19c963b88f34f0aecf707cfa8c457eb4db7f8815",
      bytes: 732299,
      mediaType: "application/pdf",
      formId: "il-dv-wi-130-3",
    })
    expect(r.sourceClass).toBe("local_guidance_only")
  })

  it("even an official_current entry is never shippable from this module", () => {
    const r = classifySource({ ...MAIN_AGREEING }, [...SOURCE_CATALOG, MAIN_AGREEING])
    expect(r.sourceClass).toBe("official_current")
    expect(r.shippable).toBe(false)
  })
})

describe("PR-3 adversarial — unknown and conflict fail closed", () => {
  it("unknown hash → unknown", () => {
    const r = classifySource({ ...LEGACY, sha256: "0".repeat(64) })
    expect(r.sourceClass).toBe("unknown")
    expect(r.reasons).toContain("unknown_artifact_hash")
  })

  it("malformed hash → unknown", () => {
    const r = classifySource({ ...LEGACY, sha256: "NOT-A-HASH" })
    expect(r.sourceClass).toBe("unknown")
    expect(r.reasons).toContain("malformed_sha256")
  })

  it("revised DOCX presented as a shippable PDF → unknown, with a named reason", () => {
    const r = classifySource({ ...SUCCESSOR, mediaType: "application/pdf" })
    expect(r.sourceClass).toBe("unknown")
    expect(r.reasons).toEqual(
      expect.arrayContaining(["media_type_mismatch", "successor_docx_presented_as_pdf"])
    )
  })

  it("revised DOCX claimed as official_current → unknown, claim never upgrades", () => {
    const r = classifySource({ ...SUCCESSOR, claimedClass: "official_current" })
    expect(r.sourceClass).toBe("unknown")
    expect(r.reasons).toContain("claimed_class_conflicts_with_catalog")
  })

  it("hash-correct bytes presented under another form id → unknown", () => {
    const r = classifySource({ ...LEGACY, formId: "petition-no-children" })
    expect(r.sourceClass).toBe("unknown")
    expect(r.reasons).toContain("form_id_mismatch")
  })

  it("right hash, wrong length → unknown", () => {
    const r = classifySource({ ...LEGACY, bytes: LEGACY.bytes + 1 })
    expect(r.sourceClass).toBe("unknown")
    expect(r.reasons).toContain("byte_length_mismatch")
  })

  it("a catalog listing one hash under two classes fails closed for that hash", () => {
    const dup: ClassifiedSource = {
      ...LEGACY,
      sourceClass: "official_current",
      receiptId: "conflicting",
    }
    const catalog = [...SOURCE_CATALOG, dup]
    expect(validateCatalog(catalog)).toContain(`conflicting_classes_for_sha256:${LEGACY.sha256}`)
    const r = classifySource(LEGACY, catalog)
    expect(r.sourceClass).toBe("unknown")
    expect(r.reasons).toContain("catalog_conflict")
  })

  it("a catalog entry classed as unknown is itself a catalog defect", () => {
    const bad = {
      ...LEGACY,
      sha256: "2".repeat(64),
      sourceClass: "unknown" as const,
      receiptId: "x",
    }
    expect(validateCatalog([...SOURCE_CATALOG, bad])).toContain(
      `catalog_entry_cannot_be_unknown:${bad.sha256}`
    )
  })
})

describe("R7 main's catalog stays authoritative — the supplement can only narrow", () => {
  const withEntry = (e: ClassifiedSource) => classifySource({ ...e }, [...SOURCE_CATALOG, e])

  it("reports main's own identity for the legacy IWO alongside the supplemental class", () => {
    const r = classifySource(LEGACY)
    expect(r.sourceClass).toBe("official_legacy")
    expect(r.mainCatalog).toEqual({
      formId: "income-withholding-order",
      authority: "federal_acf",
      automationStatus: "separately_guarded",
    })
  })

  it("an official class for a form main does not catalog → unknown", () => {
    const r = withEntry({ ...MAIN_AGREEING, formId: "synthetic-current" })
    expect(r.sourceClass).toBe("unknown")
    expect(r.reasons).toContain("main_catalog_unknown_form")
  })

  it("an official class whose bytes differ from main's pinned artifact → unknown", () => {
    const r = withEntry({ ...MAIN_AGREEING, sha256: "1".repeat(64) })
    expect(r.sourceClass).toBe("unknown")
    expect(r.reasons).toContain("main_catalog_artifact_mismatch")
  })

  it.each([
    ["certificate-of-service", "unverified_identity"],
    ["marital-settlement-agreement", "freshstart_template"],
  ])("never classifies main's unsupported identity %s as official", (formId, authority) => {
    const r = withEntry({ ...MAIN_AGREEING, sha256: "2".repeat(64), formId })
    expect(r.sourceClass).toBe("unknown")
    expect(r.reasons).toContain(`main_catalog_identity_unsupported:${authority}`)
  })

  it("bytes main pins to one form cannot be classified under another form id", () => {
    const r = withEntry({ ...MAIN_AGREEING, formId: "summons" })
    expect(r.sourceClass).toBe("unknown")
    expect(r.reasons).toContain("main_catalog_pins_hash_to_other_form")
  })

  it("the non-official successor DOCX, absent from main, stays non-shippable", () => {
    const r = classifySource(SUCCESSOR)
    expect(r.sourceClass).toBe("official_successor_not_shippable")
    expect(r.mainCatalog).toBeNull()
  })
})
