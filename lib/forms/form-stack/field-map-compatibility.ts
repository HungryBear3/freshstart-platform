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
 *
 * R7 — DUAL GATE. This module supplements main's canonical controls and never
 * replaces them. `compatible` requires ALL of main's answers as well:
 * `isFieldMapCompatibilityProven` (catalog row + questionnaire fields + pinned
 * artifact verification), `resolveOfficialFormTemplateSource` (the only template
 * location authority), a canonical county for which main's
 * `isAutoPacketComposable` holds, an automation status main does not exclude,
 * dual source classification (PR-3), and a binding whose name and written
 * fields are exactly main's own map for that form. Main answers "no" for every
 * form today, so nothing here can be compatible in production.
 */
import crypto from "node:crypto"

import { isCanonicalCountyId } from "@/lib/counties/county-iwo-workflow"
import { resolveOfficialFormTemplateSource } from "@/lib/document-generation/official-forms/template-source"
import {
  OFFICIAL_FIELD_MAP_BINDINGS,
  isFieldMapCompatibilityProven,
} from "@/lib/forms/field-map-compatibility"
import { deepFreeze } from "@/lib/forms/form-stack/provenance-ledger"
import { getFormById, isAutoPacketComposable } from "@/lib/forms/illinois-court-forms"
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

/**
 * R2: the inventory is serialized as typed, versioned canonical JSON. Joining
 * names with a newline made `['A','B']` and `['A\nB']` the same bytes; JSON
 * string escaping cannot collide that way, and the type/version tag keeps a
 * future format from ever hashing equal to this one.
 */
export const FIELD_INVENTORY_SERIALIZATION = deepFreeze({
  type: "fs.acroform-field-inventory",
  version: 1,
} as const)

const MAX_FIELD_NAME_LENGTH = 256
const MAX_INVENTORY_SIZE = 5000
// Controls, invisible format characters and line/paragraph separators. Built
// from an ASCII string so no raw separator ever sits in the source.
const FIELD_NAME_FORBIDDEN = new RegExp("[\\p{Cc}\\p{Cf}\\p{Zl}\\p{Zp}]", "u")

/** Structural defects in an inventory. Empty array = valid. Codes only, never names. */
export function validateFieldInventory(fields: readonly string[]): string[] {
  if (!Array.isArray(fields)) return ["inventory_not_array"]
  const out = new Set<string>()
  if (fields.length > MAX_INVENTORY_SIZE) out.add("inventory_too_large")
  const seen = new Set<string>()
  for (const f of fields as unknown[]) {
    if (typeof f !== "string") {
      out.add("field_name_not_string")
      continue
    }
    if (f.length === 0) out.add("empty_field_name")
    if (f.length > MAX_FIELD_NAME_LENGTH) out.add("field_name_too_long")
    if (FIELD_NAME_FORBIDDEN.test(f)) out.add("field_name_control_character")
    if (seen.has(f)) out.add("duplicate_field_name")
    seen.add(f)
  }
  return [...out].sort()
}

/** Canonical bytes of a VALID inventory. Throws with the defect codes otherwise. */
export function canonicalFieldInventory(fields: readonly string[]): string {
  const defects = validateFieldInventory(fields)
  if (defects.length > 0) throw new Error(`invalid field inventory: ${defects.join(",")}`)
  // Keys in sorted order; names sorted by UTF-16 code unit, which is deterministic.
  return JSON.stringify({
    fields: [...fields].sort(),
    type: FIELD_INVENTORY_SERIALIZATION.type,
    version: FIELD_INVENTORY_SERIALIZATION.version,
  })
}

export function fieldInventorySha256(fields: readonly string[]): string {
  return crypto.createHash("sha256").update(canonicalFieldInventory(fields)).digest("hex")
}

