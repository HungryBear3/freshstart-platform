/**
 * Federal Income Withholding for Support (IWO) provenance + currentness gate.
 *
 * PROVENANCE OF THIS MODULE — read before editing.
 * This is an ADAPTED FORK of the IWO hunk of `scripts/verify-form-field-mappings.ts`
 * as it exists on branch `fs-pricing-value-over-free` (and
 * `codex/fs-structured-intake-cleanbase-20260727`). It is NOT verbatim.
 *
 * Carried unchanged from that source: the pinned identity constants
 * (file, provenanceClass, ombNumber, expiration, canonicalUrl, expectedSha256,
 * expectedBytes, companionAuthority, excludedStaleVariant, renewalReviewWindowDays),
 * the hash/byte provenance check, and the blocker vocabulary. The pinned
 * SHA-256 and byte length were re-verified against the actual PDF carried into
 * this branch and against `docs/legal-audit/iwo-federal-provenance-2026-07-21.json`.
 *
 * DELIBERATE POLICY DELTAS from the source (each a controller decision):
 *   1. Expiration is evaluated on the America/Chicago CALENDAR DATE and fails
 *      closed for the whole expiration day (`localDate >= expiration`). The
 *      source used a `2026-08-31T23:59:59Z` instant cutoff. This adopts the
 *      stricter `cc/fs-iwo-artifact-guard-20260805` policy.
 *   2. `computeLaunchReadiness` no longer accepts an `ombRenewalReview` caller
 *      override; renewal is pinned evidence threaded as a dependency.
 *   3. Renewal state moved OUT of IWO_PROVENANCE into PINNED_RENEWAL_EVIDENCE,
 *      so there is exactly one source of truth.
 *   4. The artifact path is the guarded `private/official-forms/`, never
 *      `public/forms/`; `computeLaunchReadiness` takes a separate
 *      `iwoArtifactDir` for it.
 *   5. PR-2A (2026-09-01): the single `expiration` field is retired. Three
 *      DIFFERENT facts are now modelled under three different names, because
 *      collapsing them into one date is what made the gate refuse for a reason
 *      that had stopped being true:
 *        - `printedExpirationDate` (2026-08-31) — the date printed on the
 *          legacy PDF. DISPLAY METADATA. Never an operative cutoff.
 *        - `collectionApprovalExpiration` (2029-08-31) — OIRA's expiration for
 *          information collection 0970-0154. Governs when a renewal review is
 *          next due. It NEVER authorizes the legacy artifact.
 *        - `legacyTransitionFirstBlockedDate` (2027-08-25) — the FIRST Chicago
 *          calendar day on which the legacy print may no longer be distributed.
 *          This, and only this, is the operative cutoff. The name says "first
 *          blocked" rather than "end" on purpose: an "end date" reads as either
 *          the last allowed day or the first disallowed one, and the gate has to
 *          be unambiguous about which. The last ALLOWED day is 2027-08-24.
 *      See `docs/legal-audit/iwo-omb-renewal-transition-2026-09-01.md`.
 *
 * Only the IWO hunk was forked. The mapping-verification half of that script
 * depends on `getStructuralMapping` / `isActiveMapping`, which do not exist in
 * this branch's `lib/document-generation/official-forms/field-mappings.ts`;
 * importing them would have pulled in unrelated mapping/intake changes.
 *
 * This module is server-side only (node:fs). Do not import it into a client
 * component.
 */
import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"

/**
 * The operative cutoff is evaluated against the calendar date in this zone and
 * fails closed for the WHOLE cutoff day — matching the artifact-guard slice
 * (`cc/fs-iwo-artifact-guard-20260805`). For the pinned 2027-08-25 legacy
 * transition end the cutoff instant is 2027-08-25T05:00:00Z (00:00 CDT) and the
 * last allowed instant is 2027-08-25T04:59:59.999Z.
 *
 * The date the whole-day rule is applied TO changed in PR-2A: it is the legacy
 * transition end, no longer the date printed on the form. The rule itself is
 * unchanged.
 */
export const FORM_EXPIRATION_TIME_ZONE = "America/Chicago"

