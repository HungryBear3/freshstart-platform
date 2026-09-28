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
 *   - SCHEMA-COMPLETE (B1). A hash proves consistency, not completeness. The
 *     verifier requires exactly the six entries in order, the pinned version,
 *     a lowercase 40-hex candidate SHA, and canonical bytes for every entry,
 *     and parses each entry against its closed schema — so a forger who
 *     re-hashes consistently can neither drop evidence nor add free text.
 *   - PII-MINIMIZED. Non-official artifacts appear by hash and shape only —
 *     never their text. Every other request field is checked against a closed,
 *     length-bounded schema (R3, `packet-request-schema.ts`); holds and test
 *     runs are ids from fixed catalogs, never caller text (B2); AcroForm field
 *     names appear in compatibility reasons only as digests; violations never
 *     echo a value.
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
import { list, shape, isString, leaf, type Report } from "@/lib/forms/form-stack/closed-schema"
import { ENTRY_SCHEMAS, FIELD_BEARING_REASONS } from "@/lib/forms/form-stack/packet-entry-schema"
import {
  COMMIT_SHA,
  PACKET_TEST_CATALOG,
  SHA256,
  parsePacketRequest,
  type PacketTestId,
} from "@/lib/forms/form-stack/packet-request-schema"
import { parseStrictUtcTimestamp } from "@/lib/forms/form-stack/strict-date"

export const OPERATOR_PACKET_VERSION = "cc05-2026-09-26.1"

/** B1: the complete entry contract, in order. Nothing more, nothing less. */
export const OPERATOR_PACKET_ENTRY_NAMES = deepFreeze([
  "provenance.json",
  "classification.json",
  "compatibility.json",
  "non-official-artifacts.json",
  "tests.json",
  "holds.json",
] as const)

export interface PacketHold {
  id: string
  reason: string
  owner: string
}

/**
 * R8: the holds every packet carries, whoever builds it. The builder injects
 * them, the manifest binds their ids, and the verifier re-checks their exact
 * text — so a caller cannot omit one and a forger who re-hashes every entry
 * consistently still cannot remove or reword one. Lifting any of them is a
 * reviewed code change here, never a request field.
 */
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
    reason: "No field map is proven against a pinned artifact (main and PR-4 both empty).",
    owner: "evidence owner",
  },
  {
    id: "pr5_copy_content_approval_pending",
    reason: "PR-5 banner, chrome and template copy have no owner approval.",
    owner: "product owner",
  },
  {
    id: "independent_exact_sha_review_pending",
    reason: "No independent exact-SHA review of this candidate has passed.",
    owner: "reviewer",
  },
  {
    id: "release_activation_approval_pending",
    reason: "No release or activation approval exists.",
    owner: "product owner",
  },
])

export const MANDATORY_PACKET_HOLD_IDS: readonly string[] = deepFreeze(
  PINNED_PACKET_HOLDS.map(h => h.id)
)

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

/** B2: a run is named by id; its display command is pinned in `PACKET_TEST_CATALOG`. */
export interface PacketTestResult {
  testId: PacketTestId
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
  /** R8: bound into the manifest; must equal `MANDATORY_PACKET_HOLD_IDS`. */
  mandatoryHoldIds: readonly string[]
  entries: PacketEntry[]
  manifestSha256: string
}

export type PacketBuild =
  | { ok: true; packet: OperatorReviewPacket }
  | { ok: false; violations: string[] }

