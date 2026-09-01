/**
 * @jest-environment node
 *
 * RUNTIME tests for the guarded federal IWO boundary — the REAL handler built
 * by the route factory, with deterministic clock, pinned renewal evidence, and
 * an injected authoritative county resolver.
 *
 * Every assertion is exact: a specific status, and for refusals, proof that no
 * PDF bytes were emitted. No branch is allowed to pass vacuously.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { NextRequest } from "next/server";

import { IWO_PROVENANCE, type IwoRenewalEvidence } from "@/lib/forms/iwo-provenance";
import { createIwoRouteHandler } from "@/lib/forms/iwo-route-factory";
import {
  dormantCountyResolver,
  type AuthoritativeCountyResolver,
  type CountyResolution,
} from "@/lib/forms/authoritative-county";
import { GUARDED_ARTIFACT_DIR } from "@/lib/forms/official-artifact-access";
import { getCourtFormsReadModel, GUARDED_IWO_HREF } from "@/lib/forms/court-forms-read-model";
import { filterIwoFromPackage, isIwoDocument } from "@/lib/forms/iwo-package-guard";
import { getFormPath, getFormById } from "@/lib/forms/illinois-court-forms";

const RENEWAL_CONFIRMED: IwoRenewalEvidence = {
  status: "confirmed",
  reviewedOn: "2026-05-01",
  source: "test-only injected evidence",
};
const RENEWAL_PENDING: IwoRenewalEvidence = {
  status: "pending",
  reviewedOn: "2026-05-01",
  source: "test-only injected evidence",
};

/** Inside the legacy transition window, and >60 days before the 2029-08-31
 *  collection approval expiration, so the renewal-review window is not open. */
const OPEN_CLOCK = () => new Date("2026-05-01T12:00:00Z");
/** The last instant the legacy print may be distributed: 2027-08-24 23:59:59.999 CDT. */
const LAST_ALLOWED = () => new Date("2027-08-25T04:59:59.999Z");
/** The legacy transition cutoff: 2027-08-25 00:00 CDT. */
const EXPIRED_CLOCK = () => new Date("2027-08-25T05:00:00Z");
/** The date printed on the form. It must NOT close the gate. */
const PRINTED_DATE_CLOCK = () => new Date("2026-08-31T05:00:00Z");

function resolverFor(countyId: string): AuthoritativeCountyResolver {
  return async () => ({ ok: true, countyId });
}
type ResolutionFailure = Extract<CountyResolution, { ok: false }>["reason"];
function failingResolver(reason: ResolutionFailure): AuthoritativeCountyResolver {
  return async () => ({ ok: false, reason });
}

function req(url = "/api/forms/iwo"): NextRequest {
  return new NextRequest(new URL(url, "http://localhost"));
}

/** An authorized, fully-open handler: canonical statewide county, gate open. */
function openHandler(overrides: Partial<Parameters<typeof createIwoRouteHandler>[0]> = {}) {
  return createIwoRouteHandler({
    resolveCounty: resolverFor("cook"),
    now: OPEN_CLOCK,
    renewalEvidence: RENEWAL_CONFIRMED,
    ...overrides,
  });
}

async function expectRefused(res: Response, expectedRefusal?: string) {
  expect(res.status).toBe(403);
  const buf = Buffer.from(await res.clone().arrayBuffer());
  // No PDF magic, and nothing remotely the size of the artifact.
  expect(buf.subarray(0, 5).toString()).not.toBe("%PDF-");
  expect(buf.includes(Buffer.from("%PDF"))).toBe(false);
  expect(buf.length).toBeLessThan(2000);
  expect(res.headers.get("Content-Type")).toMatch(/application\/json/);
  // T-15 is E (403) / N (200): the 200 path already asserted `no-store`, the
  // refusal path did not. A cached refusal is as much a correctness problem as
  // a cached artifact — it can outlive the state that produced it.
  expect(res.headers.get("Cache-Control")).toMatch(/no-store/);
  const body = await res.json();
  expect(body.available).toBe(false);
  if (expectedRefusal) expect(body.refusal).toBe(expectedRefusal);
  return body;
}

