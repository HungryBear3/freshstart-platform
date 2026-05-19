// Shared v2 visual shell for informational pages outside / and /pricing.
//
// Wraps a page in the same `fs-page` dark surface, with the v2 Header and
// Footer, and an opinionated prose container so secondary routes inherit
// the homepage's typography and dark-card spacing without duplicating CSS.
//
// Server component — safe for static informational pages. Pages that need
// client interactivity (auth forms, search) can still mount this around
// their own client-rendered children.
import * as React from "react";
import "./styles.css";
import "./shell.css";
import { Header } from "./Header";
import { Footer } from "./Footer";
import type { AnalyticsPage } from "./analytics";

export interface V2PageShellProps {
  /**
   * Used for the Header's CTA wiring (analytics page label + signup-first
   * checkout source). Pages that aren't really the homepage/pricing surface
   * should pass `"homepage"` — the CTA still routes through the same
   * checkout flow.
   */
  page?: AnalyticsPage;
  /**
   * Header CTA label. Defaults to "Start my filing" (the v2 primary CTA)
   * so secondary pages don't fork the funnel.
   */
  ctaLabel?: string;
  /**
   * Footer slug suffix. Each page gets a unique value to keep the SVG
   * gradient IDs unique when multiple shells render on one route.
   */
  idSuffix: string;
  /**
   * Eyebrow above the page title. Optional.
   */
  eyebrow?: string;
  /**
   * Page title rendered inside the shell.
   */
  title: string;
  /**
   * Short subtitle / lede paragraph.
   */
  lede?: React.ReactNode;
  /**
   * Optional last-updated marker (shown in the legal-style footer line).
   */
  lastUpdated?: string;
  /**
   * Visible disclaimer block. Defaults to the standard "not legal advice"
   * note. Pass `null` to suppress (e.g. on the auth shell).
   */
  disclaimer?: React.ReactNode | null;
  /**
   * Page body. Should be plain prose; the wrapper applies `.fs-doc-body`
   * so headings/lists/paragraphs inherit v2 typography automatically.
   */
  children: React.ReactNode;
}

const DEFAULT_DISCLAIMER = (
  <>
    <strong>Not legal advice.</strong> FreshStart IL is not a law firm and
    doesn&apos;t represent you. This page is general information about
    Illinois divorce. For advice on your specific situation, consult a
    licensed Illinois attorney.
  </>
);

export function V2PageShell({
  page = "homepage",
  ctaLabel = "Start my filing",
  idSuffix,
  eyebrow,
  title,
  lede,
  lastUpdated,
  disclaimer = DEFAULT_DISCLAIMER,
  children,
}: V2PageShellProps) {
  return (
    <div className="fs-page" data-variant={`shell-${idSuffix}`}>
      <Header page={page} ctaLabel={ctaLabel} />
      <main role="main" className="fs-doc">
        <div className="fs-doc-inner">
          <article className="fs-doc-article">
            {eyebrow && <div className="fs-doc-eyebrow">{eyebrow}</div>}
            <h1 className="fs-doc-title">{title}</h1>
            {lede && <p className="fs-doc-lede">{lede}</p>}
            {lastUpdated && (
              <div className="fs-doc-meta">Last updated: {lastUpdated}</div>
            )}
            <div className="fs-doc-body">{children}</div>
            {disclaimer !== null && (
              <aside className="fs-doc-disclaimer" role="note">
                {disclaimer}
              </aside>
            )}
          </article>
        </div>
      </main>
      <Footer idSuffix={`shell-${idSuffix}`} />
    </div>
  );
}
