/**
 * @jest-environment node
 *
 * The IWO OPEN path, and the disclosure hold that closes it.
 *
 * Two defects are closed here, and they are opposite in direction.
 *
 * 1. DOCUMENTATION UNDERSTATED WHAT THE CODE DOES. The 2026-09-01 overlay said
 *    flatly "no universal packet inclusion". That is not what the code does.
 *    While the federal gate is open, a canonical NON-Will county auto-composes
 *    the IWO into the opening and prove-up packets with no further condition;
 *    only Will and unknown/noncanonical counties are withheld. The federal gate
 *    IS open at production defaults today, so this is the live path, not a
 *    hypothetical. These tests pin that behavior so no document can describe it
 *    wrongly again.
 *
 * 2. THE OPEN PATH SHIPPED WITH NO DISCLOSURE. On the successful path the
 *    customer receives the LEGACY ACF print, which has "Expiration Date:
 *    08/31/2026" printed on its face, and for which an approved revised
 *    successor exists (OIRA concluded ICR 202607-0970-002 on 2026-08-25). Fresh
 *    Start says nothing to the customer about either fact when it hands the file
 *    over. The exact wording of that disclosure is owner-gated copy, so it
 *    cannot be written here. Distribution is therefore held closed until the
 *    owner approves it.
 *
 * The hold is NOT an expiry, an OMB status, or an agency action, and nothing
 * here may describe it as one. The OIRA renewal is confirmed, the collection
 * approval runs to 2029-08-31, and the legacy transition boundary is
 * 2027-08-25. The hold is Fresh Start's own release decision and is modelled
 * entirely separately from all of that pinned evidence.
 *
 * Evidence: docs/legal-audit/iwo-omb-renewal-transition-2026-09-01.md
 * Owner decision pending: docs/legal-audit/iwo-open-path-disclosure-copy-decision-2026-09-05.md
 * Pending ledger: docs/legal-audit/iwo-copy-approval-ledger.md
 */
import fs from "node:fs"
import path from "node:path"

import {
  IWO_PROVENANCE,
  validateIwo,
} from "@/lib/forms/iwo-provenance"
import {
  getOpenPathDisclosureApproval,
  type IwoOpenPathDisclosureApproval,
} from "@/lib/forms/iwo-distribution-hold"
import {
  describeIwoProvenance,
  getIwoAvailability,
  readGuardedIwoArtifact,
} from "@/lib/forms/official-artifact-access"
import {
  getCountyIwoWorkflow,
  getOpeningPacketForms,
  getProveUpPacketForms,
  IWO_NEUTRAL_COPY,
} from "@/lib/counties/county-iwo-workflow"
import { filterIwoFromPackage } from "@/lib/forms/iwo-package-guard"
import { IWO_OPERATIVE_REFUSAL_COPY } from "@/lib/forms/iwo-refusal-copy"
import { getCourtFormsReadModel } from "@/lib/forms/court-forms-read-model"
import { ILLINOIS_COURT_FORMS } from "@/lib/forms/illinois-court-forms"

const REAL_ARTIFACT_DIR = path.join(process.cwd(), "private", "official-forms")

/** Canonical, non-Will, statewide-default counties. */
const OPEN_COUNTIES = ["cook", "dupage", "lake", "kane"] as const

/** Test-only: the owner decision recorded as taken. Product code never does this. */
const DISCLOSURE_APPROVED: IwoOpenPathDisclosureApproval = {
  status: "approved",
  requestedOn: "2026-09-05",
  decisionRecord: "test-only injected approval",
  ledgerRecord: "test-only injected approval",
}

const DECISION_DOC = path.join(
  process.cwd(),
  "docs/legal-audit/iwo-open-path-disclosure-copy-decision-2026-09-05.md",
)
const LEDGER_DOC = path.join(process.cwd(), "docs/legal-audit/iwo-copy-approval-ledger.md")
const OVERLAY_DOC = path.join(
  process.cwd(),
  "docs/legal-audit/iwo-omb-renewal-transition-2026-09-01.md",
)

