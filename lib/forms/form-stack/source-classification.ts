/**
 * CC-05 PR-3 — versioned catalog / source classification.
 *
 * Classifies an artifact by its EXACT bytes (SHA-256 + length + media type +
 * form id) into one of five classes. Positive identification requires every
 * attribute to match one catalog entry; anything else is `unknown`. A caller's
 * claimed class is checked, never trusted, and can never upgrade a result.
 *
 * `official_current` exists in the vocabulary but the pinned catalog holds no
 * such entry: this snapshot carries no verified current-form evidence (the
 * Illinois manifest's `verification` blocks are all null). And no class is
 * shippable from here — `shippable` is the literal `false`. Classification is
 * evidence for a later, separately approved release decision, not that decision.
 *
 * R7 — this supplements main's catalog (`lib/forms/illinois-court-forms.ts`);
 * it is never a second authority. The supplement can only NARROW: an official
 * class requires main to catalog that form id, pin exactly these bytes, and
 * class it under an authority that may carry an official artifact. Bytes main
 * pins to one form are never classified under another id. Any disagreement is
 * `unknown`.
 *
 * No I/O.
 */
import { IWO_FORM_ID } from "@/lib/counties/county-iwo-workflow"
import {
  FORM_AUTHORITY_CLASSES,
  ILLINOIS_COURT_FORMS,
  getFormById,
  type AutomationStatus,
  type FormAuthority,
} from "@/lib/forms/illinois-court-forms"
import {
  deepFreeze,
  IWO_SOURCE_RECEIPTS,
  type ReceiptRole,
} from "@/lib/forms/form-stack/provenance-ledger"

export const SOURCE_CLASSIFICATION_VERSION = "cc05-2026-09-26.1"

export const SOURCE_CLASSES = deepFreeze([
  "official_current",
  "official_legacy",
  "official_successor_not_shippable",
  "local_guidance_only",
  "unknown",
] as const)

export type SourceClass = (typeof SOURCE_CLASSES)[number]

export interface ClassifiedSource {
  sha256: string
  bytes: number
  mediaType: string
  formId: string
  sourceClass: SourceClass
  receiptId: string
}

const ROLE_TO_ENTRY: Partial<Record<ReceiptRole, { sourceClass: SourceClass; formId: string }>> = {
  legacy_artifact: { sourceClass: "official_legacy", formId: IWO_FORM_ID },
  revised_successor: {
    sourceClass: "official_successor_not_shippable",
    formId: `${IWO_FORM_ID}-revised`,
  },
  state_companion_instruction: { sourceClass: "local_guidance_only", formId: "il-dv-wi-130-3" },
}

/** Built only from pinned receipts. Evidence documents (NOA, statements) are not form artifacts. */
export const SOURCE_CATALOG: readonly ClassifiedSource[] = deepFreeze(
  IWO_SOURCE_RECEIPTS.flatMap(r => {
    const e = ROLE_TO_ENTRY[r.role]
    return e
      ? [{ sha256: r.sha256, bytes: r.bytes, mediaType: r.mediaType, receiptId: r.id, ...e }]
      : []
  })
)

export interface ClassificationQuery {
  sha256: string
  bytes: number
  mediaType: string
  formId: string
  /** What the caller believes. Checked, never trusted. */
  claimedClass?: SourceClass
}

/** Main's own identity for the queried form id, reported beside the supplement. */
export interface MainCatalogIdentity {
  formId: string
  authority: FormAuthority
  automationStatus: AutomationStatus
}

export interface ClassificationResult {
  version: string
  sourceClass: SourceClass
  formId: string
  receiptId: string | null
  mainCatalog: MainCatalogIdentity | null
  /** Nothing is shippable from classification alone. */
  shippable: false
  reasons: string[]
}

const SHA256 = /^[0-9a-f]{64}$/