function safeInventorySha256(fields: readonly string[]): string | null {
  return validateFieldInventory(fields).length === 0 ? fieldInventorySha256(fields) : null
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
  /** The county whose packet this would serve. Required — there is no default. */
  countyId: string
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
    Array.isArray(b.fieldInventory) &&
    b.fieldInventory.length > 0 &&
    Array.isArray(b.criticalFields) &&
    b.criticalFields.length > 0 &&
    Array.isArray(b.mappedFields) &&
    b.mappedFields.length > 0
  if (!complete) return ["binding_incomplete"]
  const inventoryDefects = validateFieldInventory(b.fieldInventory)
  for (const d of inventoryDefects) out.push(`binding_inventory_invalid:${d}`)
  if (
    inventoryDefects.length > 0 ||
    safeInventorySha256(b.fieldInventory) !== b.fieldInventorySha256
  ) {
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
    for (const r of classification.reasons) {
      if (r.startsWith("main_")) reasons.push(`classification:${r}`)
    }
  } else if (classification.receiptId !== b.sourceReceiptId) {
    reasons.push("source_identity_mismatch")
  }

  // R2: exact set comparison runs unconditionally. A matching hash is
  // corroboration, never a reason to skip looking at the fields themselves.
  const observedDefects = validateFieldInventory(a.fieldInventory)
  for (const d of observedDefects) reasons.push(`observed_inventory_invalid:${d}`)
  const observedList = Array.isArray(a.fieldInventory) ? a.fieldInventory : []
  if (observedDefects.length > 0 || safeInventorySha256(observedList) !== b.fieldInventorySha256) {
    reasons.push("field_inventory_drift")
  }
  const observed = new Set<unknown>(observedList)
  const bound = new Set<unknown>(b.fieldInventory)
  let setMismatch = observed.size !== bound.size
  for (const f of b.criticalFields)
    if (!observed.has(f)) reasons.push(`missing_critical_field:${f}`)
  for (const f of b.mappedFields) {
    if (!observed.has(f) && !b.criticalFields.includes(f)) reasons.push(`missing_mapped_field:${f}`)
  }
  for (const f of bound) if (!observed.has(f)) setMismatch = true
  for (const f of observed) {
    if (!bound.has(f)) {
      setMismatch = true
      reasons.push(`unexpected_field:${String(f)}`)
    }
  }
  if (setMismatch) reasons.push("inventory_set_mismatch")

  reasons.push(...mainGateRefusals(q, b))
  return result(reasons)
}

/** Main's automation statuses this module never maps onto. */
const EXCLUDED_AUTOMATION: readonly string[] = ["unsupported", "separately_guarded"]

/**
 * R7: main's canonical answers, every one required. Codes only, `main_`-prefixed,
 * so a reader can see which authority refused.
 */
function mainGateRefusals(q: CompatibilityQuery, b: FieldMapBinding): string[] {
  const out: string[] = []
  const formId = q.artifact.formId
  const row = getFormById(formId)
  if (row) {
    if (EXCLUDED_AUTOMATION.includes(row.automationStatus)) {
      out.push(`main_automation_status_excluded:${row.automationStatus}`)
    }
    if (!isCanonicalCountyId(q.countyId)) {
      out.push("main_invalid_county_context")
    } else if (!isAutoPacketComposable(row, { countyId: q.countyId })) {
      out.push("main_not_composable_for_county")
    }
  } else if (!isCanonicalCountyId(q.countyId)) {
    out.push("main_invalid_county_context")
  }
  if (!isFieldMapCompatibilityProven(formId)) out.push("main_field_map_not_proven")
  try {
    resolveOfficialFormTemplateSource(formId)
  } catch {
    out.push("main_template_source_unavailable")
  }
  const mainMap = OFFICIAL_FIELD_MAP_BINDINGS.find(m => m.formId === formId)
  if (!mainMap) {
    out.push("main_has_no_field_map")
  } else {
    if (mainMap.mapName !== b.mappingId) out.push("main_mapping_name_mismatch")
    const mainFields = new Set(mainMap.mapping.map(m => m.pdfField))
    const bound = new Set(b.mappedFields)
    if (mainFields.size !== bound.size || [...mainFields].some(f => !bound.has(f))) {
      out.push("main_mapping_fields_differ")
    }
  }
  return out
}
