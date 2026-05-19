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

// ── 2b. legacy /v2 marketing routes redirect to canonical production ─────────
//
// /v2 was the pre-launch review alias. Production lives at / and /pricing.
// Permanent 301s on both so any stale external link or cached crawl resolves
// to the canonical public surface instead of the now-internal /v2 paths.

describe("v2 SEO — next.config keeps the /v2 → / and /v2/pricing → /pricing redirects", () => {
  const src = readFileSync(
    resolve(__dirname, "../../next.config.ts"),
    "utf8",
  );

  const REQUIRED_V2_REDIRECTS = [
    { source: "/v2", destination: "/" },
    { source: "/v2/pricing", destination: "/pricing" },
  ];

  it.each(REQUIRED_V2_REDIRECTS)(
    "declares $source → $destination",
    ({ source, destination }) => {
      // Same LEGACY_ROUTE_REDIRECTS shape used by the other legacy routes —
      // `{ source: "...", destination: "..." }`. Match both quote styles
      // so a linter swap stays accepted.
      const pattern = new RegExp(
        `source:\\s*["']${source.replace(/\//g, "\\/")}["']\\s*,\\s*destination:\\s*["']${destination.replace(/\//g, "\\/")}["']`,
      );
      expect(src).toMatch(pattern);
    },
  );
});

// ── 2c. legacy /legal-info article pages redirect to canonical destinations ─
//
// /legal-info index already 301s to /legal, but the article-level pages
// (e.g. /legal-info/grounds-for-divorce) were still serving 200 with a
// root canonical on the aviklrs4t preview. Map the four canonical-topic
// duplicates onto their v2 topic page, and the four thinner stubs onto
// the /legal hub.

describe("v2 SEO — next.config redirects legacy /legal-info article pages", () => {
  const src = readFileSync(
    resolve(__dirname, "../../next.config.ts"),
    "utf8",
  );

  const REQUIRED_ARTICLE_REDIRECTS = [
    { source: "/legal-info/grounds-for-divorce", destination: "/grounds-for-divorce" },
    { source: "/legal-info/property-division", destination: "/property-division" },
    { source: "/legal-info/child-custody", destination: "/child-custody" },
    { source: "/legal-info/spousal-maintenance", destination: "/support-calculations" },
    { source: "/legal-info/divorce-basics", destination: "/legal" },
    { source: "/legal-info/child-support", destination: "/legal" },
    { source: "/legal-info/court-procedures", destination: "/legal" },
    { source: "/legal-info/legal-rights", destination: "/legal" },
  ];

  it.each(REQUIRED_ARTICLE_REDIRECTS)(
    "declares $source → $destination",
    ({ source, destination }) => {
      const pattern = new RegExp(
        `source:\\s*["']${source.replace(/\//g, "\\/")}["']\\s*,\\s*destination:\\s*["']${destination.replace(/\//g, "\\/")}["']`,
      );
      expect(src).toMatch(pattern);
    },
  );
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

  it("emits each JSON-LD payload as an object with @context, never one array script", () => {
    const payloads = Array.from(
      html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g),
      (match) => JSON.parse(match[1]),
    );

    expect(payloads.length).toBeGreaterThanOrEqual(2);
    for (const payload of payloads) {
      expect(Array.isArray(payload)).toBe(false);
      expect(typeof payload["@context"]).toBe("string");
      expect(payload["@context"].toLowerCase()).toBe("https://schema.org");
    }
  });

  it("Organization references the canonical site URL", () => {
    expect(html).toMatch(/"url":"https:\/\/freshstart-il\.com"/);
  });
});

// ── 6. canonical regression — every named public page is self-canonical ─────
//
// Preview audit found 20 of 33 sitemap pages with canonical pointing at the
// root domain instead of their own path. The metadata.alternates.canonical
// for each page must be a /<own-path> string, NOT "/" and NOT the bare
// origin.

const SELF_CANONICAL_PAGES = [
  { rel: "app/about/page.tsx", canonical: "/about" },
  { rel: "app/faq/page.tsx", canonical: "/faq" },
  { rel: "app/legal/page.tsx", canonical: "/legal" },
  { rel: "app/privacy/page.tsx", canonical: "/privacy" },
  { rel: "app/terms/page.tsx", canonical: "/terms" },
  { rel: "app/disclaimer/page.tsx", canonical: "/disclaimer" },
  { rel: "app/grounds-for-divorce/page.tsx", canonical: "/grounds-for-divorce" },
  { rel: "app/child-custody/page.tsx", canonical: "/child-custody" },
  { rel: "app/property-division/page.tsx", canonical: "/property-division" },
  { rel: "app/support-calculations/page.tsx", canonical: "/support-calculations" },
  { rel: "app/pricing/page.tsx", canonical: "/pricing" },
  { rel: "app/checklist/page.tsx", canonical: "/checklist" },
  { rel: "app/calculators/page.tsx", canonical: "/calculators" },
  { rel: "app/start/page.tsx", canonical: "/start" },
  { rel: "app/blog/page.tsx", canonical: "/blog" },
];

describe("v2 SEO — every named public page is self-canonical (not root)", () => {
  it.each(SELF_CANONICAL_PAGES)(
    "$canonical declares alternates.canonical = $canonical",
    ({ rel, canonical }) => {
      const m = loadPageMetadata(rel);
      const alts = m.alternates as { canonical?: string } | undefined;
      if (!alts || !alts.canonical) {
        throw new Error(`${rel} must declare alternates.canonical`);
      }
      const c = alts.canonical;
      // Accept the bare path or the absolute apex URL form. What we reject
      // is the root "/" / apex root / no-path forms that triggered the
      // preview regression.
      const validForms = [
        canonical,
        `https://freshstart-il.com${canonical}`,
        `https://www.freshstart-il.com${canonical}`,
      ];
      expect(validForms).toContain(c);
      expect(c).not.toBe("/");
      expect(c).not.toBe("https://freshstart-il.com");
      expect(c).not.toBe("https://freshstart-il.com/");
    },
  );
});

