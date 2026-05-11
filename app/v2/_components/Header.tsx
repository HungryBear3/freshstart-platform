"use client";

import * as React from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { analytics, type AnalyticsPage } from "./analytics";
import { STUB_ENDPOINTS } from "./tiers";

export function Header({ page, ctaLabel }: { page: AnalyticsPage; ctaLabel: string }) {
  const onCta = () => {
    analytics.track({ name: "cta_click", page, location: "header", label: ctaLabel });
    void fetch(STUB_ENDPOINTS.startTrial, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "header", page }),
    }).catch(() => {});
  };

  return (
    <header className="fs-hd" role="banner">
      <div className="fs-hd-inner">
        <Link href="/v2" aria-label="FreshStart-IL home">
          <Logo idSuffix={`hd-${page}`} />
        </Link>
        <nav className="fs-nav" aria-label="Primary">
          <Link href="/v2#how-it-works">How it works</Link>
          <Link href="/v2/pricing" className={page === "pricing" ? "fs-nav-active" : undefined}>
            Pricing
          </Link>
          <Link href="/v2#legal-info">Legal Info</Link>
          <Link href="/v2#faq">FAQ</Link>
        </nav>
        <div className="fs-hd-r">
          <Link className="fs-signin" href="/auth/signin">
            Sign In
          </Link>
          <button type="button" className="fs-btn fs-btn-primary fs-btn-sm" onClick={onCta}>
            {ctaLabel}
          </button>
          <button type="button" className="fs-burger" aria-label="Menu" aria-expanded="false">
            ☰
          </button>
        </div>
      </div>
    </header>
  );
}
