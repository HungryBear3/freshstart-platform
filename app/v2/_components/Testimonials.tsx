import * as React from "react";

const scenarios = [
  {
    title: "Organize agreed basics",
    label: "Hypothetical uncontested case",
    description:
      "Two spouses agree on the basic terms and use the questionnaire to organize information for supported Illinois form drafts.",
    initial: "1",
  },
  {
    title: "Review the drafts",
    label: "Hypothetical self-filer",
    description:
      "A self-filer reviews each generated draft, corrects their answers, and verifies the current court and clerk requirements.",
    initial: "2",
  },
  {
    title: "Follow the filing roadmap",
    label: "Hypothetical filing step",
    description:
      "After reviewing the drafts, a self-filer uses the roadmap and confirms current local instructions before submitting anything.",
    initial: "3",
  },
];

export function Testimonials() {
  return (
    <section className="fs-testi" aria-labelledby="testi-h2">
      <div className="fs-section-inner">
        <div className="fs-section-head">
          <div className="fs-section-eyebrow">Hypothetical examples</div>
          <h2 id="testi-h2" className="fs-h2">
            How a straightforward workflow may look.
          </h2>
        </div>
        <div className="fs-testi-grid">
          {scenarios.map((scenario) => (
            <article className="fs-testi-card" key={scenario.title}>
              <div className="fs-testi-quote">{scenario.description}</div>
              <div className="fs-testi-meta">
                <div className="fs-testi-avatar" aria-hidden="true">
                  {scenario.initial}
                </div>
                <div>
                  <div className="fs-testi-name">{scenario.title}</div>
                  <div className="fs-testi-city">{scenario.label}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
