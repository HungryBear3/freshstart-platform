import * as React from "react";

const quotes = [
  {
    name: "Marcus T.",
    city: "Naperville, IL",
    quote:
      "I expected weeks of paperwork and panic. I was done in an evening. The forms were accepted by DuPage County on first submission.",
    initial: "M",
  },
  {
    name: "Priya R.",
    city: "Oak Park, IL",
    quote:
      "The cost-comparison line is real. My friend paid an attorney $18k for the same outcome. I paid $149 and a Saturday afternoon.",
    initial: "P",
  },
  {
    name: "Devon K.",
    city: "Springfield, IL",
    quote:
      "County-specific instructions were the unlock. I was about to file the wrong form for Sangamon and FreshStart caught it.",
    initial: "D",
  },
];

export function Testimonials() {
  return (
    <section className="fs-testi" aria-labelledby="testi-h2">
      <div className="fs-section-inner">
        <div className="fs-section-head">
          <div className="fs-section-eyebrow">Real Illinois residents</div>
          <h2 id="testi-h2" className="fs-h2">
            People who&apos;ve actually filed.
          </h2>
        </div>
        <div className="fs-testi-grid">
          {quotes.map((q) => (
            <article className="fs-testi-card" key={q.name}>
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
