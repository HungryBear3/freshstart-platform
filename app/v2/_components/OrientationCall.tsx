"use client";

import * as React from "react";
import { analytics, type AnalyticsPage } from "./analytics";
import { STUB_ENDPOINTS } from "./tiers";

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
  const [status, setStatus] = React.useState<string | null>(null);
  const onClick = async () => {
    analytics.track({ name: "orientation_cta_click", page });
    try {
      const res = await fetch(STUB_ENDPOINTS.orientation, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page }),
      });
      if (res.ok) setStatus("Mock: booking request received — preview only.");
    } catch {
      setStatus("Mock: offline — preview only.");
    }
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
          <button type="button" className="fs-btn fs-btn-primary fs-btn-lg" onClick={onClick}>
            Book a free 15-min call
          </button>
          <div className="fs-orient-meta">Real human · No sales script · 15 minutes</div>
          {status && (
            <div className="fs-orient-meta" role="status" aria-live="polite">
              {status}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
