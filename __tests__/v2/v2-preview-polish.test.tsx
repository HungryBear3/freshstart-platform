/**
 * @jest-environment node
 *
 * P1/P2 preview polish guardrails:
 *
 *   1. Sticky-header overlap: `.fs-page` sections/headings declare
 *      scroll-margin-top so anchor jumps clear the blurred top bar.
 *   2. CTA copy consistency: "Start my filing" is the primary label
 *      across Hero, Header instances, and the V2PageShell default.
 *   3. Mobile header: the burger button has aria-expanded wiring and
 *      a real mobile drawer (<nav id="fs-mobile-menu">) lives in the
 *      Header.
 *   4. Mobile pricing: the $149/$299 amount has explicit narrow-viewport
 *      font-size step-downs so it doesn't clip.
 *   5. À la carte grid: auto-fit columns so two cards never leave an
 *      empty third slot.
 *   6. Lead-magnet stable success/error: covered by the existing P0
 *      checklist-capture-resilience suite — this file only re-asserts
 *      the timeout constant survives.
 */
import * as React from "react";
import ReactDOMServer from "react-dom/server";
import fs from "node:fs";
import path from "node:path";

import { Header } from "@/app/v2/_components/Header";
import { PricingAddons } from "@/app/v2/_components/PricingAddons";

function readSource(rel: string): string {
  return fs.readFileSync(path.resolve(__dirname, "..", "..", rel), "utf8");
}

function ssr(node: React.ReactElement): string {
  return ReactDOMServer.renderToStaticMarkup(node);
}

describe("CTA copy consistency — primary v2 label is 'Start my filing'", () => {
  it("Hero passes the new HERO_CTA_LABEL through to the button", () => {
    const src = readSource("app/v2/_components/Hero.tsx");
    expect(src).toMatch(/HERO_CTA_LABEL\s*=\s*"Start my filing"/);
    expect(src).not.toMatch(/HERO_CTA_LABEL\s*=\s*"Start my free 7-day trial"/);
  });

  it("HomeView mounts the header with the 'Start my filing' label", () => {
    const src = readSource("app/v2/_components/HomeView.tsx");
    expect(src).toMatch(/ctaLabel="Start my filing"/);
    expect(src).not.toMatch(/ctaLabel="Start Free Trial"/);
  });

  it("PricingView mounts the header with the 'Start my filing' label", () => {
    const src = readSource("app/v2/_components/PricingView.tsx");
    expect(src).toMatch(/ctaLabel="Start my filing"/);
    expect(src).not.toMatch(/ctaLabel="Start Free Trial"/);
  });

  it("V2PageShell default ctaLabel is 'Start my filing'", () => {
    const src = readSource("app/v2/_components/V2PageShell.tsx");
    expect(src).toMatch(/ctaLabel = "Start my filing"/);
    expect(src).not.toMatch(/ctaLabel = "Start my free 7-day trial"/);
  });

  it("no-trial language is preserved as supporting microcopy in the priceline", () => {
    const src = readSource("app/v2/_components/Hero.tsx");
    expect(src).toMatch(/No free trial/);
  });

  it("PricingTiers and the mobile sticky CTA already use 'Start my filing'", () => {
    expect(readSource("app/v2/_components/PricingTiers.tsx")).toMatch(
      /PRIMARY_CTA\s*=\s*"Start my filing"/,
    );
    expect(readSource("app/v2/_components/PricingMobileStickyCTA.tsx")).toMatch(
      /LABEL\s*=\s*"Start my filing"/,
    );
  });
});

describe("Mobile header — burger toggles a real menu", () => {
  const headerSrc = readSource("app/v2/_components/Header.tsx");

  it("declares state for menuOpen and wires aria-expanded to it", () => {
    expect(headerSrc).toMatch(/useState\(false\)/);
    expect(headerSrc).toMatch(/aria-expanded=\{menuOpen\}/);
  });

  it("renders a <nav id='fs-mobile-menu'> drawer with the same nav links", () => {
    expect(headerSrc).toMatch(/id="fs-mobile-menu"/);
    expect(headerSrc).toMatch(/className="fs-hd-mobile"/);
    expect(headerSrc).toMatch(/aria-controls="fs-mobile-menu"/);
    // Same links as desktop nav.
    expect(headerSrc).toMatch(/href="\/legal"/);
    expect(headerSrc).toMatch(/href="\/faq"/);
    expect(headerSrc).toMatch(/href="\/auth\/signin"/);
  });

  it("SSR output contains both the desktop nav and the (initially hidden) mobile drawer", () => {
    const html = ssr(<Header page="homepage" ctaLabel="Start my filing" />);
    expect(html).toContain('class="fs-nav"');
    expect(html).toContain('id="fs-mobile-menu"');
    // Drawer is hidden on the initial render (menuOpen=false).
    expect(html).toContain('hidden=""');
  });
});

