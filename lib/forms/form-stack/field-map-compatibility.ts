/**
 * CC-05 PR-4 — field-map compatibility.
 *
 * A field map may be used only against the one artifact it was proven on. A
 * binding pins that artifact's form id, path, SHA-256, length, source receipt,
 * full AcroForm field inventory (and its hash), the mapping version, the fields
 * the map writes, and the fields without which the output would be wrong.
 *
 * `PINNED_FIELD_MAP_BINDINGS` is deliberately EMPTY. The maps in
 * `lib/document-generation/official-forms/field-mappings.ts` were never proven
 * against a pinned official artifact (the Illinois PDFs are not in this
 * snapshot, and the IWO is never filled), so nothing may claim compatibility.
 * Adding a binding requires official-artifact evidence and separate approval.
 *
 * `compatible: true` is a statement about one mapping and one artifact. It is
 * never generation authority — `generationAuthorized` is the literal `false`.
 */
import crypto from "node:crypto"

import { deepFreeze } from "@/lib/forms/form-stack/provenance-ledger"
import {
  SOURCE_CATALOG,
  classifySource,
  type ClassificationResult,
  type ClassifiedSource,
  type SourceClass,
} from "@/lib/forms/form-stack/source-classification"

export interface FieldMapBinding {
  mappingId: string
  mappingVersion: string
  formId: string
  artifactPath: string
  artifactSha256: string
  artifactBytes: number
  sourceReceiptId: string
  fieldInventory: readonly string[]
  fieldInventorySha256: string
  criticalFields: readonly string[]
  mappedFields: readonly string[]
}

export const PINNED_FIELD_MAP_BINDINGS: readonly FieldMapBinding[] = deepFreeze([])

/** Only these classes can ever carry a mapping. Successor/guidance/unknown never can. */
const MAPPABLE_CLASSES: readonly SourceClass[] = ["official_current", "official_legacy"]

export function fieldInventorySha256(fields: readonly string[]): string {
  const canonical = [...new Set(fields)].sort().join("\n")
  return crypto.createHash("sha256").update(canonical).digest("hex")
}

export interface ObservedArtifact {
  formId: string
  path: string
  sha256: string
  bytes: number
  mediaType: string
  /** AcroForm field names read from the artifact actually on disk. */
  fieldInventory: readonly string[]
}

export interface CompatibilityQuery {
  mappingId: string
  mappingVersion: string
  artifact: ObservedArtifact
}

export interface CompatibilityResult {
  compatible: boolean
  mappingId: string
  reasons: string[]
  classification: ClassificationResult
  generationAuthorized: false
}

function bindingDefects(b: FieldMapBinding): string[] {
  const out: string[] = []
  const complete =
    !!b.mappingId &&
    !!b.mappingVersion &&
    !!b.formId &&
    !!b.artifactPath &&
    /^[0-9a-f]{64}$/.test(b.artifactSha256) &&
    b.artifactBytes > 0 &&
    !!b.sourceReceiptId &&
    b.fieldInventory.length > 0 &&
    b.criticalFields.length > 0 &&
    b.mappedFields.length > 0
  if (!complete) out.push("binding_incomplete")
  if (fieldInventorySha256(b.fieldInventory) !== b.fieldInventorySha256) {
    out.push("binding_inventory_hash_invalid")
  }
  const inventory = new Set(b.fieldInventory)
  const mapped = new Set(b.mappedFields)
  for (const f of b.criticalFields) {
    if (!inventory.has(f)) out.push(`critical_field_not_in_inventory:${f}`)
    if (!mapped.has(f)) out.push(`critical_field_unmapped:${f}`)
  }
  for (const f of b.mappedFields)
    if (!inventory.has(f)) out.push(`mapped_field_not_in_inventory:${f}`)
  return out
}

export function checkFieldMapCompatibility(
  q: CompatibilityQuery,
  deps: { bindings: readonly FieldMapBinding[]; catalog: readonly ClassifiedSource[] } = {
    bindings: PINNED_FIELD_MAP_BINDINGS,
    catalog: SOURCE_CATALOG,
  }
): CompatibilityResult {
  const a = q.artifact
  const classification = classifySource(
    { sha256: a.sha256, bytes: a.bytes, mediaType: a.mediaType, formId: a.formId },
    deps.catalog
  )
  const result = (reasons: string[]): CompatibilityResult => ({
    compatible: reasons.length === 0,
    mappingId: q.mappingId,
    reasons,
    classification,
    generationAuthorized: false,
  })

  const matches = deps.bindings.filter(b => b.mappingId === q.mappingId)
  if (matches.length === 0) return result(["no_bound_mapping"])
  if (matches.length > 1) return result(["ambiguous_mapping_binding"])
  const b = matches[0]

  const reasons = bindingDefects(b)
  if (q.mappingVersion !== b.mappingVersion) reasons.push("mapping_version_mismatch")

  if (a.sha256 !== b.artifactSha256) {
    reasons.push("artifact_sha256_mismatch")
    // Known, valid, but DIFFERENT artifact: the map is being reused across artifacts.
    if (deps.catalog.some(e => e.sha256 === a.sha256))
      reasons.push("mapping_bound_to_different_artifact")
  }
  if (a.bytes !== b.artifactBytes) reasons.push("artifact_bytes_mismatch")
  if (a.formId !== b.formId) reasons.push("form_id_mismatch")
  if (a.path !== b.artifactPath) reasons.push("artifact_path_mismatch")

  if (!MAPPABLE_CLASSES.includes(classification.sourceClass)) {
    reasons.push(`source_not_mappable:${classification.sourceClass}`)
  } else if (classification.receiptId !== b.sourceReceiptId) {
    reasons.push("source_identity_mismatch")
  }

  if (fieldInventorySha256(a.fieldInventory) !== b.fieldInventorySha256) {
    reasons.push("field_inventory_drift")
    const observed = new Set(a.fieldInventory)
    const bound = new Set(b.fieldInventory)
    for (const f of b.criticalFields)
      if (!observed.has(f)) reasons.push(`missing_critical_field:${f}`)
    for (const f of b.mappedFields) {
      if (!observed.has(f) && !b.criticalFields.includes(f))
        reasons.push(`missing_mapped_field:${f}`)
    }
    for (const f of observed) if (!bound.has(f)) reasons.push(`unexpected_field:${f}`)
  }

  return result(reasons)
}
