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
import { PricingProductsJsonLd } from "./JsonLd";
import { getTierCount, getTiers } from "./tiers";

const PRICING_FAQ = [
  {
    q: "What if my spouse decides to contest?",
    a: "FreshStart is built for uncontested cases. If your spouse contests, your filing stays valid but the case moves to a litigated track. We'll refund Essential within 30 days, or pause your Plus subscription, and point you to flat-fee Illinois attorneys for the contested portion.",
  },
  {
    q: "Will my forms hold up in Cook County?",
    a: "Yes. Cook County is the strictest — and the one we test against first. Every Cook-specific cover sheet, summons, and judgment template is supported. If a Cook clerk rejects on a generation error, we fix it free and refund your refile fee.",
  },
  {
    q: "What if I need to refile because the court rejected something?",
    a: "Plus and Concierge include unlimited regenerations — fix and refile at no extra cost. On Essential, the refile add-on is $49. Roughly 1 in 12 of our cases needs a refile, and it's almost always a clerk-level formatting fix, not a substantive error.",
  },
  {
    q: "Do I still need a lawyer?",
    a: "For most uncontested Illinois divorces, no — but FreshStart isn't legal advice. If your case has a contested asset, a complicated business, or you and your spouse can't agree on a parenting plan, talk to a flat-fee attorney first. We'll refer you free.",
  },
  {
    q: "What actually happens after I pay?",
    a: "You're routed straight to the guided questionnaire. About 80% of people complete their first full draft in one sitting — under 2 hours. You can save and come back. Once your forms are signed and ready, you e-file through Illinois Odyssey with our step-by-step guide.",
  },
  {
    q: "When and how do I get refunded?",
    a: "Email refund@freshstart-il.com (or click 'Refund' in account settings) within 30 days. We process within 3 business days. No questions, no retention call. Plus subscribers also get a prorated refund on cancelation.",
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
      <PricingMobileStickyCTA />
    </div>
  );
}
