// Shared pricing view. Rendered from both `/pricing` (app/pricing/page.tsx)
// and `/v2/pricing` (app/v2/pricing/page.tsx).
import * as React from "react";
import "./styles.css";
import { Header } from "./Header";
import { Footer } from "./Footer";

import { FAQ } from "./FAQ";
import { OrientationCall } from "./OrientationCall";
import { PageView } from "./PageView";
import { PricingHero } from "./PricingHero";
import { PricingTiers } from "./PricingTiers";
import { PricingValueOverFree } from "./PricingValueOverFree";
import { PricingGuaranteeBand } from "./PricingGuaranteeBand";
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
    q: "What if I need to correct something after clerk review?",
    a: "Some filings need corrections after clerk review. FreshStart helps you regenerate organized form drafts and filing steps, but we cannot guarantee clerk acceptance or a court outcome.",
  },
  {
    q: "Do I still need a lawyer?",
    a: "FreshStart cannot determine whether you need a lawyer and does not provide legal advice. If your case has a contested asset, a complicated business, or you and your spouse cannot agree on a parenting plan, talk to an Illinois attorney before filing.",
  },
  {
    q: "What actually happens after I pay?",
    a: "You're routed straight to the guided questionnaire. Many straightforward uncontested cases can complete a first draft in one focused session when their information is ready. You can save and come back, then use our step-by-step guide for the filing process.",
  },
  {
    q: "Why pay if Illinois forms are free?",
    a: "The forms themselves are free. FreshStart charges for the guided questionnaire, organized form drafts, checks for common clerical gaps, and plain-English filing steps. If you already know what to file and how your county handles the next steps, the free forms may be enough.",
  },
  {
    q: "When and how do I get refunded?",
    a: "Email support@freshstart-il.com (or use the account settings flow when available) within 30 days. Eligible refunds are processed under the published refund policy at /legal-info/refund-policy — no retention call required.",
  },
  {
    q: "Why one flat price instead of a subscription?",
    a: "FreshStart is designed for straightforward uncontested cases, not recurring billing. If your case keeps changing or you and your spouse do not agree on the basics, pause before filing and talk to an Illinois attorney.",
  },
];

export function PricingView() {
  const count = getTierCount();
  const tiers = getTiers({ count, recommendedTier: "essential" });
  return (
    <div className="fs-page" data-variant={`pricing-${count}-tier`}>
      <PricingProductsJsonLd tiers={tiers} />
      <PageView page="pricing" variant={`pricing-${count}-tier`} />
      {/*
        Primary CTA across v2 is "Start my filing". The no-trial policy is
        kept as supporting microcopy, not as a button label. We do NOT surface a `Free Checklist` link
        or checklist capture above the tiers; the only checklist capture
        lives below the homepage FAQ.
      */}
      <Header page="pricing" ctaLabel="Start my filing" />
      <main role="main">
        <PricingHero />
        <PricingTiers tiers={tiers} />
        <PricingValueOverFree />
        <PricingGuaranteeBand />
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
          body="We'll explain FreshStart's product scope and answer service questions. We cannot tell you whether you need an attorney or give legal advice."
        />
      </main>
      <Footer idSuffix="pricing" />
      <PricingCheckoutResume />
      <PricingMobileStickyCTA />
    </div>
  );
}
