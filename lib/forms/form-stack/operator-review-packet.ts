/**
 * CC-05 PR-6 — operator review packet.
 *
 * Assembles what a human operator reviews before any later release step:
 * provenance reconciliation, source classification, field-map compatibility,
 * the non-official artifacts, test results, and holds.
 *
 *   - COMPUTED, NOT ACCEPTED. The caller supplies queries and inputs; every
 *     verdict is produced here by the PR-2..PR-5 gates. A caller cannot pass in
 *     a finished "compatible: true".
 *   - HASH-BOUND. Each entry is canonical JSON with its own SHA-256; the
 *     manifest hash covers every entry. `verifyOperatorReviewPacket` detects any
 *     change made after the hash an operator reviewed.
 *   - PII-MINIMIZED. Non-official artifacts appear by hash and shape only —
 *     never their text. Every other request field is checked against a closed,
 *     length-bounded schema (R3, `packet-request-schema.ts`); holds are ids
 *     from a fixed catalog, never caller text; AcroForm field names appear in
 *     compatibility reasons only as digests; violations never echo a value.
 *   - NO DELIVERY. `delivery` is the literal "none". This module builds an
 *     in-memory object; it has no network, email, storage or database path.
 */
import crypto from "node:crypto"

import { deepFreeze, reconcileIwoProvenance } from "@/lib/forms/form-stack/provenance-ledger"
import {
  classifySource,
  type ClassificationQuery,
} from "@/lib/forms/form-stack/source-classification"
import {
  checkFieldMapCompatibility,
  type CompatibilityQuery,
} from "@/lib/forms/form-stack/field-map-compatibility"
import {
  findOfficialMarkers,
  renderNonOfficialSummary,
  type NonOfficialInput,
} from "@/lib/forms/form-stack/non-official-output"
import { validatePacketRequest } from "@/lib/forms/form-stack/packet-request-schema"

export const OPERATOR_PACKET_VERSION = "cc05-2026-09-26.1"

export interface PacketHold {
  id: string
  reason: string
  owner: string
}

export const PINNED_PACKET_HOLDS: readonly PacketHold[] = deepFreeze([
  {
    id: "official_form_generation_paused",
    reason: "Official-form generation is not authorized.",
    owner: "product owner",
  },
  {
    id: "official_form_delivery_paused",
    reason: "Official-form delivery is not authorized.",
    owner: "product owner",
  },
  {
    id: "activation_dormant",
    reason: "Activation requires every PR-7 receipt plus release approval.",
    owner: "product owner",
  },
  {
    id: "no_official_current_evidence",
    reason: "No artifact is classified official_current.",
    owner: "evidence owner",
  },
  {
    id: "no_proven_field_map_binding",
    reason: "PINNED_FIELD_MAP_BINDINGS is empty.",
    owner: "evidence owner",
  },
])

/**
 * Holds a caller may ADD, by id. Fixed text; a caller can never supply reason
 * or owner strings, so no customer or contact text can ride in on a hold.
 */
export const OPTIONAL_PACKET_HOLDS: readonly PacketHold[] = deepFreeze([
  {
    id: "banner_copy_owner_review",
    reason: "The PR-5 banner and chrome copy await owner review.",
    owner: "product owner",
  },
  {
    id: "template_copy_owner_review",
    reason: "The PR-5 procedural templates await owner review.",
    owner: "product owner",
  },
  {
    id: "homoglyph_coverage_partial",
    reason: "Confusable folding covers a Cyrillic/Greek subset, not all of Unicode TR39.",
    owner: "engineering",
  },
])
export type OptionalHoldId =
  | "banner_copy_owner_review"
  | "template_copy_owner_review"
  | "homoglyph_coverage_partial"

export interface PacketTestResult {
  command: string
  status: "PASS" | "FAIL" | "NOT_RUN"
  passed: number
  failed: number
  skipped: number
}

export interface PacketRequest {
  candidateSha: string
  classificationQueries: ClassificationQuery[]
  compatibilityQueries: CompatibilityQuery[]
  nonOfficialInputs: NonOfficialInput[]
  tests: PacketTestResult[]
  /** Optional holds, by id only. Mandatory holds are always injected. */
  holdIds: OptionalHoldId[]
}

export interface PacketEntry {
  name: string
  sha256: string
  bytes: number
  content: string
}

export interface OperatorReviewPacket {
  version: string
  candidateSha: string
  builtAt: string
  delivery: "none"
  entries: PacketEntry[]
  manifestSha256: string
}

export type PacketBuild =
  | { ok: true; packet: OperatorReviewPacket }
  | { ok: false; violations: string[] }

/** Codes whose suffix is an AcroForm field name; the packet carries a digest instead. */
const FIELD_BEARING = new Set([
  "missing_critical_field",
  "missing_mapped_field",
  "unexpected_field",
  "critical_field_not_in_inventory",
  "critical_field_unmapped",
  "mapped_field_not_in_inventory",
])

function redactFieldName(reason: string): string {
  const i = reason.indexOf(":")
  if (i < 0 || !FIELD_BEARING.has(reason.slice(0, i))) return reason
  return `${reason.slice(0, i)}:field#${sha256(reason.slice(i + 1)).slice(0, 16)}`
}

