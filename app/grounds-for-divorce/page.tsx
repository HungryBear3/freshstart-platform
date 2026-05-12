import type { Metadata } from "next";
import Link from "next/link";
import { V2PageShell } from "@/app/v2/_components/V2PageShell";

export const metadata: Metadata = {
  title: "Grounds for divorce in Illinois | FreshStart-IL",
  description:
    "Illinois is a no-fault state. Most divorces are filed on irreconcilable differences. What 'separate and apart' means, and how the 6-month period works.",
  alternates: { canonical: "/grounds-for-divorce" },
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
          the spouses have lived <em>separate and apart</em> for at least 6
          months (the 6-month period can be waived if both spouses agree).
        </li>
      </ul>

      <h2>What "separate and apart" means</h2>
      <p>
        You don&apos;t necessarily need to live in different houses. Courts
        accept that you&apos;re separate and apart if you are:
      </p>
      <ul>
        <li>living in separate residences, OR</li>
        <li>
          living in the same house but in separate rooms, not sharing meals,
          and not holding yourselves out as a married couple.
        </li>
      </ul>

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
        <li>
          The 6-month separation period is waived if both spouses agree on
          the record.
        </li>
      </ul>

      <p>
        <Link href="/legal-info/grounds-for-divorce">
          Read the full write-up in the legal library →
        </Link>
      </p>

      <div className="fs-doc-cta-row">
        <Link href="/v2/pricing" className="fs-btn fs-btn-primary fs-btn-md">
          See pricing →
        </Link>
        <Link href="/legal" className="fs-btn fs-btn-ghost fs-btn-md">
          All topics
        </Link>
      </div>
    </V2PageShell>
  );
}
