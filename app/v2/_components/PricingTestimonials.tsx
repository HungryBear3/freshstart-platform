import * as React from "react";

const quotes = [
  {
    initial: "P",
    name: "Priya R.",
    city: "Oak Park, IL",
    plan: "Essential",
    quote:
      "For a straightforward uncontested case, starting at $149 was the difference between moving forward now and waiting months.",
  },
  {
    initial: "J",
    name: "Jordan B.",
    city: "Aurora, IL",
    plan: "Plus",
    quote:
      "We had kids and a property timeline that kept changing. Plus made more sense than paying again every time we needed to update drafts.",
  },
  {
    initial: "A",
    name: "Amelia S.",
    city: "Peoria, IL",
    plan: "Essential → Plus",
    quote:
      "Started on Essential, then upgraded when the details changed. The annual option made the moving pieces feel easier to manage.",
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
