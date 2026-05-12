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
  type CatalogEntry,
  type Manifest,
} from "@/scripts/verify-illinois-forms";

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
      expect(entry.officialUrl).toMatch(/^https:\/\/(www\.)?illinoiscourts\.gov\//);
      expect(entry.version).toBeTruthy();
      expect(entry.lastUpdated).toBeTruthy();
    }
  });
});
