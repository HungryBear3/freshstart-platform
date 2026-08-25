/**
 * @jest-environment node
 *
 * Federal IWO refusal-copy split (C-2/C-3/C-5) and the closed-gate workflow
 * correction (F-3), per the corrected design
 * `COWORK-FINAL-HANDOFF-REVISION-20260824.md` and the owner copy approval of
 * 2026-08-24.
 *
 * The defect these tests close: ONE sentence served every closed-gate cause and
 * said the form's "published information-collection approval is under renewal
 * review". That is true only while a renewal is actually pending. For a missing
 * file, a byte mismatch, or a reached expiration it stated something untrue to
 * the user.
 *
 * Copy assertions here are EXACT. These strings are legally reviewed and
 * approved verbatim; a near-match is a failure, not a nit.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  IWO_OPERATIVE_REFUSAL_COPY,
  operativeRefusalCopy,
  selectOperativeRefusal,
  withheldItemsNotice,
  type IwoOperativeRefusal,
} from "@/lib/forms/iwo-refusal-copy";
import { IWO_PROVENANCE, validateIwo } from "@/lib/forms/iwo-provenance";
import { getIwoAvailability } from "@/lib/forms/official-artifact-access";
import { filterIwoFromPackage } from "@/lib/forms/iwo-package-guard";
import { resolveIwoWorkflow } from "@/lib/counties/county-iwo-workflow";

const REAL_ARTIFACT_DIR = path.join(process.cwd(), "private", "official-forms");

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "fs-iwo-copy-test-"));
}

function tmpDirWithRealIwo(): string {
  const dir = tmpDir();
  fs.copyFileSync(
    path.join(REAL_ARTIFACT_DIR, IWO_PROVENANCE.file),
    path.join(dir, IWO_PROVENANCE.file),
  );
  return dir;
}

function tmpDirWithWrongBytes(): string {
  const dir = tmpDir();
  fs.writeFileSync(path.join(dir, IWO_PROVENANCE.file), "%PDF-1.7\nnot the federal print\n");
  return dir;
}

const RENEWAL_CONFIRMED = {
  status: "confirmed" as const,
  reviewedOn: "2026-05-01",
  source: "test-injected",
};
const RENEWAL_PENDING = {
  status: "pending" as const,
  reviewedOn: "2026-07-21",
  source: "test-injected",
};

/** >60 days before expiry: the renewal-review window is not open on its own. */
const OPEN_CLOCK = new Date("2026-05-01T12:00:00Z");
/** 2026-08-31 00:00 CDT — the first blocked Chicago calendar day. */
const EXPIRED_CLOCK = new Date("2026-08-31T05:00:00Z");

/** A canonical statewide-default county. Not Will, not free text. */
const STATEWIDE_COUNTY = "cook";

const ALL_CODES: IwoOperativeRefusal[] = [
  "federal_form_authority_expired",
  "federal_form_renewal_pending",
  "federal_artifact_provenance_failed",
  "federal_artifact_missing",
];

// ─────────────────────────────────────────────────────────────────────────────
// The approved strings, verbatim. Any edit to the copy module fails here first.
// ─────────────────────────────────────────────────────────────────────────────
const APPROVED = {
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
} as const;

