import type { Metadata } from "next";
import Link from "next/link";
import { V2PageShell } from "@/app/v2/_components/V2PageShell";
import { DEFAULT_OG_IMAGE, DEFAULT_TWITTER_IMAGE } from "@/lib/seo-metadata";

export const metadata: Metadata = {
  title: "Grounds for divorce in Illinois",
  description:
    "A general explanation of irreconcilable differences and Illinois's rebuttable presumption after six months of living separate and apart.",
  alternates: { canonical: "/grounds-for-divorce" },
  openGraph: {
    title: "Grounds for divorce in Illinois",
    description:
      "A general explanation of irreconcilable differences and the rebuttable presumption concerning living separate and apart.",
    url: "/grounds-for-divorce",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    title: "Grounds for divorce in Illinois",
    description:
      "Irreconcilable differences and the rebuttable presumption concerning living separate and apart.",
    images: [DEFAULT_TWITTER_IMAGE],
  },
};

export default function GroundsForDivorcePage() {
  return (
    <V2PageShell
      idSuffix="grounds"
      eyebrow="Illinois law"
      title="Grounds for divorce in Illinois."
      lede="Illinois is a no-fault state. You don't have to prove your spouse did anything wrong — you just need to show the marriage has broken down."
      lastUpdated="2026-05"
    >
      <h2>Irreconcilable differences</h2>
      <p>
        The standard ground for divorce in Illinois is{" "}
        <strong>irreconcilable differences</strong>. To use it you have to
        show:
      </p>
      <ul>
        <li>the marriage has broken down,</li>
        <li>there is no reasonable prospect of reconciliation, and</li>
        <li>
          efforts at reconciliation have failed or future attempts would be
          impracticable and not in the family&apos;s best interests.
        </li>
      </ul>

      <h2>What the six-month language does</h2>
      <p>
        If spouses have lived separate and apart continuously for at least six
        months immediately before entry of judgment, Illinois law provides a
        <strong> rebuttable presumption</strong> that the irreconcilable-
        differences requirement has been met. This is not a universal
        pre-filing separation or waiting period.
      </p>
      <p>
        How &quot;separate and apart&quot; applies to particular living
        arrangements is fact-specific. Check current law and court instructions
        or ask a lawyer rather than relying on a general website description.
      </p>

      <h2>No-fault — what's gone</h2>
      <p>
        Illinois eliminated fault-based grounds (adultery, abandonment,
        habitual drunkenness, etc.) in favor of the no-fault system. You
        don&apos;t plead fault, and you don&apos;t need your spouse&apos;s
        agreement to file.
      </p>

      <h2>Practical notes</h2>
      <ul>
        <li>You can file even if your spouse doesn&apos;t want a divorce.</li>
        <li>
          You don&apos;t need your spouse&apos;s sign-off on the grounds —
          you just plead irreconcilable differences.
        </li>
        <li>Only the court decides whether the legal ground is established.</li>
        <li>This page provides general information, not legal advice.</li>
      </ul>

      <p>
        <Link href="/legal">
          Browse all legal topics →
        </Link>
      </p>

      <div className="fs-doc-cta-row">
        <Link href="/pricing" className="fs-btn fs-btn-primary fs-btn-md">
          See pricing →
        </Link>
        <Link href="/legal" className="fs-btn fs-btn-ghost fs-btn-md">
          All topics
        </Link>
      </div>
    </V2PageShell>
  );
}
