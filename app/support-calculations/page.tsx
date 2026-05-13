import type { Metadata } from "next";
import Link from "next/link";
import { V2PageShell } from "@/app/v2/_components/V2PageShell";

export const metadata: Metadata = {
  title: "Child support & maintenance calculations (Illinois) | FreshStart-IL",
  description:
    "How Illinois calculates child support (750 ILCS 5/505, income-shares) and spousal maintenance (750 ILCS 5/504, statutory formula).",
  alternates: { canonical: "/support-calculations" },
  openGraph: {
    title: "Child support & maintenance calculations (Illinois)",
    description:
      "How Illinois calculates child support (750 ILCS 5/505, income-shares) and spousal maintenance (750 ILCS 5/504, statutory formula).",
    url: "/support-calculations",
  },
  twitter: {
    title: "Child support & maintenance calculations (Illinois)",
    description:
      "Income-shares child support (750 ILCS 5/505) and statutory maintenance (750 ILCS 5/504) — Illinois specifics.",
  },
};

export default function SupportCalculationsPage() {
  return (
    <V2PageShell
      idSuffix="support"
      eyebrow="Illinois law"
      title="Support calculations — child support & maintenance."
      lede="Illinois child support and spousal maintenance are formula-driven by statute. FreshStart-IL surfaces the same formulas so the numbers in your filing match what a court would expect to see."
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
          parenting time — when each parent has the children for at least
          146 overnights/year, the "shared parenting" formula applies.
        </li>
      </ul>
      <p>
        FreshStart-IL has a built-in{" "}
        <Link href="/calculators">child-support calculator</Link> that
        applies the current schedule.
      </p>

      <h2>Spousal maintenance (750 ILCS 5/504)</h2>
      <p>
        Illinois maintenance — formerly called "alimony" — is calculated by
        a statutory formula when combined gross income is at or below the
        income cap. The standard formula is:
      </p>
      <ul>
        <li>
          <strong>Amount:</strong> 33⅓% of the payor&apos;s net annual
          income minus 25% of the payee&apos;s net annual income, capped so
          the payee&apos;s share of combined net income doesn&apos;t exceed
          40%.
        </li>
        <li>
          <strong>Duration:</strong> a statutory percentage of the length
          of the marriage that scales from short to long marriages, with
          marriages of 20+ years often eligible for indefinite
          maintenance.
        </li>
      </ul>
      <p>
        For combined gross income above the statutory cap (currently
        $500,000), the formula does not apply automatically — the court
        sets maintenance using the §504 factors.
      </p>

      <h2>Modifications</h2>
      <p>
        Either type of support can be modified later if circumstances
        change substantially (income change, parenting-time change,
        remarriage for maintenance, etc.). Modification requires a court
        petition; you can&apos;t just stop paying.
      </p>

      <p>
        <Link href="/legal-info/spousal-maintenance">
          Read the maintenance write-up in the legal library →
        </Link>
      </p>

      <div className="fs-doc-cta-row">
        <Link href="/v2/pricing" className="fs-btn fs-btn-primary fs-btn-md">
          See pricing →
        </Link>
        <Link href="/calculators" className="fs-btn fs-btn-ghost fs-btn-md">
          Calculators
        </Link>
      </div>
    </V2PageShell>
  );
}
