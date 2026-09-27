/**
 * CC-05 PR-7 — dormant activation state machine.
 *
 * Models the four independent receipts any official-form activation would need,
 * in order:
 *
 *   1. owner_approval
 *   2. authoritative_current_form_evidence  (an `official_current` artifact)
 *   3. independent_exact_sha_review         (reviewer is not the author)
 *   4. release_approval
 *
 * Every receipt must be bound to the exact commit SHA and the exact operator
 * review packet manifest (PR-6) under evaluation, be fresh against an injected
 * clock, and match a digest in `TRUSTED_RECEIPT_REGISTRY`. That registry is
 * EMPTY and frozen — no receipt verifies in this snapshot.
 *
 * The terminal state is unreachable by construction. With all four receipts
 * verified (possible only with an injected registry, in tests) the machine
 * stops at `release_approved_compiled_off`, because `ACTIVATION_COMPILED_OFF`
 * is a `true` constant and every output flag is the literal `false`. There is no
 * parameter, environment variable or registry entry that turns anything on:
 * environment flags are only inspected, and any enabling or malformed value
 * holds the machine at `held_flag_anomaly`.
 *
 * Nothing here is wired to a route, flag, build or deploy.
 */
import crypto from "node:crypto"

import { calendarDateInTimeZone, FORM_EXPIRATION_TIME_ZONE } from "@/lib/forms/iwo-provenance"
import { deepFreeze } from "@/lib/forms/form-stack/provenance-ledger"
import { parseStrictIsoDate } from "@/lib/forms/form-stack/strict-date"
import { canonicalJson } from "@/lib/forms/form-stack/operator-review-packet"
import {
  SOURCE_CATALOG,
  classifySource,
  type ClassifiedSource,
} from "@/lib/forms/form-stack/source-classification"

export const ACTIVATION_COMPILED_OFF = true as const

export const ACTIVATION_GATES = deepFreeze([
  "owner_approval",
  "authoritative_current_form_evidence",
  "independent_exact_sha_review",
  "release_approval",
] as const)
export type GateId = (typeof ACTIVATION_GATES)[number]

const STATES = [
  "dormant",
  "owner_approved",
  "current_evidence_pinned",
  "exact_sha_reviewed",
  "release_approved_compiled_off",
] as const
export type ActivationState = (typeof STATES)[number] | "held_flag_anomaly"

/** receiptId -> SHA-256 of the receipt's canonical JSON. Empty: nothing is trusted. */
export const TRUSTED_RECEIPT_REGISTRY: Readonly<Record<string, string>> = deepFreeze({})

export const MAX_RECEIPT_AGE_DAYS = 30

export const ACTIVATION_FLAG_NAMES = deepFreeze([
  "FS_OFFICIAL_FORMS_ENABLED",
  "FS_OFFICIAL_FORM_GENERATION",
  "FS_OFFICIAL_FORM_DELIVERY",
  "FS_FORM_STACK_ACTIVATION",
] as const)

export interface GateReceipt {
  gate: GateId
  receiptId: string
  issuedBy: string
  issuedOn: string
  boundCommitSha: string
  boundPacketManifestSha256: string
  evidenceArtifactSha256: string | null
}

export interface ActivationSubject {
  commitSha: string
  packetManifestSha256: string
  author: string
}

export interface GateResult {
  gate: GateId
  satisfied: boolean
  reasons: string[]
}

export interface ActivationEvaluation {
  state: ActivationState
  active: false
  generationEnabled: false
  deliveryEnabled: false
  routeEnabled: false
  terminalActivationReachable: false
  gates: GateResult[]
  anomalies: string[]
}

export function receiptDigest(r: GateReceipt): string {
  return crypto.createHash("sha256").update(canonicalJson(r)).digest("hex")
}

/** Flags can only be reported. No value of any flag enables anything. */
export function inspectActivationFlags(env: Record<string, string | undefined>): string[] {
  const out: string[] = []
  for (const name of ACTIVATION_FLAG_NAMES) {
    const raw = env[name]
    if (raw === undefined) continue
    const v = raw.trim().toLowerCase()
    if (v === "" || v === "false" || v === "0" || v === "off") continue
    if (["true", "1", "on", "yes", "enabled"].includes(v))
      out.push(`unexpected_enable_flag:${name}`)
    else out.push(`malformed_flag:${name}`)
  }
  return out
}

