import * as React from "react";

const valuePoints = [
  {
    title: "Answers organized into drafts",
    body: "The guided questionnaire organizes your information into the Illinois form drafts FreshStart supports.",
  },
  {
    title: "Common clerical gaps flagged",
    body: "FreshStart checks supported fields for blanks and common omissions. You still review every draft before filing.",
  },
  {
    title: "A plain-English filing roadmap",
    body: "You receive filing steps and county-aware notes where FreshStart supports them, with reminders to verify current clerk instructions.",
  },
];

export function PricingValueOverFree() {
  return (
    <section className="fs-costband" aria-labelledby="value-over-free-heading">
      <div className="fs-section-inner">
        <div className="fs-cost-eyebrow">The free forms versus FreshStart</div>
        <h2 id="value-over-free-heading" className="fs-h2">
          Official Illinois court forms are available free.
        </h2>
        <p className="fs-costband-body">
          FreshStart charges for organizing your answers into supported form drafts, checking
          supported fields for common clerical gaps, and providing a filing roadmap. You can use
          the official forms yourself instead. FreshStart provides document preparation, not legal
          advice, and does not promise clerk acceptance or a court outcome.
        </p>
        <div className="fs-pr-guarantee-grid">
          {valuePoints.map((point) => (
            <article className="fs-pr-guarantee-card" key={point.title}>
              <h3 className="fs-pr-guarantee-title">{point.title}</h3>
              <p className="fs-pr-guarantee-body">{point.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
