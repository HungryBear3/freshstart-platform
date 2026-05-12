import type { Metadata } from "next";
import Link from "next/link";
import { V2PageShell } from "@/app/v2/_components/V2PageShell";

export const metadata: Metadata = {
  title: "Legal Info — Illinois Divorce | FreshStart-IL",
  description:
    "Plain-English overviews of how Illinois divorce works — grounds, property division, child custody, and support calculations.",
  alternates: { canonical: "/legal" },
};

const TOPICS: Array<{ href: string; title: string; body: string }> = [
  {
    href: "/grounds-for-divorce",
    title: "Grounds for divorce",
    body:
      "Illinois is a no-fault state — most divorces are filed on irreconcilable differences. What that means, and what counts as 'separate and apart.'",
  },
  {
    href: "/property-division",
    title: "Property division",
    body:
      "Equitable distribution: how marital vs. non-marital property is sorted, and the factors courts weigh when dividing assets and debts.",
  },
  {
    href: "/child-custody",
    title: "Parenting time & responsibilities",
    body:
      "Illinois replaced 'custody' with parenting time + decision-making responsibilities. How the parenting plan works and what's required.",
  },
  {
    href: "/support-calculations",
    title: "Child support & maintenance",
    body:
      "Illinois child support is income-shares (750 ILCS 5/505). Spousal maintenance follows 750 ILCS 5/504 with statutory formulas.",
  },
];

export default function LegalIndexPage() {
  return (
    <V2PageShell
      idSuffix="legal"
      eyebrow="Legal info"
      title="Illinois divorce — the essentials, in plain English."
      lede="FreshStart-IL is built around Illinois court forms and filing steps. These pages summarize the law in plain language so you can decide where to dig deeper."
      lastUpdated="2026-05"
    >
      <h2>Start here</h2>
      <div className="fs-doc-cards">
        {TOPICS.map((t) => (
          <Link key={t.href} className="fs-doc-card" href={t.href}>
            <div className="fs-doc-card-title">{t.title} →</div>
            <p className="fs-doc-card-body">{t.body}</p>
          </Link>
        ))}
      </div>

      <h2>Need someone in your corner?</h2>
      <p>
        If your situation is contested, involves a complicated business, or
        you and your spouse can&apos;t agree on a parenting plan, talk to a
        licensed Illinois attorney before filing. FreshStart-IL is built for
        uncontested matters.
      </p>
    </V2PageShell>
  );
}
