// Shared pricing view. Rendered from both `/pricing` (app/pricing/page.tsx)
// and `/v2/pricing` (app/v2/pricing/page.tsx).
import * as React from "react";
import "./styles.css";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CostBand } from "./CostBand";
import { FAQ } from "./FAQ";
import { OrientationCall } from "./OrientationCall";
import { PageView } from "./PageView";
import { PricingHero } from "./PricingHero";
import { PricingTiers } from "./PricingTiers";
import { PricingCompareTable } from "./PricingCompareTable";
import { PricingAddons } from "./PricingAddons";
import { PricingGuaranteeBand } from "./PricingGuaranteeBand";
import { PricingTestimonials } from "./PricingTestimonials";
import { PricingMobileStickyCTA } from "./PricingMobileStickyCTA";
import { PricingCheckoutResume } from "./PricingCheckoutResume";
import { PricingProductsJsonLd } from "./JsonLd";
import { getTierCount, getTiers } from "./tiers";

const PRICING_FAQ = [
  {
    q: "What if my spouse decides to contest?",
    a: "FreshStart is built for uncontested cases. If your spouse contests or stops agreeing on the basics, pause before filing and talk to an Illinois attorney. We don't mediate contested disputes or make refund decisions based on why an agreement fell apart.",
  },
  {
    q: "Does this work for Cook County?",
    a: "FreshStart includes Cook County-specific form templates and filing notes where they apply. Cook has detailed local requirements, so you should review the generated packet and current clerk instructions before filing.",
  },
  {
    q: "What if I need to refile because the court rejected something?",
    a: "Some filings need corrections after clerk review. Plus includes unlimited regenerations while your subscription is active. On Essential, the refile assistance add-on is $49 if you want help updating the packet.",
  },
  {
    q: "Do I still need a lawyer?",
    a: "For most uncontested Illinois divorces, no — but FreshStart isn't legal advice. If your case has a contested asset, a complicated business, or you and your spouse can't agree on a parenting plan, talk to a flat-fee attorney first. We'll refer you free.",
  },
  {
    q: "What actually happens after I pay?",
    a: "You're routed straight to the guided questionnaire. Many straightforward uncontested cases can complete a first draft in one focused session when their information is ready. You can save and come back, then use our step-by-step guide for the filing process.",
  },
  {
    q: "When and how do I get refunded?",
    a: "Email support@freshstart-il.com (or use the account settings flow when available) within 30 days. Eligible refunds are processed under the published refund policy at /legal-info/refund-policy — no retention call required.",
  },
  {
    q: "Why is Plus annual instead of one-time?",
    a: "Because Illinois statutes change, parenting schedules change, and properties take time to actually divide. Plus exists for cases that aren't 'done' on day one. If yours is, Essential is the right plan.",
  },
];

export function PricingView() {
  const count = getTierCount();
  const tiers = getTiers({ count, recommendedTier: "plus" });
  return (
    <div className="fs-page" data-variant={`pricing-${count}-tier`}>
      <PricingProductsJsonLd tiers={tiers} />
      <PageView page="pricing" variant={`pricing-${count}-tier`} />
      {/*
        Header CTA on pricing is intentionally `Start Free Trial` per the
        v2 root-preview locked values — the in-card CTA `Start my filing →`
        is the conversion lever. We do NOT surface a `Free Checklist` link
        or checklist capture above the tiers; the only checklist capture
        lives below the homepage FAQ.
      */}
      <Header page="pricing" ctaLabel="Start Free Trial" />
      <main role="main">
        <PricingHero />
        <PricingTiers tiers={tiers} />
        <PricingCompareTable threeTier={count === 3} recommended="plus" />
        <PricingAddons />
        <PricingGuaranteeBand />
        <CostBand page="pricing" eyebrow="For context" variant="pricing" />
        <PricingTestimonials />
        <FAQ
          page="pricing"
          variant="pricing"
          eyebrow="Pricing FAQ"
          heading="The objections worth answering."
          items={PRICING_FAQ}
        />
        <OrientationCall
          page="pricing"
          eyebrow="Still on the fence?"
          heading="Talk to a human for 15 minutes — free."
          body="We'll tell you honestly whether Essential, Plus, or an attorney is the right call for your situation. No sales script."
        />
      </main>
      <Footer idSuffix="pricing" />
      <PricingCheckoutResume />
      <PricingMobileStickyCTA />
    </div>
  );
}
