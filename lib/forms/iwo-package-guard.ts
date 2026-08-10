/**
 * Document-package boundary guard for the federal IWO.
 *
 * SERVER ONLY.
 *
 * `/api/documents/package` zips up whatever `Document` rows a user already has
 * at status `ready`. That is an INDEPENDENT release path: a row created before
 * this gating existed, or by any other code path, would otherwise be packaged
 * and handed to the user regardless of county disposition or federal
 * currentness. This guard closes that path.
 *
 * The county is taken from the server-side case record and canonically
 * validated — free-text values fail closed, exactly as in the download route.
 */
import crypto from "node:crypto"

import { isCanonicalCountyId } from "@/lib/counties/county-iwo-workflow"
import { getIwoAvailability } from "@/lib/forms/official-artifact-access"
import { IWO_PROVENANCE, type IwoRenewalEvidence } from "@/lib/forms/iwo-provenance"

export interface PackageDocumentLike {
  type: string
  fileName: string
  /** Base64 payload actually stored on the row. */
  content?: string | null
  mimeType?: string | null
}

/** Why a row's stored payload failed the pin. */
export type IwoPayloadRejection =
  | "missing_content"
  | "invalid_base64"
  | "wrong_mime_type"
  | "wrong_byte_length"
  | "wrong_sha256"

export type IwoPayloadCheck =
  | { ok: true; bytes: Buffer; sha256: string }
  | { ok: false; reason: IwoPayloadRejection }

/**
 * Validate the EXACT bytes that would be written into the package.
 *
 * Policy gates authorize the *form*; this authorizes the *payload*. They are
 * independent: a row can name itself an IWO, pass every county/currentness
 * gate, and still hold `%PDF-FAKE`. Nothing reaches the archive without
 * matching the pinned federal print byte for byte.
 *
 * Consequence worth stating plainly: because the pin is the unfilled canonical
 * federal print, only an unmodified copy can pass. A *filled* IWO can never
 * satisfy this check. That is consistent with this product — the IWO has no
 * field mappings and is never generated or filled here.
 */
export function validateIwoPayload(doc: PackageDocumentLike): IwoPayloadCheck {
  if (doc.mimeType !== "application/pdf") return { ok: false, reason: "wrong_mime_type" }

  const content = doc.content
  if (typeof content !== "string" || content.length === 0) {
    return { ok: false, reason: "missing_content" }
  }

  // Strict base64: Buffer.from is lenient, so round-trip to prove fidelity.
  const normalized = content.trim()
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized) || normalized.length % 4 !== 0) {
    return { ok: false, reason: "invalid_base64" }
  }
  const bytes = Buffer.from(normalized, "base64")
  if (bytes.toString("base64") !== normalized) return { ok: false, reason: "invalid_base64" }

  if (bytes.length !== IWO_PROVENANCE.expectedBytes) {
    return { ok: false, reason: "wrong_byte_length" }
  }
  const sha256 = crypto.createHash("sha256").update(bytes).digest("hex")
  if (sha256 !== IWO_PROVENANCE.expectedSha256) return { ok: false, reason: "wrong_sha256" }

  return { ok: true, bytes, sha256 }
}

/**
 * Normalize a free-form label for matching: lowercase, and collapse every
 * non-alphanumeric run (`-`, `_`, `.`, spaces) to a single space. This makes
 * `withholding_order`, `withholding-order`, `Withholding Order.pdf`, and
 * `WITHHOLDING_ORDER.PDF` all reduce to the same token sequence.
 */
function normalizeLabel(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim()
}

/** Terminal filename extension tokens dropped before identity comparison. */
const FILE_EXTENSION_TOKENS = new Set([
  "pdf", "doc", "docx", "rtf", "txt", "png", "jpg", "jpeg", "tif", "tiff",
])

/**
 * Normalize a label to a comparable IDENTITY: normalize separators, then drop a
 * single trailing file-extension token so `Withholding Order.pdf` and
 * `withholding_order` compare equal.
 */
function normalizeIdentity(value: string): string {
  const tokens = normalizeLabel(value).split(" ").filter(Boolean)
  if (tokens.length > 1 && FILE_EXTENSION_TOKENS.has(tokens[tokens.length - 1])) {
    tokens.pop()
  }
  return tokens.join(" ")
}

/**
 * EXACT, evidence-derived identities for the federal instrument.
 *
 * This is an allowlist of complete identities, not a set of substrings. Phrase
 * containment is not sufficient: "State Tax Withholding Order" and "Income
 * Withholding Certificate" are qualified tax/payroll documents that merely
 * contain an identity phrase, and treating them as the federal IWO would
 * suppress them from packages AND attach an inaccurate Will County
 * currentness/procedural disclosure. Over-matching and under-matching are both
 * release-boundary failures, so a field must name the instrument exactly.
 *
 * Sources: the 2026-07-31 Will County Circuit Clerk response (which states the
 * IWO, the "Withholding Order", and federal OMB 0970-0154 are the same
 * instrument), the workflow model's `sameInstrumentAliases`, and the canonical
 * catalog id/basename. A test asserts every current `sameInstrumentAliases`
 * entry classifies, so this list cannot silently drift from the evidence.
 */
