import type { Metadata } from "next";
import Link from "next/link";
import { V2PageShell } from "@/app/v2/_components/V2PageShell";
import { DEFAULT_OG_IMAGE, DEFAULT_TWITTER_IMAGE } from "@/lib/seo-metadata";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Plain-English summary of the FreshStart-IL Terms of Service. Full version at /legal-info/terms.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "FreshStart-IL Terms of Service",
    description:
      "Plain-English summary of the FreshStart-IL Terms of Service — what we provide, what you pay, refunds, and disclaimers.",
    url: "/terms",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    title: "FreshStart-IL Terms of Service",
    description:
      "Plain-English summary — what we provide, what you pay, refunds, and disclaimers.",
    images: [DEFAULT_TWITTER_IMAGE],
  },
};

export default function TermsPage() {
  return (
    <V2PageShell
      idSuffix="terms"
      eyebrow="Terms"
      title="Terms of Service — the short version."
      lede="FreshStart-IL prepares Illinois divorce form drafts and gives you filing guidance. It's information and tools — not legal advice, and not legal representation."
      lastUpdated="2026-05"
      disclaimer={
        <>
          <strong>This is a summary.</strong> The full, controlling Terms of
          Service live at{" "}
          <Link href="/legal-info/terms">/legal-info/terms</Link>. If this
          summary and the full Terms ever disagree, the full Terms win.
        </>
      }
    >
      <h2>What FreshStart-IL is</h2>
      <p>
        FreshStart-IL is software. It walks you through Illinois divorce
        forms and procedures, generates document drafts from your answers,
        and points you at the right next step. It is not a law firm and
        does not create an attorney–client relationship with you.
      </p>

      <h2>What you agree to when you use it</h2>
      <ul>
        <li>You&apos;re at least 18.</li>
        <li>You give us accurate information.</li>
        <li>
          You review every generated document before you sign or file it.
        </li>
        <li>
          You don&apos;t use FreshStart-IL to interfere with the service,
          scrape it, or break any law.
        </li>
      </ul>

      <h2>Paid service</h2>
      <p>
        FreshStart-IL currently offers <strong>Essential for $149 one-time with 60 days of service access</strong>,
        with no subscription. Eligible refunds are governed by our{" "}
        <Link href="/legal-info/refund-policy">Refund Policy</Link>. See
        the <Link href="/pricing">pricing page</Link> for current rates.
      </p>

      <h2>What we don't promise</h2>
      <p>
        We don&apos;t guarantee a court outcome, a specific filing
        timeline, or that any individual judge or clerk will accept your
        documents on the first try. We also don&apos;t guarantee the
        service will be available 100% of the time.
      </p>

      <h2>Disputes</h2>
      <p>
        Illinois law governs. Before filing a claim, please email{" "}
        <Link href="mailto:support@freshstart-il.com">
          support@freshstart-il.com
        </Link>{" "}
        and give us 30 days to resolve it informally.
      </p>

      <h2>Full Terms</h2>
      <p>
        <Link href="/legal-info/terms">
          Read the full Terms of Service →
        </Link>
      </p>
    </V2PageShell>
  );
}
