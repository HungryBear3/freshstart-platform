/**
 * @jest-environment node
 *
 * PR-2A — the OIRA renewal and the conservative legacy-transition model.
 *
 * The defect these tests close: `IWO_PROVENANCE.expiration` was ONE field
 * carrying THREE different facts. It held the date printed on the legacy PDF,
 * and it was simultaneously used as the operative distribution cutoff and as the
 * anchor for the OMB renewal-review window. On 2026-08-31 that made the product
 * refuse the form, and tell the user renewal was under review, when OIRA had in
 * fact concluded ICR 202607-0970-002 on 2026-08-25 and approved the collection
 * without change through 2029-08-31.
 *
 * The correction is not "move the date to 2029". Approval of the COLLECTION is
 * not authority to distribute this LEGACY ARTIFACT: the approved supporting
 * statement extends the currently approved IWO for one additional year so states
 * can program the revised form. So three separate facts are modelled under three
 * separate names, and only one of them — the legacy transition end — closes the
 * gate.
 *
 * Evidence: docs/legal-audit/iwo-omb-renewal-transition-2026-09-01.md.
 */
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import {
  FORM_EXPIRATION_TIME_ZONE,
  IWO_PROVENANCE,
  PINNED_OIRA_APPROVAL,
  calendarDateInTimeZone,
  getRenewalEvidence,
  validateIwo,
} from "@/lib/forms/iwo-provenance"
import { describeIwoProvenance, getIwoAvailability } from "@/lib/forms/official-artifact-access"
import {
  operativeRefusalCopy,
  selectOperativeRefusal,
  withheldItemsNotice,
} from "@/lib/forms/iwo-refusal-copy"

const REAL_ARTIFACT_DIR = path.join(process.cwd(), "private", "official-forms")

function tmpDirWithRealIwo(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fs-iwo-transition-"))
  fs.copyFileSync(
    path.join(REAL_ARTIFACT_DIR, IWO_PROVENANCE.file),
    path.join(dir, IWO_PROVENANCE.file)
  )
  return dir
}

/** A canonical statewide-default county. Not Will, not free text. */
const STATEWIDE_COUNTY = "cook"

// 2027-08-25 00:00 CDT is 2027-08-25T05:00:00Z. CDT (UTC-5) is in force on that
// date; the offset is asserted below rather than assumed.
const LAST_ALLOWED_INSTANT = new Date("2027-08-25T04:59:59.999Z")
const TRANSITION_CUTOFF = new Date("2027-08-25T05:00:00Z")

