import * as React from "react";

// "Why pay $149 vs. the free Illinois forms?" band.
//
// Illinois publishes uncontested-divorce forms for free (state-approved
// forms and aid-society resources), so FreshStart's honest value is NOT
// secret access to forms — it is the time of sorting, assembling, and
// completeness-checking them, plus plain-English filing steps. Copy must
// stay factual and compliance-safe:
//   - acknowledge the forms are free,
//   - frame value as time saved / organization / completeness / guidance,
//   - state plainly it is NOT legal advice and NOT a substitute for an
//     attorney,
//   - make no court-outcome guarantee and imply no attorney relationship.
// (See the v2 compliance gates in __tests__/v2/v2-root-routes.test.tsx.)
const VALUE_POINTS: Array<{ title: string; body: string }> = [
  {
    title: "Organized and assembled for you",
    body:
      "Illinois publishes the divorce forms for free. FreshStart pulls the right ones for an uncontested case into one ordered packet from your answers, so you are not hunting across court and aid-society sites working out which forms apply.",
  },
  {
    title: "Checked for completeness",
    body:
      "We flag blank required fields and common omissions before you file, so you are less likely to be sent back for a missing field. We do not review the legal merits of your case.",
  },
  {
    title: "Filing steps in plain English",
    body:
      "Step-by-step, county-aware filing instructions for your case — where to file, what to bring, and what order to do things in — so you spend less time deciphering procedure.",
  },
];

export function PricingValueOverFree() {
  // Reuses the guarantee band's card-grid classes purely for styling (no
  // new CSS); this is not a guarantee band — aria-labelledby points at the
  // value heading, and the visible copy makes no guarantee.
  return (
    <section className="fs-pr-guarantee" aria-labelledby="value-over-free-heading">
      <div className="fs-section-inner">
        <div className="fs-cost-eyebrow">The free forms vs. FreshStart</div>
        <h2 id="value-over-free-heading" className="fs-h2">
          The Illinois forms are free. The hours of sorting, checking, and filing
          them are what you’re paying to skip.
        </h2>
        <p className="fs-costband-body">
          You can absolutely file an uncontested Illinois divorce yourself with the
          free, official forms. FreshStart is for people who would rather not spend a
          weekend working out which forms apply and whether the packet is complete.
          It is document preparation and filing guidance — not legal advice, and not
          a substitute for an attorney.
        </p>
        <div className="fs-pr-guarantee-grid">
          {VALUE_POINTS.map((it) => (
            <div className="fs-pr-guarantee-card" key={it.title}>
              <div className="fs-pr-guarantee-title">{it.title}</div>
              <div className="fs-pr-guarantee-body">{it.body}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
