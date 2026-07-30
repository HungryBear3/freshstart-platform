"use client";

import * as React from "react";
import { analytics } from "./analytics";
import { beginSignupFirstCheckout } from "./checkout-intent";

// Primary CTA copy is "Start my filing" across the v2 surface. The
// priceline states the current one-time, no-subscription policy.
const HERO_CTA_LABEL = "Start my filing";

export function HomepageHero() {
  const onPrimary = () => {
    analytics.track({
      name: "cta_click",
      page: "homepage",
      location: "hero",
      label: HERO_CTA_LABEL,
    });
    beginSignupFirstCheckout({ plan: "one_time", source: "homepage_hero" });
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
          For straightforward uncontested Illinois divorces
        </div>
        <h1 id="hero-h1" className="fs-h1">
          We prepare your forms. <span className="fs-h1-accent">You file them.</span>
        </h1>
        <p className="fs-sub">
          FreshStart IL turns your answers into Illinois uncontested-divorce form drafts and a
          filing roadmap. You review the drafts, pay court fees separately, and file them yourself.
        </p>
        <div className="fs-priceline" aria-label="Pricing summary">
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
            <span className="fs-tick" aria-hidden="true">✓</span> No subscription
          </span>
        </div>
      </div>
    </section>
  );
}
