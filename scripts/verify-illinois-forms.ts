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
 *
 * Usage:
 *   tsx scripts/verify-illinois-forms.ts --offline
 *   tsx scripts/verify-illinois-forms.ts --fetch
 *   tsx scripts/verify-illinois-forms.ts --fetch --report-only   # don't write manifest
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { ILLINOIS_COURT_FORMS } from "../lib/forms/illinois-court-forms";

// ──────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────

export interface CatalogEntry {
  id: string;
  name: string;
  officialUrl: string;
  version: string;
  lastUpdated: string;
  sourceAuthority?: "illinois-courts" | "federal-hhs";
  artifactSha256?: string;
  artifactSizeBytes?: number;
  expiresOn?: string;
  conditionalUse?: boolean;
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
  officialUrl: string;
  catalogVersion: string;
  catalogLastUpdated: string;
  verification: ManifestVerification | null;
  sourceAuthority?: "illinois-courts" | "federal-hhs";
  artifactSha256?: string;
  artifactSizeBytes?: number;
  expiresOn?: string;
  conditionalUse?: boolean;
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
    catalogUrl: string;
    manifestUrl: string;
  }>;
  provenanceMismatches: Array<{
    id: string;
    catalog: Record<string, unknown>;
    manifest: Record<string, unknown>;
  }>;
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
    sourceAuthority: f.sourceAuthority,
    artifactSha256: f.artifactSha256,
    artifactSizeBytes: f.artifactSizeBytes,
    expiresOn: f.expiresOn,
    conditionalUse: f.conditionalUse,
  }));
}

export interface ArtifactCheckResult {
  id: string;
  ok: boolean;
  errors: string[];
}

const FORM_EXPIRATION_TIME_ZONE = "America/Chicago";

function calendarDateInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function verifyPinnedArtifactBytes(
  entry: CatalogEntry,
  bytes: Buffer,
  asOf: Date = new Date(),
): ArtifactCheckResult {
  const errors: string[] = [];
  if (!entry.artifactSha256 || entry.artifactSizeBytes === undefined) {
    errors.push("artifact is not SHA/size pinned");
  } else {
    if (bytes.length !== entry.artifactSizeBytes) {
      errors.push(`size mismatch: expected ${entry.artifactSizeBytes}, got ${bytes.length}`);
    }
    const actualSha = crypto.createHash("sha256").update(bytes).digest("hex");
    if (actualSha !== entry.artifactSha256) {
      errors.push(`SHA-256 mismatch: expected ${entry.artifactSha256}, got ${actualSha}`);
    }
  }
  if (!bytes.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
    errors.push("artifact does not have a PDF signature");
  }
  if (
    entry.expiresOn &&
    calendarDateInTimeZone(asOf, FORM_EXPIRATION_TIME_ZONE) > entry.expiresOn
  ) {
    errors.push(`artifact expired on ${entry.expiresOn}`);
  }
  return { id: entry.id, ok: errors.length === 0, errors };
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
  const provenanceMismatches: DiffResult["provenanceMismatches"] = [];

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
    const catalogProvenance = {
      sourceAuthority: c.sourceAuthority,
      artifactSha256: c.artifactSha256,
      artifactSizeBytes: c.artifactSizeBytes,
      expiresOn: c.expiresOn,
      conditionalUse: c.conditionalUse,
    };
    const manifestProvenance = {
      sourceAuthority: m.sourceAuthority,
      artifactSha256: m.artifactSha256,
      artifactSizeBytes: m.artifactSizeBytes,
      expiresOn: m.expiresOn,
      conditionalUse: m.conditionalUse,
    };
    if (JSON.stringify(catalogProvenance) !== JSON.stringify(manifestProvenance)) {
      provenanceMismatches.push({
        id: c.id,
        catalog: catalogProvenance,
        manifest: manifestProvenance,
      });
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
    provenanceMismatches,
    ok:
      addedInCatalog.length === 0 &&
      removedFromCatalog.length === 0 &&
      versionMismatches.length === 0 &&
      urlMismatches.length === 0 &&
      provenanceMismatches.length === 0,
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
  if (diff.provenanceMismatches.length) {
    lines.push(`Pinned provenance drift (${diff.provenanceMismatches.length}):`);
    for (const p of diff.provenanceMismatches) {
      lines.push(`  ~ ${p.id}`);
    }
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

export function isAcceptableOfficialResponse(
  url: string,
  status: number,
  contentType: string | null,
  wafAction: string | null,
): boolean {
  if (status < 200 || status >= 300 || wafAction) return false;
  if (/\.pdf(?:$|[?#])/i.test(url)) {
    return contentType?.toLowerCase().includes("application/pdf") ?? false;
  }
  return true;
}

async function fetchUrlHead(url: string): Promise<FetchResult> {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    const ct = res.headers.get("content-type");
    const lm = res.headers.get("last-modified");
    const et = res.headers.get("etag");
    const wafAction = res.headers.get("x-amzn-waf-action");
    const reachable = isAcceptableOfficialResponse(url, res.status, ct, wafAction);
    return {
      httpStatus: res.status,
      contentType: ct,
      lastModified: lm,
      etag: et,
      reachable,
      notes: reachable
        ? null
        : wafAction
          ? `HEAD returned WAF action ${wafAction}`
          : /\.pdf(?:$|[?#])/i.test(url) && !ct?.toLowerCase().includes("application/pdf")
            ? `HEAD did not return a PDF (${res.status} ${ct ?? "no content-type"})`
            : `HEAD returned ${res.status}`,
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
    if (diff.provenanceMismatches.length) {
      lines.push(`- ⚠️ ${diff.provenanceMismatches.length} pinned-provenance drifts:`);
      for (const p of diff.provenanceMismatches) {
        lines.push(`  - \`${p.id}\``);
      }
    }
  }
  lines.push("");
  lines.push("## Per-form verification");
  lines.push("");
  lines.push("| ID | Name | Catalog version / lastUpdated | Reachable | HTTP | Content-Type | Last-Modified |");
  lines.push("|---|---|---|---|---|---|---|");
  for (const m of manifest.forms) {
    const v = m.verification;
    const reach = v ? (v.reachable ? "✅" : "❌") : "—";
    const http = v?.httpStatus ?? "—";
    const ct = v?.contentType ?? "—";
    const lm = v?.lastModified ?? "—";
    lines.push(
      `| \`${m.id}\` | ${m.name} | ${m.catalogVersion} / ${m.catalogLastUpdated} | ${reach} | ${http} | ${ct} | ${lm} |`,
    );
  }
  lines.push("");
  lines.push("## Notes & limitations");
  lines.push("");
  lines.push("- HEAD requests on `illinoiscourts.gov` index pages do not expose per-form PDF versions; we only confirm the official URL still resolves and capture transport headers.");
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

export function verifyPinnedArtifactsOnDisk(
  formsDir: string,
  asOf: Date = new Date(),
): ArtifactCheckResult[] {
  const catalog = catalogFromForms();
  return ILLINOIS_COURT_FORMS.filter((form) => form.artifactSha256).map((form) => {
    const entry = catalog.find((candidate) => candidate.id === form.id)!;
    try {
      return verifyPinnedArtifactBytes(
        entry,
        fs.readFileSync(path.join(formsDir, form.filename)),
        asOf,
      );
    } catch (error) {
      return {
        id: form.id,
        ok: false,
        errors: [`artifact read failed: ${(error as Error).message}`],
      };
    }
  });
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
  const artifactChecks = verifyPinnedArtifactsOnDisk(path.join(REPO_ROOT, "public", "forms"));
  const artifactsOk = artifactChecks.every((check) => check.ok);

  console.log("Illinois court forms verifier");
  console.log(`  catalog : ${catalog.length} forms (lib/forms/illinois-court-forms.ts)`);
  console.log(`  manifest: ${manifest.forms.length} forms (docs/legal-audit/illinois-court-forms-manifest.json)`);
  console.log("");
  console.log(formatDiffReport(diff));
  if (artifactChecks.length) {
    console.log("");
    console.log("Pinned local artifacts:");
    for (const check of artifactChecks) {
      console.log(`  ${check.ok ? "✅" : "❌"} ${check.id}${check.errors.length ? ` — ${check.errors.join("; ")}` : ""}`);
    }
  }

  if (!flags.fetch) {
    if (!diff.ok || !artifactsOk) {
      console.log("");
      console.log("Offline mode found catalog/manifest drift or invalid pinned artifacts. Review the items above and either:");
      console.log("  1) update the catalog only after official-source verification, or");
      console.log("  2) update the manifest/pinned artifact only after operator sign-off.");
      process.exit(1);
    }
    process.exit(0);
  }

  // --fetch mode
  console.log("");
  console.log("Fetching official URLs (HEAD only)…");
  const updatedForms: ManifestEntry[] = [];
  for (const m of manifest.forms) {
    const c = catalog.find((x) => x.id === m.id);
    const url = c?.officialUrl ?? m.officialUrl;
    const result = await fetchUrlHead(url);
    const verification: ManifestVerification = {
      verifiedAt: new Date().toISOString(),
      ...result,
    };
    updatedForms.push({
      ...m,
      officialUrl: url,
      catalogVersion: c?.version ?? m.catalogVersion,
      catalogLastUpdated: c?.lastUpdated ?? m.catalogLastUpdated,
      verification,
    });
    console.log(`  ${result.reachable ? "✅" : "❌"} ${m.id}  ${result.httpStatus ?? "ERR"} ${result.contentType ?? ""}`);
  }

  const nextManifest: Manifest = {
    ...manifest,
    lastFetchedAt: new Date().toISOString(),
    lastFetchedBy: process.env.USER || process.env.LOGNAME || "operator",
    forms: updatedForms,
  };
  const nextDiff = diffCatalogVsManifest(catalog, nextManifest);
  const sourcesOk = updatedForms.every((entry) => entry.verification?.reachable);

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

  process.exit(nextDiff.ok && artifactsOk && sourcesOk ? 0 : 1);
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
