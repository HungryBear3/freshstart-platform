import * as React from "react";

const steps = [
  {
    n: "01",
    title: "Answer a few questions",
    body: "Our guided questionnaire walks you through your situation. Save and resume anytime.",
  },
  {
    n: "02",
    title: "Get court-ready documents",
    body: "We auto-fill every required Illinois form. Edit and regenerate as your case evolves.",
  },
  {
    n: "03",
    title: "File with confidence",
    body: "Step-by-step e-filing guidance through Illinois E-Services, with county-specific instructions so nothing gets rejected.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="fs-how" aria-labelledby="how-h2">
      <div className="fs-section-inner">
        <div className="fs-section-head">
          <div className="fs-section-eyebrow">How it works</div>
          <h2 id="how-h2" className="fs-h2">
            From questionnaire to filed in three steps.
          </h2>
        </div>
        <div className="fs-how-grid">
          {steps.map((s) => (
            <div className="fs-step" key={s.n}>
              <div className="fs-step-n">{s.n}</div>
              <div className="fs-step-title">{s.title}</div>
              <div className="fs-step-body">{s.body}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
