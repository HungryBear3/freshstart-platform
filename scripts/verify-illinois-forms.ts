/**
 * scripts/verify-illinois-forms.ts
 *
 * Compares the local Illinois court forms catalog
 * (`lib/forms/illinois-court-forms.ts`) against a checked-in manifest
 * (`docs/legal-audit/illinois-court-forms-manifest.json`) and, optionally,
 * the live official source pages on illinoiscourts.gov.
 *
 * Modes:
 *   --offline   compare catalog ↔ manifest only. No network calls. Default.
 *   --fetch     run --offline, then HEAD each form's officialUrl, write
 *               http verification metadata into the manifest, and refresh
 *               the human-readable freshness report. Operator-run only.
 *
 * Hard rules:
 *   - This script never rewrites lib/forms/illinois-court-forms.ts.
 *   - Drift is flagged for human review, never auto-applied.
 *   - --fetch is the only mode that touches the network.
 *   - --fetch REFUSES to run from a drifting baseline. It exits non-zero before
 *     any network call or write, so an unreviewed catalog change cannot be
 *     absorbed into the manifest and then reported clean.
 *   - The --fetch write path touches `verification` and the run stamp only. It
 *     never copies a catalog version, date or URL into a manifest entry.
 *
 * Usage:
 *   tsx scripts/verify-illinois-forms.ts --offline
 *   tsx scripts/verify-illinois-forms.ts --fetch
 *   tsx scripts/verify-illinois-forms.ts --fetch --report-only   # don't write manifest
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ILLINOIS_COURT_FORMS } from "../lib/forms/illinois-court-forms";

// ──────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────

export interface CatalogEntry {
  id: string;
  name: string;
  officialUrl: string | null;
  version: string;
  lastUpdated: string;
  authority: string;
  automationStatus: string;
  provenance: unknown;
}

export interface ManifestVerification {
  verifiedAt: string;
  httpStatus: number | null;
  contentType: string | null;
  lastModified: string | null;
  etag: string | null;
  reachable: boolean;
  notes: string | null;
}

export interface ManifestEntry {
  id: string;
  name: string;
  officialUrl: string | null;
  catalogVersion: string;
  catalogLastUpdated: string;
  verification: ManifestVerification | null;
  authority: string;
  automationStatus: string;
  provenance: unknown;
}

export interface Manifest {
  lastFetchedAt: string | null;
  lastFetchedBy: string | null;
  officialSources: string[];
  forms: ManifestEntry[];
  [key: string]: unknown;
}

export interface DiffResult {
  addedInCatalog: CatalogEntry[];        // in catalog, missing from manifest
  removedFromCatalog: ManifestEntry[];   // in manifest, missing from catalog
  versionMismatches: Array<{
    id: string;
    name: string;
    catalogVersion: string;
    manifestVersion: string;
    catalogLastUpdated: string;
    manifestLastUpdated: string;
  }>;
  urlMismatches: Array<{
    id: string;
    catalogUrl: string | null;
    manifestUrl: string | null;
  }>;
  metadataMismatches: string[];
  ok: boolean;
}

// ──────────────────────────────────────────────────────────────────────────
// Pure helpers (exported for unit tests)
// ──────────────────────────────────────────────────────────────────────────

export function catalogFromForms(): CatalogEntry[] {
  return ILLINOIS_COURT_FORMS.map((f) => ({
    id: f.id,
    name: f.name,
    officialUrl: f.officialUrl,
    version: f.version,
    lastUpdated: f.lastUpdated,
    authority: f.authority,
    automationStatus: f.automationStatus,
    provenance: f.provenance ?? null,
  }));
}

export function diffCatalogVsManifest(
  catalog: CatalogEntry[],
  manifest: Manifest,
): DiffResult {
  const manifestById = new Map(manifest.forms.map((m) => [m.id, m]));
  const catalogById = new Map(catalog.map((c) => [c.id, c]));

  const addedInCatalog: CatalogEntry[] = [];
  const removedFromCatalog: ManifestEntry[] = [];
  const versionMismatches: DiffResult["versionMismatches"] = [];
  const urlMismatches: DiffResult["urlMismatches"] = [];
  const metadataMismatches: string[] = [];

  for (const c of catalog) {
    const m = manifestById.get(c.id);
    if (!m) {
      addedInCatalog.push(c);
      continue;
    }
    if (c.version !== m.catalogVersion || c.lastUpdated !== m.catalogLastUpdated) {
      versionMismatches.push({
        id: c.id,
        name: c.name,
        catalogVersion: c.version,
        manifestVersion: m.catalogVersion,
        catalogLastUpdated: c.lastUpdated,
        manifestLastUpdated: m.catalogLastUpdated,
      });
    }
    if (c.officialUrl !== m.officialUrl) {
      urlMismatches.push({
        id: c.id,
        catalogUrl: c.officialUrl,
        manifestUrl: m.officialUrl,
      });
    }
    // `name` is compared too: it is the customer-visible identity claim, and a
    // row renamed on one side only (e.g. quietly dropping an "(unverified
    // identity)" qualifier) is exactly the drift this verifier exists to catch.
    if (
      c.name !== m.name ||
      c.authority !== m.authority ||
      c.automationStatus !== m.automationStatus ||
      JSON.stringify(c.provenance) !== JSON.stringify(m.provenance)
    ) {
      metadataMismatches.push(c.id);
    }
  }
  for (const m of manifest.forms) {
    if (!catalogById.has(m.id)) {
      removedFromCatalog.push(m);
    }
  }

  return {
    addedInCatalog,
    removedFromCatalog,
    versionMismatches,
    urlMismatches,
    metadataMismatches,
    ok:
      addedInCatalog.length === 0 &&
      removedFromCatalog.length === 0 &&
      versionMismatches.length === 0 &&
      urlMismatches.length === 0 &&
      metadataMismatches.length === 0,
  };
}

/**
 * Whether `--fetch` may proceed.
 *
 * The old flow ran the fetch regardless, then rebuilt every manifest entry with
 * `catalogVersion: c.version`, `catalogLastUpdated: c.lastUpdated` and the
 * catalog's `officialUrl`. Any unreviewed catalog edit was therefore ADOPTED
 * into the committed manifest by the act of checking freshness, and the
 * post-write diff — taken against the manifest that had just been overwritten
 * from the catalog — came back clean and exited 0. The drift the manifest exists
 * to catch was erased by the tool that was supposed to report it.
 *
 * So the baseline has to be clean before anything is fetched or written.
 */