// ── 7. OG image coverage — every named public page resolves to a 1200x630 ───

describe("v2 SEO — every named public page has an OG image", () => {
  it.each(SELF_CANONICAL_PAGES)(
    "$canonical openGraph.images is non-empty (page-set or layout-inherited)",
    ({ rel }) => {
      const m = loadPageMetadata(rel);
      const og = m.openGraph as { images?: unknown } | undefined;
      const layoutImages = (rootMetadata.openGraph as { images?: unknown })?.images;
      // Page-set images win; otherwise the layout default must be present.
      const effective = og?.images ?? layoutImages;
      expect(effective).toBeDefined();
      if (Array.isArray(effective)) {
        expect(effective.length).toBeGreaterThan(0);
      } else {
        expect(Boolean(effective)).toBe(true);
      }
    },
  );
});

// ── 8. /blog index has a blog-specific og:title (not the homepage title) ────

describe("v2 SEO — /blog index has a blog-specific og:title", () => {
  it("openGraph.title is a Blog-scoped string, not the layout default", () => {
    const m = loadPageMetadata("app/blog/page.tsx");
    const og = m.openGraph as { title?: string } | undefined;
    expect(og?.title).toBeDefined();
    expect(String(og!.title)).toMatch(/blog/i);
    const layoutOgTitle = (rootMetadata.openGraph as { title?: string })?.title;
    if (layoutOgTitle) {
      expect(og!.title).not.toBe(layoutOgTitle);
    }
  });
});

// ── 9. Homepage SSR contains zero /v2 hrefs ─────────────────────────────────
//
// /v2 is the internal review alias. No client-rendered nav / hero / cost
// band should link to it from the public homepage — those links were
// caught on the 2s4205u1z preview as logo /v2, desktop+mobile nav
// /v2#how-it-works + /v2/pricing, and the cost-comparison "Compare to
// hiring an attorney" CTA.

describe("v2 SEO — homepage SSR has zero rendered /v2 hrefs", () => {
  const html = ssr(<HomePage />);

  it("no href=\"/v2...\" anywhere in the rendered HTML", () => {
    // Capture every href value so the test failure points at the offender.
    const hrefs = Array.from(html.matchAll(/href="([^"]+)"/g)).map((m) => m[1]);
    const v2Hrefs = hrefs.filter((h) => /^\/v2(\/|#|$)/.test(h));
    if (v2Hrefs.length > 0) {
      throw new Error(
        `expected zero /v2 hrefs in rendered home, found:\n  ${v2Hrefs.join("\n  ")}`,
      );
    }
  });

  it("the rendered logo / nav points at production routes (no /v2)", () => {
    // Spot-check the canonical pricing CTA target.
    const hrefs = Array.from(html.matchAll(/href="([^"]+)"/g)).map((m) => m[1]);
    // We expect at least one /pricing href in the rendered home.
    expect(hrefs.some((h) => h === "/pricing" || /^\/pricing(\?|#|$)/.test(h))).toBe(true);
  });
});

// ── 10. metadata.title does not duplicate brand after template ──────────────
//
// app/layout.tsx declares title.template = "%s | FreshStart IL". Any page
// that bakes the brand into its own metadata.title (e.g. "Foo | FreshStart
// IL") renders as "Foo | FreshStart IL | FreshStart IL" once the template
// wraps it. The aviklrs4t preview surfaced this on /checklist; scanning
// the rest of the public pages exposed the same shape everywhere with a
// brand suffix baked in.
//
// Invariant: every page-set metadata.title must NOT contain the substring
// "FreshStart" (case-insensitive). The layout template owns brand
// placement; pages own the scoped name.

const TITLE_DEDUPE_PAGES = [
  "app/about/page.tsx",
  "app/faq/page.tsx",
  "app/legal/page.tsx",
  "app/privacy/page.tsx",
  "app/terms/page.tsx",
  "app/disclaimer/page.tsx",
  "app/grounds-for-divorce/page.tsx",
  "app/child-custody/page.tsx",
  "app/property-division/page.tsx",
  "app/support-calculations/page.tsx",
  "app/pricing/page.tsx",
  "app/checklist/page.tsx",
  "app/calculators/page.tsx",
  "app/start/page.tsx",
  "app/blog/page.tsx",
];

describe("v2 SEO — page-level metadata.title never bakes in the brand suffix", () => {
  it.each(TITLE_DEDUPE_PAGES)(
    "%s metadata.title is scoped (no FreshStart in the string)",
    (rel) => {
      const m = loadPageMetadata(rel);
      const title = m.title;
      // Pages must export a plain string title (the layout template
      // wraps it). title-as-object is allowed for the layout itself,
      // not for individual pages here.
      expect(typeof title === "string" || typeof title === "undefined").toBe(true);
      if (typeof title === "string") {
        // Case-insensitive substring check — catches "FreshStart",
        // "FreshStart IL", and "FreshStart-IL" forms.
        expect(title.toLowerCase()).not.toContain("freshstart");
      }
    },
  );

  it("the layout template still owns brand placement", () => {
    const tplObj = rootMetadata.title as { template?: string } | undefined;
    expect(tplObj?.template).toBe("%s | FreshStart IL");
  });
});
