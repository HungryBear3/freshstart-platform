"use client";

import * as React from "react";
import { analytics } from "./analytics";
import { STUB_ENDPOINTS } from "./tiers";

const items = [
  {
    name: "Prenup template",
    price: "$79",
    body: "Illinois UPAA-compliant prenup builder. Editable and exportable.",
    ic: "♥",
  },
  {
    name: "Parenting plan worksheet",
    price: "$29",
    body: "Standalone worksheet — printable, court-formatted. Included in Plus.",
    ic: "👨‍👩‍👧",
  },
  {
    name: "Mediation referral",
    price: "$49",
    body: "Vetted Illinois mediator match within 48 hours. Flat-fee mediators only.",
    ic: "⚖",
  },
  {
    name: "Refile assistance",
    price: "$49",
    body: "If your county rejects, we revise and you resubmit. Cook County common.",
    ic: "↻",
  },
];

export function PricingAddons() {
  const [pending, setPending] = React.useState<string | null>(null);

  const onAdd = async (name: string, price: string) => {
    setPending(name);
    analytics.track({ name: "addon_add_click", page: "pricing", addon: name, price });
    try {
      await fetch(STUB_ENDPOINTS.addOn, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addon: name, price }),
      });
    } catch {
      /* preview-only */
    } finally {
      setTimeout(() => setPending((cur) => (cur === name ? null : cur)), 800);
    }
  };

  return (
    <section className="fs-pr-addons" aria-labelledby="addons-h2">
      <div className="fs-section-inner">
        <div className="fs-section-head fs-section-head-c">
          <div className="fs-section-eyebrow">À la carte</div>
          <h2 id="addons-h2" className="fs-h2">
            Add only what your case needs.
          </h2>
        </div>
        <div className="fs-pr-addon-grid">
          {items.map((it) => (
            <article className="fs-pr-addon" key={it.name}>
              <div className="fs-pr-addon-ic" aria-hidden="true">
                {it.ic}
              </div>
              <div className="fs-pr-addon-name">{it.name}</div>
              <div className="fs-pr-addon-body">{it.body}</div>
              <div className="fs-pr-addon-foot">
                <span className="fs-pr-addon-price">{it.price}</span>
                <button
                  type="button"
                  className="fs-pr-addon-add"
                  aria-label={`Add ${it.name} (${it.price})`}
                  onClick={() => onAdd(it.name, it.price)}
                >
                  {pending === it.name ? "Added ✓" : "Add →"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