/** Calendar date (YYYY-MM-DD) for an instant, in the given IANA zone. */
export function calendarDateInTimeZone(at: Date, timeZone: string): string {
  // en-CA renders ISO-style YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at)
}

function wholeDaysBetweenDates(fromIsoDate: string, toIsoDate: string): number {
  return Math.round(
    (Date.parse(`${toIsoDate}T00:00:00Z`) - Date.parse(`${fromIsoDate}T00:00:00Z`)) / 86_400_000,
  )
}

// ── Federal Income Withholding for Support (IWO) provenance ────────────────────
// This is a FEDERAL OMB form, NOT an AOIC/ATJ form and NOT HFS 3683. It is keyed
// by OMB number + expiration, with deterministic renewal/expiry monitoring, so a
// re-issued federal print can be re-pinned without a code change. A file merely
// named income-withholding-order.pdf can NEVER clear the gate: it must match the
// verified SHA-256 below (which excludes the stale HFS 3683 R-8-09 exp 10/31/2010
// variant, any HTML-saved-as-pdf, mirror, or generated form).
export const IWO_PROVENANCE = {
  file: 'income-withholding-order.pdf',
  provenanceClass: 'federal-omb' as const,
  ombNumber: '0970-0154',
  /**
   * DISPLAY METADATA ONLY — the date printed on the legacy artifact
   * ("Expiration Date: 08/31/2026").
   *
   * Do NOT gate on this. OCSE moved the printed expiration off the revised form
   * precisely because readers were treating a printed date as a termination
   * date; FreshStart made the same mistake in code. The artifact's authority is
   * `legacyTransitionFirstBlockedDate`; the collection's approval is
   * `collectionApprovalExpiration`. This value is carried so provenance
   * reporting can still say what the paper in hand says.
   */
  printedExpirationDate: '2026-08-31',
  /**
   * OIRA's expiration for information collection 0970-0154, from the pinned
   * Notice of Action (see PINNED_OIRA_APPROVAL).
   *
   * This governs when the next RENEWAL REVIEW is due. It is deliberately never
   * consulted when deciding whether the legacy artifact may still be
   * distributed: an approval that runs to 2029 does not extend a legacy print
   * whose transition period ends in 2027.
   */
  collectionApprovalExpiration: '2029-08-31',
  /**
   * THE OPERATIVE CUTOFF, and the FIRST BLOCKED DAY — not the last allowed one.
   * The gate fails closed on and after this Chicago calendar date, for the whole
   * day. The last allowed day is therefore 2027-08-24, and the last allowed
   * instant is 2027-08-25T04:59:59.999Z.
   *
   * Conservative derivation, not a published ACF implementation date: the
   * approved supporting statement extends the currently approved IWO for ONE
   * ADDITIONAL YEAR so states can program the revised form, and makes the
   * revised collection effective one year from OMB approval where programming
   * time is needed. One year from the 2026-08-25 OIRA approval is 2027-08-25. A
   * third-party comment describes 2027-08-31; that wording is not the agency's
   * and the earlier of the two is used. Re-pin only against an explicit ACF
   * implementation notice.
   */
  legacyTransitionFirstBlockedDate: '2027-08-25',
  canonicalUrl: 'https://www.acf.hhs.gov/sites/default/files/documents/ocse/omb_0970_0154.pdf',
  expectedSha256: '2b15c02a46b66a7d0fa2bd80d4644d5d6d5e6798911225f8e0272b45fe20b551',
  expectedBytes: 505412,
  companionAuthority: 'DV-WI 130.3 (03/23) — Illinois "How to Fill Out the IWO Form" field-semantics companion',
  excludedStaleVariant: 'HFS 3683 (R-8-09), OMB expiration 10/31/2010',
  // Renewal state deliberately does NOT live here — see PINNED_RENEWAL_EVIDENCE
  // below. Keeping it in one place prevents a caller or a stale copy from
  // disagreeing with the evidence of record.
  //
  // The window is measured against `collectionApprovalExpiration`, because that
  // is the date a renewal review actually concerns. Measuring it against the
  // legacy transition end would raise "renewal review pending" while renewal is
  // confirmed — the exact untruth PR-1 removed from the copy.
  renewalReviewWindowDays: 60,
}

