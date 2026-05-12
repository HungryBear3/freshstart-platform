/**
 * @jest-environment node
 *
 * Guardrails for the v2 /legal hub and the legacy /legal-info -> /legal
 * permanent redirects.
 *
 * /legal must not link to /legal-info anymore (those pages are the old
 * light-theme hub and are being retired from the v2 nav surface). The
 * detailed write-ups at /legal-info/[slug] remain reachable as targets
 * of the policy summaries (/privacy, /terms, /disclaimer) — those links
 * live in the policy pages, not in /legal.
 *
 * next.config.ts must declare a permanent (301) redirect from every
 * retired /legal-info entry point to /legal.
 */
import * as React from "react";
import ReactDOMServer from "react-dom/server";
import fs from "node:fs";
import path from "node:path";

import LegalIndexPage from "@/app/legal/page";
import nextConfig from "@/next.config";

function readSource(rel: string): string {
  return fs.readFileSync(path.resolve(__dirname, "..", "..", rel), "utf8");
}

const RETIRED_LEGAL_INFO_PATHS = [
  "/legal-info",
  "/legal-info/process",
  "/legal-info/requirements",
  "/legal-info/court-forms",
  "/legal-info/court-resources",
  "/legal-info/cost-estimator",
  "/legal-info/timeline-calculator",
  "/legal-info/glossary",
] as const;

describe("/legal — no /legal-info bridge", () => {
  const html = ReactDOMServer.renderToStaticMarkup(<LegalIndexPage />);
  const src = readSource("app/legal/page.tsx");

  it("does not render any /legal-info hyperlink", () => {
    expect(html).not.toMatch(/href="\/legal-info[^"]*"/);
  });

  it("source does not declare a DEEP_LIBRARY array of /legal-info links", () => {
    expect(src).not.toMatch(/DEEP_LIBRARY/);
    expect(src).not.toMatch(/legal-info\/process/);
    expect(src).not.toMatch(/legal-info\/requirements/);
    expect(src).not.toMatch(/legal-info\/court-forms/);
    expect(src).not.toMatch(/legal-info\/court-resources/);
    expect(src).not.toMatch(/legal-info\/cost-estimator/);
    expect(src).not.toMatch(/legal-info\/timeline-calculator/);
    expect(src).not.toMatch(/legal-info\/glossary/);
  });

  it("metadata.description no longer mentions the legal-info library", () => {
    expect(src).not.toMatch(/legal-info library/i);
  });

  it("still renders the four canonical v2 topic cards", () => {
    expect(html).toContain('href="/grounds-for-divorce"');
    expect(html).toContain('href="/property-division"');
    expect(html).toContain('href="/child-custody"');
    expect(html).toContain('href="/support-calculations"');
  });

  it("keeps the conservative attorney / not-legal-advice posture", () => {
    expect(html).toMatch(/licensed Illinois attorney/i);
    // The shell-level disclaimer must still render.
    expect(html).toMatch(/not legal advice|not a law firm/i);
  });
});

describe("next.config redirects — /legal-info -> /legal permanently", () => {
  it("declares an async redirects() function", () => {
    expect(typeof (nextConfig as { redirects?: () => unknown }).redirects).toBe(
      "function",
    );
  });

  it("returns a permanent (301) redirect for every retired /legal-info path", async () => {
    const fn = (nextConfig as {
      redirects: () => Promise<
        Array<{ source: string; destination: string; permanent: boolean }>
      >;
    }).redirects;
    const list = await fn();

    // Map source -> entry for easier per-path assertions.
    const bySource = new Map(list.map((r) => [r.source, r]));

    for (const source of RETIRED_LEGAL_INFO_PATHS) {
      const entry = bySource.get(source);
      expect(entry).toBeDefined();
      expect(entry!.destination).toBe("/legal");
      expect(entry!.permanent).toBe(true);
    }

    // Sanity: we don't accidentally redirect routes that still need to render
    // (the policy summaries link to /legal-info/privacy etc.).
    const sources = list.map((r) => r.source);
    expect(sources).not.toContain("/legal-info/privacy");
    expect(sources).not.toContain("/legal-info/terms");
    expect(sources).not.toContain("/legal-info/disclaimer");
    expect(sources).not.toContain("/legal-info/refund-policy");
  });

  it("source declares the retired paths in a single LEGAL_INFO_REDIRECTS list", () => {
    const src = readSource("next.config.ts");
    expect(src).toMatch(/LEGAL_INFO_REDIRECTS/);
    expect(src).toMatch(/permanent:\s*true/);
    for (const p of RETIRED_LEGAL_INFO_PATHS) {
      expect(src).toContain(`"${p}"`);
    }
  });
});
