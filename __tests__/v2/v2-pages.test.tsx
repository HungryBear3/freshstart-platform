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
 *   - homepage hero CTA renders the locked free-trial copy
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
import { PricingCompareTable } from "@/app/v2/_components/PricingCompareTable";
import { PricingMobileStickyCTA } from "@/app/v2/_components/PricingMobileStickyCTA";
import { FAQ } from "@/app/v2/_components/FAQ";
import { Header } from "@/app/v2/_components/Header";
import { getTiers, getTierCount } from "@/app/v2/_components/tiers";

function ssr(node: React.ReactElement): string {
  return ReactDOMServer.renderToStaticMarkup(node);
}

describe("v2 homepage hero", () => {
  it("renders the price-forward headline variant", () => {
    const html = ssr(<HomepageHero />);
    expect(html).toContain("Your Illinois divorce, filed right");
    expect(html).toContain("without $15,000 attorney fees.");
  });

  it("renders the locked free-trial CTA and a 'See how it works' secondary CTA", () => {
    const html = ssr(<HomepageHero />);
    expect(html).toContain("Start my free 7-day trial");
    expect(html).toContain("See how it works");
  });

  it("renders the locked price line ($149 / $299) and trust strip", () => {
    const html = ssr(<HomepageHero />);
    expect(html).toContain("$149 one-time");
    expect(html).toContain("$299/yr");
    expect(html).toContain("7-day free trial");
    expect(html).toContain("30-day money-back guarantee");
    expect(html).toContain("256-bit encrypted");
  });
});

describe("v2 pricing hero", () => {
  it('renders the "from $149" hero copy', () => {
    const html = ssr(<PricingHero />);
    expect(html).toMatch(/from \$149/i);
    expect(html).toContain("Pricing · Illinois divorce, end to end");
    // The pre-replacement "Pay once at $149, or get ongoing updates" copy MUST be gone.
    expect(html).not.toMatch(/Pay once at \$149, or get ongoing updates/);
  });
});

describe("v2 pricing tiers", () => {
  it("renders 2 tiers by default and marks Plus as recommended", () => {
    const tiers = getTiers({ count: 2, recommendedTier: "plus" });
    expect(tiers).toHaveLength(2);
    expect(tiers.map((t) => t.key)).toEqual(["essential", "plus"]);
    const html = ssr(<PricingTiers tiers={tiers} />);
    expect(html).toContain(">Essential<");
    expect(html).toContain(">Plus<");
    expect(html).not.toContain(">Concierge<");
    expect(html).toContain("Recommended");
  });

  it("renders Concierge when the 3-tier flag is on", () => {
    const tiers = getTiers({ count: 3, recommendedTier: "plus" });
    expect(tiers).toHaveLength(3);
    expect(tiers.map((t) => t.key)).toEqual(["essential", "plus", "concierge"]);
    const html = ssr(<PricingTiers tiers={tiers} />);
    expect(html).toContain(">Concierge<");
  });
});

describe("v2 pricing tier-count flag default", () => {
  it("getTierCount defaults to 2 when PRICING_TIERS is unset or not '3'", () => {
    const prior = process.env.PRICING_TIERS;
    delete process.env.PRICING_TIERS;
    expect(getTierCount()).toBe(2);
    process.env.PRICING_TIERS = "2";
    expect(getTierCount()).toBe(2);
    process.env.PRICING_TIERS = "3";
    expect(getTierCount()).toBe(3);
    if (prior === undefined) delete process.env.PRICING_TIERS;
    else process.env.PRICING_TIERS = prior;
  });
});

describe("v2 pricing compare table", () => {
  it("renders Concierge column only when threeTier=true and labels 'not included' dashes for screen readers", () => {
    const two = ssr(<PricingCompareTable threeTier={false} recommended="plus" />);
    expect(two).not.toContain(">Concierge<");

    const three = ssr(<PricingCompareTable threeTier recommended="plus" />);
    expect(three).toContain(">Concierge<");
    // aria-label on dash cells so SRs don't read silence
    expect(three).toMatch(/aria-label="not included"/);
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
  it("renders nav links to /v2/pricing and marks the active state on the pricing page", () => {
    const home = ssr(<Header page="homepage" ctaLabel="Start Free Trial" />);
    expect(home).toMatch(/href="\/v2\/pricing"/);
    expect(home).toContain("Start Free Trial");
    expect(home).not.toMatch(/fs-nav-active[^"]*"[^>]*>Pricing/);

    const pricing = ssr(<Header page="pricing" ctaLabel="Start my filing" />);
    expect(pricing).toMatch(/class="fs-nav-active"[^>]*>Pricing/);
    expect(pricing).toContain("Start my filing");
  });

  it("links the logo back to /v2 from both pages", () => {
    const home = ssr(<Header page="homepage" ctaLabel="Start Free Trial" />);
    const pricing = ssr(<Header page="pricing" ctaLabel="Start my filing" />);
    expect(home).toMatch(/href="\/v2"/);
    expect(pricing).toMatch(/href="\/v2"/);
  });
});

describe("v2 pricing mobile sticky CTA", () => {
  it("renders the locked price summary and CTA label", () => {
    const html = ssr(<PricingMobileStickyCTA />);
    expect(html).toContain("$149");
    expect(html).toContain("$299/yr");
    expect(html).toContain("Start my filing");
    // Hidden flag starts false; flips true via IntersectionObserver in-browser.
    expect(html).toContain('data-hidden="false"');
  });
});
