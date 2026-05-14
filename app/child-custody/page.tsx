import type { Metadata } from "next";
import Link from "next/link";
import { V2PageShell } from "@/app/v2/_components/V2PageShell";
import { DEFAULT_OG_IMAGE, DEFAULT_TWITTER_IMAGE } from "@/lib/seo-metadata";

export const metadata: Metadata = {
  title: "Parenting time & responsibilities (Illinois)",
  description:
    "Illinois replaced 'custody' with parenting time and decision-making responsibilities. How the parenting plan works and what's required.",
  alternates: { canonical: "/child-custody" },
  openGraph: {
    title: "Parenting time & responsibilities in Illinois",
    description:
      "Illinois replaced 'custody' with parenting time and decision-making responsibilities. How the parenting plan works and what's required.",
    url: "/child-custody",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    title: "Parenting time & responsibilities in Illinois",
    description:
      "Parenting time, decision-making responsibilities, and the parenting plan — Illinois specifics.",
    images: [DEFAULT_TWITTER_IMAGE],
  },
};

export default function ChildCustodyPage() {
  return (
    <V2PageShell
      idSuffix="custody"
      eyebrow="Illinois law"
      title="Parenting time & decision-making."
      lede="In 2016 Illinois replaced the word 'custody' with two ideas: parenting time and parental decision-making responsibilities. Cases with minor children must file a parenting plan."
      lastUpdated="2026-05"
    >
      <h2>The two pieces</h2>
      <h3>Parenting time</h3>
      <p>
        When each parent is with the children. This is the day-to-day,
        overnight-by-overnight schedule.
      </p>

      <h3>Decision-making responsibilities</h3>
      <p>
        Who decides on the major issues. Illinois splits these into four
        domains and lets the parents — or the court — allocate them either
        jointly or solely:
      </p>
      <ul>
        <li>Education,</li>
        <li>Health,</li>
        <li>Religion, and</li>
        <li>Extracurricular activities.</li>
      </ul>

      <h2>The parenting plan</h2>
      <p>
        Cases with minor children must file a parenting plan. It covers:
      </p>
      <ul>
        <li>a regular parenting-time schedule,</li>
        <li>holidays and school breaks,</li>
        <li>summer and vacation time,</li>
        <li>the allocation of each decision-making domain,</li>
        <li>how transitions and communication happen, and</li>
        <li>how disputes will be resolved going forward.</li>
      </ul>

      <h2>Best-interest standard</h2>
      <p>
        Illinois courts decide parenting allocations using a best-interest-of-the-child
        analysis under 750 ILCS 5/602.5 and 5/602.7. Among other things, the
        court considers the child&apos;s adjustment to home/school, each
        parent&apos;s ability to facilitate a close relationship with the
        other parent, the wishes of the child (when appropriate), and any
        history of violence or abuse.
      </p>

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
