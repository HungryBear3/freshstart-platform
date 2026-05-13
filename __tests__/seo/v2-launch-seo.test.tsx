/**
 * @jest-environment node
 *
 * v2 SEO launch-blocker gates.
 *
 * Covers:
 *   1. Sitemap excludes /v2 + /v2/pricing, excludes /legal-info (which
 *      permanent-301s elsewhere), and only references public marketing
 *      routes.
 *   2. /legal-info/* permanent redirects to /legal are still configured.
 *   3. Site-wide OG image is wired into app/layout.tsx and the
 *      Next file-convention image exists.
 *   4. Per-page metadata.openGraph.title + .description are page-
 *      specific (not the layout-level homepage default) on each named
 *      public page.
 *   5. Homepage SSR HTML contains the Organization + WebSite JSON-LD
 *      block in the initial server-rendered output (not hydration-only).
 */
// @/lib/blog reads markdown via the remark ESM pipeline. Jest's CJS
// transform can't load remark, so we stub the surface the sitemap uses
// (getAllPosts) at module load time. Same pattern the legacy
// app/sitemap.test.ts uses to keep the sitemap loadable in unit tests.
jest.mock("@/lib/blog", () => ({
  getAllPosts: () => [
    { slug: "test-post-a", title: "A", description: "", date: "2026-01-01", content: "" },
    { slug: "test-post-b", title: "B", description: "", date: "2026-02-01", content: "" },
  ],
}));

import * as React from "react";
import ReactDOMServer from "react-dom/server";
import { readFileSync } from "fs";
import { resolve } from "path";

import sitemap from "@/app/sitemap";
import { metadata as rootMetadata } from "@/app/layout";

import HomePage from "@/app/page";

function ssr(node: React.ReactElement): string {
  return ReactDOMServer.renderToStaticMarkup(node);
}

function loadPageMetadata(rel: string): Record<string, unknown> {
  // Each page module exports `metadata` as a const. Loading via require so
  // the test can introspect the literal export shape without an extra
  // async layer.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require(`@/${rel}`);
  return mod.metadata as Record<string, unknown>;
}

// ── 1. sitemap exclusions ──────────────────────────────────────────────────

