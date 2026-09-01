/**
 * @jest-environment node
 *
 * Will County IWO manual/conditional workflow + federal IWO currentness gate.
 *
 * Evidence basis (read-only, not restated as legal advice):
 *  - rex/research/.../WILL-IWO-CLERK-RESPONSE-ADDENDUM.md (2026-07-31 clerk response)
 *  - docs/legal-audit/iwo-federal-provenance-2026-07-21.json (pinned federal print)
 *
 * These tests encode PRODUCT-SAFETY invariants only. They deliberately do NOT
 * assert which filing path is legally correct in Will County — the whole point
 * is that the product must not decide that.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  IWO_PROVENANCE,
  REQUIRED_LAUNCH_FORMS,
  calendarDateInTimeZone,
  computeLaunchReadiness,
  getRenewalEvidence,
  validateIwo,
} from "@/lib/forms/iwo-provenance";
import {
  IWO_NEUTRAL_COPY,
  getCountyIwoWorkflow,
  getOpeningPacketForms,
  getProveUpPacketForms,
  isCanonicalCountyId,
  resolveIwoWorkflow,
} from "@/lib/counties/county-iwo-workflow";

/** The guarded artifact lives OUTSIDE public/ and is never statically served. */
const REAL_ARTIFACT_DIR = path.join(process.cwd(), "private", "official-forms");

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "fs-iwo-test-"));
}

/** A dir containing a byte-exact copy of the pinned federal IWO. */
function tmpDirWithRealIwo(): string {
  const dir = tmpDir();
  fs.copyFileSync(
    path.join(REAL_ARTIFACT_DIR, IWO_PROVENANCE.file),
    path.join(dir, IWO_PROVENANCE.file),
  );
  return dir;
}

const BEFORE_EXPIRY = new Date("2026-08-10T00:00:00Z");
const PACKET_OPTS = { artifactDir: REAL_ARTIFACT_DIR, today: BEFORE_EXPIRY };

// Chicago-date policy applied to the LEGACY TRANSITION END (2027-08-25), which
// is the operative cutoff — not the 2026-08-31 date printed on the form, and not
// the 2029-08-31 collection approval expiration. The whole 2027-08-25 local day
// is blocked.
const LAST_ALLOWED_INSTANT = new Date("2027-08-25T04:59:59.999Z"); // 2027-08-24 CDT
const TRANSITION_CUTOFF = new Date("2027-08-25T05:00:00Z"); // 2027-08-25 00:00 CDT
const RETIRED_UTC_CUTOFF = new Date("2027-08-25T23:59:59Z"); // a UTC-day rule would allow this
const JUST_AFTER_TRANSITION = new Date("2027-08-26T00:00:00Z");

/** Far enough out that the 60-day renewal-review window is not yet open. */
const WELL_BEFORE_EXPIRY = new Date("2026-05-01T12:00:00Z");
const CONFIRMED_RENEWAL = {
  status: "confirmed" as const,
  reviewedOn: "2026-05-01",
  source: "test-only injected evidence",
};
const PENDING_RENEWAL = {
  status: "pending" as const,
  reviewedOn: "2026-07-21",
  source: "test-only injected evidence",
};

/** Renewal is injected as a dependency; there is no mutable global to toggle. */
function withOpenFederalGate<T>(fn: () => T): T {
  return fn();
}
const OPEN_GATE_OPTS = {
  artifactDir: REAL_ARTIFACT_DIR,
  today: WELL_BEFORE_EXPIRY,
  renewalEvidence: CONFIRMED_RENEWAL,
};
/**
 * A closed federal gate under the CURRENT evidence. Renewal is confirmed in
 * pinned evidence as of 2026-09-01, so a closed gate is now reached by running
 * the clock past the legacy transition end — not by leaving renewal pending.
 */
