"use client";

import * as React from "react";
import { analytics, type AnalyticsPage } from "./analytics";

export interface FAQItem {
  q: string;
  a: string;
}

export function FAQ({
  page,
  items,
  eyebrow,
  heading,
  sectionId = "faq",
  variant = "default",
}: {
  page: AnalyticsPage;
  items: FAQItem[];
  eyebrow: string;
  heading: string;
  sectionId?: string;
  variant?: "default" | "pricing";
}) {
  const [open, setOpen] = React.useState(0);
  return (
    <section id={sectionId} className={`fs-faq ${variant === "pricing" ? "fs-pr-faq" : ""}`}>
      <div className="fs-section-inner fs-section-inner-narrow">
        <div className="fs-section-head fs-section-head-c">
          <div className="fs-section-eyebrow">{eyebrow}</div>
          <h2 className="fs-h2">{heading}</h2>
        </div>
        <div className="fs-faq-list">
          {items.map((it, i) => {
            const isOpen = open === i;
            const panelId = `${sectionId}-panel-${i}`;
            const buttonId = `${sectionId}-button-${i}`;
            return (
              <div className={`fs-faq-item ${isOpen ? "is-open" : ""}`} key={i}>
                <button
                  type="button"
                  className="fs-faq-q"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => {
                    const next = isOpen ? -1 : i;
                    setOpen(next);
                    if (next === i) {
                      analytics.track({
                        name: "faq_expand",
                        page,
                        question: it.q,
                        index: i,
                      });
                    }
                  }}
                >
                  <span>{it.q}</span>
                  <span aria-hidden="true" className="fs-faq-pm">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen && (
                  <div id={panelId} role="region" aria-labelledby={buttonId} className="fs-faq-a">
                    {it.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
