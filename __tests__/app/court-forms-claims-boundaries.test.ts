/**
 * @jest-environment node
 *
 * Public-claim boundaries for the two form-related /legal-info surfaces.
 *
 * `/legal-info/court-forms` is served a permanent redirect, but its client kept
 * live auto-fill and download copy in source — "Let Us Fill Out Your Forms",
 * "we'll automatically fill out this form for you", "Always download forms" —
 * for a catalog in which every entry is non-automation-eligible and no entry
 * resolves to a static path. Lifting the redirect would have published all of it.
 *
 * `/legal-info/document-guide` was NOT redirected and was reachable. It carried
 * its own hardcoded form list, independent of the catalog, labelling statewide
 * ATJ artifacts with Cook County CCP numbers as `officialId`, naming artifacts
 * the 2026-09-14 evidence packet could not corroborate, and stating both a
 * generation claim and a filing-readiness claim.
 *
 * These tests assert claim boundaries only. Nothing here is release, generation,
 * download, or filing authority for any entry, and no hold is lifted.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import nextConfig from "@/next.config";

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");

const CLIENT = "app/legal-info/court-forms/court-forms-client.tsx";
const DOCUMENT_GUIDE = "app/legal-info/document-guide/page.tsx";

async function redirects() {
  const fn = (nextConfig as {
    redirects: () => Promise<
      Array<{ source: string; destination: string; permanent: boolean }>
    >;
  }).redirects;
  return fn();
}

describe("both form surfaces are held behind a permanent redirect", () => {
  it.each([
    "/legal-info/court-forms",
    "/legal-info/document-guide",
  ])("sends %s to /legal permanently", async (source) => {
    const entry = (await redirects()).find((r) => r.source === source);
    expect(entry).toBeDefined();
    expect(entry!.destination).toBe("/legal");
    expect(entry!.permanent).toBe(true);
  });

  it("declares the document guide in the shared LEGAL_INFO_REDIRECTS list", () => {
    const src = read("next.config.ts");
    const block = src.slice(
      src.indexOf("const LEGAL_INFO_REDIRECTS"),
      src.indexOf("const LEGACY_ROUTE_REDIRECTS"),
    );
    expect(block).toContain('"/legal-info/document-guide"');
  });
});

describe("the document guide makes no live generation or filing claim", () => {
  // The page's own copy is questionnaire→form mapping, which is owner/legal-gated
  // and out of this lane to rewrite. The claim is neutralized by making the route
  // unreachable, so what is asserted here is that the redirect is what stands
  // between those exact strings and a customer.
  const CLAIMS = [
    "Our system fills out official Illinois court forms using your answers",
    "E-file or print and file your documents with the circuit court",
    "CCP 0910.01",
    "CCP 0912.03",
    "CCP 0913.01",
    "Allocation Judgment",
  ];

  it("still contains the claims this redirect exists to contain", () => {
    // If a later change removes these from the page, this test should be
    // revisited together with the redirect — it must not silently become a
    // vacuous pass that implies the page was remediated.
    const guide = read(DOCUMENT_GUIDE);
    for (const claim of CLAIMS) expect(guide).toContain(claim);
  });

  it("is not reachable while those claims stand", async () => {
    const sources = (await redirects()).map((r) => r.source);
    expect(sources).toContain("/legal-info/document-guide");
  });
});

describe("the court-forms client publishes no auto-fill or blanket-download claim", () => {
  const client = read(CLIENT);

  it.each([
    [/Let Us Fill Out Your Forms/i, "auto-fill headline"],
    [/Auto-Fill/i, "auto-fill control or badge"],
    [/automatically\s+fill/i, "automatic fill claim"],
    [/fill (?:out )?this form for you/i, "per-form fill claim"],
    [/auto-fill this form/i, "per-form auto-fill claim"],
    [/Generate Form/i, "generation control"],
    [/Always download forms to your computer/i, "blanket download instruction"],
  ])("does not contain %s (%s)", (pattern) => {
    expect(client).not.toMatch(pattern as RegExp);
  });

  it("references no catalog id that the reconciled catalog does not hold", () => {
    // Per id rather than one combined assertion: a single surviving stale key is
    // a defect, and a combined check can pass while one of them remains.
    for (const staleId of [
      "allocation-judgment",
      "schedule-a",
      "schedule-b",
      "marital-settlement",
    ]) {
      expect(client).not.toContain(staleId);
    }
  });

  it("keeps the download control server-decided rather than catalog-derived", () => {
    // The client may render `downloadHref` and nothing else. It must never call
    // getFormPath or build a /forms/ path of its own.
    expect(client).toContain("form.downloadHref");
    expect(client).not.toMatch(/getFormPath\s*\(/);
    expect(client).not.toMatch(/["'`]\/forms\//);
  });

  it("renders the unverified sentinel as a non-version and a non-date", () => {
    expect(client).toContain("UNVERIFIED_CATALOG_VALUE");
    expect(client).toContain("formatCatalogLastUpdated(form.lastUpdated)");
    // A bare `v{form.version}` prints "vunverified" for a row with no version.
    expect(client).not.toMatch(/>\s*v\{form\.version\}/);
  });

  it("keeps the not-a-law-firm posture", () => {
    expect(client).toMatch(/not a law firm/i);
    expect(client).toMatch(/does not provide legal advice/i);
  });
});