export function fetchPreflight(diff: DiffResult): { proceed: boolean; reason: string | null } {
  if (diff.ok) return { proceed: true, reason: null };
  return {
    proceed: false,
    reason:
      "catalog/manifest drift detected before fetching; --fetch will not adopt catalog values into the manifest",
  };
}

/**
 * Apply transport verification results to a manifest.
 *
 * Every identity field — id, name, officialUrl, catalogVersion,
 * catalogLastUpdated, authority, automationStatus, provenance — is carried
 * through untouched. A HEAD response says a URL resolved; it is not evidence
 * about any of those, and must never be allowed to rewrite one.
 */
export function manifestWithVerifications(
  manifest: Manifest,
  verifications: Map<string, ManifestVerification>,
  meta: { fetchedAt: string; fetchedBy: string },
): Manifest {
  return {
    ...manifest,
    lastFetchedAt: meta.fetchedAt,
    lastFetchedBy: meta.fetchedBy,
    forms: manifest.forms.map((m) => {
      const verification = verifications.get(m.id);
      return verification ? { ...m, verification } : m;
    }),
  };
}

export function formatDiffReport(diff: DiffResult): string {
  const lines: string[] = [];
  if (diff.ok) {
    lines.push("OK — catalog and manifest agree on every form.");
    return lines.join("\n");
  }
  if (diff.addedInCatalog.length) {
    lines.push(`Added in catalog but missing from manifest (${diff.addedInCatalog.length}):`);
    for (const f of diff.addedInCatalog) {
      lines.push(`  + ${f.id}  (${f.name})`);
    }
  }
  if (diff.removedFromCatalog.length) {
    lines.push(`In manifest but no longer in catalog (${diff.removedFromCatalog.length}):`);
    for (const f of diff.removedFromCatalog) {
      lines.push(`  - ${f.id}  (${f.name})`);
    }
  }
  if (diff.versionMismatches.length) {
    lines.push(`Version/date drift (${diff.versionMismatches.length}):`);
    for (const v of diff.versionMismatches) {
      lines.push(
        `  ~ ${v.id}  catalog=${v.catalogVersion}/${v.catalogLastUpdated} manifest=${v.manifestVersion}/${v.manifestLastUpdated}`,
      );
    }
  }
  if (diff.urlMismatches.length) {
    lines.push(`Official URL drift (${diff.urlMismatches.length}):`);
    for (const u of diff.urlMismatches) {
      lines.push(`  ~ ${u.id}`);
      lines.push(`      catalog : ${u.catalogUrl}`);
      lines.push(`      manifest: ${u.manifestUrl}`);
    }
  }
  if (diff.metadataMismatches.length) {
    lines.push(`Authority/provenance drift (${diff.metadataMismatches.length}):`);
    for (const id of diff.metadataMismatches) lines.push(`  ~ ${id}`);
  }
  return lines.join("\n");
}

