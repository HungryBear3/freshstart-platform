import * as React from "react";
import Link from "next/link";
import { Logo } from "./Logo";

export function Footer({ idSuffix }: { idSuffix: string }) {
  return (
    <footer className="fs-ft" role="contentinfo">
      <div className="fs-ft-inner">
        <div className="fs-ft-trust">
          Available in all 102 Illinois counties · 30-day money-back guarantee ·
          Built around Illinois court forms and filing steps
        </div>

        <div className="fs-ft-grid">
          <div className="fs-ft-col fs-ft-col-brand">
            <Logo idSuffix={`ft-${idSuffix}`} />
            <p className="fs-ft-tag">
              Illinois divorce form drafts and step-by-step filing guidance — without the
              attorney bill.
            </p>
          </div>
          <div className="fs-ft-col">
            <div className="fs-ft-h">Product</div>
            <Link href="/#how-it-works">How it works</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/#capture">Free checklist</Link>
            <Link href="/auth/signin">Sign In</Link>
          </div>
          <div className="fs-ft-col">
            <div className="fs-ft-h">Legal info</div>
            <Link href="/grounds-for-divorce">Grounds for divorce</Link>
            <Link href="/property-division">Property division</Link>
            <Link href="/child-custody">Child custody</Link>
            <Link href="/support-calculations">Support calculations</Link>
          </div>
          <div className="fs-ft-col">
            <div className="fs-ft-h">Company</div>
            <Link href="/about">About</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/legal">All legal topics</Link>
          </div>
        </div>

        <div className="fs-ft-bot">
          <div>© 2026 FreshStart-IL · Not a law firm. Not legal advice.</div>
          <div className="fs-ft-bot-r">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/disclaimer">Disclaimer</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
