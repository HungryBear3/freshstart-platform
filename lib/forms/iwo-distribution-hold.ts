/**
 * Open-path disclosure hold for the federal Income Withholding for Support
 * artifact (OMB 0970-0154).
 *
 * READ THE NEXT PARAGRAPH BEFORE TOUCHING THIS FILE.
 *
 * THIS IS NOT AN EXPIRY, AN OMB STATUS, OR AN AGENCY ACTION, and no code,
 * comment, log line, refusal code, or user-visible string may describe it as
 * one. The pinned federal evidence is unchanged and remains open: OIRA concluded
 * ICR 202607-0970-002 on 2026-08-25 and approved the collection without change
 * through 2029-08-31; the legacy print's own transition boundary is 2027-08-25;
 * the on-disk bytes still match the pinned SHA-256. All of that lives in
 * `lib/forms/iwo-provenance.ts` and is deliberately not touched here.
 *
 * WHAT THIS IS: Fresh Start's own release decision, held closed pending owner
 * approval of exact disclosure wording for the SUCCESSFUL path.
 *
 * Why it is needed. Every refusal path already tells the customer something.
 * The successful path told them nothing — and on the successful path Fresh Start
 * hands over the LEGACY ACF print, which has "Expiration Date: 08/31/2026"
 * printed on its face (a date now in the past) and for which an approved revised
 * successor exists. Both facts are true, neither is disclosed, and a customer
 * receiving that file has no way to know either. The gate model was complete for
 * every case except the one where a file actually reaches a person.
 *
 * Why the hold rather than a disclosure. The exact public wording is owner-gated
 * copy. Writing it here would be inventing customer-facing legal-adjacent text,
 * and reusing an existing approved string would apply an approval that was
 * granted for a different cause. So distribution fails closed and says nothing,
 * and the proposed exact wording sits UNAPPROVED and unwired in
 * `docs/legal-audit/iwo-open-path-disclosure-copy-decision-2026-09-05.md`.
 *
 * How it clears. The owner approves one exact variant, it is added to the
 * approved-copy module with a ledger entry, and `status` moves to `approved`
 * here in the same change. There is deliberately no environment variable, no
 * runtime toggle, and no product entry point that accepts an override: like
 * `PINNED_RENEWAL_EVIDENCE`, the only way to move it is to edit this constant.
 *
 * This module imports nothing, so every gate — access boundary, packet
 * composer, package guard — can consult it without a cycle.
 */

/**
 * Owner approval state for the exact OPEN-PATH disclosure copy.
 *
 * `pending` is the fail-closed default and the only state the pinned constant
 * has ever held.
 */
export interface IwoOpenPathDisclosureApproval {
  status: "pending" | "approved"
  /** Chicago calendar date the exact wording was requested from the owner. */
  requestedOn: string
  /** In-repo artifact carrying the proposed exact variants. */
  decisionRecord: string
  /** In-repo pending ledger entry. Records a request; never an approval. */
  ledgerRecord: string
}

const PINNED_OPEN_PATH_DISCLOSURE_APPROVAL: IwoOpenPathDisclosureApproval = {
  status: "pending",
  requestedOn: "2026-09-05",
  decisionRecord: "docs/legal-audit/iwo-open-path-disclosure-copy-decision-2026-09-05.md",
  ledgerRecord: "docs/legal-audit/iwo-copy-approval-ledger.md",
}

/**
 * The single refusal/blocker identity for this hold.
 *
 * Named for the thing that is actually missing — an approved disclosure — and
 * deliberately containing no word that could be read as an expiry, an OMB
 * status, or an agency determination.
 */
export const IWO_OPEN_PATH_DISCLOSURE_REFUSAL = "open_path_disclosure_unapproved" as const

export type IwoOpenPathDisclosureRefusal = typeof IWO_OPEN_PATH_DISCLOSURE_REFUSAL

/** The pinned state, copied so a caller cannot mutate it. */
export function getOpenPathDisclosureApproval(): IwoOpenPathDisclosureApproval {
  return { ...PINNED_OPEN_PATH_DISCLOSURE_APPROVAL }
}

/**
 * Is distribution held?
 *
 * Fail-closed on anything that is not an explicit `approved`, including
 * `undefined` — a caller that forgets to thread the state gets the hold, not the
 * open path.
 */
export function isOpenPathDisclosureHeld(
  approval: IwoOpenPathDisclosureApproval | undefined = PINNED_OPEN_PATH_DISCLOSURE_APPROVAL,
): boolean {
  return approval?.status !== "approved"
}
