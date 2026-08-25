/**
 * Operative refusal codes and the approved user-visible copy for the federal
 * Income Withholding for Support artifact (OMB 0970-0154).
 *
 * SOURCE OF TRUTH FOR USER-VISIBLE STRINGS — read before editing.
 *
 * Every string in this module was approved VERBATIM by the product owner on
 * 2026-08-24 (`OWNER-COPY-APPROVAL-20260824.md`) against the controlling design
 * `COWORK-FINAL-HANDOFF-REVISION-20260824.md`
 * (sha256 b7a465b5d2501d4401aae52628d98d1f43670fd27dad9df5ea5f4e94e3ce187c).
 * Changing a single character of them requires a new copy review and approval.
 *
 * WHY THIS EXISTS: a single shared refusal sentence previously claimed that the
 * form's "published information-collection approval is under renewal review"
 * for EVERY closed-gate cause — including a missing file, a byte mismatch, and
 * a reached expiration. That sentence was untrue in three of the four cases.
 * Copy is now selected by the OPERATIVE refusal code, so a refusal states the
 * reason that actually closed the gate.
 *
 * This module deliberately depends on nothing but the blocker vocabulary. It
 * carries no filesystem, county, or policy logic, so both the access boundary
 * and the county workflow can import it without a cycle.
 */

/**
 * The four operative causes a federal-artifact refusal can have. This is a
 * COPY-SELECTION code, deliberately finer-grained than `IwoAccessRefusal`:
 * `federal_artifact_gate_closed` remains the coarse refusal identity that
 * callers, snapshots, and the 403 body report.
 */
export type IwoOperativeRefusal =
  | "federal_form_authority_expired"
  | "federal_form_renewal_pending"
  | "federal_artifact_provenance_failed"
  | "federal_artifact_missing"

/** Approved refusal copy, keyed by operative code. Paragraph order is fixed. */
export const IWO_OPERATIVE_REFUSAL_COPY: Record<IwoOperativeRefusal, readonly string[]> = {
  federal_form_authority_expired: [
    "The federal Income Withholding for Support form (OMB 0970-0154) is not being offered right now because the period Fresh Start is authorized to distribute the selected version has ended.",
    "Fresh Start is not able to tell you whether a court, clerk, or employer will accept a particular version of this form. This is procedural information about what Fresh Start distributes, not legal advice.",
  ],
  federal_form_renewal_pending: [
    "The federal Income Withholding for Support form (OMB 0970-0154) is not being offered right now because Fresh Start's most recently verified federal record showed the selected version under renewal review.",
    "Fresh Start is not able to tell you whether a court, clerk, or employer will accept a particular version of this form. This is procedural information about what Fresh Start distributes, not legal advice.",
  ],
  federal_artifact_provenance_failed: [
    "The federal Income Withholding for Support form (OMB 0970-0154) is not being offered right now because the stored file does not match Fresh Start's verified federal copy.",
    "Fresh Start will not distribute an unverified file. This is procedural information about what Fresh Start distributes, not legal advice.",
  ],
  federal_artifact_missing: [
    "The federal Income Withholding for Support form (OMB 0970-0154) is not being offered right now because Fresh Start's verified federal file is unavailable.",
    "Fresh Start will not distribute a missing or substitute file. This is procedural information about what Fresh Start distributes, not legal advice.",
  ],
}

/**
 * Blocker -> operative code, in fail-closed precedence order.
 *
 * Precedence is ARTIFACT INTEGRITY BEFORE AUTHORITY WINDOW: if we do not hold a
 * verified copy of the file, we cannot truthfully describe which version's
 * authorization window closed. Both statements may be true at once (an absent
 * file on an expired date); the integrity statement is the one that is true
 * unconditionally, so it is reported.
 */
const OPERATIVE_PRECEDENCE: ReadonlyArray<readonly [string, IwoOperativeRefusal]> = [
  ["missing_federal_iwo", "federal_artifact_missing"],
  ["invalid_federal_iwo_provenance", "federal_artifact_provenance_failed"],
  ["federal_iwo_expired", "federal_form_authority_expired"],
  ["omb_renewal_review_pending", "federal_form_renewal_pending"],
]

/**
 * Select the operative refusal for a set of `validateIwo` blockers.
 *
 * Returns null when no federal-artifact blocker is present — the caller is then
 * refusing for a county reason, or not refusing at all. Callers must NOT
 * substitute a default code: an unrecognized blocker set must not silently
 * borrow another cause's copy.
 */
export function selectOperativeRefusal(
  blockers: readonly string[],
): IwoOperativeRefusal | null {
  for (const [blocker, code] of OPERATIVE_PRECEDENCE) {
    if (blockers.includes(blocker)) return code
  }
  return null
}

/** The approved copy block for an operative refusal. */
export function operativeRefusalCopy(code: IwoOperativeRefusal): string[] {
  return [...IWO_OPERATIVE_REFUSAL_COPY[code]]
}

/**
 * Approved `00_WITHHELD_ITEMS.txt` disclosure. The bracketed slot is filled with
 * the FIRST (reason) paragraph of the selected refusal block; that paragraph
 * already ends in a period, so it replaces the slot's own terminating period
 * rather than doubling it. Both approved strings are otherwise verbatim.
 */
const WITHHELD_ITEMS_TEMPLATE =
  "Income Withholding for Support form (OMB 0970-0154) — withheld from this package. Reason: [insert the exact refusal message selected above]. No federal IWO file was included. Fresh Start is not able to tell you whether a court, clerk, or employer will accept a particular version. This is procedural information about what Fresh Start distributes, not legal advice."

const WITHHELD_ITEMS_REASON_SLOT =
  "[insert the exact refusal message selected above]."

/** The exact `00_WITHHELD_ITEMS.txt` disclosure for an operative refusal. */
export function withheldItemsNotice(code: IwoOperativeRefusal): string[] {
  const reason = IWO_OPERATIVE_REFUSAL_COPY[code][0]
  return [WITHHELD_ITEMS_TEMPLATE.replace(WITHHELD_ITEMS_REASON_SLOT, reason)]
}
