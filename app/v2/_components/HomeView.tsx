// Shared homepage view. Rendered from both `/` (app/page.tsx) and `/v2`
// (app/v2/page.tsx) so the redesigned preview lives at root and the v2
// alias keeps working without duplication.
import * as React from "react";
import "./styles.css";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { HomepageHero } from "./Hero";
import { CostBand } from "./CostBand";
import { FeaturePills } from "./FeaturePills";
import { HowItWorks } from "./HowItWorks";
import { Testimonials } from "./Testimonials";
import { FAQ } from "./FAQ";
import { OrientationCall } from "./OrientationCall";
import { ChecklistCapture } from "./ChecklistCapture";
import { PageView } from "./PageView";
import { OrganizationAndWebsiteJsonLd } from "./JsonLd";

const FAQ_ITEMS = [
  {
    q: "Are the forms built for Illinois filing?",
    a: "Yes. FreshStart prepares Illinois divorce form drafts and county-specific filing steps based on current court templates and filing information. You review everything before filing, and support can help correct generation issues under our guarantee.",
  },
  {
    q: "What if my divorce is contested?",
    a: "FreshStart is built for uncontested divorces — where you and your spouse agree on the basics. If your case becomes contested, we'll help you understand your options and connect you with attorneys if needed.",
  },
  {
    q: "What if we have kids?",
    a: "Fully supported. Our parenting plan builder handles 50/50, joint custody, and custom arrangements, with a visual schedule calendar. Child support is calculated using Illinois statutory guidelines.",
  },
  {
    q: "Is this legal advice?",
    a: "No. FreshStart provides Illinois-specific legal information and document preparation. We don't give legal advice. If you need it, we'll point you to attorneys offering flat-fee consultations.",
  },
  {
    q: "What if I don't finish?",
    a: "Your progress is saved automatically. The 7-day free trial lets you explore everything risk-free. The 30-day money-back guarantee means if it's not right for you, you get a full refund.",
  },
];

export function HomeView() {
  return (
    <div className="fs-page" data-variant="price-forward">
      <OrganizationAndWebsiteJsonLd />
      <PageView page="homepage" variant="price-forward" />
      <Header page="homepage" ctaLabel="Start my filing" />
      <main role="main">
        <HomepageHero />
        <CostBand page="homepage" eyebrow="The math is the message" />
        <FeaturePills />
        <HowItWorks />
        <Testimonials />
        <FAQ
          page="homepage"
          eyebrow="Frequently asked"
          heading="The questions everyone asks before they start."
          items={FAQ_ITEMS}
        />
        <OrientationCall
          page="homepage"
          eyebrow="Not sure yet?"
          heading="Book a free 15-minute orientation call."
          body="No pitch — we'll tell you honestly whether FreshStart is the right fit for your situation, and point you to the next step either way."
        />
        <ChecklistCapture />
      </main>
      <Footer idSuffix="home" />
    </div>
  );
}