function sha256(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex")
}

/** JSON with recursively sorted object keys, so equal data always hashes equal. */
export function canonicalJson(value: unknown): string {
  const sort = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(sort)
      : v && typeof v === "object"
        ? Object.fromEntries(
            Object.keys(v)
              .sort()
              .map(k => [k, sort((v as Record<string, unknown>)[k])])
          )
        : v
  return JSON.stringify(sort(value))
}

function entry(name: string, value: unknown): PacketEntry {
  const content = canonicalJson(value)
  return { name, sha256: sha256(content), bytes: Buffer.byteLength(content), content }
}

function manifestHash(p: Omit<OperatorReviewPacket, "manifestSha256">): string {
  return sha256(
    canonicalJson({
      version: p.version,
      candidateSha: p.candidateSha,
      builtAt: p.builtAt,
      delivery: p.delivery,
      entries: p.entries.map(e => ({ name: e.name, sha256: e.sha256, bytes: e.bytes })),
    })
  )
}

export function buildOperatorReviewPacket(
  req: PacketRequest,
  deps: { clock: () => Date }
): PacketBuild {
  const optionalIds = new Set(OPTIONAL_PACKET_HOLDS.map(h => h.id))
  const violations = validatePacketRequest(req, optionalIds)
  const now = deps.clock()
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) violations.push("invalid_clock")
  // Nothing below may run on a request that failed its schema.
  if (violations.length > 0) return { ok: false, violations }

  // Customer inputs are rendered and hashed, never copied.

  const artifacts = req.nonOfficialInputs.map((input, i) => {
    const r = renderNonOfficialSummary(input)
    if (!r.ok) {
      violations.push(`non_official_render_refused:${i}`)
      return null
    }
    return {
      index: i,
      kind: r.document.kind,
      version: r.document.version,
      officialForm: r.document.officialForm,
      filingReady: r.document.filingReady,
      sha256: r.document.sha256,
      bytes: Buffer.byteLength(r.document.text),
      officialMarkers: findOfficialMarkers(r.document.text),
      shape: {
        summary: input.summary.length,
        checklist: input.checklist.length,
        guidance: input.guidance.length,
      },
    }
  })
  if (violations.length > 0) return { ok: false, violations }

  // Rebuild every query from its known fields only — smuggled verdicts are dropped.
  const classification = req.classificationQueries.map(q =>
    classifySource({
      sha256: q.sha256,
      bytes: q.bytes,
      mediaType: q.mediaType,
      formId: q.formId,
      claimedClass: q.claimedClass,
    })
  )
  const compatibility = req.compatibilityQueries.map(q => {
    const a = q.artifact
    const r = checkFieldMapCompatibility({
      mappingId: q.mappingId,
      mappingVersion: q.mappingVersion,
      countyId: q.countyId,
      artifact: {
        formId: a.formId,
        path: a.path,
        sha256: a.sha256,
        bytes: a.bytes,
        mediaType: a.mediaType,
        fieldInventory: [...a.fieldInventory],
      },
    })
    return {
      mappingId: r.mappingId,
      compatible: r.compatible,
      reasons: r.reasons.map(redactFieldName),
      sourceClass: r.classification.sourceClass,
      generationAuthorized: r.generationAuthorized,
    }
  })
  const holds = [
    ...PINNED_PACKET_HOLDS,
    ...OPTIONAL_PACKET_HOLDS.filter(h => (req.holdIds as string[]).includes(h.id)),
  ]

  const body = {
    version: OPERATOR_PACKET_VERSION,
    candidateSha: req.candidateSha,
    builtAt: now.toISOString(),
    delivery: "none" as const,
    entries: [
      entry("provenance.json", reconcileIwoProvenance()),
      entry("classification.json", classification),
      entry("compatibility.json", compatibility),
      entry("non-official-artifacts.json", artifacts),
      entry(
        "tests.json",
        req.tests.map(t => ({
          command: t.command,
          status: t.status,
          passed: t.passed,
          failed: t.failed,
          skipped: t.skipped,
        }))
      ),
      entry("holds.json", holds),
    ],
  }
  return { ok: true, packet: { ...body, manifestSha256: manifestHash(body) } }
}

export function verifyOperatorReviewPacket(
  packet: OperatorReviewPacket,
  reviewedManifestSha256: string
): { valid: boolean; reasons: string[] } {
  const reasons: string[] = []
  if (packet.delivery !== "none") reasons.push("delivery_not_none")
  for (const e of packet.entries) {
    if (sha256(e.content) !== e.sha256 || Buffer.byteLength(e.content) !== e.bytes) {
      reasons.push(`entry_hash_mismatch:${e.name}`)
    }
  }
  const recomputed = manifestHash(packet)
  if (recomputed !== packet.manifestSha256) reasons.push("manifest_hash_mismatch")
  if (recomputed !== reviewedManifestSha256) reasons.push("manifest_changed_after_review")
  return { valid: reasons.length === 0, reasons }
}
