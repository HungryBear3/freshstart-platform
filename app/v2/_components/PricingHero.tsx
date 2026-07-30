import * as React from "react";

export function PricingHero() {
  return (
    <section className="fs-hero fs-pr-hero" aria-labelledby="pricing-h1">
      <div className="fs-hero-bg" aria-hidden="true" />
      <div className="fs-hero-inner">
        <div className="fs-eyebrow">
          <span className="fs-eyebrow-dot" aria-hidden="true" />
          Pricing · Document preparation and filing guidance
        </div>
        <h1 id="pricing-h1" className="fs-h1">
          Illinois divorce paperwork, organized — <span className="fs-h1-accent">$149 flat.</span>
        </h1>
        <p className="fs-sub">
          Free court forms are the raw materials. FreshStart turns your answers into organized
          Illinois form drafts, a filing checklist, and plain-English next steps.
        </p>
        <div className="fs-priceline" aria-label="Plan benefits">
          <strong>$149 one-time · 60 days of service access</strong>
          <span className="fs-priceline-dot" aria-hidden="true">
            ·
          </span>
          <span>No subscription</span>
          <span className="fs-priceline-dot" aria-hidden="true">
            ·
          </span>
          <span>30-day refund policy</span>
        </div>
      </div>
    </section>
  );
}
