import type { Metadata } from "next";
import Link from "next/link";
import { V2PageShell } from "@/app/v2/_components/V2PageShell";
import { DEFAULT_OG_IMAGE, DEFAULT_TWITTER_IMAGE } from "@/lib/seo-metadata";

export const metadata: Metadata = {
  title: "Child support & maintenance calculations (Illinois)",
  description:
    "How Illinois calculates child support (750 ILCS 5/505, income-shares) and spousal maintenance (750 ILCS 5/504, statutory formula).",
  alternates: { canonical: "/support-calculations" },
  openGraph: {
    title: "Child support & maintenance calculations (Illinois)",
    description:
      "How Illinois calculates child support (750 ILCS 5/505, income-shares) and spousal maintenance (750 ILCS 5/504, statutory formula).",
    url: "/support-calculations",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    title: "Child support & maintenance calculations (Illinois)",
    description:
      "Income-shares child support (750 ILCS 5/505) and statutory maintenance (750 ILCS 5/504) — Illinois specifics.",
    images: [DEFAULT_TWITTER_IMAGE],
  },
};

export default function SupportCalculationsPage() {
  return (
    <V2PageShell
      idSuffix="support"
      eyebrow="Illinois law"
      title="Support calculations — child support & maintenance."
      lede="Illinois statutes describe child-support and maintenance calculations. This overview is educational; verify current inputs, limits, and court requirements before relying on any estimate."
      lastUpdated="2026-05"
    >
      <h2>Child support (750 ILCS 5/505)</h2>
      <p>
        Illinois uses an <strong>income-shares</strong> model. Both
        parents&apos; net incomes are combined, the statutory schedule
        produces a basic support obligation for the number of children, and
        the obligation is then prorated between the parents based on each
        parent&apos;s share of combined net income.
      </p>
      <p>Key inputs:</p>
      <ul>
        <li>each parent&apos;s gross income,</li>
        <li>the resulting net income under the statutory standardized
          deductions,</li>
        <li>the number of qualifying children, and</li>
        <li>
          parenting time — current statutory overnight thresholds and other
          case facts can change how a calculation is performed.
        </li>
      </ul>
      <p>
        FreshStart-IL does not currently provide a child-support calculation.
        Use current official Illinois schedules and instructions, or consult a
        qualified attorney, before relying on a figure.
      </p>

      <h2>Spousal maintenance (750 ILCS 5/504)</h2>
      <p>
        Illinois maintenance — formerly called "alimony" — may involve
        statutory guidelines after a court determines that an award is
        appropriate. Eligibility, inputs, limits, amount, and duration are
        fact-specific and can change.
      </p>
      <p>
        FreshStart-IL does not currently provide a maintenance calculation.
        Verify the current statute and official court resources, or consult a
        qualified attorney, for a case-specific analysis.
      </p>
      <p>
        Formula eligibility and statutory limits can change. When the
        statutory formula does not apply, the court considers the §504
        factors. Verify current law or consult a qualified attorney for advice
        about a specific case.
      </p>

      <h2>Modifications</h2>
      <p>
        Either type of support can be modified later if circumstances
        change substantially (income change, parenting-time change,
        remarriage for maintenance, etc.). Modification requires a court
        petition; you can&apos;t just stop paying.
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
        <Link href="/calculators" className="fs-btn fs-btn-ghost fs-btn-md">
          Calculators
        </Link>
      </div>
    </V2PageShell>
  );
}