const CLOSED_GATE_OPTS = {
  artifactDir: REAL_ARTIFACT_DIR,
  today: TRANSITION_CUTOFF,
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. Will IWO is not universally added to opening/prove-up packets.
// ─────────────────────────────────────────────────────────────────────────────
describe("Will IWO packet placement", () => {
  it("does not auto-add the IWO to the Will opening packet, even with the gate open", () => {
    const packet = withOpenFederalGate(() => getOpeningPacketForms("will", true, OPEN_GATE_OPTS));
    expect(packet.forms.map((f) => f.id)).not.toContain("income-withholding-order");
  });

  it("does not auto-add the IWO to the Will prove-up packet", () => {
    const packet = withOpenFederalGate(() => getProveUpPacketForms("will", true, OPEN_GATE_OPTS));
    expect(packet.forms.map((f) => f.id)).not.toContain("income-withholding-order");
  });

  it("surfaces the Will IWO as a deferred manual-review item rather than dropping it silently", () => {
    const packet = getOpeningPacketForms("will", true, PACKET_OPTS);
    const deferred = packet.deferred.find((d) => d.formId === "income-withholding-order");
    expect(deferred).toBeDefined();
    expect(deferred!.disposition).toBe("manual_conditional");
    expect(deferred!.copy.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11 + federal gate applies to ALL counties.
// ─────────────────────────────────────────────────────────────────────────────
describe("non-Will county behavior", () => {
  it.each(["cook", "lake", "dupage", "kane"])(
    "%s keeps its statewide-default packet composition ONLY while the federal gate is open",
    (countyId) => {
      const open = withOpenFederalGate(() => getOpeningPacketForms(countyId, true, OPEN_GATE_OPTS));
      expect(open.forms.map((f) => f.id)).toContain("income-withholding-order");
      expect(open.deferred).toHaveLength(0);
      expect(getCountyIwoWorkflow(countyId).disposition).toBe("statewide_default");
    },
  );

  it.each(["cook", "lake", "dupage", "kane"])(
    "%s withholds the IWO when the federal gate is closed",
    (countyId) => {
      // The legacy transition period has ended, so the gate is closed.
      const packet = getOpeningPacketForms(countyId, true, CLOSED_GATE_OPTS);
      expect(packet.forms.map((f) => f.id)).not.toContain("income-withholding-order");
      const deferred = packet.deferred.find((d) => d.formId === "income-withholding-order");
      expect(deferred).toBeDefined();
      expect(deferred!.reasonCodes).toContain("federal_artifact_gate_closed");
    },
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Unknown / blank / malformed / noncanonical county ids fail closed.
// ─────────────────────────────────────────────────────────────────────────────
describe("county identity fails closed", () => {
  const BAD_IDS = ["", "   ", "Will", "WILL", "Will County", "cook ", "../will", "0", "wi-ll", "notacounty"];

  it.each(BAD_IDS)("rejects %p as a canonical county id", (id) => {
    expect(isCanonicalCountyId(id)).toBe(false);
  });

  it.each([null, undefined, 42, {}, []])("rejects non-string %p", (id) => {
    expect(isCanonicalCountyId(id)).toBe(false);
  });

  it.each(["cook", "will", "dupage", "lake", "kane"])("accepts canonical id %p", (id) => {
    expect(isCanonicalCountyId(id)).toBe(true);
  });

  it.each(BAD_IDS)("routes %p to manual review rather than statewide_default", (id) => {
    expect(getCountyIwoWorkflow(id).disposition).toBe("manual_conditional");
    expect(getCountyIwoWorkflow(id).autoPacketPlacementAllowed).toBe(false);
  });

  it("does not restate Will's specific conflict for an unknown county", () => {
    const state = withOpenFederalGate(() =>
      resolveIwoWorkflow({ countyId: "notacounty", artifactDir: REAL_ARTIFACT_DIR, today: WELL_BEFORE_EXPIRY, renewalEvidence: CONFIRMED_RENEWAL }),
    );
    expect(state.reasonCodes).toContain("county_unknown_or_noncanonical");
    expect(state.reasonCodes).not.toContain("will_local_rule_vs_statewide_filing_conflict");
    expect(getCountyIwoWorkflow("notacounty").conflict.localRule).toBeNull();
  });

  it("withholds the IWO from an unknown county's packet even with the gate open", () => {
    const packet = withOpenFederalGate(() => getOpeningPacketForms("notacounty", true, OPEN_GATE_OPTS));
    expect(packet.forms.map((f) => f.id)).not.toContain("income-withholding-order");
    expect(packet.deferred[0].reasonCodes).toContain("county_unknown_or_noncanonical");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Will returns a stable manual_conditional state and reason codes.
// ─────────────────────────────────────────────────────────────────────────────
describe("Will manual_conditional state", () => {
  it("reports manual_conditional with a stable, machine-readable reason set", () => {
    const state = resolveIwoWorkflow({ countyId: "will", artifactDir: REAL_ARTIFACT_DIR, today: BEFORE_EXPIRY });
    expect(state.disposition).toBe("manual_conditional");
    expect(state.requiresManualReview).toBe(true);
    expect(state.reasonCodes).toEqual(
      expect.arrayContaining([
        "will_local_rule_vs_statewide_filing_conflict",
        "judge_direction_required",
        "packet_placement_not_established",
      ]),
    );
    // Stability: codes are sorted and duplicate-free, so consumers can snapshot them.
    expect(state.reasonCodes).toEqual([...new Set(state.reasonCodes)].sort());
  });

  it("preserves case data without fabricating a completed workflow", () => {
    const state = resolveIwoWorkflow({ countyId: "will", artifactDir: REAL_ARTIFACT_DIR, today: BEFORE_EXPIRY });
    expect(state.completed).toBe(false);
    expect(state.pathDecision).toBe("undetermined_manual_review");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. IWO and ATJ 129.5 remain distinct.
// ─────────────────────────────────────────────────────────────────────────────
describe("instrument identity", () => {
  it("treats the IWO, the Withholding Order, and OMB 0970-0154 as the same instrument", () => {
    const { instrument } = getCountyIwoWorkflow("will");
    expect(instrument.ombNumber).toBe("0970-0154");
    expect(instrument.sameInstrumentAliases).toEqual(
      expect.arrayContaining(["Income Withholding for Support", "Withholding Order"]),
    );
  });

  it("keeps the Support Order (ATJ 129.5) distinct from the IWO", () => {
    const { instrument } = getCountyIwoWorkflow("will");
    expect(instrument.supportOrderFormCode).toBe("ATJ 129.5");
    expect(instrument.supportOrderIsDistinctFromIwo).toBe(true);
    expect(instrument.sameInstrumentAliases).not.toContain("ATJ 129.5");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. File vs. do-not-file conflict never resolves silently.
// ─────────────────────────────────────────────────────────────────────────────
describe("filing conflict is never silently resolved", () => {
  it("does not collapse the local-rule/statewide conflict into an automatic decision", () => {
    const state = resolveIwoWorkflow({ countyId: "will", artifactDir: REAL_ARTIFACT_DIR, today: BEFORE_EXPIRY });
    expect(state.lanes.postServiceFiling.decision).toBe("conditional_unresolved");
    expect(state.lanes.postServiceFiling.autoDecided).toBe(false);
    expect(state.reasonCodes).toContain("will_local_rule_vs_statewide_filing_conflict");
  });

  it("records both conflicting instructions without ranking them", () => {
    const { conflict } = getCountyIwoWorkflow("will");
    expect(conflict.localRule).toMatch(/8\.09/);
    expect(conflict.statewideInstruction).toMatch(/127\.3/);
    expect(conflict.resolved).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Judge / proposed-order / employer-change paths require manual resolution.
// ─────────────────────────────────────────────────────────────────────────────
describe("case-specific lanes require manual resolution", () => {
  it("gates employer service, proposed-order submission, and filing behind case-specific direction", () => {
    const state = resolveIwoWorkflow({ countyId: "will", artifactDir: REAL_ARTIFACT_DIR, today: BEFORE_EXPIRY });
    expect(state.lanes.employerService.decision).toBe("conditional_unresolved");
    expect(state.lanes.proposedOrder.decision).toBe("conditional_unresolved");
    expect(state.lanes.noticeProof.decision).toBe("conditional_unresolved");
  });

  it("treats the employer-change scenario as its own conditional lane, not a rule", () => {
    const state = resolveIwoWorkflow({
      countyId: "will",
      artifactDir: REAL_ARTIFACT_DIR,
      today: BEFORE_EXPIRY,
      employerChanged: true,
    });
    expect(state.reasonCodes).toContain("employer_change_scenario_conditional");
    expect(state.pathDecision).toBe("undetermined_manual_review");
  });

  it("still refuses to claim a completed workflow even when judge direction is supplied", () => {
    const state = resolveIwoWorkflow({
      countyId: "will",
      artifactDir: REAL_ARTIFACT_DIR,
      today: BEFORE_EXPIRY,
      caseSpecificDirection: "file_after_employer_service",
    });
    expect(state.lanes.postServiceFiling.decision).toBe("directed_by_case_specific_input");
    expect(state.lanes.postServiceFiling.autoDecided).toBe(false);
    expect(state.completed).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Missing / invalid / wrong-hash IWO fails closed.
// ─────────────────────────────────────────────────────────────────────────────
describe("federal IWO provenance fails closed", () => {
  it("flags a missing IWO", () => {
    const v = validateIwo(tmpDir(), BEFORE_EXPIRY);
    expect(v.present).toBe(false);
    expect(v.provenanceValid).toBe(false);
    expect(v.blockers).toContain("missing_federal_iwo");
  });

  it("rejects a wrong-hash file that merely has the right filename", () => {
    const dir = tmpDir();
    fs.writeFileSync(path.join(dir, IWO_PROVENANCE.file), "%PDF-1.6\nnot the real federal print\n");
    const v = validateIwo(dir, BEFORE_EXPIRY);
    expect(v.present).toBe(true);
    expect(v.sha256Match).toBe(false);
    expect(v.provenanceValid).toBe(false);
    expect(v.blockers).toContain("invalid_federal_iwo_provenance");
  });

  it("rejects a truncated copy of the real print", () => {
    const dir = tmpDir();
    const real = fs.readFileSync(path.join(REAL_ARTIFACT_DIR, IWO_PROVENANCE.file));
    fs.writeFileSync(path.join(dir, IWO_PROVENANCE.file), real.subarray(0, real.length - 1));
    const v = validateIwo(dir, BEFORE_EXPIRY);
    expect(v.bytesMatch).toBe(false);
    expect(v.provenanceValid).toBe(false);
  });

  it("accepts only the byte-exact pinned federal print", () => {
    const v = validateIwo(tmpDirWithRealIwo(), BEFORE_EXPIRY);
    expect(v.sha256).toBe(IWO_PROVENANCE.expectedSha256);
    expect(v.bytes).toBe(IWO_PROVENANCE.expectedBytes);
    expect(v.provenanceValid).toBe(true);
  });

  it("keeps the Will workflow from presenting an unverifiable IWO as ready", () => {
    const state = resolveIwoWorkflow({ countyId: "will", artifactDir: tmpDir(), today: BEFORE_EXPIRY });
    expect(state.federalForm.usable).toBe(false);
    expect(state.federalForm.blockers).toContain("missing_federal_iwo");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Chicago-date expiration boundary (controller-adopted policy).
// ─────────────────────────────────────────────────────────────────────────────
describe("legacy-transition boundary — America/Chicago calendar date", () => {
  const dir = tmpDirWithRealIwo();

  it("pins the three dates under three distinct names", () => {
    expect(IWO_PROVENANCE.printedLegacyPdfDate).toBe("2026-08-31");
    expect(IWO_PROVENANCE.collectionApprovalExpiresOn).toBe("2029-08-31");
    expect(IWO_PROVENANCE.legacyTransitionFirstBlockedDate).toBe("2027-08-25");
    // The retired single `expiration` field must not come back: one generic name
    // for three different facts is the defect PR-2A closed.
    expect(IWO_PROVENANCE).not.toHaveProperty("expiration");
  });

  it("maps the cutoff instant to the 2027-08-25 Chicago calendar date", () => {
    expect(calendarDateInTimeZone(LAST_ALLOWED_INSTANT, "America/Chicago")).toBe("2027-08-24");
    expect(calendarDateInTimeZone(TRANSITION_CUTOFF, "America/Chicago")).toBe("2027-08-25");
  });

  it("is not expired at the last allowed instant, 2027-08-25T04:59:59.999Z", () => {
    const v = validateIwo(dir, LAST_ALLOWED_INSTANT);
    expect(v.legacyTransitionBlocked).toBe(false);
    expect(v.blockers).toEqual([]);
  });

  it("is expired at the cutoff, 2027-08-25T05:00:00Z", () => {
    const v = validateIwo(dir, TRANSITION_CUTOFF);
    expect(v.legacyTransitionBlocked).toBe(true);
    expect(v.blockers).toContain("federal_iwo_expired");
  });

  it("blocks the ENTIRE cutoff day — 2027-08-25T23:59:59Z is expired", () => {
    expect(validateIwo(dir, RETIRED_UTC_CUTOFF).legacyTransitionBlocked).toBe(true);
  });

  it("remains expired the following day", () => {
    expect(validateIwo(dir, JUST_AFTER_TRANSITION).legacyTransitionBlocked).toBe(true);
  });

  it("the printed 2026-08-31 date does not close the gate", () => {
    // The old operative cutoff, one day into what used to be refusal territory.
    const v = validateIwo(dir, new Date("2026-08-31T05:00:00Z"));
    expect(v.legacyTransitionBlocked).toBe(false);
    expect(v.blockers).toEqual([]);
  });

  it("the 2029 collection approval does not authorize the legacy print past 2027-08-25", () => {
    // Well inside the collection's approval window, well past the transition end.
    const v = validateIwo(dir, new Date("2028-06-01T12:00:00Z"));
    expect(v.daysToCollectionApprovalExpiresOn).toBeGreaterThan(0);
    expect(v.legacyTransitionBlocked).toBe(true);
    expect(v.blockers).toContain("federal_iwo_expired");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8 & 9. Readiness stays HOLD after expiration, and while renewal is pending.
// ─────────────────────────────────────────────────────────────────────────────
describe("launch readiness", () => {
  const dir = tmpDirWithRealIwo();

  it("holds after the legacy transition ends, even with every other confirmation supplied", () => {
    const r = withOpenFederalGate(() =>
      computeLaunchReadiness({
        brokenActive: 0,
        unsupportedGaps: 0,
        formsDir: dir,
        iwoArtifactDir: dir,
        today: TRANSITION_CUTOFF,
        countyPacketComposition: "confirmed",
        countyEfilingTreatment: "confirmed",
      }),
    );
    expect(r.launchReadiness).toBe("HOLD");
    expect(r.blockers).toContain("federal_iwo:federal_iwo_expired");
  });

  it("holds while OMB renewal review is pending, even inside the transition window", () => {
    // Renewal is now CONFIRMED in pinned evidence, so this branch is reached by
    // injecting pending evidence — the state a future re-pin would restore.
    const r = computeLaunchReadiness({
      brokenActive: 0,
      unsupportedGaps: 0,
      formsDir: dir,
      iwoArtifactDir: dir,
      today: BEFORE_EXPIRY,
      countyPacketComposition: "confirmed",
      countyEfilingTreatment: "confirmed",
      renewalEvidence: PENDING_RENEWAL,
    });
    expect(r.launchReadiness).toBe("HOLD");
    expect(r.blockers).toContain("omb_renewal_review:pending");
  });

  it("defaults to HOLD with no injected confirmations", () => {
    const r = computeLaunchReadiness({
      brokenActive: 0,
      unsupportedGaps: 0,
      formsDir: dir,
      iwoArtifactDir: dir,
      today: BEFORE_EXPIRY,
    });
    expect(r.launchReadiness).toBe("HOLD");
  });

  it("pins renewal as evidence, not a caller argument", () => {
    // Pinned evidence moved to confirmed on 2026-09-01 (OIRA ICR 202607-0970-002).
    expect(getRenewalEvidence().status).toBe("confirmed");
    expect(getRenewalEvidence().reviewedOn).toBe("2026-09-01");

    // The invariant is unchanged and still asserted the same way: with pending
    // evidence in force, the public input type has no ombRenewalReview field and
    // passing one is inert — a caller cannot clear a pending renewal.
    const r = computeLaunchReadiness({
      brokenActive: 0,
      unsupportedGaps: 0,
      formsDir: dir,
      iwoArtifactDir: dir,
      today: BEFORE_EXPIRY,
      countyPacketComposition: "confirmed",
      countyEfilingTreatment: "confirmed",
      renewalEvidence: PENDING_RENEWAL,
      // @ts-expect-error runtime callers must not be able to clear a pending renewal
      ombRenewalReview: "resolved",
    });
    expect(r.launchReadiness).toBe("HOLD");
    expect(r.blockers).toContain("omb_renewal_review:pending");
  });

  it("can reach READY on confirmed evidence inside the transition window", () => {
    // Proof the gate can actually move: this is the state PR-2A creates, and it
    // is why the evidence split matters. Not a legal-acceptance conclusion.
    //
    // The non-IWO required forms are presence-checked only, so placeholders are
    // sufficient here; the IWO itself is still the byte-exact pinned print.
    const readyDir = tmpDirWithRealIwo();
    for (const f of REQUIRED_LAUNCH_FORMS) {
      if (f === IWO_PROVENANCE.file) continue;
      fs.writeFileSync(path.join(readyDir, f), "placeholder");
    }
    const r = computeLaunchReadiness({
      brokenActive: 0,
      unsupportedGaps: 0,
      formsDir: readyDir,
      iwoArtifactDir: readyDir,
      today: BEFORE_EXPIRY,
      countyPacketComposition: "confirmed",
      countyEfilingTreatment: "confirmed",
    });
    expect(r.launchReadiness).toBe("READY");
    expect(r.blockers).toEqual([]);
  });

  it("exposes no mutable global renewal override", async () => {
    const mod = await import("@/lib/forms/iwo-provenance");
    expect(Object.keys(mod)).not.toContain("__withRenewalEvidenceForTests");
    expect(getRenewalEvidence().status).toBe("confirmed");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. Unsupported field mappings remain skipped; no fake PDF fields go active.
// ─────────────────────────────────────────────────────────────────────────────
describe("no fabricated field mappings", () => {
  it("does not introduce any field mapping for the IWO", async () => {
    const { getFieldMapping } = await import("@/lib/document-generation/official-forms/field-mappings");
    expect(getFieldMapping("income-withholding-order")).toEqual([]);
  });

  it("does not mark the IWO as a generatable/fillable form anywhere in the workflow", () => {
    const state = resolveIwoWorkflow({ countyId: "will", artifactDir: REAL_ARTIFACT_DIR, today: BEFORE_EXPIRY });
    expect(state.federalForm.fillable).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. Neutral copy contains no legal advice, guarantee, or universal claim.
// ─────────────────────────────────────────────────────────────────────────────
describe("neutral explanatory copy", () => {
  const BANNED = [
    /\bwe recommend\b/i,
    /\byou should\b/i,
    /\byou must\b/i,
    /\bguarantee[ds]?\b/i,
    /\balways file\b/i,
    /\bnever file\b/i,
    /\bis required in all\b/i,
  ];

  it("exposes copy for the Will manual_conditional state", () => {
    expect(IWO_NEUTRAL_COPY.will.length).toBeGreaterThan(0);
  });

  it.each(Object.keys(IWO_NEUTRAL_COPY))("%s copy avoids advice/guarantee/universal phrasing", (key) => {
    for (const line of IWO_NEUTRAL_COPY[key as keyof typeof IWO_NEUTRAL_COPY]) {
      for (const pattern of BANNED) {
        expect(line).not.toMatch(pattern);
      }
    }
  });

  it("states the non-decision explicitly rather than implying a path", () => {
    const joined = IWO_NEUTRAL_COPY.will.join(" ");
    expect(joined).toMatch(/varies|depends|case-specific|not established/i);
  });
});
