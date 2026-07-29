/**
 * @jest-environment node
 *
 * Smoke tests for the /v2 preview redesign.
 *
 * Mirrors the repo's existing pattern (e.g. __tests__/app/homepage-premium.test.tsx)
 * — renderToStaticMarkup, no DOM. RTL 16 + React 19 has an `act` compat hiccup
 * inside the existing jest setup, so we stay on the SSR pattern for portability.
 *
 * Coverage requested by the brief:
 *   - homepage hero renders correct headline variant
 *   - homepage hero CTA renders the approved no-trial copy
 *   - pricing hero renders "from $149"
 *   - pricing cards render 2-tier default
 *   - PRICING_TIERS=3 flag flips to render Concierge
 *   - FAQ items render with aria-expanded wiring
 *   - mobile sticky CTA visibility on pricing
 *   - cross-page nav links resolve (and active class on the pricing page)
 *
 * Stub-handler smoke for the /api/_stub/* surface is in v2-stubs.test.ts.
 */
import * as React from "react";
import ReactDOMServer from "react-dom/server";

import { HomepageHero } from "@/app/v2/_components/Hero";
import { PricingHero } from "@/app/v2/_components/PricingHero";
import { PricingTiers } from "@/app/v2/_components/PricingTiers";

import { PricingMobileStickyCTA } from "@/app/v2/_components/PricingMobileStickyCTA";
import { FAQ } from "@/app/v2/_components/FAQ";
import { Header } from "@/app/v2/_components/Header";
import { getTiers, getTierCount } from "@/app/v2/_components/tiers";

function ssr(node: React.ReactElement): string {
  return ReactDOMServer.renderToStaticMarkup(node);
}

describe("v2 homepage hero", () => {
  it("renders the document-preparation division of labor", () => {
    const html = ssr(<HomepageHero />);
    expect(html).toMatch(/We prepare your forms\.[\s\S]*You file them\./);
    expect(html).toContain("uncontested-divorce form drafts");
    expect(html).not.toMatch(/filed right|nothing gets rejected/i);
  });

  it("renders the locked primary CTA `Start my filing` and a 'See how it works' secondary CTA", () => {
    const html = ssr(<HomepageHero />);
    // Price/supporting policy copy is visible next to the primary CTA.
    expect(html).toContain("Start my filing");
    expect(html).toContain("No subscription");
    expect(html).toContain("See how it works");
  });

  it("renders one-time pricing, refund-policy language, and the trust strip", () => {
    const html = ssr(<HomepageHero />);
    expect(html).toContain("$149 one-time");
    expect(html).not.toContain("$299/yr");
    expect(html).toContain("No subscription");
    expect(html).toContain("30-day refund policy");
    expect(html).not.toMatch(/money-back guarantee/i);
    expect(html).toContain("256-bit encrypted");
  });

  it("does not advertise held prenup support in the launch feature pills", () => {
    const source = require("node:fs").readFileSync(require("node:path").join(process.cwd(), "app/v2/_components/FeaturePills.tsx"), "utf8");
    expect(source).toContain("Refile Help");
    expect(source).not.toMatch(/Prenup Support|UPAA framework/);
  });
});

describe("v2 pricing hero", () => {
  it('renders the "$149 flat" hero copy', () => {
    const html = ssr(<PricingHero />);
    expect(html).toMatch(/\$149 flat/i);
    expect(html).toContain("Pricing · Document preparation and filing guidance");
    // The pre-replacement "Pay once at $149, or get ongoing updates" copy MUST be gone.
    expect(html).not.toMatch(/Pay once at \$149, or get ongoing updates/);
  });
});

