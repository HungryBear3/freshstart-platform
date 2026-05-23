"use client";

import * as React from "react";
import { analytics } from "./analytics";
import { beginSignupFirstCheckout } from "./checkout-intent";

// Primary CTA copy is "Start my filing" across the v2 surface. The
// 7-day free-trial language lives in the priceline microcopy below.
const HERO_CTA_LABEL = "Start my filing";

export function HomepageHero() {
  const onPrimary = () => {
    analytics.track({
      name: "cta_click",
      page: "homepage",
      location: "hero",
      label: HERO_CTA_LABEL,
    });
    beginSignupFirstCheckout({ plan: "annual", source: "homepage_hero" });
  };
  const onSecondary = () => {
    analytics.track({
      name: "cta_click",
      page: "homepage",
      location: "hero",
      label: "See how it works",
    });
    const el = document.getElementById("how-it-works");
    el?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <section className="fs-hero" aria-labelledby="hero-h1">
      <div className="fs-hero-bg" aria-hidden="true" />
      <div className="fs-hero-inner">
        <div className="fs-eyebrow">
          <span className="fs-eyebrow-dot" aria-hidden="true" />
          Available in all 102 Illinois counties
        </div>
        <h1 id="hero-h1" className="fs-h1">
          Your Illinois divorce, filed right —{" "}
          <span className="fs-h1-accent">without starting with hourly attorney fees.</span>
        </h1>
        <p className="fs-sub">
          Illinois form drafts, step-by-step guidance, and a filing roadmap. Straightforward
          uncontested cases can often complete a first draft in one focused session when their
          information is ready.
        </p>
        <div className="fs-priceline" aria-label="Pricing summary">
          <strong>$149 one-time</strong>
          <span className="fs-priceline-sep">or</span>
          <strong>$299/yr</strong>
          <span className="fs-priceline-dot" aria-hidden="true">
            ·
          </span>
          <span>7-day free trial</span>
          <span className="fs-priceline-dot" aria-hidden="true">
            ·
          </span>
          <span>30-day refund policy</span>
        </div>
        <div className="fs-cta-row">
          <button type="button" className="fs-btn fs-btn-primary fs-btn-lg" onClick={onPrimary}>
            {HERO_CTA_LABEL} <span className="fs-arrow" aria-hidden="true">→</span>
          </button>
          <button type="button" className="fs-btn fs-btn-ghost fs-btn-lg" onClick={onSecondary}>
            See how it works
          </button>
        </div>
        <div className="fs-trust-strip" aria-label="Trust signals">
          <span>
            <span className="fs-tick" aria-hidden="true">🔒</span> 256-bit encrypted
          </span>
          <span>
            <span className="fs-tick" aria-hidden="true">✓</span> Save & resume anytime
          </span>
          <span>
            <span className="fs-tick" aria-hidden="true">✓</span> Illinois form drafts
          </span>
          <span>
            <span className="fs-tick" aria-hidden="true">✓</span> Cancel anytime
          </span>
        </div>
      </div>
    </section>
  );
}