// ─────────────────────────────────────────────────────────────────────────────
// 1. The federal gate really is OPEN at production defaults.
//
// No injected renewal evidence, no injected clock, the real pinned artifact.
// This is the exact configuration production runs. If it ever stops being open
// this suite must fail loudly rather than silently re-describing the product:
// after 2027-08-25 (America/Chicago) the legacy transition boundary closes it by
// design, and that is a re-pin decision, not a test to relax.
// ─────────────────────────────────────────────────────────────────────────────
describe("production-default federal artifact gate", () => {
  it("has zero blockers with the real artifact, the real clock, and pinned evidence", () => {
    const v = validateIwo(REAL_ARTIFACT_DIR)
    expect(v.present).toBe(true)
    expect(v.provenanceValid).toBe(true)
    expect(v.legacyTransitionBlocked).toBe(false)
    expect(v.renewalReviewDue).toBe(false)
    expect(v.blockers).toEqual([])
  })

  it("is inside the legacy transition window and the collection approval window", () => {
    const v = validateIwo(REAL_ARTIFACT_DIR)
    expect(v.daysToLegacyTransitionFirstBlockedDate!).toBeGreaterThan(0)
    expect(v.daysToCollectionApprovalExpiresOn!).toBeGreaterThan(
      IWO_PROVENANCE.renewalReviewWindowDays,
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. With the federal gate open AND disclosure approved, non-Will counties
//    auto-include the IWO. This is what "no universal packet inclusion" got
//    wrong: inclusion is automatic for these counties, it is just not universal
//    across counties.
// ─────────────────────────────────────────────────────────────────────────────
describe("open path — canonical non-Will county", () => {
  const OPTS = {
    artifactDir: REAL_ARTIFACT_DIR,
    disclosureApproval: DISCLOSURE_APPROVED,
  }

  it.each(OPEN_COUNTIES)("%s is statewide_default and permits auto packet placement", (countyId) => {
    const w = getCountyIwoWorkflow(countyId)
    expect(w.disposition).toBe("statewide_default")
    expect(w.autoPacketPlacementAllowed).toBe(true)
  })

  it.each(OPEN_COUNTIES)("%s auto-includes the IWO in the opening packet", (countyId) => {
    const packet = getOpeningPacketForms(countyId, true, OPTS)
    expect(packet.forms.map((f) => f.id)).toContain("income-withholding-order")
    expect(packet.deferred).toHaveLength(0)
  })

  it.each(OPEN_COUNTIES)("%s auto-includes the IWO in the prove-up packet", (countyId) => {
    const packet = getProveUpPacketForms(countyId, true, OPTS)
    expect(packet.forms.map((f) => f.id)).toContain("income-withholding-order")
    expect(packet.deferred).toHaveLength(0)
  })

  it.each(OPEN_COUNTIES)("%s is available through the access boundary", (countyId) => {
    const a = getIwoAvailability({
      countyId,
      artifactDir: REAL_ARTIFACT_DIR,
      disclosureApproval: DISCLOSURE_APPROVED,
    })
    expect(a.available).toBe(true)
    expect(a.refusal).toBeNull()
    expect(a.copy).toEqual(IWO_NEUTRAL_COPY.statewide_default)
  })

  it("hands back the pinned bytes only on that open path", () => {
    const read = readGuardedIwoArtifact({
      countyId: "cook",
      artifactDir: REAL_ARTIFACT_DIR,
      disclosureApproval: DISCLOSURE_APPROVED,
    })
    expect(read.allowed).toBe(true)
    if (read.allowed) {
      expect(read.sha256).toBe(IWO_PROVENANCE.expectedSha256)
      expect(read.byteLength).toBe(IWO_PROVENANCE.expectedBytes)
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. Will and unknown/noncanonical counties stay closed even with the federal
//    gate open and disclosure approved. The county gate is independent.
// ─────────────────────────────────────────────────────────────────────────────
describe("county fail-closed, independent of the federal gate and the hold", () => {
  const OPTS = {
    artifactDir: REAL_ARTIFACT_DIR,
    disclosureApproval: DISCLOSURE_APPROVED,
  }

  it("Will is manual_conditional and never auto-composed", () => {
    expect(getCountyIwoWorkflow("will").disposition).toBe("manual_conditional")
    for (const packet of [
      getOpeningPacketForms("will", true, OPTS),
      getProveUpPacketForms("will", true, OPTS),
    ]) {
      expect(packet.forms.map((f) => f.id)).not.toContain("income-withholding-order")
    }
    const deferred = getOpeningPacketForms("will", true, OPTS).deferred.find(
      (d) => d.formId === "income-withholding-order",
    )
    expect(deferred).toBeDefined()
    expect(deferred!.disposition).toBe("manual_conditional")
    expect(deferred!.copy).toEqual(IWO_NEUTRAL_COPY.will)
  })

  it("Will refuses at the access boundary with the county reason, not the hold", () => {
    const a = getIwoAvailability({
      countyId: "will",
      artifactDir: REAL_ARTIFACT_DIR,
      disclosureApproval: DISCLOSURE_APPROVED,
    })
    expect(a.available).toBe(false)
    expect(a.refusal).toBe("county_manual_conditional")
    expect(a.requiresManualReview).toBe(true)
  })

  it.each(["", "  ", "Cook County", "notacounty", "COOK", "cook "])(
    "%p is not canonical and fails closed",
    (countyId) => {
      const packet = getOpeningPacketForms(countyId, true, OPTS)
      expect(packet.forms.map((f) => f.id)).not.toContain("income-withholding-order")

      const a = getIwoAvailability({
        countyId,
        artifactDir: REAL_ARTIFACT_DIR,
        disclosureApproval: DISCLOSURE_APPROVED,
      })
      expect(a.available).toBe(false)
      expect(a.refusal).toBe("county_unknown_or_noncanonical")
      expect(a.requiresManualReview).toBe(true)
    },
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. The hold itself: production defaults keep distribution CLOSED.
// ─────────────────────────────────────────────────────────────────────────────
describe("open-path disclosure hold — pinned pending", () => {
  it("is pinned pending and points at the owner decision artifact", () => {
    const approval = getOpenPathDisclosureApproval()
    expect(approval.status).toBe("pending")
    expect(approval.status).not.toBe("approved")
    expect(approval.decisionRecord).toBe(
      "docs/legal-audit/iwo-open-path-disclosure-copy-decision-2026-09-05.md",
    )
    expect(approval.ledgerRecord).toBe("docs/legal-audit/iwo-copy-approval-ledger.md")
  })

  it("hands back a copy, so a caller cannot flip the pinned state", () => {
    const first = getOpenPathDisclosureApproval()
    first.status = "approved"
    expect(getOpenPathDisclosureApproval().status).toBe("pending")
  })

  it.each(OPEN_COUNTIES)("closes the otherwise-open access boundary for %s", (countyId) => {
    const a = getIwoAvailability({ countyId, artifactDir: REAL_ARTIFACT_DIR })
    expect(a.available).toBe(false)
    expect(a.refusal).toBe("open_path_disclosure_unapproved")
    expect(a.operativeRefusal).toBeNull()
    expect(a.blockers).toEqual(["open_path_disclosure_unapproved"])
  })

  it("returns zero bytes from the guarded read at production defaults", () => {
    const read = readGuardedIwoArtifact({ countyId: "cook", artifactDir: REAL_ARTIFACT_DIR })
    expect(read.allowed).toBe(false)
    if (!read.allowed) expect(read.refusal).toBe("open_path_disclosure_unapproved")
  })

  it.each(OPEN_COUNTIES)("withholds the IWO from the %s opening packet", (countyId) => {
    const packet = getOpeningPacketForms(countyId, true, { artifactDir: REAL_ARTIFACT_DIR })
    expect(packet.forms.map((f) => f.id)).not.toContain("income-withholding-order")
    const deferred = packet.deferred.find((d) => d.formId === "income-withholding-order")
    expect(deferred).toBeDefined()
    expect(deferred!.reasonCodes).toContain("open_path_disclosure_unapproved")
  })

  it("withholds an existing READY IWO row from the document package", () => {
    const row = {
      type: "iwo",
      fileName: "income-withholding-order.pdf",
      mimeType: "application/pdf",
      content: fs
        .readFileSync(path.join(REAL_ARTIFACT_DIR, IWO_PROVENANCE.file))
        .toString("base64"),
    }
    const other = { type: "petition", fileName: "petition.pdf", mimeType: "application/pdf", content: "" }
    const result = filterIwoFromPackage([row, other], {
      storedCounty: "cook",
      artifactDir: REAL_ARTIFACT_DIR,
    })
    expect(result.included).toEqual([other])
    expect(result.withheld.map((w) => w.reason)).toEqual(["open_path_disclosure_unapproved"])
    expect(result.refusal).toBe("open_path_disclosure_unapproved")
  })

  it("removes the IWO from the court-forms read model", () => {
    const model = getCourtFormsReadModel({ countyId: "cook" })
    expect(model.forms.map((f) => f.id)).not.toContain("income-withholding-order")
    const notice = model.gatedNotices.find((n) => n.formId === "income-withholding-order")
    expect(notice).toBeDefined()
    expect(notice!.refusal).toBe("open_path_disclosure_unapproved")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. The hold must never speak, and must never be dressed as an agency fact.
// ─────────────────────────────────────────────────────────────────────────────
describe("the hold states nothing to the user", () => {
  const heldSurfaces = () => [
    getIwoAvailability({ countyId: "cook", artifactDir: REAL_ARTIFACT_DIR }).copy,
    getOpeningPacketForms("cook", true, { artifactDir: REAL_ARTIFACT_DIR }).deferred.find(
      (d) => d.formId === "income-withholding-order",
    )!.copy,
    filterIwoFromPackage(
      [{ type: "iwo", fileName: "iwo.pdf", mimeType: "application/pdf", content: "" }],
      { storedCounty: "cook", artifactDir: REAL_ARTIFACT_DIR },
    ).notice ?? [],
  ]

  it("emits no user-visible sentence at all — unapproved copy is not invented", () => {
    for (const copy of heldSurfaces()) expect(copy).toEqual([])
  })

  it("never reuses another cause's approved copy", () => {
    const approved = Object.values(IWO_OPERATIVE_REFUSAL_COPY).flatMap((c) => [...c])
    for (const copy of heldSurfaces()) {
      for (const sentence of copy) expect(approved).not.toContain(sentence)
    }
  })

  it("never labels itself an expiry, an OMB action, or a renewal state", () => {
    const a = getIwoAvailability({ countyId: "cook", artifactDir: REAL_ARTIFACT_DIR })
    const surface = [a.refusal, ...a.blockers, ...a.copy].join(" ")
    for (const banned of [/expir/i, /\bomb\b/i, /renewal/i, /\bagency\b/i, /\bacf\b/i, /0970/]) {
      expect(surface).not.toMatch(banned)
    }
  })

  it("does not fabricate a federal-artifact blocker to achieve the hold", () => {
    // The artifact is fine. Saying otherwise would be untrue, and would make the
    // federal evidence model lie to keep a release decision.
    expect(validateIwo(REAL_ARTIFACT_DIR).blockers).toEqual([])
    const a = getIwoAvailability({ countyId: "cook", artifactDir: REAL_ARTIFACT_DIR })
    expect(a.validation!.blockers).toEqual([])
    expect(a.validation!.provenanceValid).toBe(true)
  })

  it("leaves the pinned OIRA evidence intact and truthful", () => {
    const d = describeIwoProvenance()
    expect(d.renewal.status).toBe("confirmed")
    expect(d.oiraApproval.action).toBe("approved_without_change")
    expect(d.oiraApproval.approvalDate).toBe("2026-08-25")
    expect(d.collectionApprovalExpiresOn).toBe("2029-08-31")
    expect(d.legacyTransitionFirstBlockedDate).toBe("2027-08-25")
    expect(d.printedLegacyPdfDate).toBe("2026-08-31")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 6. The owner decision artifact and the pending ledger.
// ─────────────────────────────────────────────────────────────────────────────
describe("owner copy decision artifact", () => {
  const read = () => fs.readFileSync(DECISION_DOC, "utf8")

  /** Every fenced ```text block is a proposed exact variant. */
  const variants = (): string[] =>
    [...read().matchAll(/```text\n([\s\S]*?)```/g)].map((m) => m[1].trim())

  it("exists and is marked UNAPPROVED and NOT WIRED", () => {
    const doc = read()
    expect(doc).toContain("STATUS: UNAPPROVED")
    expect(doc).toContain("NOT WIRED")
    expect(doc).not.toMatch(/^STATUS: APPROVED/m)
  })

  it("proposes one or two exact variants, no more", () => {
    expect(variants().length).toBeGreaterThanOrEqual(1)
    expect(variants().length).toBeLessThanOrEqual(2)
  })

  it("has no proposed variant wired into any shipped copy surface", () => {
    const shipped = [
      ...Object.values(IWO_OPERATIVE_REFUSAL_COPY).flatMap((c) => [...c]),
      ...Object.values(IWO_NEUTRAL_COPY).flatMap((c) => [...c]),
      ...getIwoAvailability({ countyId: "cook", artifactDir: REAL_ARTIFACT_DIR }).copy,
      ...getIwoAvailability({
        countyId: "cook",
        artifactDir: REAL_ARTIFACT_DIR,
        disclosureApproval: DISCLOSURE_APPROVED,
      }).copy,
    ].join("\n")
    for (const variant of variants()) expect(shipped).not.toContain(variant)
  })
})

describe("pending copy-approval ledger", () => {
  const read = () => fs.readFileSync(LEDGER_DOC, "utf8")

  it("exists and declares itself not an approval", () => {
    const doc = read()
    expect(doc).toContain("THIS FILE IS NOT AN APPROVAL")
  })

  it("records every entry as PENDING and none as approved", () => {
    const doc = read()
    const statuses = [...doc.matchAll(/^- \*\*Status:\*\* (.+)$/gm)].map((m) => m[1].trim())
    expect(statuses.length).toBeGreaterThan(0)
    for (const status of statuses) {
      expect(status).toBe("PENDING — REQUESTED, NOT APPROVED")
    }
  })

  it("carries the two entries this branch requires", () => {
    const doc = read()
    // The 2026-09-01 federal_form_authority_expired supersession, never logged.
    expect(doc).toContain("federal_form_authority_expired")
    // The new open-path disclosure request.
    expect(doc).toContain("iwo-open-path-disclosure-copy-decision-2026-09-05.md")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 7. Catalog metadata matches the evidence pinned in this branch.
// ─────────────────────────────────────────────────────────────────────────────
describe("IWO catalog metadata", () => {
  /**
   * The URL this branch actually retrieved with HTTP 200 and the exact pinned
   * hash/length on 2026-09-01 (overlay §3.3, §3.4.1), and which §3.6 records the
   * Illinois approved-forms page as linking. No new fact is asserted here.
   */
  const URL_OF_RECORD = "https://acf.gov/sites/default/files/documents/ocse/omb_0970_0154.pdf?download=1"

  const catalogEntry = () => ILLINOIS_COURT_FORMS.find((f) => f.id === "income-withholding-order")!
  const manifestEntry = () =>
    JSON.parse(
      fs.readFileSync(
        path.join(process.cwd(), "docs/legal-audit/illinois-court-forms-manifest.json"),
        "utf8",
      ),
    ).forms.find((f: { id: string }) => f.id === "income-withholding-order")

  it("names one URL, in all three places", () => {
    expect(IWO_PROVENANCE.canonicalUrl).toBe(URL_OF_RECORD)
    expect(catalogEntry().officialUrl).toBe(URL_OF_RECORD)
    expect(manifestEntry().officialUrl).toBe(URL_OF_RECORD)
  })

  it("does not describe the printed 2026-08-31 date as an expiration", () => {
    // PR-2A retired that label everywhere else: it is the exact ambiguity that
    // made the gate refuse a form that was still distributable.
    expect(catalogEntry().version).not.toMatch(/expiration/i)
    expect(manifestEntry().catalogVersion).not.toMatch(/expiration/i)
    expect(catalogEntry().version).toContain("2026-08-31")
    expect(catalogEntry().version).toBe(manifestEntry().catalogVersion)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 8. The overlay no longer misdescribes packet inclusion.
// ─────────────────────────────────────────────────────────────────────────────
describe("legal-audit overlay reconciliation", () => {
  const read = () => fs.readFileSync(OVERLAY_DOC, "utf8")

  it("drops the unqualified 'no universal packet inclusion' claim", () => {
    expect(read()).not.toContain("no universal packet inclusion")
  })

  it("states precisely who is auto-included and who is withheld", () => {
    const doc = read()
    expect(doc).toContain("auto-composed into the opening and prove-up packets")
    expect(doc).toContain("Will and unknown/noncanonical counties")
  })

  it("documents the disclosure hold without calling it an expiry", () => {
    const doc = read()
    const section = doc.slice(doc.indexOf("## 5.1 Actual packet behavior and open-path disclosure hold"))
    expect(section.length).toBeGreaterThan(0)
    expect(section).toContain("open_path_disclosure_unapproved")
    expect(section).toContain("not an expiry")
  })
})