/**
 * The OIRA conclusion of record for information collection 0970-0154.
 *
 * PINNED EVIDENCE, not configuration. Every field was read off the official
 * Reginfo ICR page and the downloaded Notice of Action, whose exact bytes are
 * hashed below. Moving any of it requires a new official retrieval and a new
 * evidence overlay under docs/legal-audit/.
 */
export interface IwoOiraApproval {
  /** Reginfo ICR reference number. */
  icrReferenceNumber: string
  action: 'approved_without_change'
  /** OIRA conclusion date. */
  approvalDate: string
  /** Expiration OIRA set for the COLLECTION (not for this legacy artifact). */
  collectionExpiration: string
  noticeOfActionUrl: string
  noticeOfActionSha256: string
  noticeOfActionBytes: number
  /** When FreshStart last verified the above against the official source. */
  reviewedOn: string
}

export const PINNED_OIRA_APPROVAL: IwoOiraApproval = {
  icrReferenceNumber: '202607-0970-002',
  action: 'approved_without_change',
  approvalDate: '2026-08-25',
  collectionExpiration: '2029-08-31',
  noticeOfActionUrl: 'https://www.reginfo.gov/public/do/DownloadNOA?requestID=1826353',
  noticeOfActionSha256: 'c2b68202cf4741b0f0a811457e40e6470b1fadce4a3a2f781e5dcb6b2c0df652',
  noticeOfActionBytes: 97827,
  reviewedOn: '2026-09-01',
}

/**
 * Pinned OMB renewal-review evidence state.
 *
 * This is EVIDENCE, not a parameter. Runtime callers cannot clear a pending
 * renewal by passing an argument — the only way to move this to `confirmed` is
 * to edit this pinned constant after an independently verified successor or
 * renewal has been approved and re-pinned.
 *
 * Confirmed renewal of the COLLECTION is not authorization to distribute the
 * legacy ARTIFACT. Those are separate gates: this one, and
 * `IWO_PROVENANCE.legacyTransitionFirstBlockedDate`. Replacing the artifact bytes remains a
 * separate change requiring a new expectedSha256/expectedBytes.
 */
export interface IwoRenewalEvidence {
  status: 'pending' | 'confirmed'
  reviewedOn: string
  source: string
}

const PINNED_RENEWAL_EVIDENCE: IwoRenewalEvidence = {
  status: 'confirmed',
  reviewedOn: '2026-09-01',
  source:
    "OIRA concluded ICR 202607-0970-002 on 2026-08-25: 'Approved without change', OMB control " +
    "number 0970-0154, collection expiration 2029-08-31. Notice of Action " +
    'https://www.reginfo.gov/public/do/DownloadNOA?requestID=1826353 (97,827 bytes, sha256 ' +
    'c2b68202cf4741b0f0a811457e40e6470b1fadce4a3a2f781e5dcb6b2c0df652). This confirms the ' +
    'COLLECTION was renewed; it does not extend the legacy print past ' +
    "IWO_PROVENANCE.legacyTransitionFirstBlockedDate. Supersedes the 2026-07-21 'pending' state.",
}

/**
 * The pinned evidence state.
 *
 * Renewal is passed explicitly through the call chain as a DEPENDENCY, not held
 * in mutable module state. There is deliberately no exported mutable override:
 * a runtime caller reaching a product entry point (the route, the read model,
 * the packet composer) always gets PINNED_RENEWAL_EVIDENCE, because those entry
 * points do not expose the parameter. Tests construct their own handler through
 * the route/guard factories and inject a state there.
 */
export function getRenewalEvidence(): IwoRenewalEvidence {
  return { ...PINNED_RENEWAL_EVIDENCE }
}

export interface IwoValidation {
  present: boolean
  sha256: string | null
  sha256Match: boolean
  bytes: number | null
  bytesMatch: boolean
  provenanceValid: boolean // present AND exact byte-identical match to the verified federal print
  /**
   * The legacy print's transition period has ended. This is the operative
   * authority state — named for the date that actually closes the gate, so no
   * reader can mistake it for the printed date or the collection expiration.
   */
  legacyTransitionBlocked: boolean
  /** Whole days from today (Chicago) to `legacyTransitionFirstBlockedDate`. Negative after. */
  daysToLegacyTransitionFirstBlockedDate: number | null
  /** Whole days from today (Chicago) to `collectionApprovalExpiration`. */
  daysToCollectionApprovalExpiration: number | null
  renewalReviewDue: boolean
  blockers: string[]
}

