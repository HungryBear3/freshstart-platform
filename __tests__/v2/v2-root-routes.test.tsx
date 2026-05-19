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
    expect(html).toContain("without starting with hourly attorney fees.");
  });

  it("renders the locked primary CTA `Start my filing` (with free-trial as microcopy)", () => {
    // Primary v2 button copy is "Start my filing" everywhere; the
    // 7-day free trial language survives in the priceline microcopy.
    expect(html).toContain("Start my filing");
    expect(html).toContain("7-day free trial");
  });

  it("renders the v2 header CTA `Start my filing` (not `Free Checklist`)", () => {
    // Header CTA button text — must be the unified primary CTA.
    expect(html).toContain("Start my filing");
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

  it("uses safer legal copy and labels scenarios as illustrative", () => {
    expect(html).toContain("Illinois form drafts");
    expect(html).toContain("Illustrative Illinois filing scenarios");
    expect(html).not.toMatch(/Court-ready|court-ready|Reviewed against Illinois Compiled Statutes|Trusted by Illinois residents/);
    expect(html).not.toMatch(/accepted by|actually filed/);
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

  it("uses `Start my filing` as the header CTA (no Free Checklist)", () => {
    expect(html).toContain("Start my filing");
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

  it("avoids court-reliant promises, contestation refunds, and unsubstantiated quantified claims", () => {
    expect(html).toContain("Illustrative pricing scenarios");
    expect(html).toContain("We don&#x27;t mediate contested disputes");
    expect(html).not.toMatch(/court-ready|Court-ready|Accepted statewide|same court acceptance/);
    expect(html).not.toMatch(/80%|1 in 12|pause your Plus|prorated refund|contestation is not a separate refund trigger/);
  });
});

describe("root metadata is production-canonical and share-copy aligned", () => {
  function read(rel: string) {
    return readFileSync(join(process.cwd(), rel), "utf8");
  }

  const layout = read("app/layout.tsx");

  it("defaults metadataBase/canonical to the production domain, not Vercel preview or auth URLs", () => {
    expect(layout).toMatch(/NEXT_PUBLIC_SITE_URL\s*\|\|\s*"https:\/\/freshstart-il\.com"/);
    expect(layout).toMatch(/metadataBase:\s*new URL\(siteUrl\)/);
    expect(layout).toMatch(/canonical:\s*"\/"/);
    expect(layout).not.toMatch(/metadataBase:[\s\S]*NEXTAUTH_URL/);
    expect(layout).not.toMatch(/metadataBase:[\s\S]*VERCEL_URL/);
  });

  it("uses the homepage hook as the default document, OpenGraph, and Twitter title", () => {
    expect(layout).toMatch(
      /homepageTitle\s*=\s*"FreshStart IL — Your Illinois divorce, filed right, from \$149"/,
    );
    expect(layout).toMatch(/default:\s*homepageTitle/);
    expect(layout).toMatch(/openGraph:[\s\S]*title:\s*homepageTitle/);
    expect(layout).toMatch(/twitter:[\s\S]*title:\s*homepageTitle/);
    expect(layout).not.toMatch(/FreshStart IL - Divorce Guidance Platform/);
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