// ─────────────────────────────────────────────────────────────────────────────
// Three facts, three names.
// ─────────────────────────────────────────────────────────────────────────────
describe("the three dates are distinct and separately named", () => {
  it("pins each date to its own field", () => {
    expect(IWO_PROVENANCE.printedLegacyPdfDate).toBe("2026-08-31")
    expect(IWO_PROVENANCE.collectionApprovalExpiresOn).toBe("2029-08-31")
    expect(IWO_PROVENANCE.legacyTransitionFirstBlockedDate).toBe("2027-08-25")
  })

  it("carries no generic `expiration` field for a reader to grab by mistake", () => {
    expect(IWO_PROVENANCE).not.toHaveProperty("expiration")
  })

  it("keeps the three values genuinely different", () => {
    const dates = new Set([
      IWO_PROVENANCE.printedLegacyPdfDate,
      IWO_PROVENANCE.collectionApprovalExpiresOn,
      IWO_PROVENANCE.legacyTransitionFirstBlockedDate,
    ])
    expect(dates.size).toBe(3)
  })

  it("orders them the only way the evidence allows", () => {
    // printed < transition end < collection approval expiration. If a re-pin ever
    // inverts this, the gate would be authorising a print past its own collection.
    expect(
      IWO_PROVENANCE.printedLegacyPdfDate < IWO_PROVENANCE.legacyTransitionFirstBlockedDate
    ).toBe(true)
    expect(
      IWO_PROVENANCE.legacyTransitionFirstBlockedDate < IWO_PROVENANCE.collectionApprovalExpiresOn
    ).toBe(true)
  })

  it("does not relabel the legacy artifact as the revised form", () => {
    // The revised 2026 form is DOCX-only on Reginfo and is not shipped here. The
    // pinned bytes must still be the legacy ACF print, unchanged by PR-2A.
    expect(IWO_PROVENANCE.file).toBe("income-withholding-order.pdf")
    expect(IWO_PROVENANCE.expectedSha256).toBe(
      "2b15c02a46b66a7d0fa2bd80d4644d5d6d5e6798911225f8e0272b45fe20b551"
    )
    expect(IWO_PROVENANCE.expectedBytes).toBe(505412)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// The OIRA conclusion of record.
// ─────────────────────────────────────────────────────────────────────────────
describe("pinned OIRA approval", () => {
  it("pins the ICR, action, approval date and collection expiration", () => {
    expect(PINNED_OIRA_APPROVAL.icrReferenceNumber).toBe("202607-0970-002")
    expect(PINNED_OIRA_APPROVAL.action).toBe("approved_without_change")
    expect(PINNED_OIRA_APPROVAL.approvalDate).toBe("2026-08-25")
    expect(PINNED_OIRA_APPROVAL.collectionApprovalExpiresOn).toBe("2029-08-31")
    expect(PINNED_OIRA_APPROVAL.reviewedOn).toBe("2026-09-01")
  })

  it("pins the Notice of Action bytes it was read from", () => {
    expect(PINNED_OIRA_APPROVAL.noticeOfActionUrl).toBe(
      "https://www.reginfo.gov/public/do/DownloadNOA?requestID=1826353"
    )
    expect(PINNED_OIRA_APPROVAL.noticeOfActionSha256).toBe(
      "c2b68202cf4741b0f0a811457e40e6470b1fadce4a3a2f781e5dcb6b2c0df652"
    )
    expect(PINNED_OIRA_APPROVAL.noticeOfActionBytes).toBe(97827)
  })

  it("agrees with the collection expiration used by the provenance model", () => {
    expect(PINNED_OIRA_APPROVAL.collectionApprovalExpiresOn).toBe(
      IWO_PROVENANCE.collectionApprovalExpiresOn
    )
  })

  it("derives the transition end as one year from the approval date", () => {
    const [y, m, d] = PINNED_OIRA_APPROVAL.approvalDate.split("-").map(Number)
    const oneYearOn = `${y + 1}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    expect(IWO_PROVENANCE.legacyTransitionFirstBlockedDate).toBe(oneYearOn)
  })

  it("records renewal as confirmed, reviewed on the audit date", () => {
    const renewal = getRenewalEvidence()
    expect(renewal.status).toBe("confirmed")
    expect(renewal.reviewedOn).toBe("2026-09-01")
    expect(renewal.source).toContain("202607-0970-002")
    expect(renewal.source).toContain("2029-08-31")
    // Confirmed renewal must not be written up as authority over the artifact.
    expect(renewal.source).toMatch(/does not extend the legacy print/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// The boundary, to the millisecond, in America/Chicago.
// ─────────────────────────────────────────────────────────────────────────────
describe("legacy transition boundary — whole-day fail closed in America/Chicago", () => {
  const dir = tmpDirWithRealIwo()

  it("uses America/Chicago", () => {
    expect(FORM_EXPIRATION_TIME_ZONE).toBe("America/Chicago")
  })

  it("places the cutoff instant on the 2027-08-25 Chicago calendar date", () => {
    expect(calendarDateInTimeZone(LAST_ALLOWED_INSTANT, FORM_EXPIRATION_TIME_ZONE)).toBe(
      "2027-08-24"
    )
    expect(calendarDateInTimeZone(TRANSITION_CUTOFF, FORM_EXPIRATION_TIME_ZONE)).toBe("2027-08-25")
  })

  it("is open at the final millisecond before the cutoff", () => {
    const v = validateIwo(dir, LAST_ALLOWED_INSTANT)
    expect(v.legacyTransitionBlocked).toBe(false)
    expect(v.blockers).toEqual([])
    expect(v.daysToLegacyTransitionFirstBlockedDate).toBe(1)
  })

  it("is closed at the first disallowed instant", () => {
    const v = validateIwo(dir, TRANSITION_CUTOFF)
    expect(v.legacyTransitionBlocked).toBe(true)
    expect(v.blockers).toEqual(["federal_iwo_expired"])
    expect(v.daysToLegacyTransitionFirstBlockedDate).toBe(0)
  })

  it("stays closed for the whole cutoff day, including the last UTC instant", () => {
    // A UTC-day rule would still allow 23:59:59Z. The Chicago-day rule does not.
    const v = validateIwo(dir, new Date("2027-08-25T23:59:59Z"))
    expect(v.legacyTransitionBlocked).toBe(true)
  })

  it("stays closed afterwards", () => {
    expect(validateIwo(dir, new Date("2027-08-26T00:00:00Z")).legacyTransitionBlocked).toBe(true)
  })

  it("refuses through the real access boundary at the cutoff, with the authority copy", () => {
    const a = getIwoAvailability({
      countyId: STATEWIDE_COUNTY,
      artifactDir: dir,
      today: TRANSITION_CUTOFF,
    })
    expect(a.available).toBe(false)
    expect(a.refusal).toBe("federal_artifact_gate_closed")
    expect(a.operativeRefusal).toBe("federal_form_authority_expired")
    expect(a.copy.join(" ")).not.toMatch(/renewal/i)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// The two ways a single ambiguous date used to go wrong.
// ─────────────────────────────────────────────────────────────────────────────
describe("neither of the other two dates can drive the gate", () => {
  const dir = tmpDirWithRealIwo()

  it("the printed 2026-08-31 date no longer closes the gate on its own", () => {
    // The exact instant the released baseline began refusing.
    const v = validateIwo(dir, new Date("2026-08-31T05:00:00Z"))
    expect(v.legacyTransitionBlocked).toBe(false)
    expect(v.blockers).toEqual([])

    const a = getIwoAvailability({
      countyId: STATEWIDE_COUNTY,
      artifactDir: dir,
      today: new Date("2026-08-31T05:00:00Z"),
    })
    expect(a.available).toBe(true)
    expect(a.operativeRefusal).toBeNull()
  })

  it("the printed date is still carried, exactly, as display metadata", () => {
    expect(describeIwoProvenance().printedLegacyPdfDate).toBe("2026-08-31")
  })

  it("the 2029 collection approval cannot authorize the legacy print past 2027-08-25", () => {
    // Deep inside the collection's approval window; well past the transition end.
    const at = new Date("2028-06-01T12:00:00Z")
    const v = validateIwo(dir, at)
    expect(v.daysToCollectionApprovalExpiresOn).toBeGreaterThan(0)
    expect(v.legacyTransitionBlocked).toBe(true)
    expect(v.blockers).toContain("federal_iwo_expired")

    const a = getIwoAvailability({ countyId: STATEWIDE_COUNTY, artifactDir: dir, today: at })
    expect(a.available).toBe(false)
    expect(a.operativeRefusal).toBe("federal_form_authority_expired")
  })

  it("still refuses on the day before the collection approval itself expires", () => {
    const v = validateIwo(dir, new Date("2029-08-30T12:00:00Z"))
    expect(v.daysToCollectionApprovalExpiresOn).toBe(1)
    expect(v.legacyTransitionBlocked).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Truthfulness: confirmed renewal is never reported as pending.
// ─────────────────────────────────────────────────────────────────────────────
describe("pinned evidence never states a renewal is pending", () => {
  const dir = tmpDirWithRealIwo()

  // Samples spanning the whole live window: today, mid-window, and each side of
  // the boundary. None may emit the renewal-pending blocker from pinned evidence.
  const SAMPLES = [
    new Date("2026-09-01T12:00:00Z"),
    new Date("2026-12-31T12:00:00Z"),
    new Date("2027-06-30T12:00:00Z"),
    LAST_ALLOWED_INSTANT,
    TRANSITION_CUTOFF,
    new Date("2027-09-01T12:00:00Z"),
  ]

  it.each(SAMPLES.map(d => [d.toISOString(), d] as const))(
    "%s emits no omb_renewal_review_pending",
    (_label, at) => {
      const v = validateIwo(dir, at)
      expect(v.renewalReviewDue).toBe(false)
      expect(v.blockers).not.toContain("omb_renewal_review_pending")
    }
  )

  it.each(SAMPLES.map(d => [d.toISOString(), d] as const))(
    "%s never selects the renewal-pending copy",
    (_label, at) => {
      const a = getIwoAvailability({ countyId: STATEWIDE_COUNTY, artifactDir: dir, today: at })
      expect(a.operativeRefusal).not.toBe("federal_form_renewal_pending")
      expect(a.copy.join(" ")).not.toMatch(/under renewal review/)
    }
  )

  it("measures the renewal-review window against the collection expiration", () => {
    // 60 days before 2029-08-31 the review is due again — that is the date a
    // renewal review actually concerns. The legacy transition end must not open
    // this window: if it did, a renewal-pending claim would appear from
    // 2027-06-26 onward, while renewal was confirmed.
    const justInsideWindow = validateIwo(dir, new Date("2027-07-01T12:00:00Z"))
    expect(justInsideWindow.daysToLegacyTransitionFirstBlockedDate).toBeLessThan(
      IWO_PROVENANCE.renewalReviewWindowDays
    )
    expect(justInsideWindow.renewalReviewDue).toBe(false)
    expect(justInsideWindow.blockers).toEqual([])
  })

  it("still reports renewal pending when injected evidence says so", () => {
    // The code and its approved copy remain reachable for a future re-pin.
    const v = validateIwo(dir, new Date("2026-09-01T12:00:00Z"), {
      status: "pending",
      reviewedOn: "2026-07-21",
      source: "test-injected",
    })
    expect(v.blockers).toContain("omb_renewal_review_pending")
    expect(selectOperativeRefusal(v.blockers)).toBe("federal_form_renewal_pending")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Provenance reporting surfaces all three, unambiguously.
// ─────────────────────────────────────────────────────────────────────────────
describe("describeIwoProvenance", () => {
  it("surfaces the three dates under three distinct names", () => {
    const d = describeIwoProvenance()
    expect(d.printedLegacyPdfDate).toBe("2026-08-31")
    expect(d.collectionApprovalExpiresOn).toBe("2029-08-31")
    expect(d.legacyTransitionFirstBlockedDate).toBe("2027-08-25")
    expect(d.transitionTimeZone).toBe("America/Chicago")
  })

  it("exposes no single ambiguous `expiration` key", () => {
    expect(describeIwoProvenance()).not.toHaveProperty("expiration")
  })

  it("reports the OIRA approval and the confirmed renewal", () => {
    const d = describeIwoProvenance()
    expect(d.oiraApproval.icrReferenceNumber).toBe("202607-0970-002")
    expect(d.oiraApproval.action).toBe("approved_without_change")
    expect(d.renewal.status).toBe("confirmed")
  })

  it("hands back copies, so a caller cannot mutate the pinned evidence", () => {
    const d = describeIwoProvenance()
    d.oiraApproval.approvalDate = "1999-01-01"
    d.renewal.status = "pending"
    expect(PINNED_OIRA_APPROVAL.approvalDate).toBe("2026-08-25")
    expect(getRenewalEvidence().status).toBe("confirmed")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// The re-approved authority-refusal sentence, pinned character-for-character.
// ─────────────────────────────────────────────────────────────────────────────
describe("federal_form_authority_expired copy — exact text", () => {
  /**
   * Owner-re-approved 2026-09-01, superseding the 2026-08-24 wording for this one
   * string. A near-match is a failure, not a nit: this is the sentence a user
   * sees when the gate closes on FreshStart's own conservative cutoff.
   */
  const APPROVED_AUTHORITY_COPY = [
    "The federal Income Withholding for Support form (OMB 0970-0154) is not being offered right now because Fresh Start has stopped distributing the selected version of this form.",
    "Fresh Start is not able to tell you whether a court, clerk, or employer will accept a particular version of this form. This is procedural information about what Fresh Start distributes, not legal advice.",
  ]

  it("is exactly the two approved paragraphs, in order", () => {
    expect(operativeRefusalCopy("federal_form_authority_expired")).toEqual(APPROVED_AUTHORITY_COPY)
  })

  it("pins each paragraph character-for-character", () => {
    const copy = operativeRefusalCopy("federal_form_authority_expired")
    expect(copy).toHaveLength(2)
    expect(copy[0]).toBe(APPROVED_AUTHORITY_COPY[0])
    expect(copy[1]).toBe(APPROVED_AUTHORITY_COPY[1])
    // Length equality catches a trailing space or a swapped Unicode dash that a
    // regex assertion would read straight past.
    expect(copy[0]).toHaveLength(APPROVED_AUTHORITY_COPY[0].length)
    expect(copy[1]).toHaveLength(APPROVED_AUTHORITY_COPY[1].length)
  })

  it("the retired 2026-08-24 sentence is gone", () => {
    expect(operativeRefusalCopy("federal_form_authority_expired").join(" ")).not.toContain(
      "the period Fresh Start is authorized to distribute the selected version has ended"
    )
  })

  it("claims no external authorization, expiry, or approval state", () => {
    // 2027-08-25 is FreshStart's own derivation, not a published ACF date, so
    // the copy must describe FreshStart's conduct and nothing else.
    const copy = operativeRefusalCopy("federal_form_authority_expired").join(" ")
    for (const banned of [
      /\bauthoriz/i,
      /\bexpir/i,
      /\bperiod\b/i,
      /\brenewal\b/i,
      /\bOMB (has|approved|extended)\b/i,
      /\bno longer (valid|current)\b/i,
    ]) {
      expect(copy).not.toMatch(banned)
    }
    expect(copy).toContain("Fresh Start")
    expect(copy).toContain("not legal advice")
  })

  it("is the sentence the real gate serves at the cutoff", () => {
    const a = getIwoAvailability({
      countyId: STATEWIDE_COUNTY,
      artifactDir: tmpDirWithRealIwo(),
      today: TRANSITION_CUTOFF,
    })
    expect(a.copy).toEqual(APPROVED_AUTHORITY_COPY)
  })

  it("is the sentence the package withholding disclosure interpolates", () => {
    expect(withheldItemsNotice("federal_form_authority_expired")[0]).toBe(
      "Income Withholding for Support form (OMB 0970-0154) — withheld from this package. " +
        `Reason: ${APPROVED_AUTHORITY_COPY[0]} No federal IWO file was included. Fresh Start ` +
        "is not able to tell you whether a court, clerk, or employer will accept a particular " +
        "version. This is procedural information about what Fresh Start distributes, not legal " +
        "advice."
    )
  })
})
