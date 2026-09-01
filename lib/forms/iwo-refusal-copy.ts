/**
 * Operative refusal codes and the approved user-visible copy for the federal
 * Income Withholding for Support artifact (OMB 0970-0154).
 *
 * SOURCE OF TRUTH FOR USER-VISIBLE STRINGS — read before editing.
 *
 * Every string in this module was approved VERBATIM by the product owner on
 * 2026-08-24 (`OWNER-COPY-APPROVAL-20260824.md`) against the controlling design
 * `COWORK-FINAL-HANDOFF-REVISION-20260824.md`
 * (sha256 b7a465b5d2501d4401aae52628d98d1f43670fd27dad9df5ea5f4e94e3ce187c),
 * with ONE exception, below. Changing a single character of any of them requires
 * a new copy review and approval.
 *
 * EXCEPTION — `federal_form_authority_expired`, first paragraph. Re-approved by
 * the product owner on 2026-09-01 as part of PR-2A, superseding the 2026-08-24
 * wording for this one string. The retired sentence read:
 *
 *   "…because the period Fresh Start is authorized to distribute the selected
 *   version has ended."
 *
 * That asserts an external authorization period ended. Under PR-2A the date that
 * closes this gate is `IWO_PROVENANCE.legacyTransitionFirstBlockedDate`, which is
 * FreshStart's own conservative derivation (one year from the OIRA approval
 * date), NOT a published ACF expiry — so the sentence claimed an agency-set fact
 * that no source states. The replacement describes only Fresh Start's own
 * conduct and asserts nothing about OMB status, any authorization window, or
 * acceptance. It must be logged against `OWNER-COPY-APPROVAL-20260824.md`.
 * Both paragraphs are pinned character-for-character by
 * `__tests__/lib/forms/iwo-refusal-copy.test.ts` and
 * `__tests__/lib/forms/iwo-omb-transition.test.ts`.
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
 *
 * PR-2A (2026-09-01) — what the two authority codes now MEAN. No approved
 * string changed; the strings were written to describe Fresh Start's own
 * conduct, and they remain true under the corrected evidence model. What
 * changed is which fact reaches them:
 *
 *   `federal_form_authority_expired` — "the period Fresh Start is authorized to
 *   distribute the selected version has ended" is now driven by
 *   `IWO_PROVENANCE.legacyTransitionFirstBlockedDate`, the first day the legacy
 *   print may no longer be distributed. It
 *   was previously driven by the date printed on the form. The sentence was
 *   accurate for the old cause and is accurate for the new one: it names an
 *   authorization period ending, and never a printed date, an OMB status, or a
 *   court outcome. Editing it would need a fresh owner copy approval; nothing
 *   here required an edit.
 *
 *   `federal_form_renewal_pending` — "Fresh Start's most recently verified
 *   federal record showed the selected version under renewal review" is now
 *   UNREACHABLE IN PRODUCTION. `PINNED_RENEWAL_EVIDENCE` is `confirmed` as of
 *   2026-09-01 (OIRA ICR 202607-0970-002), and the review window is measured
 *   against the 2029-08-31 collection expiration, so `validateIwo` cannot emit
 *   `omb_renewal_review_pending` from pinned evidence. The code and its copy are
 *   retained deliberately: it is written in the past tense about Fresh Start's
 *   own record, so it stays truthful if a future review re-pins renewal to
 *   `pending`, and tests still reach it by injecting that evidence. Deleting it
 *   would mean re-approving copy to get it back.
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
    "The federal Income Withholding for Support form (OMB 0970-0154) is not being offered right now because Fresh Start has stopped distributing the selected version of this form.",
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
