import * as React from "react";

const items = [
  {
    ic: "IL",
    title: "Illinois-Specific",
    body: "Focused on straightforward Illinois uncontested-divorce paperwork and filing guidance.",
  },
  {
    ic: "⚖",
    title: "Illinois Form Drafts",
    body: "Supported drafts are organized from your answers. Review, edit, and regenerate them as needed.",
  },
  {
    ic: "↻",
    title: "Refile Help",
    body: "If a clerk returns a submission, optional help can review common clerical or formatting issues before you resubmit.",
  },
  {
    ic: "⏱",
    title: "Save and resume",
    body: "Work through the questionnaire at your pace and return when you have the information you need.",
  },
];

export function FeaturePills() {
  return (
    <section className="fs-features" aria-label="Product features">
      <div className="fs-section-inner">
        <div className="fs-features-grid">
          {items.map((it) => (
            <div className="fs-feat" key={it.title}>
              <div className="fs-feat-ic" aria-hidden="true">
                {it.ic}
              </div>
              <div className="fs-feat-title">{it.title}</div>
              <div className="fs-feat-body">{it.body}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