const CANONICAL_IWO_IDENTITIES: ReadonlySet<string> = new Set([
  // Workflow-model aliases (same instrument per the clerk response).
  "income withholding for support",
  "withholding order",
  "federal income withholding for support form omb 0970 0154",
  // Canonical catalog id / stored basename / historical catalog name.
  "income withholding order",
  "income withholding",
  "income withholding for support order",
])

/** OMB control number, however it was punctuated. A bounded, specific signal. */
const OMB_CONTROL_NUMBER = /\b0970 ?0154\b/

/** Whole-word acronym: matches "iwo.pdf" and "type: iwo", never "kiwo". */
const IWO_ACRONYM = /\biwo\b/

function fieldIdentifiesIwo(value: string): boolean {
  const normalized = normalizeLabel(value)
  if (!normalized) return false
  // Bounded signals: a whole-word acronym or the exact federal control number
  // are specific enough that a qualified superset cannot arise by accident.
  if (IWO_ACRONYM.test(normalized)) return true
  if (OMB_CONTROL_NUMBER.test(normalized)) return true
  // Otherwise the field must name the instrument EXACTLY.
  return CANONICAL_IWO_IDENTITIES.has(normalizeIdentity(value))
}

/**
 * Identify an IWO document.
 *
 * `Document.type` and `fileName` are free-form strings persisted from user
 * input, so a row can name the instrument in any casing or separator style —
 * `withholding_order`, `Withholding Order.pdf`, `INCOME-WITHHOLDING.PDF`. All of
 * those must be caught, because a missed one bypasses every county,
 * currentness, and payload gate. Equally, a qualified tax or payroll document
 * must NOT be caught, because a false positive suppresses a legitimate document
 * and mislabels it with IWO procedural disclosure.
 */
export function isIwoDocument(doc: PackageDocumentLike): boolean {
  // `type` and `fileName` are normalized and tested INDEPENDENTLY. Joining them
  // first could manufacture an identity present in neither field — type
  // "income" plus fileName "withholding.pdf" would spell "income withholding"
  // across the seam and misclassify two unrelated values.
  return fieldIdentifiesIwo(doc.type) || fieldIdentifiesIwo(doc.fileName)
}

export interface WithheldIwoItem<T> {
  doc: T
  /** Policy refusal (county/federal) or payload rejection reason. */
  reason: string
}

export interface IwoPackageFilter<T> {
  included: T[]
  withheld: WithheldIwoItem<T>[]
  /** Neutral explanatory copy for the disclosure file, when anything was withheld. */
  notice: string[] | null
  refusal: string | null
}

export interface IwoPackageFilterInput {
  /** Raw stored county from the case record. Server-owned; may be free text. */
  storedCounty?: string | null
  today?: Date
  artifactDir?: string
  /** Injected ONLY by test factories. */
  renewalEvidence?: IwoRenewalEvidence
}

export function filterIwoFromPackage<T extends PackageDocumentLike>(
  documents: T[],
  input: IwoPackageFilterInput,
): IwoPackageFilter<T> {
  const candidates = documents.filter(isIwoDocument)
  if (candidates.length === 0) {
    return { included: documents, withheld: [], notice: null, refusal: null }
  }

  const stored = input.storedCounty ?? ""
  const countyId = isCanonicalCountyId(stored) ? stored : ""

  const availability = getIwoAvailability({
    countyId,
    today: input.today,
    artifactDir: input.artifactDir,
    renewalEvidence: input.renewalEvidence,
  })

  // Gate 1 — policy. Closed policy withholds every IWO candidate outright.
  if (!availability.available) {
    const withheldAll = new Set(candidates)
    return {
      included: documents.filter((d) => !withheldAll.has(d)),
      withheld: candidates.map((doc) => ({ doc, reason: availability.refusal! })),
      notice: availability.copy,
      refusal: availability.refusal,
    }
  }

  // Gate 2 — payload. Policy being open authorizes the FORM, never the bytes.
  const rejected = new Map<T, string>()
  for (const doc of candidates) {
    const check = validateIwoPayload(doc)
    if (!check.ok) rejected.set(doc, check.reason)
  }

  if (rejected.size === 0) {
    return { included: documents, withheld: [], notice: null, refusal: null }
  }

  return {
    included: documents.filter((d) => !rejected.has(d)),
    withheld: [...rejected].map(([doc, reason]) => ({ doc, reason })),
    notice: [
      "A copy of the federal Income Withholding for Support form stored on this account did not match the verified federal print and was not included.",
      "Fresh Start only releases this form when its contents match the official federal file exactly.",
      "This is procedural information about file verification, not legal advice.",
    ],
    refusal: "iwo_payload_failed_provenance",
  }
}
