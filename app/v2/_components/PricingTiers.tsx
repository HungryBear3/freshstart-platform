"use client";

import * as React from "react";
import { analytics } from "./analytics";
import { beginSignupFirstCheckout, planForTier } from "./checkout-intent";
import type { PricingTier } from "./tiers";

const PRIMARY_CTA = "Start my filing";

export function PricingTiers({ tiers }: { tiers: PricingTier[] }) {
  const onCta = async (tier: PricingTier) => {
    analytics.track({
      name: "cta_click",
      page: "pricing",
      location: "tier_card",
      label: PRIMARY_CTA,
      tier: tier.key,
    });
    analytics.track({ name: "tier_select", page: "pricing", tier: tier.key });
    beginSignupFirstCheckout({
      plan: planForTier(tier.key),
      source: `pricing_tier_${tier.key}`,
    });
  };

  return (
    <section className="fs-pr-tiers" aria-label="Pricing tiers">
      <div className="fs-section-inner">
        <div className={`fs-pr-tier-grid ${tiers.length === 3 ? "is-three" : "is-two"}`}>
          {tiers.map((tier) => (
            <article
              key={tier.key}
              className={`fs-pr-tier ${tier.recommended ? "is-rec" : ""}`}
              aria-label={`${tier.name} plan${tier.recommended ? ", recommended" : ""}`}
            >
              {tier.recommended && (
                <div className="fs-pr-tier-ribbon" aria-hidden="true">
                  Recommended
                </div>
              )}
              <div className="fs-pr-tier-name">{tier.name}</div>
              <div className="fs-pr-tier-tag">{tier.tagline}</div>
              <div className="fs-pr-tier-price">
                <span className="fs-pr-tier-currency" aria-hidden="true">
                  $
                </span>
                <span className="fs-pr-tier-amt">{tier.price.replace("$", "")}</span>
                <span className="fs-pr-tier-period">{tier.period}</span>
              </div>
              <button
                type="button"
                className={`fs-btn ${
                  tier.ctaStyle === "primary" ? "fs-btn-primary" : "fs-btn-ghost"
                } fs-btn-md fs-pr-tier-cta`}
                onClick={() => onCta(tier)}
              >
                {tier.key === "concierge" ? "Book intake call" : PRIMARY_CTA}{" "}
                <span className="fs-arrow" aria-hidden="true">
                  →
                </span>
              </button>
              <div className="fs-pr-tier-audience">{tier.audience}</div>
              <ul className="fs-pr-tier-bullets">
                {tier.bullets.map((b, i) => (
                  <li key={i}>
                    <span className="fs-pr-check" aria-hidden="true">
                      ✓
                    </span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              {tier.excluded && (
                <ul
                  className="fs-pr-tier-bullets fs-pr-tier-bullets-out"
                  aria-label="Not included"
                >
                  {tier.excluded.map((b, i) => (
                    <li key={i}>
                      <span className="fs-pr-x" aria-label="not included">
                        —
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
