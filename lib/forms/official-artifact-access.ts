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
 *   4. the legacy transition period has not ended        (else refuse)
 *   5. OMB renewal review is not outstanding             (else refuse)
 *
 * Gate 4 is NOT the date printed on the form. PR-2A separated three dates that
 * were previously one: the printed date (display metadata), the OIRA collection
 * approval expiration (governs gate 5's review window), and the legacy
 * transition end (governs gate 4). Only the last one closes this gate, and the
 * 2029 collection approval never opens it past that date. See
 * `lib/forms/iwo-provenance.ts` and
 * `docs/legal-audit/iwo-omb-renewal-transition-2026-09-01.md`.
 *
 * Nothing is cached: the hash is recomputed from disk on each call, so a
 * swapped or corrupted file cannot ride on an earlier success.
 */
import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"

import {
  FORM_EXPIRATION_TIME_ZONE,
  IWO_PROVENANCE,
  PINNED_OIRA_APPROVAL,
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
import {
  operativeRefusalCopy,
  selectOperativeRefusal,
  type IwoOperativeRefusal,
} from "@/lib/forms/iwo-refusal-copy"

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
  /**
   * Which federal-artifact cause actually closed the gate, when one did. This
   * selects the user-visible copy; `refusal` remains the coarse identity that
   * callers and snapshots report. Null for county refusals and for the open
   * state.
   */
  operativeRefusal: IwoOperativeRefusal | null
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

/**
 * Copy for the two COUNTY refusals. The federal-artifact refusal deliberately
 * has no entry here: it no longer has one message. Its copy is selected from
 * `lib/forms/iwo-refusal-copy` by the operative cause, because the single
 * sentence that used to sit here asserted a renewal review for every cause and
 * was untrue for a missing file, a byte mismatch, and a reached expiration.
 */
const COUNTY_REFUSAL_COPY: Record<
  Exclude<IwoAccessRefusal, "federal_artifact_gate_closed">,
  string[]
> = {
  county_unknown_or_noncanonical: [
    "This form's handling depends on the county, and the county for this case has not been identified from the supported list. This item is set aside for manual review.",
  ],
  county_manual_conditional: IWO_NEUTRAL_COPY.will,
}

/**
 * Copy for a closed federal gate, chosen by the operative blocker.
 *
 * `selectOperativeRefusal` returns null only for a blocker outside
 * `validateIwo`'s vocabulary, which it cannot produce — an invariant test pins
 * that. If it ever did, this still refuses with zero bytes and says nothing
 * untrue rather than borrowing another cause's message.
 */
function federalGateCopy(operative: IwoOperativeRefusal | null): string[] {
  return operative === null ? [] : operativeRefusalCopy(operative)
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
      operativeRefusal: null,
      blockers: ["county_unknown_or_noncanonical"],
      disposition: null,
      requiresManualReview: true,
      copy: COUNTY_REFUSAL_COPY.county_unknown_or_noncanonical,
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
      operativeRefusal: null,
      blockers: allBlockers,
      disposition: workflow.disposition,
      requiresManualReview: true,
      copy: COUNTY_REFUSAL_COPY.county_manual_conditional,
      validation,
    }
  }

  if (validation.blockers.length > 0) {
    const operative = selectOperativeRefusal(validation.blockers)
    return {
      available: false,
      refusal: "federal_artifact_gate_closed",
      operativeRefusal: operative,
      blockers: allBlockers,
      disposition: workflow.disposition,
      requiresManualReview: false,
      copy: federalGateCopy(operative),
      validation,
    }
  }

  return {
    available: true,
    refusal: null,
    operativeRefusal: null,
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
  | {
      allowed: false
      refusal: IwoAccessRefusal
      operativeRefusal: IwoOperativeRefusal | null
      blockers: string[]
      copy: string[]
    }

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
      operativeRefusal: availability.operativeRefusal,
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
      // The bytes on disk changed under us between validation and read. That is
      // exactly the provenance case, and its copy says so.
      operativeRefusal: "federal_artifact_provenance_failed",
      blockers: ["invalid_federal_iwo_provenance"],
      copy: operativeRefusalCopy("federal_artifact_provenance_failed"),
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

/**
 * Reporting helper: the pinned federal provenance surfaced without bytes.
 *
 * There is deliberately no single `expiration` key. Three different dates apply
 * to this artifact and a reader who is handed one of them under a generic name
 * will act on the wrong one — which is the defect PR-2A exists to close. Each is
 * surfaced under the name of the fact it actually is.
 */
export function describeIwoProvenance() {
  return {
    ombNumber: IWO_PROVENANCE.ombNumber,
    provenanceClass: IWO_PROVENANCE.provenanceClass,
    /** What the legacy PDF has printed on it. Display metadata; gates nothing. */
    printedLegacyFormDate: IWO_PROVENANCE.printedExpirationDate,
    /** OIRA's expiration for the information collection. Never an authority to distribute. */
    collectionApprovalExpiration: IWO_PROVENANCE.collectionApprovalExpiration,
    /** The operative cutoff for distributing this legacy print. */
    legacyTransitionFirstBlockedDate: IWO_PROVENANCE.legacyTransitionFirstBlockedDate,
    /** The whole-day, fail-closed evaluation zone for the cutoff above. */
    transitionTimeZone: FORM_EXPIRATION_TIME_ZONE,
    canonicalUrl: IWO_PROVENANCE.canonicalUrl,
    oiraApproval: { ...PINNED_OIRA_APPROVAL },
    renewal: getRenewalEvidence(),
  }
}