/** Validate the on-disk IWO against the pinned federal provenance. A wrong-hash
 * file (fake fields, HTML-as-pdf, stale HFS 3683, guessed) fails provenance. */
export function validateIwo(
  formsDir: string,
  today: Date = new Date(),
  renewal: IwoRenewalEvidence = PINNED_RENEWAL_EVIDENCE,
): IwoValidation {
  const p = path.join(formsDir, IWO_PROVENANCE.file)
  const blockers: string[] = []
  if (!fs.existsSync(p)) {
    blockers.push('missing_federal_iwo')
    return { present: false, sha256: null, sha256Match: false, bytes: null, bytesMatch: false,
      provenanceValid: false, legacyTransitionBlocked: false, daysToLegacyTransitionFirstBlockedDate: null,
      daysToCollectionApprovalExpiration: null, renewalReviewDue: true, blockers }
  }
  const buf = fs.readFileSync(p)
  const sha256 = crypto.createHash('sha256').update(buf).digest('hex')
  const sha256Match = sha256 === IWO_PROVENANCE.expectedSha256
  const bytesMatch = buf.length === IWO_PROVENANCE.expectedBytes
  const provenanceValid = sha256Match && bytesMatch
  if (!provenanceValid) blockers.push('invalid_federal_iwo_provenance')

  // Fail closed on or after the LEGACY TRANSITION END, in America/Chicago: the
  // form is blocked for that ENTIRE calendar day, not merely once it passed.
  //
  // Read this next line carefully before changing it. The operative cutoff is
  // `legacyTransitionFirstBlockedDate` and nothing else. It is deliberately NOT
  // `printedExpirationDate` (that date is on the paper, not in the authority)
  // and deliberately NOT `collectionApprovalExpiration` (a collection approved
  // through 2029 does not license a legacy print through 2029). Substituting
  // either one re-opens a defect: the printed date refuses while the form is
  // still distributable, the collection expiration serves it long after it is
  // not.
  const localDate = calendarDateInTimeZone(today, FORM_EXPIRATION_TIME_ZONE)
  const daysToLegacyTransitionFirstBlockedDate = wholeDaysBetweenDates(
    localDate,
    IWO_PROVENANCE.legacyTransitionFirstBlockedDate,
  )
  const daysToCollectionApprovalExpiration = wholeDaysBetweenDates(
    localDate,
    IWO_PROVENANCE.collectionApprovalExpiration,
  )
  const legacyTransitionBlocked = localDate >= IWO_PROVENANCE.legacyTransitionFirstBlockedDate
  if (legacyTransitionBlocked) blockers.push('federal_iwo_expired')

  // A renewal review concerns the COLLECTION's approval, so its window is
  // measured against the collection expiration. Measuring it against the legacy
  // transition end would emit `omb_renewal_review_pending` — and therefore tell
  // a user renewal is under review — while renewal is confirmed and only the
  // legacy print is running out. That refusal has its own code and its own copy.
  const renewalReviewDue =
    renewal.status !== 'confirmed' ||
    daysToCollectionApprovalExpiration <= IWO_PROVENANCE.renewalReviewWindowDays
  if (renewalReviewDue && !legacyTransitionBlocked) blockers.push('omb_renewal_review_pending')
  return { present: true, sha256, sha256Match, bytes: buf.length, bytesMatch, provenanceValid,
    legacyTransitionBlocked, daysToLegacyTransitionFirstBlockedDate, daysToCollectionApprovalExpiration,
    renewalReviewDue, blockers }
}

export const REQUIRED_LAUNCH_FORMS = [
  'petition-dissolution-no-children.pdf',
  'petition-dissolution-with-children.pdf',
  'financial-affidavit.pdf',
  'summons-dissolution.pdf',
  'income-withholding-order.pdf',
]

