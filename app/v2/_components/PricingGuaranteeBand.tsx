import * as React from "react";

const items = [
  {
    num: "$149",
    unit: "one-time",
    title: "No subscription",
    body: "One simple price. No subscription and no recurring billing — you pay once.",
  },
  {
    num: "IL",
    unit: "focused",
    title: "Illinois workflow",
    body: "Built for straightforward uncontested Illinois divorce paperwork and filing guidance.",
  },
  {
    num: "No",
    unit: "trial",
    title: "Pay when ready",
    body: "There is no free trial. Choose a plan only when you are ready to move forward.",
  },
];

export function PricingGuaranteeBand() {
  return (
    <section className="fs-pr-guarantee" aria-label="Pricing and scope details">
      <div className="fs-section-inner">
        <div className="fs-pr-guarantee-grid">
          {items.map((it) => (
            <div className="fs-pr-guarantee-card" key={it.title}>
              <div className="fs-pr-guarantee-num">
                <span className="fs-pr-guarantee-n">{it.num}</span>
                <span className="fs-pr-guarantee-u">{it.unit}</span>
              </div>
              <div className="fs-pr-guarantee-title">{it.title}</div>
              <div className="fs-pr-guarantee-body">{it.body}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