/** Field-bearing reasons carry a digest of the AcroForm field name instead of the name. */
function redactFieldName(reason: string): string {
  const i = reason.indexOf(":")
  if (i < 0 || !FIELD_BEARING_REASONS.has(reason.slice(0, i))) return reason
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

/** The manifest hash of a packet body. Exported so verifiers can recompute it. */
export function computeManifestSha256(p: Omit<OperatorReviewPacket, "manifestSha256">): string {
  return sha256(
    canonicalJson({
      version: p.version,
      candidateSha: p.candidateSha,
      builtAt: p.builtAt,
      delivery: p.delivery,
      mandatoryHoldIds: p.mandatoryHoldIds,
      entries: p.entries.map(e => ({ name: e.name, sha256: e.sha256, bytes: e.bytes })),
    })
  )
}

export function buildOperatorReviewPacket(
  req: PacketRequest,
  deps: { clock: () => Date }
): PacketBuild {
  const optionalIds = new Set(OPTIONAL_PACKET_HOLDS.map(h => h.id))
  const parsed = parsePacketRequest(req as unknown, optionalIds)
  const violations = parsed.ok ? [] : parsed.violations
  const now = deps.clock()
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) violations.push("invalid_clock")
  // Nothing below may run on a request that failed its schema, and everything
  // below reads the parsed copy, never the caller's object.
  if (!parsed.ok || violations.length > 0) return { ok: false, violations }
  req = parsed.value

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
    mandatoryHoldIds: [...MANDATORY_PACKET_HOLD_IDS],
    entries: [
      entry("provenance.json", reconcileIwoProvenance()),
      entry("classification.json", classification),
      entry("compatibility.json", compatibility),
      entry("non-official-artifacts.json", artifacts),
      entry(
        "tests.json",
        req.tests.map(t => ({
          testId: t.testId,
          command: PACKET_TEST_CATALOG[t.testId],
          status: t.status,
          passed: t.passed,
          failed: t.failed,
          skipped: t.skipped,
        }))
      ),
      entry("holds.json", holds),
    ],
  }
  const packet = { ...body, manifestSha256: computeManifestSha256(body) }
  // The builder refuses to hand out a packet its own verifier would reject.
  const self = verifyOperatorReviewPacket(packet, packet.manifestSha256)
  if (!self.valid) return { ok: false, violations: self.reasons }
  return { ok: true, packet }
}

/** R8: every mandatory hold present with its exact pinned text. */
function mandatoryHoldDefects(packet: ShapedPacket, holds: unknown): string[] {
  const out: string[] = []
  const ids = packet.mandatoryHoldIds
  if (
    ids.length !== MANDATORY_PACKET_HOLD_IDS.length ||
    ids.some((id, i) => id !== MANDATORY_PACKET_HOLD_IDS[i])
  ) {
    out.push("mandatory_hold_set_mismatch")
  }
  if (holds === MISSING) return [...out, "holds_entry_missing"]
  if (!Array.isArray(holds)) return [...out, "holds_entry_malformed"]
  for (const pinned of PINNED_PACKET_HOLDS) {
    const found = holds.filter(h => h && typeof h === "object" && h.id === pinned.id)
    if (found.length === 0) out.push(`mandatory_hold_missing:${pinned.id}`)
    else if (
      found.length > 1 ||
      found[0].reason !== pinned.reason ||
      found[0].owner !== pinned.owner
    ) {
      out.push(`mandatory_hold_altered:${pinned.id}`)
    }
  }
  return out
}

const HOLD_CATALOG = [...PINNED_PACKET_HOLDS, ...OPTIONAL_PACKET_HOLDS]

/**
 * B1: holds.json is the pinned holds in order, then catalog optional holds in
 * catalog order, each with its exact text. Nothing else.
 */
function readHolds(v: unknown, path: string, report: Report): void {
  const holds = list(
    shape({ id: leaf(isString), owner: leaf(isString), reason: leaf(isString) }),
    HOLD_CATALOG.length
  )(v, path, report)
  if (!holds) return
  let last = -1
  holds.forEach((h, i) => {
    const hold = h as PacketHold | null
    const at = HOLD_CATALOG.findIndex(c => c.id === hold?.id)
    const c = HOLD_CATALOG[at]
    if (at < 0 || hold?.reason !== c.reason || hold?.owner !== c.owner) {
      report(`${path}[${i}]`, "not_a_catalog_hold")
    } else if (at <= last) {
      report(`${path}[${i}]`, "out_of_catalog_order")
    }
    if (at >= 0) last = Math.max(last, at)
  })
}

const MISSING = Symbol("missing")

interface ShapedPacket {
  version: string
  candidateSha: string
  builtAt: string
  delivery: string
  mandatoryHoldIds: string[]
  entries: PacketEntry[]
  manifestSha256: string
}

const PACKET_SHAPE = shape({
  version: leaf(isString),
  candidateSha: leaf(isString),
  builtAt: leaf(isString),
  delivery: leaf(isString),
  mandatoryHoldIds: list(leaf(isString), MANDATORY_PACKET_HOLD_IDS.length * 2),
  entries: list(
    shape({
      name: leaf(isString),
      sha256: leaf(isString),
      bytes: leaf(v => (Number.isSafeInteger(v) && (v as number) >= 0 ? null : "out_of_range")),
      content: leaf(isString),
    }),
    OPERATOR_PACKET_ENTRY_NAMES.length * 2
  ),
  manifestSha256: leaf(isString),
})

/**
 * B1 entry-name contract: every required name exactly once, in order, and no
 * other. An unknown name is reported by index — it may be attacker text.
 */
