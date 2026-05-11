import * as React from "react";
import Link from "next/link";
import { Logo } from "./Logo";

export function Footer({ idSuffix }: { idSuffix: string }) {
  return (
    <footer className="fs-ft" role="contentinfo">
      <div className="fs-ft-inner">
        <div className="fs-ft-trust">
          Trusted by Illinois residents in all 102 counties · 30-day money-back guarantee ·
          Reviewed against Illinois Compiled Statutes
        </div>

        <div className="fs-ft-grid">
          <div className="fs-ft-col fs-ft-col-brand">
            <Logo idSuffix={`ft-${idSuffix}`} />
            <p className="fs-ft-tag">
              Court-ready Illinois divorce forms and step-by-step filing guidance — without the
              attorney bill.
            </p>
          </div>
          <div className="fs-ft-col">
            <div className="fs-ft-h">Product</div>
            <Link href="/v2#how-it-works">How it works</Link>
            <Link href="/v2/pricing">Pricing</Link>
            <Link href="/v2#capture">Free checklist</Link>
            <Link href="/auth/signin">Sign In</Link>
          </div>
          <div className="fs-ft-col">
            <div className="fs-ft-h">Legal info</div>
            <Link href="/v2#legal-info">Grounds for divorce</Link>
            <Link href="/v2#legal-info">Property division</Link>
            <Link href="/v2#legal-info">Child custody</Link>
            <Link href="/v2#legal-info">Support calculations</Link>
          </div>
          <div className="fs-ft-col">
            <div className="fs-ft-h">Company</div>
            <Link href="/v2#about">About</Link>
            <Link href="/v2#faq">FAQ</Link>
            <Link href="/v2#contact">Contact</Link>
            <a href="tel:+13125550142">(312) 555-0142</a>
          </div>
        </div>

        <div className="fs-ft-bot">
          <div>© 2026 FreshStart-IL · Not a law firm. Not legal advice.</div>
          <div className="fs-ft-bot-r">
            <Link href="/v2#privacy">Privacy</Link>
            <Link href="/v2#terms">Terms</Link>
            <Link href="/v2#disclaimer">Disclaimer</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
