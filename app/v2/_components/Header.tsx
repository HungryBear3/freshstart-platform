"use client";

import * as React from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { analytics, type AnalyticsPage } from "./analytics";
import { beginSignupFirstCheckout } from "./checkout-intent";

export function Header({ page, ctaLabel }: { page: AnalyticsPage; ctaLabel: string }) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  const onCta = () => {
    analytics.track({ name: "cta_click", page, location: "header", label: ctaLabel });
    beginSignupFirstCheckout({ plan: "annual", source: `${page}_header` });
  };

  const onBurger = () => setMenuOpen((v) => !v);
  const closeMenu = () => setMenuOpen(false);

  // Close on Escape so keyboard users can dismiss the drawer.
  React.useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className="fs-hd" role="banner" data-menu-open={menuOpen ? "true" : "false"}>
      <div className="fs-hd-inner">
        <Link href="/" aria-label="FreshStart IL home" onClick={closeMenu}>
          <Logo idSuffix={`hd-${page}`} />
        </Link>
        <nav className="fs-nav" aria-label="Primary">
          <Link href="/#how-it-works">How it works</Link>
          <Link href="/pricing" className={page === "pricing" ? "fs-nav-active" : undefined}>
            Pricing
          </Link>
          <Link href="/legal">Legal Info</Link>
          <Link href="/faq">FAQ</Link>
        </nav>
        <div className="fs-hd-r">
          <Link className="fs-signin" href="/auth/signin">
            Sign In
          </Link>
          <button
            type="button"
            className="fs-btn fs-btn-primary fs-btn-sm fs-hd-cta"
            onClick={onCta}
          >
            {ctaLabel}
          </button>
          <button
            type="button"
            className="fs-burger"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="fs-mobile-menu"
            onClick={onBurger}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>
      <nav
        id="fs-mobile-menu"
        className="fs-hd-mobile"
        aria-label="Mobile primary"
        hidden={!menuOpen}
      >
        <Link href="/#how-it-works" onClick={closeMenu}>
          How it works
        </Link>
        <Link
          href="/pricing"
          className={page === "pricing" ? "fs-nav-active" : undefined}
          onClick={closeMenu}
        >
          Pricing
        </Link>
        <Link href="/legal" onClick={closeMenu}>
          Legal Info
        </Link>
        <Link href="/faq" onClick={closeMenu}>
          FAQ
        </Link>
        <Link href="/auth/signin" onClick={closeMenu}>
          Sign in
        </Link>
      </nav>
    </header>
  );
}
