import type { Metadata } from "next";
import Link from "next/link";
import { V2PageShell } from "@/app/v2/_components/V2PageShell";
import { DEFAULT_OG_IMAGE, DEFAULT_TWITTER_IMAGE } from "@/lib/seo-metadata";

export const metadata: Metadata = {
  title: "Property division in an Illinois divorce | FreshStart-IL",
  description:
    "Illinois uses equitable distribution — fair, not necessarily 50/50. How marital vs. non-marital property is sorted and what courts weigh.",
  alternates: { canonical: "/property-division" },
  openGraph: {
    title: "Property division in an Illinois divorce",
    description:
      "Illinois uses equitable distribution — fair, not necessarily 50/50. How marital vs. non-marital property is sorted and what courts weigh.",
    url: "/property-division",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    title: "Property division in an Illinois divorce",
    description:
      "Equitable distribution: marital vs. non-marital property and the factors Illinois courts weigh.",
    images: [DEFAULT_TWITTER_IMAGE],
  },
};

export default function PropertyDivisionPage() {
  return (
    <V2PageShell
      idSuffix="property"
      eyebrow="Illinois law"
      title="Property division — equitable, not equal."
      lede="Illinois uses equitable distribution. That's a fairness standard, not a 50/50 rule. Marital property is divided based on a list of statutory factors."
      lastUpdated="2026-05"
    >
      <h2>Marital vs. non-marital property</h2>
      <p>
        Before anything gets divided, the court sorts each asset into one of
        two buckets.
      </p>

      <h3>Marital property (subject to division)</h3>
      <ul>
        <li>Property acquired during the marriage,</li>
        <li>income earned during the marriage,</li>
        <li>retirement contributions made during the marriage, and</li>
        <li>
          increases in value of separate property that came from joint
          marital effort.
        </li>
      </ul>

      <h3>Non-marital property (kept by the owning spouse)</h3>
      <ul>
        <li>Property owned before the marriage,</li>
        <li>gifts and inheritances received by one spouse,</li>
        <li>
          property excluded by a valid prenup or postnup, and
        </li>
        <li>property acquired after a legal separation.</li>
      </ul>

      <h2>Factors the court weighs</h2>
      <p>
        When dividing marital property, Illinois courts look at, among
        others:
      </p>
      <ul>
        <li>each spouse&apos;s contribution to acquiring the property,</li>
        <li>the length of the marriage,</li>
        <li>each spouse&apos;s economic circumstances after divorce,</li>
        <li>obligations from a previous marriage,</li>
        <li>any valid prenuptial agreement,</li>
        <li>the age, health, and earning ability of each spouse, and</li>
        <li>tax consequences of the proposed division.</li>
      </ul>

      <h2>Debt is divided too</h2>
      <p>
        Marital debt — credit cards, mortgages, loans taken during the
        marriage — is divided the same way as marital assets. Pre-marital
        debt generally stays with the spouse who incurred it.
      </p>

      <p>
        <Link href="/legal-info/property-division">
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