// ──────────────────────────────────────────────────────────────────────────
// I/O
// ──────────────────────────────────────────────────────────────────────────

const REPO_ROOT = (() => {
  // Resolve repo root from this file's location: <root>/scripts/verify-illinois-forms.ts
  try {
    const here = path.dirname(fileURLToPath(import.meta.url));
    return path.resolve(here, "..");
  } catch {
    // Fallback for environments where import.meta.url is unavailable.
    return process.cwd();
  }
})();

const MANIFEST_PATH = path.join(
  REPO_ROOT,
  "docs",
  "legal-audit",
  "illinois-court-forms-manifest.json",
);
const REPORT_PATH = path.join(
  REPO_ROOT,
  "docs",
  "legal-audit",
  "ILLINOIS_FORMS_FRESHNESS.md",
);

export function readManifest(filePath: string = MANIFEST_PATH): Manifest {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as Manifest;
}

export function writeManifest(manifest: Manifest, filePath: string = MANIFEST_PATH): void {
  fs.writeFileSync(filePath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
}

// ──────────────────────────────────────────────────────────────────────────
// Fetch mode
// ──────────────────────────────────────────────────────────────────────────

interface FetchResult {
  httpStatus: number | null;
  contentType: string | null;
  lastModified: string | null;
  etag: string | null;
  reachable: boolean;
  notes: string | null;
}

async function fetchUrlHead(url: string | null): Promise<FetchResult> {
  if (!url) return { httpStatus: null, contentType: null, lastModified: null, etag: null, reachable: false, notes: "no official artifact URL" };
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    const ct = res.headers.get("content-type");
    const lm = res.headers.get("last-modified");
    const et = res.headers.get("etag");
    return {
      httpStatus: res.status,
      contentType: ct,
      lastModified: lm,
      etag: et,
      reachable: res.ok,
      notes: res.ok ? null : `HEAD returned ${res.status}`,
    };
  } catch (err) {
    return {
      httpStatus: null,
      contentType: null,
      lastModified: null,
      etag: null,
      reachable: false,
      notes: `fetch error: ${(err as Error).message}`,
    };
  }
}

