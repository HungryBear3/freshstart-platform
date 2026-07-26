/**
 * Unit tests for the Illinois court forms verifier.
 *
 * These cover only the pure helpers — no fs, no network. The catalog and
 * manifest are constructed inline so the test does not rely on the real
 * project state staying frozen.
 */
import {
  catalogFromForms,
  diffCatalogVsManifest,
  formatDiffReport,
  isAcceptableOfficialResponse,
  verifyPinnedArtifactBytes,
  type CatalogEntry,
  type Manifest,
} from "@/scripts/verify-illinois-forms";
import fs from "node:fs";
import path from "node:path";
import { getFormsForCaseType } from "@/lib/forms/illinois-court-forms";

function manifestOf(
  forms: Array<Partial<Manifest["forms"][number]> & { id: string }>,
): Manifest {
  return {
    lastFetchedAt: null,
    lastFetchedBy: null,
    officialSources: [],
    forms: forms.map((f) => ({
      name: f.name ?? f.id,
      officialUrl: f.officialUrl ?? "https://example.test/" + f.id,
      catalogVersion: f.catalogVersion ?? "2024",
      catalogLastUpdated: f.catalogLastUpdated ?? "2024-01-01",
      verification: f.verification ?? null,
      ...f,
    })),
  };
}

function catalogOf(
  forms: Array<Partial<CatalogEntry> & { id: string }>,
): CatalogEntry[] {
  return forms.map((f) => ({
    name: f.name ?? f.id,
    officialUrl: f.officialUrl ?? "https://example.test/" + f.id,
    version: f.version ?? "2024",
    lastUpdated: f.lastUpdated ?? "2024-01-01",
    ...f,
  }));
}

describe("diffCatalogVsManifest", () => {
  it("reports ok when both sides match exactly", () => {
    const cat = catalogOf([{ id: "a" }, { id: "b" }]);
    const man = manifestOf([{ id: "a" }, { id: "b" }]);
    const d = diffCatalogVsManifest(cat, man);
    expect(d.ok).toBe(true);
    expect(d.addedInCatalog).toHaveLength(0);
    expect(d.removedFromCatalog).toHaveLength(0);
    expect(d.versionMismatches).toHaveLength(0);
    expect(d.urlMismatches).toHaveLength(0);
  });

  it("flags an entry added to the catalog but missing from the manifest", () => {
    const cat = catalogOf([{ id: "a" }, { id: "b" }, { id: "new-form" }]);
    const man = manifestOf([{ id: "a" }, { id: "b" }]);
    const d = diffCatalogVsManifest(cat, man);
    expect(d.ok).toBe(false);
    expect(d.addedInCatalog.map((x) => x.id)).toEqual(["new-form"]);
    expect(d.removedFromCatalog).toHaveLength(0);
  });

  it("flags an entry present in the manifest but removed from the catalog", () => {
    const cat = catalogOf([{ id: "a" }]);
    const man = manifestOf([{ id: "a" }, { id: "retired" }]);
    const d = diffCatalogVsManifest(cat, man);
    expect(d.ok).toBe(false);
    expect(d.removedFromCatalog.map((x) => x.id)).toEqual(["retired"]);
  });

  it("flags a version/date drift on a matching id", () => {
    const cat = catalogOf([
      { id: "a", version: "2025", lastUpdated: "2025-06-01" },
    ]);
    const man = manifestOf([
      { id: "a", catalogVersion: "2024", catalogLastUpdated: "2024-01-01" },
    ]);
    const d = diffCatalogVsManifest(cat, man);
    expect(d.ok).toBe(false);
    expect(d.versionMismatches).toHaveLength(1);
    expect(d.versionMismatches[0]).toMatchObject({
      id: "a",
      catalogVersion: "2025",
      manifestVersion: "2024",
    });
  });

  it("flags a URL drift even when versions match", () => {
    const cat = catalogOf([
      { id: "a", officialUrl: "https://illinoiscourts.gov/new-path" },
    ]);
    const man = manifestOf([
      { id: "a", officialUrl: "https://illinoiscourts.gov/old-path" },
    ]);
    const d = diffCatalogVsManifest(cat, man);
    expect(d.ok).toBe(false);
    expect(d.urlMismatches).toHaveLength(1);
    expect(d.urlMismatches[0].id).toBe("a");
  });

  it("formatDiffReport returns a non-empty summary line for drift", () => {
    const cat = catalogOf([{ id: "new" }]);
    const man = manifestOf([{ id: "retired" }]);
    const d = diffCatalogVsManifest(cat, man);
    const report = formatDiffReport(d);
    expect(report).toMatch(/Added in catalog/);
    expect(report).toMatch(/no longer in catalog/);
  });
});