function entryNameDefects(names: string[]): string[] {
  const out: string[] = []
  const required: readonly string[] = OPERATOR_PACKET_ENTRY_NAMES
  names.forEach((n, i) => {
    if (!required.includes(n)) out.push(`entry_unknown:${i}`)
  })
  for (const n of required) {
    const count = names.filter(x => x === n).length
    if (count === 0) out.push(`entry_missing:${n}`)
    if (count > 1) out.push(`entry_duplicate:${n}`)
  }
  if (out.length === 0 && names.some((n, i) => n !== required[i])) out.push("entry_order_mismatch")
  return out
}

/**
 * Verify a packet against the reviewed manifest hash. Three phases, in order:
 *
 *   A. SHAPE — own data fields only, exact keys, dense lists, correct types.
 *      Nothing is hashed or parsed until this passes; a failure returns here.
 *   B. CONTRACT — pinned version, lowercase 40-hex candidate SHA, delivery
 *      none, canonical builtAt, the exact entry-name list, and for every entry:
 *      valid JSON, canonical bytes, and its closed schema; the R8 holds.
 *   C. INTEGRITY — every entry hash and length, then the manifest, recomputed
 *      from the shaped copy, and compared with the reviewed hash.
 *
 * Reasons are codes; none carries a value from the packet.
 */
export function verifyOperatorReviewPacket(
  packet: unknown,
  reviewedManifestSha256: string
): { valid: boolean; reasons: string[] } {
  const reasons: string[] = []
  const report: Report = (path, code) =>
    reasons.push(`packet_invalid:${path.replace(/^packet\./, "")}:${code}`)

  // A. SHAPE
  const shaped = PACKET_SHAPE(packet, "packet", report) as ShapedPacket | null
  if (!shaped || reasons.length > 0) {
    return {
      valid: false,
      reasons: reasons.length ? reasons : ["packet_invalid:packet:not_object"],
    }
  }
  const p = shaped

  // B. CONTRACT
  if (p.version !== OPERATOR_PACKET_VERSION) reasons.push("packet_version_mismatch")
  if (!COMMIT_SHA.test(p.candidateSha)) reasons.push("malformed_candidate_sha")
  if (p.delivery !== "none") reasons.push("delivery_not_none")
  if (parseStrictUtcTimestamp(p.builtAt) === null) reasons.push("malformed_built_at")
  if (!SHA256.test(p.manifestSha256)) reasons.push("malformed_manifest_sha256")
  reasons.push(...entryNameDefects(p.entries.map(e => e.name)))

  const unique = OPERATOR_PACKET_ENTRY_NAMES.filter(
    n => p.entries.filter(e => e.name === n).length === 1
  )
  let holds: unknown = MISSING
  for (const name of unique) {
    const e = p.entries.find(x => x.name === name)!
    let body: unknown
    try {
      body = JSON.parse(e.content)
    } catch {
      reasons.push(`entry_malformed_json:${name}`)
      if (name === "holds.json") holds = undefined
      continue
    }
    if (canonicalJson(body) !== e.content) reasons.push(`entry_noncanonical:${name}`)
    const schemaReport: Report = (path, code) =>
      reasons.push(`entry_schema_invalid:${name}:${path}:${code}`)
    if (name === "provenance.json") {
      if (e.content !== canonicalJson(reconcileIwoProvenance())) {
        schemaReport("", "not_pinned_value")
      }
    } else if (name === "holds.json") {
      holds = body
      readHolds(body, "", schemaReport)
    } else {
      ENTRY_SCHEMAS[name](body, "", schemaReport)
    }
  }
  reasons.push(...mandatoryHoldDefects(p, holds))

  // C. INTEGRITY
  for (const e of p.entries) {
    if (
      !SHA256.test(e.sha256) ||
      sha256(e.content) !== e.sha256 ||
      Buffer.byteLength(e.content) !== e.bytes
    ) {
      const known = (OPERATOR_PACKET_ENTRY_NAMES as readonly string[]).includes(e.name)
      reasons.push(`entry_hash_mismatch:${known ? e.name : `#${p.entries.indexOf(e)}`}`)
    }
  }
  const recomputed = computeManifestSha256(p as OperatorReviewPacket)
  if (recomputed !== p.manifestSha256) reasons.push("manifest_hash_mismatch")
  if (recomputed !== reviewedManifestSha256) reasons.push("manifest_changed_after_review")
  return { valid: reasons.length === 0, reasons }
}
