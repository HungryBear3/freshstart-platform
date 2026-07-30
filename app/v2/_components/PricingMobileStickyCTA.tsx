"use client";

import * as React from "react";
import { analytics } from "./analytics";
import { beginSignupFirstCheckout } from "./checkout-intent";

const LABEL = "Start my filing";

export function PricingMobileStickyCTA() {
  // Hide the sticky CTA while the user is inside the tier-cards section, so
  // we don't double-up CTAs. Respect prefers-reduced-motion for the
  // visibility flip — no CSS transitions in that case.
  const [hidden, setHidden] = React.useState(false);
  React.useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const cards = document.querySelector(".fs-pr-tiers");
    if (!cards) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          setHidden(e.isIntersecting);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(cards);
    return () => observer.disconnect();
  }, []);

  const onClick = () => {
    analytics.track({ name: "mobile_sticky_cta_click", page: "pricing", tier: "essential" });
    beginSignupFirstCheckout({ plan: "one_time", source: "pricing_mobile_sticky" });
  };

  return (
    <div
      className="fs-pr-sticky"
      data-hidden={hidden ? "true" : "false"}
      role="region"
      aria-label="Mobile pricing summary"
    >
      <div className="fs-pr-sticky-l">
        <div className="fs-pr-sticky-price">
          $149<span className="fs-pr-sticky-or"> one-time</span>
        </div>
        <div className="fs-pr-sticky-meta">60 days access · No subscription · 30-day refund policy</div>
      </div>
      <button
        type="button"
        className="fs-btn fs-btn-primary fs-btn-md fs-pr-sticky-btn"
        onClick={onClick}
      >
        {LABEL} →
      </button>
    </div>
  );
}