describe("approved copy is carried verbatim", () => {
  it.each(ALL_CODES)("%s matches the approved block exactly", (code) => {
    expect(operativeRefusalCopy(code)).toEqual([...APPROVED[code]]);
  });

  it("defines exactly the four operative codes — no fifth state is synthesized", () => {
    // R-1: a configuration-error refusal belongs to PR-2, once the authorization
    // -window registry that can produce one exists. PR-1 must not invent it.
    expect(Object.keys(IWO_OPERATIVE_REFUSAL_COPY).sort()).toEqual([...ALL_CODES].sort());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T-68 / T-69 / T-70 — the cause named is the cause that closed the gate.
// ─────────────────────────────────────────────────────────────────────────────
describe("operative code selection", () => {
  it("T-69: a reached expiration selects federal_form_authority_expired", () => {
    expect(selectOperativeRefusal(["federal_iwo_expired"])).toBe("federal_form_authority_expired");
  });

  it("T-68: post-cutoff copy does NOT claim a renewal review", () => {
    const copy = operativeRefusalCopy("federal_form_authority_expired").join(" ");
    expect(copy).not.toMatch(/renewal/i);
    expect(copy).toMatch(
      /the period Fresh Start is authorized to distribute the selected version has ended/,
    );
  });

  it("T-70: renewal-pending-before-cutoff copy still says renewal review", () => {
    expect(selectOperativeRefusal(["omb_renewal_review_pending"])).toBe(
      "federal_form_renewal_pending",
    );
    expect(operativeRefusalCopy("federal_form_renewal_pending").join(" ")).toMatch(
      /under renewal review/,
    );
  });

  it("maps a missing file and a byte mismatch to their own causes", () => {
    expect(selectOperativeRefusal(["missing_federal_iwo"])).toBe("federal_artifact_missing");
    expect(selectOperativeRefusal(["invalid_federal_iwo_provenance"])).toBe(
      "federal_artifact_provenance_failed",
    );
  });

  it("puts artifact integrity ahead of the authority window when both are true", () => {
    // An absent file on an expired date: "we do not hold a verified copy" is the
    // statement that is unconditionally true, so it is the one reported.
    expect(selectOperativeRefusal(["missing_federal_iwo", "federal_iwo_expired"])).toBe(
      "federal_artifact_missing",
    );
    expect(selectOperativeRefusal(["invalid_federal_iwo_provenance", "federal_iwo_expired"])).toBe(
      "federal_artifact_provenance_failed",
    );
  });

  it("returns null rather than borrowing a message for an unknown blocker", () => {
    expect(selectOperativeRefusal(["something_else"])).toBeNull();
    expect(selectOperativeRefusal([])).toBeNull();
  });

  it("INVARIANT: every blocker validateIwo can emit has an operative code", () => {
    // Guarantees the null branch above is unreachable from real validation, so
    // no refusal can ever ship with empty copy.
    const observed = new Set<string>();
    for (const [dir, today, renewal] of [
      [tmpDir(), OPEN_CLOCK, RENEWAL_CONFIRMED],
      [tmpDirWithWrongBytes(), OPEN_CLOCK, RENEWAL_CONFIRMED],
      [tmpDirWithRealIwo(), EXPIRED_CLOCK, RENEWAL_CONFIRMED],
      [tmpDirWithRealIwo(), OPEN_CLOCK, RENEWAL_PENDING],
    ] as const) {
      for (const b of validateIwo(dir, today, renewal).blockers) observed.add(b);
    }
    expect(observed.size).toBe(4);
    for (const b of observed) expect(selectOperativeRefusal([b])).not.toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T-71 — no advice, no instruction to act, no acceptance claim.
// ─────────────────────────────────────────────────────────────────────────────
describe("T-71: copy makes no advisory or acceptance claim", () => {
  const BANNED = [
    /\byou (should|must|need to|have to)\b/i,
    /\bwe recommend\b/i,
    /\bguarantee/i,
    /\bwill be accepted\b/i,
    /\bis (still )?valid\b/i,
    /\bcourts? (will|accepts?)\b/i,
    /\bfile this\b/i,
    /\balways\b/i,
    /\bnever\b/i,
  ];

  it.each(ALL_CODES)("%s avoids advisory and acceptance phrasing", (code) => {
    const copy = operativeRefusalCopy(code).join(" ");
    for (const pattern of BANNED) expect(copy).not.toMatch(pattern);
    expect(copy).toMatch(/not legal advice/);
    // States only Fresh Start's own conduct, never a federal or court outcome.
    expect(copy).toMatch(/Fresh Start/);
  });

  it("never asserts anything about present federal approval status", () => {
    for (const code of ALL_CODES) {
      const copy = operativeRefusalCopy(code).join(" ");
      expect(copy).not.toMatch(/\bOMB (has|approved|extended)\b/i);
      expect(copy).not.toMatch(/\bis (currently )?approved\b/i);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// A -> D, B -> D, C -> D, driven through the REAL access boundary.
// ─────────────────────────────────────────────────────────────────────────────
describe("state transitions produce the right exact copy", () => {
  it("A -> D (authorized print, window reached): expired copy, no renewal claim", () => {
    const a = getIwoAvailability({
      countyId: STATEWIDE_COUNTY,
      artifactDir: tmpDirWithRealIwo(),
      today: EXPIRED_CLOCK,
      renewalEvidence: RENEWAL_CONFIRMED,
    });
    expect(a.available).toBe(false);
    expect(a.refusal).toBe("federal_artifact_gate_closed");
    expect(a.operativeRefusal).toBe("federal_form_authority_expired");
    expect(a.copy).toEqual([...APPROVED.federal_form_authority_expired]);
    expect(a.copy.join(" ")).not.toMatch(/renewal/i);
  });

  it("B -> D (renewal pending, window still open): renewal copy", () => {
    const b = getIwoAvailability({
      countyId: STATEWIDE_COUNTY,
      artifactDir: tmpDirWithRealIwo(),
      today: OPEN_CLOCK,
      renewalEvidence: RENEWAL_PENDING,
    });
    expect(b.available).toBe(false);
    expect(b.operativeRefusal).toBe("federal_form_renewal_pending");
    expect(b.copy).toEqual([...APPROVED.federal_form_renewal_pending]);
  });

  it("C -> D (pinned bytes do not match): provenance copy, no renewal claim", () => {
    const c = getIwoAvailability({
      countyId: STATEWIDE_COUNTY,
      artifactDir: tmpDirWithWrongBytes(),
      today: OPEN_CLOCK,
      renewalEvidence: RENEWAL_CONFIRMED,
    });
    expect(c.available).toBe(false);
    expect(c.operativeRefusal).toBe("federal_artifact_provenance_failed");
    expect(c.copy).toEqual([...APPROVED.federal_artifact_provenance_failed]);
    expect(c.copy.join(" ")).not.toMatch(/renewal|expire/i);
  });

  it("C -> D (file absent): missing copy, no renewal or expiry claim", () => {
    const c = getIwoAvailability({
      countyId: STATEWIDE_COUNTY,
      artifactDir: tmpDir(),
      today: OPEN_CLOCK,
      renewalEvidence: RENEWAL_CONFIRMED,
    });
    expect(c.available).toBe(false);
    expect(c.operativeRefusal).toBe("federal_artifact_missing");
    expect(c.copy).toEqual([...APPROVED.federal_artifact_missing]);
    expect(c.copy.join(" ")).not.toMatch(/renewal|expire/i);
  });

  it("the retired single false sentence is gone from every closed state", () => {
    for (const [dir, today, renewal] of [
      [tmpDir(), OPEN_CLOCK, RENEWAL_CONFIRMED],
      [tmpDirWithWrongBytes(), OPEN_CLOCK, RENEWAL_CONFIRMED],
      [tmpDirWithRealIwo(), EXPIRED_CLOCK, RENEWAL_CONFIRMED],
    ] as const) {
      const a = getIwoAvailability({
        countyId: STATEWIDE_COUNTY,
        artifactDir: dir,
        today,
        renewalEvidence: renewal,
      });
      expect(a.copy.join(" ")).not.toMatch(/published information-collection approval/);
    }
  });

  it("county refusals keep their own copy and carry no operative federal code", () => {
    const will = getIwoAvailability({
      countyId: "will",
      artifactDir: tmpDirWithRealIwo(),
      today: OPEN_CLOCK,
      renewalEvidence: RENEWAL_CONFIRMED,
    });
    expect(will.refusal).toBe("county_manual_conditional");
    expect(will.operativeRefusal).toBeNull();

    const unknown = getIwoAvailability({
      countyId: "Cook County",
      artifactDir: tmpDirWithRealIwo(),
      today: OPEN_CLOCK,
      renewalEvidence: RENEWAL_CONFIRMED,
    });
    expect(unknown.refusal).toBe("county_unknown_or_noncanonical");
    expect(unknown.operativeRefusal).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T-48 — the F-3 fix. All FOUR properties, not copy alone.
// ─────────────────────────────────────────────────────────────────────────────
describe("T-48: statewide-default county with the federal gate closed", () => {
  const CLOSED_CASES = [
    ["expired", tmpDirWithRealIwo, EXPIRED_CLOCK, RENEWAL_CONFIRMED, "federal_form_authority_expired"],
    ["renewal pending", tmpDirWithRealIwo, OPEN_CLOCK, RENEWAL_PENDING, "federal_form_renewal_pending"],
    ["wrong bytes", tmpDirWithWrongBytes, OPEN_CLOCK, RENEWAL_CONFIRMED, "federal_artifact_provenance_failed"],
    ["missing file", tmpDir, OPEN_CLOCK, RENEWAL_CONFIRMED, "federal_artifact_missing"],
  ] as const;

  it.each(CLOSED_CASES)(
    "%s: asserts all four closed-gate properties",
    (_label, dirFactory, today, renewalEvidence, expectedCode) => {
      const state = resolveIwoWorkflow({
        countyId: STATEWIDE_COUNTY,
        artifactDir: dirFactory(),
        today,
        renewalEvidence,
      });

      expect(state.federalForm.usable).toBe(false);

      // 1. the closed gate is reported in the machine-readable reason codes
      expect(state.reasonCodes).toContain("federal_artifact_gate_closed");

      // 2. the path decision cannot be read as the open statewide path
      expect(state.pathDecision).not.toBe("statewide_serve_employer_do_not_file");
      expect(state.pathDecision).toBe("undetermined_manual_review");

      // 3. manual/blocked handling is consistent with the closed gate
      expect(state.requiresManualReview).toBe(true);
      expect(state.completed).toBe(false);
      for (const lane of Object.values(state.lanes)) {
        expect(lane.decision).toBe("conditional_unresolved");
        expect(lane.autoDecided).toBe(false);
      }

      // 4. the copy is the exact operative refusal copy
      expect(state.copy).toEqual([...APPROVED[expectedCode]]);
      expect(state.copy.join(" ")).not.toMatch(/served on the employer/);
    },
  );

  it("still returns the open statewide path when the gate is genuinely open", () => {
    const state = resolveIwoWorkflow({
      countyId: STATEWIDE_COUNTY,
      artifactDir: tmpDirWithRealIwo(),
      today: OPEN_CLOCK,
      renewalEvidence: RENEWAL_CONFIRMED,
    });
    expect(state.federalForm.usable).toBe(true);
    expect(state.pathDecision).toBe("statewide_serve_employer_do_not_file");
    expect(state.requiresManualReview).toBe(false);
    expect(state.reasonCodes).toEqual([]);
    expect(state.copy.join(" ")).toMatch(/served on the employer/);
  });

  it("leaves Will County's manual/conditional handling unchanged", () => {
    const state = resolveIwoWorkflow({
      countyId: "will",
      artifactDir: tmpDirWithRealIwo(),
      today: OPEN_CLOCK,
      renewalEvidence: RENEWAL_CONFIRMED,
    });
    expect(state.pathDecision).toBe("undetermined_manual_review");
    expect(state.reasonCodes).toContain("will_local_rule_vs_statewide_filing_conflict");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T-77 — 00_WITHHELD_ITEMS.txt names the refusal that actually applied.
// ─────────────────────────────────────────────────────────────────────────────
describe("T-77: package withholding disclosure", () => {
  const IWO_DOC = {
    type: "income-withholding-order",
    fileName: "income-withholding-order.pdf",
    content: null,
    mimeType: "application/pdf",
  };
  const PETITION_DOC = {
    type: "petition",
    fileName: "Petition.pdf",
    content: "cGV0aXRpb24=",
    mimeType: "application/pdf",
  };

  it.each(ALL_CODES)("%s: disclosure interpolates that cause's exact reason", (code) => {
    const notice = withheldItemsNotice(code);
    expect(notice).toHaveLength(1);

    const reason = APPROVED[code][0];
    expect(notice[0]).toBe(
      "Income Withholding for Support form (OMB 0970-0154) — withheld from this package. " +
        `Reason: ${reason} No federal IWO file was included. Fresh Start is not able to tell ` +
        "you whether a court, clerk, or employer will accept a particular version. This is " +
        "procedural information about what Fresh Start distributes, not legal advice.",
    );
    // The bracketed slot is filled, and its period is not doubled.
    expect(notice[0]).not.toMatch(/\[insert/);
    expect(notice[0]).not.toMatch(/\.\./);
  });

  it("a statewide-default package with the gate closed carries that exact text", () => {
    const r = filterIwoFromPackage([PETITION_DOC, IWO_DOC], {
      storedCounty: STATEWIDE_COUNTY,
      today: EXPIRED_CLOCK,
      artifactDir: tmpDirWithRealIwo(),
      renewalEvidence: RENEWAL_CONFIRMED,
    });

    expect(r.included).toEqual([PETITION_DOC]);
    expect(r.withheld.map((w) => w.doc)).toEqual([IWO_DOC]);
    expect(r.refusal).toBe("federal_artifact_gate_closed");
    expect(r.operativeRefusal).toBe("federal_form_authority_expired");
    expect(r.notice).toEqual(withheldItemsNotice("federal_form_authority_expired"));
    // ZERO IWO bytes: the row is excluded outright, not re-encoded or summarized.
    expect(JSON.stringify(r.included)).not.toContain("income-withholding-order");
  });

  it("names renewal review only when renewal review is what closed the gate", () => {
    const pending = filterIwoFromPackage([IWO_DOC], {
      storedCounty: STATEWIDE_COUNTY,
      today: OPEN_CLOCK,
      artifactDir: tmpDirWithRealIwo(),
      renewalEvidence: RENEWAL_PENDING,
    });
    expect(pending.notice!.join(" ")).toMatch(/under renewal review/);

    const expired = filterIwoFromPackage([IWO_DOC], {
      storedCounty: STATEWIDE_COUNTY,
      today: EXPIRED_CLOCK,
      artifactDir: tmpDirWithRealIwo(),
      renewalEvidence: RENEWAL_CONFIRMED,
    });
    expect(expired.notice!.join(" ")).not.toMatch(/renewal/i);
  });

  it("a county refusal keeps its own copy, not the federal disclosure", () => {
    const r = filterIwoFromPackage([IWO_DOC], {
      storedCounty: "will",
      today: OPEN_CLOCK,
      artifactDir: tmpDirWithRealIwo(),
      renewalEvidence: RENEWAL_CONFIRMED,
    });
    expect(r.refusal).toBe("county_manual_conditional");
    expect(r.operativeRefusal).toBeNull();
    expect(r.notice!.join(" ")).toMatch(/Rule 8\.09\(C\)/);
  });
});
