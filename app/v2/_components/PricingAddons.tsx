"use client";

import * as React from "react";
import { analytics } from "./analytics";
import { beginSignupFirstCheckout, type CheckoutPlan } from "./checkout-intent";

const items: Array<{
  key: Extract<CheckoutPlan, "parenting_plan" | "refile_assistance">;
  name: string;
  price: string;
  body: string;
  ic: string;
}> = [
  {
    key: "parenting_plan",
    name: "Parenting plan worksheet",
    price: "$29",
    body: "Standalone worksheet for parenting-time terms and schedules. Included in Plus.",
    ic: "👨‍👩‍👧",
  },
  {
    key: "refile_assistance",
    name: "Refile assistance",
    price: "$49",
    body: "If your county rejects for a filing/format issue, send us the note and we help correct the packet for resubmission.",
    ic: "↻",
  },
];

export function PricingAddons() {
  const [pending, setPending] = React.useState<string | null>(null);

  const onAdd = (key: Extract<CheckoutPlan, "parenting_plan" | "refile_assistance">, name: string, price: string) => {
    setPending(name);
    analytics.track({ name: "addon_add_click", page: "pricing", addon: name, price });
    beginSignupFirstCheckout({ plan: key, source: `pricing_addon_${key}` });
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
                  onClick={() => onAdd(it.key, it.name, it.price)}
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