/** Structural defects in a catalog. Empty array = consistent. */
export function validateCatalog(catalog: readonly ClassifiedSource[]): string[] {
  const out: string[] = []
  const byHash = new Map<string, Set<string>>()
  for (const e of catalog) {
    if (!SHA256.test(e.sha256)) out.push(`catalog_malformed_sha256:${e.sha256}`)
    if (e.sourceClass === "unknown") out.push(`catalog_entry_cannot_be_unknown:${e.sha256}`)
    if (!(SOURCE_CLASSES as readonly string[]).includes(e.sourceClass)) {
      out.push(`catalog_unrecognized_class:${e.sha256}`)
    }
    const key = JSON.stringify([e.sourceClass, e.formId, e.bytes, e.mediaType])
    byHash.set(e.sha256, (byHash.get(e.sha256) ?? new Set()).add(key))
  }
  for (const [sha, keys] of byHash) {
    if (keys.size > 1) out.push(`conflicting_classes_for_sha256:${sha}`)
  }
  return out
}

const OFFICIAL_CLASSES: readonly SourceClass[] = ["official_current", "official_legacy"]

/** R7: where main's catalog disagrees with a positive supplemental match. */
function mainCatalogDisagreements(q: ClassificationQuery, cls: SourceClass): string[] {
  const out: string[] = []
  if (ILLINOIS_COURT_FORMS.some(f => f.provenance?.sha256 === q.sha256 && f.id !== q.formId)) {
    out.push("main_catalog_pins_hash_to_other_form")
  }
  const row = getFormById(q.formId)
  if (row && !FORM_AUTHORITY_CLASSES[row.authority].mayCarryOfficialArtifact) {
    out.push(`main_catalog_identity_unsupported:${row.authority}`)
  }
  if (OFFICIAL_CLASSES.includes(cls)) {
    if (!row) {
      out.push("main_catalog_unknown_form")
    } else {
      const pin = row.provenance
      if (
        !pin ||
        pin.sha256 !== q.sha256 ||
        pin.bytes !== q.bytes ||
        pin.contentType !== q.mediaType
      ) {
        out.push("main_catalog_artifact_mismatch")
      }
    }
  }
  return out
}

export function classifySource(
  q: ClassificationQuery,
  catalog: readonly ClassifiedSource[] = SOURCE_CATALOG
): ClassificationResult {
  const row = typeof q.formId === "string" ? getFormById(q.formId) : undefined
  const mainCatalog: MainCatalogIdentity | null = row
    ? { formId: row.id, authority: row.authority, automationStatus: row.automationStatus }
    : null
  const unknown = (reasons: string[]): ClassificationResult => ({
    version: SOURCE_CLASSIFICATION_VERSION,
    sourceClass: "unknown",
    formId: q.formId,
    receiptId: null,
    mainCatalog,
    shippable: false,
    reasons,
  })

  if (typeof q.sha256 !== "string" || !SHA256.test(q.sha256)) return unknown(["malformed_sha256"])

  const defects = validateCatalog(catalog)
  const matches = catalog.filter(e => e.sha256 === q.sha256)
  if (matches.length === 0) return unknown(["unknown_artifact_hash"])
  if (defects.some(d => d.endsWith(q.sha256)) || matches.length > 1) {
    return unknown(["catalog_conflict"])
  }

  const entry = matches[0]
  const reasons: string[] = []
  if (q.bytes !== entry.bytes) reasons.push("byte_length_mismatch")
  if (q.formId !== entry.formId) reasons.push("form_id_mismatch")
  if (q.mediaType !== entry.mediaType) {
    reasons.push("media_type_mismatch")
    if (entry.sourceClass === "official_successor_not_shippable" && /pdf/i.test(q.mediaType)) {
      reasons.push("successor_docx_presented_as_pdf")
    }
  }
  if (q.claimedClass !== undefined && q.claimedClass !== entry.sourceClass) {
    reasons.push("claimed_class_conflicts_with_catalog")
  }
  reasons.push(...mainCatalogDisagreements(q, entry.sourceClass))
  if (reasons.length > 0) return unknown(reasons)

  return {
    version: SOURCE_CLASSIFICATION_VERSION,
    sourceClass: entry.sourceClass,
    formId: entry.formId,
    receiptId: entry.receiptId,
    mainCatalog,
    shippable: false,
    reasons: [],
  }
}