// ─────────────────────────────────────────────────────────────────────────────
// POSITIVE control — exact 200, exact bytes.
// ─────────────────────────────────────────────────────────────────────────────
describe("authorized open state", () => {
  it("returns exactly 200 with the exact pinned artifact", async () => {
    const res = await openHandler()(req());

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Length")).toBe(String(IWO_PROVENANCE.expectedBytes));
    expect(res.headers.get("X-Artifact-SHA256")).toBe(IWO_PROVENANCE.expectedSha256);
    expect(res.headers.get("Cache-Control")).toMatch(/no-store/);

    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.length).toBe(IWO_PROVENANCE.expectedBytes);
    expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(crypto.createHash("sha256").update(buf).digest("hex")).toBe(
      IWO_PROVENANCE.expectedSha256,
    );
  });

  it("still serves the exact artifact at the last allowed instant", async () => {
    // 2027-08-25T04:59:59.999Z is 2027-08-24 in Chicago -> inside the transition
    // window. The renewal-review window is measured against the 2029 collection
    // expiration, so it does not close the gate here either. Exact bytes, not
    // merely a 200.
    const res = await openHandler({ now: LAST_ALLOWED })(req());
    expect(res.status).toBe(200);
    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.length).toBe(IWO_PROVENANCE.expectedBytes);
    expect(crypto.createHash("sha256").update(buf).digest("hex")).toBe(
      IWO_PROVENANCE.expectedSha256,
    );
  });

  it("refuses one millisecond later, at the Chicago transition cutoff", async () => {
    const body = await expectRefused(
      await openHandler({ now: EXPIRED_CLOCK })(req()),
      "federal_artifact_gate_closed",
    );
    expect(body.blockers).toContain("federal_iwo_expired");
  });

  it("does NOT refuse on the date printed on the form", async () => {
    // The defect PR-2A closes: 2026-08-31 is display metadata, and after the
    // confirmed OIRA renewal it no longer closes the gate on its own.
    const res = await openHandler({ now: PRINTED_DATE_CLOCK })(req());
    expect(res.status).toBe(200);
    expect(Buffer.from(await res.arrayBuffer()).length).toBe(IWO_PROVENANCE.expectedBytes);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// County substitution — the round-1 defect.
// ─────────────────────────────────────────────────────────────────────────────
describe("county substitution is impossible", () => {
  it("ignores ?county=cook when the case resolves to Will", async () => {
    const handler = createIwoRouteHandler({
      resolveCounty: resolverFor("will"),
      now: OPEN_CLOCK,
      renewalEvidence: RENEWAL_CONFIRMED,
    });
    const body = await expectRefused(
      await handler(req("/api/forms/iwo?county=cook")),
      "county_manual_conditional",
    );
    expect(body.blockers).toContain("county_manual_conditional");
  });

  it.each(["cook", "dupage", "lake", "kane", "will", ""])(
    "gives a Will case the same refusal regardless of ?county=%p",
    async (claimed) => {
      const handler = createIwoRouteHandler({
        resolveCounty: resolverFor("will"),
        now: OPEN_CLOCK,
        renewalEvidence: RENEWAL_CONFIRMED,
      });
      await expectRefused(
        await handler(req(`/api/forms/iwo?county=${encodeURIComponent(claimed)}`)),
        "county_manual_conditional",
      );
    },
  );

  it("does not let a query param rescue a case with no authoritative county", async () => {
    const handler = createIwoRouteHandler({
      resolveCounty: dormantCountyResolver,
      now: OPEN_CLOCK,
      renewalEvidence: RENEWAL_CONFIRMED,
    });
    await expectRefused(await handler(req("/api/forms/iwo?county=cook")), "county_unknown_or_noncanonical");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Every closed branch, asserted exactly.
// ─────────────────────────────────────────────────────────────────────────────
describe("closed states return 403 and zero PDF bytes", () => {
  it("missing case / no session", async () => {
    const handler = openHandler({ resolveCounty: failingResolver("no_authenticated_case") });
    const res = await handler(req());
    const body = await expectRefused(res, "county_unknown_or_noncanonical");
    expect(body.countyResolution).toBe("no_authenticated_case");
    // Stated explicitly for the unauthenticated case, not only via the helper.
    expect(res.headers.get("Cache-Control")).toBe("no-store, max-age=0, must-revalidate");
  });

  it("no stored county", async () => {
    const handler = openHandler({ resolveCounty: failingResolver("no_stored_county") });
    const body = await expectRefused(await handler(req()));
    expect(body.countyResolution).toBe("no_stored_county");
  });

  it("stored county is free text / noncanonical", async () => {
    const handler = openHandler({ resolveCounty: failingResolver("stored_county_not_canonical") });
    const body = await expectRefused(await handler(req()));
    expect(body.countyResolution).toBe("stored_county_not_canonical");
  });

  it("Will (manual/conditional) even with the federal gate open", async () => {
    const handler = openHandler({ resolveCounty: resolverFor("will") });
    await expectRefused(await handler(req()), "county_manual_conditional");
  });

  it("renewal pending", async () => {
    const handler = openHandler({ renewalEvidence: RENEWAL_PENDING });
    const body = await expectRefused(await handler(req()), "federal_artifact_gate_closed");
    expect(body.blockers).toContain("omb_renewal_review_pending");
  });

  it("expired at the Chicago cutoff", async () => {
    const handler = openHandler({ now: EXPIRED_CLOCK });
    const body = await expectRefused(await handler(req()), "federal_artifact_gate_closed");
    expect(body.blockers).toContain("federal_iwo_expired");
  });

  it("missing artifact file", async () => {
    const handler = openHandler({ artifactDir: fs.mkdtempSync(path.join(os.tmpdir(), "iwo-empty-")) });
    const body = await expectRefused(await handler(req()), "federal_artifact_gate_closed");
    expect(body.blockers).toContain("missing_federal_iwo");
  });

  it("wrong-hash artifact with the right filename", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "iwo-bad-"));
    fs.writeFileSync(path.join(dir, IWO_PROVENANCE.file), "%PDF-1.6\nimposter\n");
    const handler = openHandler({ artifactDir: dir });
    const body = await expectRefused(await handler(req()), "federal_artifact_gate_closed");
    expect(body.blockers).toContain("invalid_federal_iwo_provenance");
  });

  it("truncated artifact", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "iwo-trunc-"));
    const real = fs.readFileSync(path.join(GUARDED_ARTIFACT_DIR, IWO_PROVENANCE.file));
    fs.writeFileSync(path.join(dir, IWO_PROVENANCE.file), real.subarray(0, real.length - 1));
    const handler = openHandler({ artifactDir: dir });
    await expectRefused(await handler(req()), "federal_artifact_gate_closed");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// No static path exists, structurally.
// ─────────────────────────────────────────────────────────────────────────────
describe("no static artifact path", () => {
  it("keeps the artifact out of public/ entirely", () => {
    const stray = fs
      .readdirSync(path.join(process.cwd(), "public"), { recursive: true })
      .map(String)
      .filter((f) => f.endsWith(IWO_PROVENANCE.file));
    expect(stray).toEqual([]);
    expect(fs.existsSync(path.join(process.cwd(), "public", "forms", IWO_PROVENANCE.file))).toBe(false);
  });

  it("keeps the pinned artifact in the guarded dir, outside public/", () => {
    expect(fs.existsSync(path.join(GUARDED_ARTIFACT_DIR, IWO_PROVENANCE.file))).toBe(true);
    expect(GUARDED_ARTIFACT_DIR).not.toContain(`${path.sep}public${path.sep}`);
  });

  it("makes getFormPath throw for the IWO rather than yield a static URL", () => {
    const iwo = getFormById("income-withholding-order")!;
    expect(() => getFormPath(iwo)).toThrow(/no static path/i);
  });

  it("still yields normal static paths for ATJ forms", () => {
    const petition = getFormById("petition-with-children")!;
    expect(getFormPath(petition)).toBe("/forms/petition-dissolution-with-children.pdf");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Read model: the client only ever sees a server-decided href.
// ─────────────────────────────────────────────────────────────────────────────
describe("court forms read model", () => {
  it("withholds the IWO entirely while the gate is closed", () => {
    const model = getCourtFormsReadModel({ countyId: "cook", renewalEvidence: RENEWAL_PENDING });
    expect(model.forms.map((f) => f.id)).not.toContain("income-withholding-order");
    expect(model.gatedNotices).toHaveLength(1);
    expect(model.gatedNotices[0].copy.join(" ")).toMatch(/renewal review/i);
  });

  it("exposes ONLY the guarded href in the open state, never a static path", () => {
    const model = getCourtFormsReadModel({
      countyId: "cook",
      today: OPEN_CLOCK(),
      renewalEvidence: RENEWAL_CONFIRMED,
    });
    const iwo = model.forms.find((f) => f.id === "income-withholding-order");
    expect(iwo).toBeDefined();
    expect(iwo!.downloadHref).toBe(GUARDED_IWO_HREF);
    expect(model.gatedNotices).toHaveLength(0);
  });

  it("never emits /forms/income-withholding-order.pdf in any state", () => {
    for (const renewalEvidence of [RENEWAL_PENDING, RENEWAL_CONFIRMED]) {
      for (const countyId of ["cook", "will", "", "Cook County"]) {
        const model = getCourtFormsReadModel({ countyId, today: OPEN_CLOCK(), renewalEvidence });
        const hrefs = model.forms.map((f) => f.downloadHref).filter(Boolean) as string[];
        expect(hrefs).not.toContain("/forms/income-withholding-order.pdf");
      }
    }
  });

  it("gives Will a manual-review notice even with the gate open", () => {
    const model = getCourtFormsReadModel({
      countyId: "will",
      today: OPEN_CLOCK(),
      renewalEvidence: RENEWAL_CONFIRMED,
    });
    expect(model.forms.map((f) => f.id)).not.toContain("income-withholding-order");
    expect(model.gatedNotices[0].refusal).toBe("county_manual_conditional");
    expect(model.gatedNotices[0].requiresManualReview).toBe(true);
  });

  it("still renders the ATJ catalog with normal static hrefs", () => {
    const model = getCourtFormsReadModel({ countyId: "cook" });
    const petition = model.forms.find((f) => f.id === "petition-with-children");
    expect(petition!.downloadHref).toBe("/forms/petition-dissolution-with-children.pdf");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Document-package boundary: an existing READY row cannot leak the IWO.
// ─────────────────────────────────────────────────────────────────────────────
describe("document package boundary", () => {
  // Byte-exact canonical payload, so these unit checks isolate POLICY gating.
  // Payload gating and real ZIP contents are proven in
  // __tests__/api/documents-package-iwo.test.ts.
  const CANONICAL_B64 = fs
    .readFileSync(path.join(GUARDED_ARTIFACT_DIR, IWO_PROVENANCE.file))
    .toString("base64");
  const IWO_DOC = {
    type: "income_withholding",
    fileName: "income-withholding-order.pdf",
    content: CANONICAL_B64,
    mimeType: "application/pdf",
  };
  const PETITION_DOC = {
    type: "petition",
    fileName: "petition.pdf",
    content: Buffer.from("%PDF-1.4\npetition\n").toString("base64"),
    mimeType: "application/pdf",
  };
  const withheldDocs = (r: { withheld: Array<{ doc: unknown }> }) => r.withheld.map((w) => w.doc);

  it.each([
    { type: "iwo", fileName: "x.pdf" },
    { type: "income_withholding", fileName: "a.pdf" },
    { type: "other", fileName: "Income-Withholding-Order.pdf" },
    { type: "other", fileName: "omb_0970-0154.pdf" },
  ])("recognizes %p as an IWO document", (doc) => {
    expect(isIwoDocument(doc)).toBe(true);
  });

  // The evidence and the workflow model both state that "Withholding Order" is
  // the SAME instrument as the IWO. The classifier must agree, or a row using
  // the bare alias slips past every county/currentness/payload gate.
  it.each([
    { type: "withholding_order", fileName: "withholding-order.pdf" },
    { type: "Withholding Order", fileName: "order.pdf" },
    { type: "support", fileName: "Withholding Order.pdf" },
    { type: "support", fileName: "WITHHOLDING_ORDER.PDF" },
    { type: "withholding order", fileName: "doc.pdf" },
  ])("recognizes the documented bare alias %p", (doc) => {
    expect(isIwoDocument(doc)).toBe(true);
  });

  it("matches the alias the workflow model declares to be the same instrument", async () => {
    const { getCountyIwoWorkflow } = await import("@/lib/counties/county-iwo-workflow");
    const aliases = getCountyIwoWorkflow("will").instrument.sameInstrumentAliases;
    for (const alias of aliases) {
      expect(isIwoDocument({ type: "support", fileName: `${alias}.pdf` })).toBe(true);
    }
  });

  it("does not misclassify unrelated documents", () => {
    expect(isIwoDocument(PETITION_DOC)).toBe(false);
    expect(isIwoDocument({ type: "financial_affidavit", fileName: "fin.pdf" })).toBe(false);
  });

  // Identity matching must be BOUNDED. "withholding" appears in many unrelated
  // tax/payroll documents; treating those as the federal IWO suppresses them
  // and attaches an inaccurate IWO disclosure.
  it.each([
    { type: "support_order", fileName: "support-order.pdf" },
    { type: "support", fileName: "Support Order.pdf" },
    { type: "tax_document", fileName: "Employee Tax Withholding Certificate.pdf" },
    { type: "tax_withholding", fileName: "employee-w4.pdf" },
    { type: "payroll", fileName: "Payroll Withholding Notice.pdf" },
    { type: "payroll", fileName: "withholding-statement.pdf" },
    { type: "tax", fileName: "state tax withholding notice.pdf" },
    // QUALIFIED SUPERSETS: these contain an identity phrase but are not the
    // evidence-defined federal instrument. Substring matching wrongly accepts
    // them; exact-identity matching must not.
    { type: "tax_document", fileName: "State Tax Withholding Order.pdf" },
    { type: "tax_document", fileName: "Employee Income Withholding Election.pdf" },
    { type: "tax_document", fileName: "Income Withholding Certificate.pdf" },
    { type: "payroll", fileName: "Payroll Withholding Order Notice.pdf" },
    { type: "state_tax_withholding_order", fileName: "doc.pdf" },
    { type: "other", fileName: "Amended State Income Withholding Order Notice.pdf" },
    { type: "petition", fileName: "petition.pdf" },
    { type: "financial_affidavit", fileName: "fin.pdf" },
    { type: "parenting_plan", fileName: "pp.pdf" },
  ])("does NOT classify unrelated document %p as an IWO", (doc) => {
    expect(isIwoDocument(doc)).toBe(false);
  });

  it("does not fabricate a match across the type/fileName boundary", () => {
    // Concatenating these would spell "income withholding"; normalized
    // independently they are two unrelated fields.
    expect(isIwoDocument({ type: "income", fileName: "withholding.pdf" })).toBe(false);
  });

  it("withholds an existing READY IWO row from a Will case", () => {
    const r = filterIwoFromPackage([PETITION_DOC, IWO_DOC], {
      storedCounty: "will",
      today: OPEN_CLOCK(),
      renewalEvidence: RENEWAL_CONFIRMED,
    });
    expect(r.included).toEqual([PETITION_DOC]);
    expect(withheldDocs(r)).toEqual([IWO_DOC]);
    expect(r.refusal).toBe("county_manual_conditional");
    expect(r.notice!.length).toBeGreaterThan(0);
  });

  it("withholds it from a free-text stored county", () => {
    const r = filterIwoFromPackage([PETITION_DOC, IWO_DOC], {
      storedCounty: "Cook County",
      today: OPEN_CLOCK(),
      renewalEvidence: RENEWAL_CONFIRMED,
    });
    expect(withheldDocs(r)).toEqual([IWO_DOC]);
    expect(r.refusal).toBe("county_unknown_or_noncanonical");
  });

  it("withholds it while renewal is pending, even for a statewide-default county", () => {
    const r = filterIwoFromPackage([PETITION_DOC, IWO_DOC], {
      storedCounty: "cook",
      today: OPEN_CLOCK(),
      renewalEvidence: RENEWAL_PENDING,
    });
    expect(withheldDocs(r)).toEqual([IWO_DOC]);
    expect(r.refusal).toBe("federal_artifact_gate_closed");
  });

  it("passes it through only when every gate is open", () => {
    const r = filterIwoFromPackage([PETITION_DOC, IWO_DOC], {
      storedCounty: "cook",
      today: OPEN_CLOCK(),
      renewalEvidence: RENEWAL_CONFIRMED,
    });
    expect(r.included).toEqual([PETITION_DOC, IWO_DOC]);
    expect(r.withheld).toEqual([]);
  });

  it("leaves packages without an IWO untouched", () => {
    const r = filterIwoFromPackage([PETITION_DOC], { storedCounty: "will" });
    expect(r.included).toEqual([PETITION_DOC]);
    expect(r.notice).toBeNull();
  });
});