function checkReceipt(
  gate: GateId,
  candidates: GateReceipt[],
  subject: ActivationSubject,
  today: string,
  deps: { registry: Readonly<Record<string, string>>; catalog: readonly ClassifiedSource[] }
): GateResult {
  const reasons: string[] = []
  if (candidates.length === 0) return { gate, satisfied: false, reasons: ["missing_receipt"] }
  if (candidates.length > 1) reasons.push("duplicate_receipt")
  const r = candidates[0]

  const wellFormed =
    typeof r.receiptId === "string" &&
    r.receiptId.length > 0 &&
    typeof r.issuedBy === "string" &&
    r.issuedBy.length > 0 &&
    parseStrictIsoDate(r.issuedOn) !== null &&
    /^[0-9a-f]{40}$/.test(r.boundCommitSha) &&
    /^[0-9a-f]{64}$/.test(r.boundPacketManifestSha256)
  if (!wellFormed) return { gate, satisfied: false, reasons: [...reasons, "malformed_receipt"] }

  if (deps.registry[r.receiptId] !== receiptDigest(r)) reasons.push("untrusted_receipt")
  if (r.boundCommitSha !== subject.commitSha) reasons.push("receipt_bound_to_different_sha")
  if (r.boundPacketManifestSha256 !== subject.packetManifestSha256)
    reasons.push("receipt_bound_to_different_packet")

  // `issuedOn` was validated above, before any trust check. An invalid clock
  // yields no day at all, which can never count as fresh.
  const todayDay = parseStrictIsoDate(today)
  if (todayDay === null) {
    reasons.push("invalid_clock")
  } else {
    const age = todayDay - parseStrictIsoDate(r.issuedOn)!
    if (age < 0) reasons.push("future_dated_receipt")
    if (age > MAX_RECEIPT_AGE_DAYS) reasons.push("stale_receipt")
  }

  if (gate === "independent_exact_sha_review" && r.issuedBy === subject.author) {
    reasons.push("review_not_independent")
  }
  if (gate === "authoritative_current_form_evidence") {
    // R7: re-classified through PR-3, so main's catalog must corroborate it too.
    const hit = deps.catalog.filter(e => e.sha256 === r.evidenceArtifactSha256)
    const cls =
      hit.length === 1
        ? classifySource(
            {
              sha256: hit[0].sha256,
              bytes: hit[0].bytes,
              mediaType: hit[0].mediaType,
              formId: hit[0].formId,
            },
            deps.catalog
          ).sourceClass
        : "unknown"
    if (cls !== "official_current") reasons.push(`evidence_not_official_current:${cls}`)
  }
  return { gate, satisfied: reasons.length === 0, reasons }
}

export function evaluateActivation(
  input: {
    subject: ActivationSubject
    receipts: GateReceipt[]
    env: Record<string, string | undefined>
  },
  deps: {
    clock: () => Date
    registry?: Readonly<Record<string, string>>
    catalog?: readonly ClassifiedSource[]
  }
): ActivationEvaluation {
  const resolved = {
    registry: deps.registry ?? TRUSTED_RECEIPT_REGISTRY,
    catalog: deps.catalog ?? SOURCE_CATALOG,
  }
  const now = deps.clock()
  const anomalies = inspectActivationFlags(input.env)
  if (Number.isNaN(now.getTime())) anomalies.push("invalid_clock")
  const today = Number.isNaN(now.getTime())
    ? "0000-00-00"
    : calendarDateInTimeZone(now, FORM_EXPIRATION_TIME_ZONE)

  const gates = ACTIVATION_GATES.map(g =>
    checkReceipt(
      g,
      input.receipts.filter(r => r.gate === g),
      input.subject,
      today,
      resolved
    )
  )

  // Ordered: a gate counts only if every earlier gate is satisfied too.
  let reached = 0
  while (reached < gates.length && gates[reached].satisfied) reached++

  // STATES has no active member: `reached === 4` maps to a compiled-off state.
  const state: ActivationState = anomalies.length > 0 ? "held_flag_anomaly" : STATES[reached]

  return {
    state,
    active: false,
    generationEnabled: false,
    deliveryEnabled: false,
    routeEnabled: false,
    terminalActivationReachable: false,
    gates,
    anomalies,
  }
}
