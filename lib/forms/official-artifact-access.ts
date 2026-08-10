/**
 * Guarded server-side access boundary for the federal Income Withholding for
 * Support artifact (OMB 0970-0154).
 *
 * SERVER ONLY — uses node:fs. Never import from a client component.
 *
 * Why this exists: the artifact must never be reachable through an
 * unconditional static URL. It is deliberately stored in `private/official-forms/`
 * (outside `public/`, so Next.js does not serve it) and released only through
 * this boundary, which re-validates EVERY time, immediately before returning
 * bytes or advertising availability:
 *
 *   1. county identity is canonical and known           (else refuse)
 *   2. county disposition is not manual_conditional      (else refuse)
 *   3. on-disk bytes match the pinned SHA-256 and length (else refuse)
 *   4. the printed expiration has not been reached       (else refuse)
 *   5. OMB renewal review is not outstanding             (else refuse)
 *
 * Nothing is cached: the hash is recomputed from disk on each call, so a
 * swapped or corrupted file cannot ride on an earlier success.
 */
import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"

import {
  IWO_PROVENANCE,
  getRenewalEvidence,
  validateIwo,
  type IwoRenewalEvidence,
  type IwoValidation,
} from "@/lib/forms/iwo-provenance"
import {
  IWO_NEUTRAL_COPY,
  getCountyIwoWorkflow,
  isCanonicalCountyId,
  type IwoDisposition,
} from "@/lib/counties/county-iwo-workflow"

/** Default location of the guarded artifact. Outside public/ by design. */
export const GUARDED_ARTIFACT_DIR = path.join(process.cwd(), "private", "official-forms")

export type IwoAccessRefusal =
  /** Blank, malformed, noncanonical, or unrecognized county id. */
  | "county_unknown_or_noncanonical"
  /** County handling is manual/conditional — routed to manual review. */
  | "county_manual_conditional"
  /** Federal provenance / expiration / renewal gate is closed. */
  | "federal_artifact_gate_closed"

export interface IwoAvailability {
  /** True only when every gate is open. Fail-closed default. */
  available: boolean
  refusal: IwoAccessRefusal | null
  blockers: string[]
  disposition: IwoDisposition | null
  requiresManualReview: boolean
  /** Neutral explanatory copy for the refusal, if any. */
  copy: string[]
  validation: IwoValidation | null
}

export interface GuardedArtifactInput {
  /**
   * Canonical county id the SERVER resolved for this case. Never a value taken
   * from request input — see lib/forms/authoritative-county.ts.
   */
  countyId: string
  today?: Date
  /** Override only for tests / alternate deployments. */
  artifactDir?: string
  /** Injected ONLY by test factories; product entry points never pass this. */
  renewalEvidence?: IwoRenewalEvidence
}

const REFUSAL_COPY: Record<IwoAccessRefusal, string[]> = {
  county_unknown_or_noncanonical: [
    "This form's handling depends on the county, and the county for this case has not been identified from the supported list. This item is set aside for manual review.",
  ],
  county_manual_conditional: IWO_NEUTRAL_COPY.will,
  federal_artifact_gate_closed: [
    "The federal Income Withholding for Support form (OMB 0970-0154) is not being offered right now. Its published information-collection approval is under renewal review, so Fresh Start is not distributing this version.",
    "This is procedural information about the form's federal approval status, not legal advice.",
  ],
}

/**
 * Evaluate availability WITHOUT reading or returning bytes. Use this anywhere
 * the UI needs to decide whether to advertise the form at all.
 */