function renderFreshnessReport(manifest: Manifest, diff: DiffResult): string {
  const ts = manifest.lastFetchedAt ?? "never";
  const by = manifest.lastFetchedBy ?? "n/a";
  const lines: string[] = [];
  lines.push("# Illinois Court Forms — Freshness Report");
  lines.push("");
  lines.push("Generated by `scripts/verify-illinois-forms.ts`. Do not hand-edit.");
  lines.push("");
  lines.push(`- Last \`--fetch\` run: **${ts}** (by ${by})`);
  lines.push(`- Catalog source: \`lib/forms/illinois-court-forms.ts\``);
  lines.push(`- Manifest: \`docs/legal-audit/illinois-court-forms-manifest.json\``);
  lines.push("");
  lines.push("## Catalog ↔ manifest diff");
  lines.push("");
  if (diff.ok) {
    lines.push("- ✅ Catalog and manifest agree on every form.");
  } else {
    if (diff.addedInCatalog.length) {
      lines.push(`- ⚠️ ${diff.addedInCatalog.length} catalog entries missing from manifest:`);
      for (const f of diff.addedInCatalog) lines.push(`  - \`${f.id}\` (${f.name})`);
    }
    if (diff.removedFromCatalog.length) {
      lines.push(`- ⚠️ ${diff.removedFromCatalog.length} manifest entries removed from catalog:`);
      for (const f of diff.removedFromCatalog) lines.push(`  - \`${f.id}\` (${f.name})`);
    }
    if (diff.versionMismatches.length) {
      lines.push(`- ⚠️ ${diff.versionMismatches.length} version/date drifts (review manually):`);
      for (const v of diff.versionMismatches) {
        lines.push(
          `  - \`${v.id}\` — catalog ${v.catalogVersion}/${v.catalogLastUpdated} vs manifest ${v.manifestVersion}/${v.manifestLastUpdated}`,
        );
      }
    }
    if (diff.urlMismatches.length) {
      lines.push(`- ⚠️ ${diff.urlMismatches.length} URL drifts:`);
      for (const u of diff.urlMismatches) {
        lines.push(`  - \`${u.id}\` — catalog \`${u.catalogUrl}\` vs manifest \`${u.manifestUrl}\``);
      }
    }
    // Authority/provenance drift fails `ok` and so must be visible here too;
    // omitting it produced a report that looked clean on a failing run.
    if (diff.metadataMismatches.length) {
      lines.push(`- ⚠️ ${diff.metadataMismatches.length} name/authority/provenance drifts:`);
      for (const id of diff.metadataMismatches) lines.push(`  - \`${id}\``);
    }
  }
  lines.push("");
  lines.push("## Per-form verification");
  lines.push("");
  lines.push("| ID | Name | Authority | Automation | Printed code / rev | Bytes | SHA-256 (12) | Reachable | HTTP | Content-Type |");
  lines.push("|---|---|---|---|---|---|---|---|---|---|");
  for (const m of manifest.forms) {
    const v = m.verification;
    const p = (m.provenance ?? null) as null | {
      printedCode?: string;
      printedRevision?: string;
      bytes?: number;
      sha256?: string;
    };
    const reach = v ? (v.reachable ? "✅" : "❌") : "—";
    const printed = p?.printedCode ? `${p.printedCode} (${p.printedRevision ?? "?"})` : "—";
    lines.push(
      `| \`${m.id}\` | ${m.name} | ${m.authority} | ${m.automationStatus} | ${printed} | ${p?.bytes ?? "—"} | ${p?.sha256?.slice(0, 12) ?? "—"} | ${reach} | ${v?.httpStatus ?? "—"} | ${v?.contentType ?? "—"} |`,
    );
  }
  lines.push("");
  lines.push("## Notes & limitations");
  lines.push("");
  lines.push("- `--fetch` issues HEAD only. It confirms the pinned artifact URL still resolves and captures transport headers; it does NOT re-read the PDF, so it cannot corroborate the pinned byte length or SHA-256, and it cannot detect a same-URL content replacement.");
  lines.push("- `--fetch` refuses to run at all when the catalog and manifest already disagree: it exits non-zero before any network call or write. It updates `verification` and the run stamp only, and never copies a catalog version, date or URL into a manifest entry — so a drift cannot be resolved by the freshness check absorbing it.");
  lines.push("- Catalog dates carry the precision the artifact states. A printed revision of `03/25` yields `2025-03`, not an invented `2025-03-01`. Rows with no corroborated artifact carry the literal `unverified` in place of a version and a date.");
  lines.push("- A non-2xx status is a TRANSPORT observation (a WAF challenge, for instance), not evidence that the form itself has drifted.");
  lines.push("- Reachability is not release authority. Catalog presence, a resolving URL and a matching hash together still do not clear generation, download, or filing for any entry.");
  lines.push("- This script will NEVER rewrite catalog values from PDF headers — operator must review drifts and edit `lib/forms/illinois-court-forms.ts` by hand.");
  lines.push("- Re-run `npm run forms:verify:fetch` (or `tsx scripts/verify-illinois-forms.ts --fetch`) when you need an updated snapshot.");
  return lines.join("\n") + "\n";
}