describe("Sticky-header overlap — scroll-margin-top is declared on v2 sections", () => {
  const stylesSrc = readSource("app/v2/_components/styles.css");

  it("scopes scroll-margin-top to .fs-page so legacy pages are untouched", () => {
    expect(stylesSrc).toMatch(/\.fs-page :where\([^)]*\)\s*{\s*scroll-margin-top/);
  });

  it("declares a generic [id] scroll-margin so anchor jumps clear the header", () => {
    expect(stylesSrc).toMatch(/\.fs-page :where\(\[id\]\)\s*{\s*scroll-margin-top:\s*88px/);
  });

  it("steps down the offset on narrow viewports", () => {
    expect(stylesSrc).toMatch(/@media \(max-width: 768px\)[\s\S]*scroll-margin-top:\s*72px/);
  });
});

describe("Mobile pricing — $149/$299 typography step-downs", () => {
  const stylesSrc = readSource("app/v2/_components/styles.css");

  it("reduces .fs-pr-tier-amt on the 768/480/390 breakpoints", () => {
    expect(stylesSrc).toMatch(/@media \(max-width: 768px\)[\s\S]*\.fs-pr-tier-amt\s*{\s*font-size:\s*44px/);
    expect(stylesSrc).toMatch(/@media \(max-width: 480px\)[\s\S]*\.fs-pr-tier-amt\s*{\s*font-size:\s*36px/);
    expect(stylesSrc).toMatch(/@media \(max-width: 390px\)[\s\S]*\.fs-pr-tier-amt\s*{\s*font-size:\s*32px/);
  });

  it("adds bottom clearance below the tier grid so the mobile sticky CTA doesn't overlap", () => {
    expect(stylesSrc).toMatch(
      /@media \(max-width: 768px\)[\s\S]*\.fs-pr-tiers\s*{[^}]*padding-bottom:\s*96px/,
    );
  });

  it("stacks the sticky CTA vertically at ≤390px so the price line + button both fit", () => {
    expect(stylesSrc).toMatch(
      /@media \(max-width: 390px\)[\s\S]*\.fs-pr-sticky\s*{[\s\S]*flex-direction:\s*column/,
    );
  });
});

describe("À la carte grid — no empty third slot for the two launch add-ons", () => {
  it("addon grid uses auto-fit columns rather than fixed 3/4 columns", () => {
    const stylesSrc = readSource("app/v2/_components/styles.css");
    expect(stylesSrc).toMatch(
      /\.fs-pr-addon-grid\s*{[^}]*grid-template-columns:\s*repeat\(auto-fit/,
    );
    expect(stylesSrc).not.toMatch(
      /\.fs-pr-addon-grid\s*{[^}]*grid-template-columns:\s*repeat\(4,/,
    );
  });

  it("renders exactly two add-on cards in the current launch lineup", () => {
    const html = ssr(<PricingAddons />);
    const cardMatches = html.match(/class="fs-pr-addon"/g) || [];
    expect(cardMatches.length).toBe(2);
    // Sanity: both launch add-ons are present.
    expect(html).toContain("Parenting plan worksheet");
    expect(html).toContain("Refile assistance");
  });
});

describe("Lead-magnet timeout — P0 behaviour still asserted at source level", () => {
  it("CHECKLIST_TIMEOUT_MS is still 2000ms with an AbortController and a finally-cleared timer", () => {
    const src = readSource("app/v2/_components/ChecklistCapture.tsx");
    expect(src).toMatch(/CHECKLIST_TIMEOUT_MS\s*=\s*2000/);
    expect(src).toMatch(/new AbortController\(\)/);
    expect(src).toMatch(/finally\s*{[\s\S]*clearTimeout/);
  });
});
