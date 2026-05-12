"use client";

import * as React from "react";
import { analytics, type AnalyticsPage } from "./analytics";

// Orientation CTA links to the existing public Calendly URL also used by
// components/home/IntroCallBanner.tsx. No server stub needed; analytics
// still fires on click. Per docs/FS_V2_CTA_BACKEND_WIRING_PLAN.md.
export const ORIENTATION_CALENDLY_URL = "https://calendly.com/il-support/30min";

export function OrientationCall({
  page,
  eyebrow,
  heading,
  body,
}: {
  page: AnalyticsPage;
  eyebrow: string;
  heading: string;
  body: string;
}) {
  const onClick = () => {
    analytics.track({ name: "orientation_cta_click", page });
  };
  return (
    <section className="fs-orient" aria-labelledby={`orient-${page}`}>
      <div className="fs-orient-inner">
        <div className="fs-orient-l">
          <div className="fs-section-eyebrow fs-section-eyebrow-l">{eyebrow}</div>
          <h2 id={`orient-${page}`} className="fs-h2 fs-h2-light">
            {heading}
          </h2>
          <p className="fs-orient-body">{body}</p>
        </div>
        <div className="fs-orient-r">
          <a
            href={ORIENTATION_CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="fs-btn fs-btn-primary fs-btn-lg"
            onClick={onClick}
          >
            Book a free 15-min call
          </a>
          <div className="fs-orient-meta">Real human · No sales script · 15 minutes</div>
        </div>
      </div>
    </section>
  );
}
