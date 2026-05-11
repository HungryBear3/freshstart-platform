"use client";

import * as React from "react";
import { analytics, type AnalyticsPage } from "./analytics";

export function CostBand({
  page,
  eyebrow,
  variant = "default",
}: {
  page: AnalyticsPage;
  eyebrow: string;
  variant?: "default" | "pricing";
}) {
  const ref = React.useRef<HTMLElement | null>(null);
  const fired = React.useRef(false);
  React.useEffect(() => {
    if (!ref.current || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !fired.current) {
            fired.current = true;
            analytics.track({ name: "cost_band_view", page });
            observer.disconnect();
            return;
          }
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [page]);

  return (
    <section
      ref={ref}
      className={`fs-costband ${variant === "pricing" ? "fs-pr-costband" : ""}`}
      aria-labelledby={`cost-band-${page}`}
    >
      <div className="fs-costband-inner">
        <div className="fs-costband-l">
          <div className="fs-cost-eyebrow">{eyebrow}</div>
          <h2 id={`cost-band-${page}`} className="fs-h2">
            Illinois divorce attorneys average{" "}
            <span className="fs-cost-strike">$15,000–$25,000</span> per case.
          </h2>
          <p className="fs-costband-body">
            FreshStart costs less than a single hour of attorney time — for your whole divorce.
            Same Illinois forms. Same court acceptance. Without the hourly meter running.
          </p>
          {variant !== "pricing" && (
            <a className="fs-link-arrow" href="/v2/pricing">
              Compare to hiring an attorney →
            </a>
          )}
        </div>
        <div className="fs-costband-r">
          <div className="fs-cost-card fs-cost-card-att">
            <div className="fs-cost-card-lbl">Hire an attorney</div>
            <div className="fs-cost-card-fig">
              <span className="fs-cost-card-currency">$</span>
              <span className="fs-cost-card-amt">15,000</span>
              <span className="fs-cost-card-plus">+</span>
            </div>
            <div className="fs-cost-card-rate">$300–$500/hr · Chicago avg.</div>
            <div className="fs-cost-card-bar" aria-hidden="true">
              <div className="fs-cost-card-bar-fill fs-cost-card-bar-fill-att" />
            </div>
          </div>
          <div className="fs-cost-arrow" aria-hidden="true">
            ↓
          </div>
          <div className="fs-cost-card fs-cost-card-fs">
            <div className="fs-cost-card-lbl">FreshStart-IL</div>
            <div className="fs-cost-card-fig">
              <span className="fs-cost-card-currency">$</span>
              <span className="fs-cost-card-amt">149</span>
            </div>
            <div className="fs-cost-card-rate">One-time · Whole case</div>
            <div className="fs-cost-card-bar" aria-hidden="true">
              <div className="fs-cost-card-bar-fill fs-cost-card-bar-fill-fs" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
