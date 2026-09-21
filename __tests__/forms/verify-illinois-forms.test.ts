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
  fetchPreflight,
  formatDiffReport,
  manifestWithVerifications,
  type CatalogEntry,
  type Manifest,
  type ManifestVerification,
} from "@/scripts/verify-illinois-forms";
import { getFormById, getFormPath } from "@/lib/forms/illinois-court-forms";

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
      authority: f.authority ?? "illinois_supreme_court",
      automationStatus: f.automationStatus ?? "artifact_and_mapping_review_required",
      provenance: f.provenance ?? null,
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
    authority: f.authority ?? "illinois_supreme_court",
    automationStatus: f.automationStatus ?? "artifact_and_mapping_review_required",
    provenance: f.provenance ?? null,
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

  it("flags a name/authority/provenance drift as a metadata mismatch", () => {
    const cat = catalogOf([{ id: "a", name: "Certificate of Service" }]);
    const man = manifestOf([{ id: "a", name: "Certificate of Service (unverified identity)" }]);
    const d = diffCatalogVsManifest(cat, man);
    expect(d.ok).toBe(false);
    expect(d.metadataMismatches).toEqual(["a"]);
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

describe("--fetch cannot launder catalog drift into the manifest", () => {
  const VERIFICATION: ManifestVerification = {
    verifiedAt: "2026-09-21T00:00:00.000Z",
    httpStatus: 200,
    contentType: "application/pdf",
    lastModified: null,
    etag: null,
    reachable: true,
    notes: null,
  };

  it("refuses to fetch or write when the starting diff is not clean", () => {
    const cat = catalogOf([{ id: "a", version: "ATJ 103.4 (04/25)" }]);
    const man = manifestOf([{ id: "a", catalogVersion: "ATJ 103.4 (03/25)" }]);
    const pre = fetchPreflight(diffCatalogVsManifest(cat, man));
    expect(pre.proceed).toBe(false);
    expect(pre.reason).toMatch(/drift/i);
  });

  it("proceeds only from a clean baseline", () => {
    const cat = catalogOf([{ id: "a" }]);
    const man = manifestOf([{ id: "a" }]);
    const pre = fetchPreflight(diffCatalogVsManifest(cat, man));
    expect(pre.proceed).toBe(true);
    expect(pre.reason).toBeNull();
  });

  it("writes transport verification only, never a catalog value", () => {
    // Even if this were somehow reached with a drifting catalog, the write path
    // must not copy version/date/URL across — that is the move that made a
    // failing run report clean.
    const man = manifestOf([
      {
        id: "a",
        name: "Old Name",
        officialUrl: "https://example.test/old",
        catalogVersion: "ATJ 103.4 (03/25)",
        catalogLastUpdated: "2025-03",
      },
    ]);
    const next = manifestWithVerifications(man, new Map([["a", VERIFICATION]]), {
      fetchedAt: "2026-09-21T00:00:00.000Z",
      fetchedBy: "tester",
    });
    const entry = next.forms[0];
    expect(entry.name).toBe("Old Name");
    expect(entry.officialUrl).toBe("https://example.test/old");
    expect(entry.catalogVersion).toBe("ATJ 103.4 (03/25)");
    expect(entry.catalogLastUpdated).toBe("2025-03");
    expect(entry.verification).toEqual(VERIFICATION);
    expect(next.lastFetchedAt).toBe("2026-09-21T00:00:00.000Z");
    expect(next.lastFetchedBy).toBe("tester");
  });

  it("preserves the pre-existing failure rather than reporting clean", () => {
    const cat = catalogOf([
      { id: "a", version: "ATJ 103.4 (04/25)", officialUrl: "https://example.test/new" },
    ]);
    const man = manifestOf([
      {
        id: "a",
        catalogVersion: "ATJ 103.4 (03/25)",
        officialUrl: "https://example.test/old",
      },
    ]);
    const next = manifestWithVerifications(man, new Map([["a", VERIFICATION]]), {
      fetchedAt: "2026-09-21T00:00:00.000Z",
      fetchedBy: "tester",
    });
    const after = diffCatalogVsManifest(cat, next);
    expect(after.ok).toBe(false);
    expect(after.versionMismatches).toHaveLength(1);
    expect(after.urlMismatches).toHaveLength(1);
  });
});

describe("catalogFromForms (integration with real catalog)", () => {
  it("returns the live catalog with required fields populated", () => {
    const cat = catalogFromForms();
    expect(cat.length).toBeGreaterThan(0);
    for (const entry of cat) {
      expect(entry.id).toMatch(/^[a-z0-9-]+$/);
      if (entry.id === "income-withholding-order") {
        // The IWO is a FEDERAL ACF/OMB form, not an Illinois ATJ form. Its
        // official source is the pinned federal canonical URL — pointing it at
        // illinoiscourts.gov would misstate its provenance.
        //
        // Reconciled 2026-09-05 to the address this branch's evidence pins:
        // iwo-omb-renewal-transition-2026-09-01.md §3.3/§3.4.1/§3.6.
        expect(entry.officialUrl).toBe(
          "https://acf.gov/sites/default/files/documents/ocse/omb_0970_0154.pdf?download=1",
        );
      } else if (entry.authority === "illinois_supreme_court") {
        expect(entry.officialUrl).toMatch(/^https:\/\/ilcourtsaudio\.blob\.core\.windows\.net\//);
        expect(entry.provenance).toBeTruthy();
      } else {
        expect(entry.officialUrl).toBeNull();
      }
      expect(entry.version).toBeTruthy();
      expect(entry.lastUpdated).toBeTruthy();
    }
  });

  it("replaces invented schedules with one row per exact official attachment", () => {
    const ids = catalogFromForms().map((entry) => entry.id);
    // Per id, not one combined assertion: `not.toEqual(arrayContaining([...]))`
    // passes as soon as ANY one member is absent, so five of these six could
    // have come back and the test would still have been green.
    for (const invented of [
      "schedule-a-child-support", "schedule-b-health-insurance", "schedule-c-debts",
      "schedule-d-accounts", "schedule-e-business", "schedule-f-retirement",
    ]) {
      expect(ids).not.toContain(invented);
    }
    expect(ids).toEqual(expect.arrayContaining([
      "financial-additional-child-support", "financial-additional-health-insurance",
      "financial-additional-debts", "financial-additional-cash",
      "financial-additional-investments", "financial-additional-business-interests",
      "financial-additional-life-insurance",
    ]));
  });

  it("fails closed for unsupported, unmapped, and pending-review local paths", () => {
    for (const id of ["waiver-service", "financial-additional-cash", "petition-no-children"]) {
      expect(() => getFormPath(getFormById(id)!)).toThrow(/not automation-eligible/);
    }
  });

  it("does not mislabel templates or uncorroborated service identities as statewide", () => {
    expect(getFormById("marital-settlement-agreement")?.authority).toBe("freshstart_template");
    // Reclassified 2026-09-21: the 2026-09-14 packet found no statewide artifact
    // for this name, which is not the same as evidence that a county issues it.
    // `county_or_non_statewide` is an affirmative source claim and is not earned.
    expect(getFormById("certificate-of-service")?.authority).toBe("unverified_identity");
    expect(getFormById("marital-settlement-agreement")?.officialUrl).toBeNull();
  });

  it("keeps the federal IWO distinguishable from the Illinois ATJ forms", () => {
    const cat = catalogFromForms();
    const federal = cat.filter((e) => e.authority === "federal_acf");
    expect(federal.map((e) => e.id)).toEqual(["income-withholding-order"]);
  });
});
