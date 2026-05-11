/**
 * @jest-environment node
 *
 * Asserts the root routes `/` and `/pricing` now render the v2 redesign
 * (not the legacy homepage or legacy "One price. Everything included."
 * pricing page) AND do not mount VisitorCounter on the redesigned path.
 *
 * These are the gates for the v2 root-preview review: if root copy
 * regresses to the legacy text or VisitorCounter sneaks back in, this
 * suite fails.
 */
import * as React from "react";
import ReactDOMServer from "react-dom/server";
import { readFileSync } from "fs";
import { join } from "path";

import HomePage from "@/app/page";
import PricingPage from "@/app/pricing/page";

function ssr(node: React.ReactElement): string {
  return ReactDOMServer.renderToStaticMarkup(node);
}

describe("root `/` renders the v2 redesigned homepage", () => {
  const html = ssr(<HomePage />);

  it("renders the v2 hero headline + price-forward accent", () => {
    expect(html).toContain("Your Illinois divorce, filed right");
    expect(html).toContain("without $15,000 attorney fees.");
  });

  it("renders the locked hero CTA `Start my free 7-day trial`", () => {
    expect(html).toContain("Start my free 7-day trial");
  });

  it("renders the v2 header CTA `Start Free Trial` (not `Free Checklist`)", () => {
    // Header CTA button text — must be the trial CTA.
    expect(html).toContain("Start Free Trial");
    // Must NOT include the legacy "Free Checklist" CTA in the header on
    // this path. (Allow it elsewhere in the bundle if a non-mounted
    // module string is matched — we only care about rendered output.)
    // The page-rendered HTML for root has no "Free Checklist" anywhere.
    expect(html).not.toMatch(/Free Checklist/);
  });

  it("does NOT render the legacy `Illinois Divorce Done Right` copy", () => {
    expect(html).not.toMatch(/Illinois Divorce Done Right/);
  });

  it("includes the cost-comparison band, FAQ, orientation call, and a single checklist capture", () => {
    expect(html).toMatch(/\$15,000–\$25,000/); // strike-through attorney range
    expect(html).toMatch(/Frequently asked/);
    expect(html).toMatch(/Book a free 15-min call/);
    // Single capture: exactly one "Send my checklist" button.
    const matches = html.match(/Send my checklist/g) ?? [];
    expect(matches).toHaveLength(1);
  });
});

describe("root `/pricing` renders the v2 redesigned pricing page", () => {
  const html = ssr(<PricingPage />);

  it('renders the "from $149" pricing hero', () => {
    expect(html).toMatch(/from \$149/i);
  });

  it("renders Essential and Plus tiers (and no Concierge by default)", () => {
    expect(html).toContain(">Essential<");
    expect(html).toContain(">Plus<");
    expect(html).not.toContain(">Concierge<");
  });

  it("uses `Start my filing →` as the tier-card CTA", () => {
    expect(html).toContain("Start my filing");
  });

  it("uses `Start Free Trial` as the header CTA (no Free Checklist)", () => {
    expect(html).toContain("Start Free Trial");
    expect(html).not.toMatch(/Free Checklist/);
  });

  it("does NOT render the legacy `One price. Everything included.` copy", () => {
    expect(html).not.toMatch(/One price\. Everything included/);
    // Belt and suspenders: legacy "One-Time Access" / "$197" / "AutoSubscribe" hooks gone.
    expect(html).not.toMatch(/One-Time Access/);
    expect(html).not.toMatch(/\$197/);
  });

  it("shows the comparison table and add-on row, with no checklist capture above tiers", () => {
    expect(html).toMatch(/Side by side/);
    expect(html).toMatch(/À la carte/);
    // No email-capture form above or inside the pricing flow.
    expect(html).not.toMatch(/Send my checklist/);
  });
});

describe("redesigned root path has no VisitorCounter or legacy MainLayout import", () => {
  function read(rel: string) {
    return readFileSync(join(process.cwd(), rel), "utf8");
  }

  // Source-level assertions look for an actual `import ... VisitorCounter`
  // line or a `<VisitorCounter` JSX usage, not the bare word — so
  // explanatory comments referencing the legacy mount don't trip the
  // regression.
  const VISITOR_IMPORT_RE = /import[^;]*VisitorCounter[^;]*from/;
  const VISITOR_JSX_RE = /<\s*VisitorCounter\b/;

  it("app/page.tsx does not import or mount VisitorCounter", () => {
    const src = read("app/page.tsx");
    expect(src).not.toMatch(VISITOR_IMPORT_RE);
    expect(src).not.toMatch(VISITOR_JSX_RE);
  });

  it("app/pricing/page.tsx does not import MainLayout or mount VisitorCounter", () => {
    const src = read("app/pricing/page.tsx");
    expect(src).not.toMatch(/import[^;]+from\s+["']@\/components\/layouts\/main-layout["']/);
    expect(src).not.toMatch(VISITOR_IMPORT_RE);
    expect(src).not.toMatch(VISITOR_JSX_RE);
  });

  it("v2 Footer + v2 Header do not import or mount VisitorCounter", () => {
    const footer = read("app/v2/_components/Footer.tsx");
    const header = read("app/v2/_components/Header.tsx");
    for (const src of [footer, header]) {
      expect(src).not.toMatch(VISITOR_IMPORT_RE);
      expect(src).not.toMatch(VISITOR_JSX_RE);
    }
  });

  it("rendered root HTML does not contain VisitorCounter telemetry markers", () => {
    const homeHtml = ssr(<HomePage />);
    const pricingHtml = ssr(<PricingPage />);
    for (const html of [homeHtml, pricingHtml]) {
      expect(html).not.toMatch(/data-visitor-counter/);
      // Real telemetry endpoint path used by the legacy counter — must be absent.
      expect(html).not.toMatch(/\/api\/visitor-count\b/);
    }
  });
});
