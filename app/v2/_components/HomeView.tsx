// Shared homepage view. Rendered from both `/` (app/page.tsx) and `/v2`
// (app/v2/page.tsx) so the redesigned preview lives at root and the v2
// alias keeps working without duplication.
import * as React from "react";
import "./styles.css";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { HomepageHero } from "./Hero";

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
    a: "FreshStart prepares supported Illinois divorce form drafts and county-aware filing notes where available. You review everything and verify current clerk requirements before filing.",
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
    a: "Your progress is saved automatically. There is no free trial; choose a plan only when you are ready to move forward. Refund requests are handled under our published refund policy.",
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
        <section className="mx-auto max-w-6xl px-5 pt-5 sm:px-8" aria-label="Scope and legal boundary">
          <div className="rounded-xl border border-[var(--fs-border)] bg-[var(--fs-card)] px-5 py-4 text-sm leading-6 text-[var(--fs-text-mid)]">
            <strong className="text-[var(--fs-text)]">Not a law firm. Not legal advice.</strong>{" "}
            FreshStart IL prepares Illinois uncontested-divorce form drafts and step-by-step
            filing guidance; you review everything before you file.
          </div>
        </section>
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
          body="No pitch — we'll explain FreshStart's product scope and answer service questions. We cannot tell you whether you need an attorney or give legal advice."
        />
        <ChecklistCapture />
      </main>
      <Footer idSuffix="home" />
    </div>
  );
}
