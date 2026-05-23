import * as React from "react";

export function PricingHero() {
  return (
    <section className="fs-hero fs-pr-hero" aria-labelledby="pricing-h1">
      <div className="fs-hero-bg" aria-hidden="true" />
      <div className="fs-hero-inner">
        <div className="fs-eyebrow">
          <span className="fs-eyebrow-dot" aria-hidden="true" />
          Pricing · Illinois divorce, end to end
        </div>
        <h1 id="pricing-h1" className="fs-h1">
          Your Illinois divorce, filed right — <span className="fs-h1-accent">from $149.</span>
        </h1>
        <p className="fs-sub">
          Same Illinois form workflow. Same Illinois-specific guidance. Pick the plan that fits how
          your case is moving.
        </p>
        <div className="fs-priceline" aria-label="Plan benefits">
          <strong>7-day free trial</strong>
          <span className="fs-priceline-dot" aria-hidden="true">
            ·
          </span>
          <span>No card required</span>
          <span className="fs-priceline-dot" aria-hidden="true">
            ·
          </span>
          <span>30-day refund policy</span>
        </div>
      </div>
    </section>
  );
}