// ──────────────────────────────────────────────────────────────────────────
// Entry point
// ──────────────────────────────────────────────────────────────────────────

interface CliFlags {
  fetch: boolean;
  reportOnly: boolean;
  help: boolean;
}

function parseArgv(argv: string[]): CliFlags {
  return {
    fetch: argv.includes("--fetch"),
    reportOnly: argv.includes("--report-only"),
    help: argv.includes("--help") || argv.includes("-h"),
  };
}

async function main() {
  const flags = parseArgv(process.argv.slice(2));
  if (flags.help) {
    console.log("Usage: tsx scripts/verify-illinois-forms.ts [--offline | --fetch] [--report-only]");
    process.exit(0);
  }

  const catalog = catalogFromForms();
  const manifest = readManifest();
  const diff = diffCatalogVsManifest(catalog, manifest);

  console.log("Illinois court forms verifier");
  console.log(`  catalog : ${catalog.length} forms (lib/forms/illinois-court-forms.ts)`);
  console.log(`  manifest: ${manifest.forms.length} forms (docs/legal-audit/illinois-court-forms-manifest.json)`);
  console.log("");
  console.log(formatDiffReport(diff));

  // Drift fails the run in EVERY mode, and in --fetch it fails here: before the
  // network is touched and before anything is written. A freshness check must
  // not be able to resolve a drift by adopting one side of it.
  if (!diff.ok) {
    const preflight = fetchPreflight(diff);
    console.log("");
    if (flags.fetch) console.log(`Refusing to fetch: ${preflight.reason}.`);
    console.log("Drift detected. Review the items above and either:");
    console.log("  1) update lib/forms/illinois-court-forms.ts after verifying against illinoiscourts.gov, or");
    console.log("  2) update docs/legal-audit/illinois-court-forms-manifest.json after operator sign-off.");
    console.log("Neither edit is made by this script.");
    process.exit(1);
  }

  if (!flags.fetch) {
    process.exit(0);
  }

  // --fetch mode. Reached only from a clean baseline.
  console.log("");
  console.log("Fetching official URLs (HEAD only)…");
  const verifications = new Map<string, ManifestVerification>();
  for (const m of manifest.forms) {
    // The manifest's own pinned URL, never the catalog's. They are identical
    // here by construction — the diff above is clean — and reading the manifest
    // keeps it that way if that ever stops being true.
    const result = await fetchUrlHead(m.officialUrl);
    verifications.set(m.id, { verifiedAt: new Date().toISOString(), ...result });
    console.log(`  ${result.reachable ? "✅" : "❌"} ${m.id}  ${result.httpStatus ?? "ERR"} ${result.contentType ?? ""}`);
  }

  const nextManifest = manifestWithVerifications(manifest, verifications, {
    fetchedAt: new Date().toISOString(),
    fetchedBy: process.env.USER || process.env.LOGNAME || "operator",
  });
  const nextDiff = diffCatalogVsManifest(catalog, nextManifest);

  if (!flags.reportOnly) {
    writeManifest(nextManifest);
    fs.writeFileSync(REPORT_PATH, renderFreshnessReport(nextManifest, nextDiff), "utf8");
    console.log("");
    console.log(`Wrote manifest → ${path.relative(REPO_ROOT, MANIFEST_PATH)}`);
    console.log(`Wrote report   → ${path.relative(REPO_ROOT, REPORT_PATH)}`);
  } else {
    console.log("");
    console.log("--report-only: skipped writing manifest/report.");
  }

  process.exit(nextDiff.ok ? 0 : 1);
}

// Only run when executed as a script (not when imported by tests).
const invokedAsScript = (() => {
  try {
    return process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
  } catch {
    return false;
  }
})();

if (invokedAsScript) {
  main().catch((err) => {
    console.error(err);
    process.exit(2);
  });
}
