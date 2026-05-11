import * as React from "react";

const quotes = [
  {
    initial: "P",
    name: "Priya R.",
    city: "Oak Park, IL",
    plan: "Essential",
    quote:
      "My friend paid an attorney $18k for the same outcome. I paid $149 and a Saturday afternoon.",
  },
  {
    initial: "J",
    name: "Jordan B.",
    city: "Aurora, IL",
    plan: "Plus",
    quote:
      "We had two kids and a property to split. The Plus plan paid for itself the first time we had to redo the parenting plan — three times in six months.",
  },
  {
    initial: "A",
    name: "Amelia S.",
    city: "Peoria, IL",
    plan: "Essential → Plus",
    quote:
      "Started on Essential to test it. Switched to Plus after my spouse asked for changes. Cost me $149 + $150 prorated — still cheaper than one attorney email.",
  },
];

export function PricingTestimonials() {
  return (
    <section className="fs-pr-testi" aria-labelledby="pr-testi-h2">
      <div className="fs-section-inner">
        <div className="fs-section-head fs-section-head-c">
          <div className="fs-section-eyebrow">What people paid</div>
          <h2 id="pr-testi-h2" className="fs-h2">
            The price comparison, in their own words.
          </h2>
        </div>
        <div className="fs-testi-grid">
          {quotes.map((q) => (
            <article className="fs-testi-card" key={q.name}>
              <div className="fs-pr-testi-plan">Filed on {q.plan}</div>
              <div className="fs-testi-quote">&ldquo;{q.quote}&rdquo;</div>
              <div className="fs-testi-meta">
                <div className="fs-testi-avatar" aria-hidden="true">
                  {q.initial}
                </div>
                <div>
                  <div className="fs-testi-name">{q.name}</div>
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
