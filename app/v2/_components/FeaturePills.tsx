import * as React from "react";

const items = [
  {
    ic: "IL",
    title: "Illinois-Specific",
    body: "Built around the Illinois Compiled Statutes and county-level filing rules.",
  },
  {
    ic: "⚖",
    title: "Illinois Form Drafts",
    body: "Auto-filled from Illinois court templates and county filing information. Edit and regenerate anytime.",
  },
  {
    ic: "↻",
    title: "Refile Help",
    body: "If a county rejects for a filing or format issue, optional refile assistance helps correct the packet for resubmission.",
  },
  {
    ic: "⏱",
    title: "Often Under 2 Hours",
    body: "Straightforward uncontested cases can often complete a first draft in one focused session when their information is ready.",
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