export interface LaunchReadiness {
  launchReadiness: 'READY' | 'HOLD'
  blockers: string[]
  incomeWithholdingPresent: boolean
  iwoProvenanceValid: boolean
  missingRequiredForms: string[]
  iwo: IwoValidation
}

/**
 * Derived launch-readiness gate (NOT a marketing/checkout/launch-status change).
 * mappingIntegrity and launchReadiness are INDEPENDENT. launchReadiness may be
 * READY only when ALL of: zero broken active mappings; zero unsupported required
 * gaps; every required official form present; the federal IWO present AND
 * provenance-valid AND still inside its legacy transition period; OMB renewal
 * review resolved; and the county
 * packet-composition + e-filing confirmations resolved by an official county
 * source. Real-world defaults for the county/renewal confirmations are
 * UNRESOLVED, so the live config can never flip READY by accident. The confirmed
 * states are injectable ONLY so tests can prove the gate can move.
 */
export function computeLaunchReadiness(input: {
  brokenActive: number
  unsupportedGaps: number
  /** Directory of the public AOIC/ATJ prints (presence check only). */
  formsDir: string
  /** Directory holding the guarded federal IWO artifact. Defaults to formsDir. */
  iwoArtifactDir?: string
  today?: Date
  // County-confirmation + OMB renewal states. Default UNRESOLVED / PENDING: these
  // require an official county source / OMB re-approval, not a code assumption.
  countyPacketComposition?: 'confirmed' | 'unconfirmed'
  countyEfilingTreatment?: 'confirmed' | 'unconfirmed'
  /** Injected ONLY by test factories; product entry points never pass this. */
  renewalEvidence?: IwoRenewalEvidence
  // NOTE: there is deliberately no ombRenewalReview parameter. Renewal state is
  // pinned evidence (PINNED_RENEWAL_EVIDENCE); a runtime caller must not be able
  // to clear a pending renewal by argument.
}): LaunchReadiness {
  const blockers: string[] = []
  if (input.brokenActive > 0) blockers.push(`broken_active_mappings:${input.brokenActive}`)
  if (input.unsupportedGaps > 0) blockers.push(`unsupported_required_gaps:${input.unsupportedGaps}`)

  const iwoArtifactDir = input.iwoArtifactDir ?? input.formsDir
  const missingRequiredForms = REQUIRED_LAUNCH_FORMS.filter((f) => {
    // The federal IWO lives in the guarded artifact dir, not the public one.
    const dir = f === IWO_PROVENANCE.file ? iwoArtifactDir : input.formsDir
    return !fs.existsSync(path.join(dir, f))
  })
  for (const f of missingRequiredForms) blockers.push(`missing_required_form:${f}`)

  // OMB renewal review comes from pinned evidence only — never from the caller.
  const renewal = input.renewalEvidence ?? PINNED_RENEWAL_EVIDENCE
  const ombRenewalReview = renewal.status === 'confirmed' ? 'resolved' : 'pending'

  // Federal IWO: presence is not enough — provenance + content must validate.
  // Hard blockers (missing / invalid provenance / legacy transition ended)
  // always stand. The soft
  // renewal-review blocker is governed by the injectable ombRenewalReview state.
  const iwo = validateIwo(iwoArtifactDir, input.today ?? new Date(), renewal)
  for (const b of iwo.blockers) {
    if (b === 'omb_renewal_review_pending' && ombRenewalReview === 'resolved') continue
    blockers.push(`federal_iwo:${b}`)
  }
  if (ombRenewalReview !== 'resolved') blockers.push('omb_renewal_review:pending')

  // County confirmations: unresolved unless an official county source confirms.
  if ((input.countyPacketComposition ?? 'unconfirmed') !== 'confirmed') blockers.push('county_packet_composition:unconfirmed')
  if ((input.countyEfilingTreatment ?? 'unconfirmed') !== 'confirmed') blockers.push('county_efiling_treatment:unconfirmed')

  return {
    launchReadiness: blockers.length === 0 ? 'READY' : 'HOLD',
    blockers,
    incomeWithholdingPresent: iwo.present,
    iwoProvenanceValid: iwo.provenanceValid,
    missingRequiredForms,
    iwo,
  }
}