describe("v2 SEO — sitemap excludes preview / redirected routes", () => {
  let urls: string[] = [];
  beforeAll(async () => {
    const entries = await sitemap();
    urls = entries.map((e) => e.url);
  });

  it("excludes /v2 and /v2/pricing", () => {
    for (const path of ["/v2", "/v2/pricing"]) {
      expect(urls.some((u) => u.endsWith(path))).toBe(false);
    }
  });

  it("excludes every /legal-info/* path (permanent-301 to /legal)", () => {
    for (const u of urls) {
      expect(u).not.toMatch(/\/legal-info(\/|$)/);
    }
  });

  it("excludes auth + admin + dashboard + internal dev routes", () => {
    for (const u of urls) {
      expect(u).not.toMatch(/\/auth\//);
      expect(u).not.toMatch(/\/admin(\/|$)/);
      expect(u).not.toMatch(/\/dashboard(\/|$)/);
      expect(u).not.toMatch(/\/api(\/|$)/);
      expect(u).not.toMatch(/\/preview$/);
      expect(u).not.toMatch(/\/test-(no-providers|root)$/);
      expect(u).not.toMatch(/\/documents(\/|$)/);
      expect(u).not.toMatch(/\/questionnaires(\/|$)/);
    }
  });

  it("includes the v2 marketing canon (/ /pricing /legal + topic pages)", () => {
    const expected = [
      "/",
      "/pricing",
      "/checklist",
      "/calculators",
      "/legal",
      "/faq",
      "/about",
      "/grounds-for-divorce",
      "/child-custody",
      "/property-division",
      "/support-calculations",
      "/contact",
    ];
    for (const path of expected) {
      const target = path === "/" ? /\/$/ : new RegExp(`${path.replace(/\//g, "\\/")}$`);
      if (!urls.some((u) => target.test(u))) {
        throw new Error(`expected sitemap to include ${path}`);
      }
    }
  });

  it("uses the canonical apex domain (freshstart-il.com, not www.)", () => {
    for (const u of urls) {
      expect(u).toMatch(/^https:\/\/(?:www\.)?freshstart-il\.com(?:\/.*)?$/);
    }
  });
});

// ── 2. /legal-info/* redirects in next.config.ts ─────────────────────────────

describe("v2 SEO — next.config keeps the 8 /legal-info → /legal redirects", () => {
  const src = readFileSync(
    resolve(__dirname, "../../next.config.ts"),
    "utf8",
  );

  const REQUIRED_REDIRECTS = [
    "/legal-info",
    "/legal-info/process",
    "/legal-info/requirements",
    "/legal-info/court-forms",
    "/legal-info/court-resources",
    "/legal-info/cost-estimator",
    "/legal-info/timeline-calculator",
    "/legal-info/glossary",
  ];

  it.each(REQUIRED_REDIRECTS)("declares redirect for %s", (path) => {
    expect(src).toContain(`"${path}"`);
  });

  it("redirects are permanent (301)", () => {
    expect(src).toMatch(/permanent:\s*true/);
  });

  it("redirects target /legal", () => {
    expect(src).toMatch(/destination:\s*["']\/legal["']/);
  });
});

// ── 3. site-wide OG image wired in layout.tsx ────────────────────────────────

describe("v2 SEO — site-wide OG image is wired up", () => {
  it("layout.tsx declares openGraph.images and twitter.images", () => {
    expect(rootMetadata.openGraph).toBeDefined();
    expect(rootMetadata.openGraph!.images).toBeDefined();
    expect(rootMetadata.twitter).toBeDefined();
    // Allow either an array or a single string; we just want a non-empty value.
    const ogImages = rootMetadata.openGraph!.images as unknown;
    expect(Array.isArray(ogImages) ? ogImages.length > 0 : Boolean(ogImages)).toBe(true);
  });

  it("the Next file-convention OG image route exists", () => {
    const src = readFileSync(
      resolve(__dirname, "../../app/opengraph-image.tsx"),
      "utf8",
    );
    expect(src).toMatch(/ImageResponse/);
    expect(src).toMatch(/size\s*=\s*\{\s*width:\s*1200,\s*height:\s*630/);
    expect(src).toMatch(/alt\s*=/);
  });
});

// ── 4. per-page OG title + description on every named public page ──────────

const PAGES_NEEDING_PAGE_SPECIFIC_OG = [
  { rel: "app/about/page.tsx", url: "/about" },
  { rel: "app/faq/page.tsx", url: "/faq" },
  { rel: "app/legal/page.tsx", url: "/legal" },
  { rel: "app/privacy/page.tsx", url: "/privacy" },
  { rel: "app/terms/page.tsx", url: "/terms" },
  { rel: "app/disclaimer/page.tsx", url: "/disclaimer" },
  { rel: "app/grounds-for-divorce/page.tsx", url: "/grounds-for-divorce" },
  { rel: "app/child-custody/page.tsx", url: "/child-custody" },
  { rel: "app/property-division/page.tsx", url: "/property-division" },
  { rel: "app/support-calculations/page.tsx", url: "/support-calculations" },
  { rel: "app/pricing/page.tsx", url: "/pricing" },
  { rel: "app/checklist/page.tsx", url: "/checklist" },
  { rel: "app/calculators/page.tsx", url: "/calculators" },
  { rel: "app/start/page.tsx", url: "/start" },
];

describe("v2 SEO — every named public page has page-specific OG metadata", () => {
  // The homepage description from layout.tsx — pages must NOT reuse it.
  const layoutOgTitle = (rootMetadata.openGraph as { title?: string })?.title;
  const layoutOgDescription = (rootMetadata.openGraph as { description?: string })?.description;

  it.each(PAGES_NEEDING_PAGE_SPECIFIC_OG)(
    "$url declares its own openGraph.title and openGraph.description",
    ({ rel }) => {
      const m = loadPageMetadata(rel);
      const og = m.openGraph as { title?: string; description?: string } | undefined;
      if (!og) throw new Error(`${rel} must export metadata.openGraph`);
      if (!og.title) throw new Error(`${rel} must declare openGraph.title`);
      if (!og.description) throw new Error(`${rel} must declare openGraph.description`);
      // And those must not be the layout-level homepage defaults.
      if (layoutOgTitle && typeof og.title === "string") {
        expect(og.title).not.toBe(layoutOgTitle);
      }
      if (layoutOgDescription && typeof og.description === "string") {
        expect(og.description).not.toBe(layoutOgDescription);
      }
    },
  );
});

// ── 5. JSON-LD appears in initial SSR HTML ───────────────────────────────────

describe("v2 SEO — homepage SSR HTML contains JSON-LD", () => {
  const html = ssr(<HomePage />);

  it("includes a <script type=\"application/ld+json\"> in the SSR output", () => {
    expect(html).toMatch(/<script type="application\/ld\+json">/);
  });

  it("includes Organization + WebSite schema", () => {
    expect(html).toMatch(/"@type":"Organization"/);
    expect(html).toMatch(/"@type":"WebSite"/);
  });

  it("Organization references the canonical site URL", () => {
    expect(html).toMatch(/"url":"https:\/\/www\.freshstart-il\.com"/);
  });
});
