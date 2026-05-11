import * as React from "react";

const items = [
  {
    num: "30",
    unit: "days",
    title: "Money-back guarantee",
    body: "Full refund within 30 days, no questions, no recovery emails.",
  },
  {
    num: "102",
    unit: "counties",
    title: "Accepted statewide",
    body: "Forms match Illinois Supreme Court templates and county filing rules.",
  },
  {
    num: "7",
    unit: "days",
    title: "Free trial",
    body: "Explore the full product with no card. Decide after, not before.",
  },
];

export function PricingGuaranteeBand() {
  return (
    <section className="fs-pr-guarantee" aria-label="Guarantees">
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
