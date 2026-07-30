import * as React from "react";

const quotes = [
  {
    initial: "P",
    name: "Scenario 1",
    city: "Hypothetical example",
    plan: "Essential",
    quote:
      "A customer with a supported uncontested case chooses the $149 one-time document-preparation service with 60 days of service access.",
  },
  {
    initial: "J",
    name: "Scenario 2",
    city: "Hypothetical example",
    plan: "Essential",
    quote:
      "A customer reviews the supported drafts, verifies current clerk requirements, and files the documents themselves.",
  },
  {
    initial: "A",
    name: "Scenario 3",
    city: "Hypothetical example",
    plan: "Essential",
    quote:
      "A customer whose situation changes pauses and asks a licensed Illinois attorney about case-specific legal questions.",
  },
];

export function PricingTestimonials() {
  return (
    <section className="fs-pr-testi" aria-labelledby="pr-testi-h2">
      <div className="fs-section-inner">
        <div className="fs-section-head fs-section-head-c">
          <div className="fs-section-eyebrow">Illustrative examples</div>
          <h2 id="pr-testi-h2" className="fs-h2">
            Illustrative pricing scenarios.
          </h2>
        </div>
        <div className="fs-testi-grid">
          {quotes.map((q) => (
            <article className="fs-testi-card" key={q.name}>
              <div className="fs-pr-testi-plan">Example: {q.plan}</div>
              <div className="fs-testi-quote">&ldquo;{q.quote}&rdquo;</div>
              <div className="fs-testi-meta">
                <div className="fs-testi-avatar" aria-hidden="true">
                  {q.initial}
                </div>
                <div>
                  <div className="fs-testi-name">Illustrative example · {q.name}</div>
                  <div className="fs-testi-city">{q.city}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
