import type { Metadata } from "next";
import Link from "next/link";
import { V2PageShell } from "@/app/v2/_components/V2PageShell";
import { DEFAULT_OG_IMAGE, DEFAULT_TWITTER_IMAGE } from "@/lib/seo-metadata";

export const metadata: Metadata = {
  title: "Disclaimer — FreshStart-IL",
  description:
    "FreshStart-IL provides information and document preparation only. It is not a law firm, not legal advice, and not legal representation.",
  alternates: { canonical: "/disclaimer" },
  openGraph: {
    title: "FreshStart-IL Disclaimer",
    description:
      "FreshStart-IL is software for Illinois divorce paperwork. It is not a law firm, not legal advice, and not legal representation.",
    url: "/disclaimer",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    title: "FreshStart-IL Disclaimer",
    description:
      "FreshStart-IL is software for Illinois divorce paperwork — not a law firm.",
    images: [DEFAULT_TWITTER_IMAGE],
  },
};

export default function DisclaimerPage() {
  return (
    <V2PageShell
      idSuffix="disclaimer"
      eyebrow="Disclaimer"
      title="Read this before relying on anything here."
      lede="FreshStart-IL is software that helps you prepare and file Illinois divorce documents. It does not replace a lawyer, and it does not represent you."
      lastUpdated="2026-05"
      disclaimer={
        <>
          The points below are the canonical disclaimer language. The
          fuller version (with examples) lives at{" "}
          <Link href="/legal-info/disclaimer">/legal-info/disclaimer</Link>.
        </>
      }
    >
      <h2>No attorney–client relationship</h2>
      <p>
        FreshStart-IL is not a law firm. Using FreshStart-IL — including
        running the questionnaires, generating documents, or emailing
        support — does <strong>not</strong> create an attorney–client
        relationship.
      </p>

      <h2>Review every document before you file</h2>
      <p>
        Generated documents are drafts based on your answers. Review them
        carefully — and, especially for any of the situations below,
        consult a licensed Illinois attorney before filing:
      </p>
      <ul>
        <li>contested custody or parenting-time disputes,</li>
        <li>significant assets, complex property, or business interests,</li>
        <li>domestic violence or safety concerns,</li>
        <li>cases with international elements (citizenship, foreign assets), and</li>
        <li>cases where your spouse has retained counsel.</li>
      </ul>

      <h2>County requirements vary</h2>
      <p>
        FreshStart-IL is{" "}
        <Link href="/legal-info">
          built around Illinois Supreme Court approved standardized forms
        </Link>
        , but individual counties may have additional local rules. Check
        with your county clerk before filing.
      </p>

      <h2>Information may become outdated</h2>
      <p>
        Laws and court rules change. We work to keep content current but
        cannot guarantee every page reflects the latest amendments. Verify
        current requirements before filing.
      </p>

      <h2>Acknowledgement</h2>
      <p>
        By using FreshStart-IL you acknowledge that you&apos;ve read and
        understood this disclaimer.
      </p>
    </V2PageShell>
  );
}