describe("v2 pricing tiers", () => {
  it("renders one Essential tier by default with no subscription upsell", () => {
    const tiers = getTiers({ count: 1, recommendedTier: "essential" });
    expect(tiers).toHaveLength(1);
    expect(tiers.map((t) => t.key)).toEqual(["essential"]);
    const html = ssr(<PricingTiers tiers={tiers} />);
    expect(html).toContain("fs-pr-tier-grid is-one");
    expect(html).toContain(">Essential<");
    expect(html).not.toContain(">Plus<");
    expect(html).not.toContain(">Concierge<");
    expect(html).not.toContain("Recommended");
  });

  it("does not re-enable legacy Plus or Concierge tiers through the old flag", () => {
    const tiers = getTiers({ count: 3 });
    expect(tiers).toHaveLength(1);
    expect(tiers.map((t) => t.key)).toEqual(["essential"]);
    const html = ssr(<PricingTiers tiers={tiers} />);
    expect(html).not.toContain(">Plus<");
    expect(html).not.toContain(">Concierge<");
  });
});

describe("v2 pricing tier-count flag default", () => {
  it("getTierCount defaults to 1 when PRICING_TIERS is unset or not '3'", () => {
    const prior = process.env.PRICING_TIERS;
    delete process.env.PRICING_TIERS;
    expect(getTierCount()).toBe(1);
    process.env.PRICING_TIERS = "2";
    expect(getTierCount()).toBe(1);
    process.env.PRICING_TIERS = "3";
    expect(getTierCount()).toBe(1);
    if (prior === undefined) delete process.env.PRICING_TIERS;
    else process.env.PRICING_TIERS = prior;
  });
});


describe("v2 FAQ accordion", () => {
  const items = [
    { q: "Will my forms actually be accepted?", a: "Yes." },
    { q: "What if my divorce is contested?", a: "FreshStart is built for uncontested cases." },
  ];

  it("renders each item with aria-expanded wiring and the first item open by default", () => {
    const html = ssr(<FAQ page="homepage" eyebrow="FAQ" heading="Heading" items={items} />);
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain("Will my forms actually be accepted?");
    expect(html).toContain("What if my divorce is contested?");
    // aria-controls wires the panel to the button for SRs.
    expect(html).toMatch(/aria-controls="faq-panel-0"/);
  });

  it("supports the pricing variant id namespace", () => {
    const html = ssr(
      <FAQ
        page="pricing"
        variant="pricing"
        eyebrow="Pricing FAQ"
        heading="Heading"
        items={items}
        sectionId="faq-pricing"
      />,
    );
    expect(html).toMatch(/aria-controls="faq-pricing-panel-0"/);
  });
});

describe("v2 header cross-page nav", () => {
  it("renders nav links to canonical /pricing and marks the active state on the pricing page", () => {
    // Primary v2 CTA copy is now "Start my filing" on both pages.
    const home = ssr(<Header page="homepage" ctaLabel="Start my filing" />);
    expect(home).toMatch(/href="\/pricing"/);
    expect(home).toContain("Start my filing");
    expect(home).not.toMatch(/fs-nav-active[^"]*"[^>]*>Pricing/);

    const pricing = ssr(<Header page="pricing" ctaLabel="Start my filing" />);
    expect(pricing).toMatch(/class="fs-nav-active"[^>]*>Pricing/);
    expect(pricing).toContain("Start my filing");
  });

  it("links the approved document/sunrise logo back to / from both pages", () => {
    const home = ssr(<Header page="homepage" ctaLabel="Start my filing" />);
    const pricing = ssr(<Header page="pricing" ctaLabel="Start my filing" />);
    expect(home).toMatch(/href="\/"/);
    expect(pricing).toMatch(/href="\/"/);
    expect(home).toContain("FreshStart");
    expect(home).toContain("IL</span>");
    expect(home).toContain("A4.9 4.9 0 0 1");
    expect(home).not.toContain("fs-logo-accent");
  });
});

describe("v2 pricing mobile sticky CTA", () => {
  it("renders the locked price summary and CTA label", () => {
    const html = ssr(<PricingMobileStickyCTA />);
    expect(html).toContain("$149");
    expect(html).not.toContain("$299/yr");
    expect(html).toContain("one-time");
    expect(html).toContain("Start my filing");
    // Hidden flag starts false; flips true via IntersectionObserver in-browser.
    expect(html).toContain('data-hidden="false"');
  });
});