describe("catalogFromForms (integration with real catalog)", () => {
  it("returns the live catalog with required fields populated", () => {
    const cat = catalogFromForms();
    expect(cat.length).toBeGreaterThan(0);
    for (const entry of cat) {
      expect(entry.id).toMatch(/^[a-z0-9-]+$/);
      expect(entry.officialUrl).toMatch(/^https:\/\//);
      expect(entry.version).toBeTruthy();
      expect(entry.lastUpdated).toBeTruthy();
    }
  });

  it("pins the canonical federal IWO bytes and authority", () => {
    const iwo = catalogFromForms().find((entry) => entry.id === "income-withholding-order");

    expect(iwo).toMatchObject({
      officialUrl: "https://www.acf.hhs.gov/sites/default/files/documents/ocse/omb_0970_0154.pdf",
      version: "OMB 0970-0154",
      sourceAuthority: "federal-hhs",
      artifactSha256: "2b15c02a46b66a7d0fa2bd80d4644d5d6d5e6798911225f8e0272b45fe20b551",
      artifactSizeBytes: 505412,
      expiresOn: "2026-08-31",
      conditionalUse: true,
    });

    const bytes = fs.readFileSync(path.join(process.cwd(), "public/forms/income-withholding-order.pdf"));
    expect(verifyPinnedArtifactBytes(iwo!, bytes, new Date("2026-07-25T12:00:00Z"))).toEqual({
      id: "income-withholding-order",
      ok: true,
      errors: [],
    });
    expect(getFormsForCaseType(true).map((form) => form.id)).not.toContain("income-withholding-order");
  });

  it("fails closed when the pinned IWO print is expired or its bytes drift", () => {
    const iwo = catalogFromForms().find((entry) => entry.id === "income-withholding-order")!;

    expect(verifyPinnedArtifactBytes(iwo, Buffer.from("%PDF-drift"), new Date("2026-09-01T05:00:00Z"))).toEqual({
      id: "income-withholding-order",
      ok: false,
      errors: expect.arrayContaining([
        expect.stringMatching(/size mismatch/),
        expect.stringMatching(/SHA-256 mismatch/),
        expect.stringMatching(/expired on 2026-08-31/),
      ]),
    });
  });

  it("keeps the federal form valid through the printed expiration date in Illinois", () => {
    const iwo = catalogFromForms().find((entry) => entry.id === "income-withholding-order")!;
    const bytes = fs.readFileSync(path.join(process.cwd(), "public/forms/income-withholding-order.pdf"));

    expect(verifyPinnedArtifactBytes(iwo, bytes, new Date("2026-09-01T00:30:00Z")).ok).toBe(true);
    expect(verifyPinnedArtifactBytes(iwo, bytes, new Date("2026-09-01T05:00:00Z"))).toEqual({
      id: "income-withholding-order",
      ok: false,
      errors: ["artifact expired on 2026-08-31"],
    });
  });
});

describe("official response classification", () => {
  const pdfUrl = "https://www.acf.hhs.gov/sites/default/files/documents/ocse/omb_0970_0154.pdf";

  it("rejects a successful-status WAF HTML challenge for a direct PDF", () => {
    expect(isAcceptableOfficialResponse(pdfUrl, 202, "text/html", "challenge")).toBe(false);
  });

  it("accepts a real PDF and ordinary Illinois source index HTML", () => {
    expect(isAcceptableOfficialResponse(pdfUrl, 200, "application/pdf", null)).toBe(true);
    expect(isAcceptableOfficialResponse("https://www.illinoiscourts.gov/forms/approved-forms", 200, "text/html", null)).toBe(true);
  });
});

describe("pinned provenance drift", () => {
  it("fails catalog/manifest comparison when pinned artifact metadata differs", () => {
    const cat = catalogOf([{
      id: "iwo",
      sourceAuthority: "federal-hhs",
      artifactSha256: "a".repeat(64),
      artifactSizeBytes: 10,
      expiresOn: "2026-08-31",
      conditionalUse: true,
    }]);
    const man = manifestOf([{
      id: "iwo",
      sourceAuthority: "illinois-courts",
      artifactSha256: "b".repeat(64),
      artifactSizeBytes: 11,
      expiresOn: "2026-09-01",
      conditionalUse: false,
    }]);

    const diff = diffCatalogVsManifest(cat, man);
    expect(diff.ok).toBe(false);
    expect(diff.provenanceMismatches).toEqual([expect.objectContaining({ id: "iwo" })]);
  });
});