export function getIwoAvailability(input: GuardedArtifactInput): IwoAvailability {
  const dir = input.artifactDir ?? GUARDED_ARTIFACT_DIR
  const today = input.today ?? new Date()

  // 1. County identity — blank / malformed / noncanonical / unknown fails closed.
  if (!isCanonicalCountyId(input.countyId)) {
    return {
      available: false,
      refusal: "county_unknown_or_noncanonical",
      blockers: ["county_unknown_or_noncanonical"],
      disposition: null,
      requiresManualReview: true,
      copy: REFUSAL_COPY.county_unknown_or_noncanonical,
      validation: null,
    }
  }

  const workflow = getCountyIwoWorkflow(input.countyId)

  // 3-5. Federal artifact gate. Evaluated for EVERY county, not just Will.
  const validation = validateIwo(dir, today, input.renewalEvidence ?? getRenewalEvidence())

  // Every failing gate is reported in `blockers`; `refusal` names the most
  // specific one. County disposition outranks the federal gate because it tells
  // the caller something the federal state never will — but both still refuse,
  // and neither can be skipped.
  const allBlockers = [...validation.blockers]
  if (workflow.disposition === "manual_conditional") allBlockers.unshift("county_manual_conditional")

  if (workflow.disposition === "manual_conditional") {
    return {
      available: false,
      refusal: "county_manual_conditional",
      blockers: allBlockers,
      disposition: workflow.disposition,
      requiresManualReview: true,
      copy: REFUSAL_COPY.county_manual_conditional,
      validation,
    }
  }

  if (validation.blockers.length > 0) {
    return {
      available: false,
      refusal: "federal_artifact_gate_closed",
      blockers: allBlockers,
      disposition: workflow.disposition,
      requiresManualReview: false,
      copy: REFUSAL_COPY.federal_artifact_gate_closed,
      validation,
    }
  }

  return {
    available: true,
    refusal: null,
    blockers: [],
    disposition: workflow.disposition,
    requiresManualReview: false,
    copy: IWO_NEUTRAL_COPY.statewide_default,
    validation,
  }
}

export type GuardedArtifactRead =
  | {
      allowed: true
      bytes: Buffer
      sha256: string
      byteLength: number
      contentType: "application/pdf"
      filename: string
    }
  | { allowed: false; refusal: IwoAccessRefusal; blockers: string[]; copy: string[] }

/**
 * Read the guarded artifact. Returns bytes ONLY when every gate is open;
 * otherwise returns zero bytes and a refusal reason.
 */
export function readGuardedIwoArtifact(input: GuardedArtifactInput): GuardedArtifactRead {
  const availability = getIwoAvailability(input)
  if (!availability.available) {
    return {
      allowed: false,
      refusal: availability.refusal!,
      blockers: availability.blockers,
      copy: availability.copy,
    }
  }

  const dir = input.artifactDir ?? GUARDED_ARTIFACT_DIR
  const filePath = path.join(dir, IWO_PROVENANCE.file)
  const bytes = fs.readFileSync(filePath)

  // Re-verify the exact bytes we are about to hand out. getIwoAvailability
  // already hashed the file; this guarantees the buffer being returned is the
  // one that was validated, even across a concurrent swap.
  const sha256 = crypto.createHash("sha256").update(bytes).digest("hex")
  if (sha256 !== IWO_PROVENANCE.expectedSha256 || bytes.length !== IWO_PROVENANCE.expectedBytes) {
    return {
      allowed: false,
      refusal: "federal_artifact_gate_closed",
      blockers: ["invalid_federal_iwo_provenance"],
      copy: REFUSAL_COPY.federal_artifact_gate_closed,
    }
  }

  return {
    allowed: true,
    bytes,
    sha256,
    byteLength: bytes.length,
    contentType: "application/pdf",
    filename: IWO_PROVENANCE.file,
  }
}

/** Reporting helper: the pinned federal provenance surfaced without bytes. */
export function describeIwoProvenance() {
  return {
    ombNumber: IWO_PROVENANCE.ombNumber,
    provenanceClass: IWO_PROVENANCE.provenanceClass,
    expiration: IWO_PROVENANCE.expiration,
    canonicalUrl: IWO_PROVENANCE.canonicalUrl,
    renewal: getRenewalEvidence(),
  }
}
