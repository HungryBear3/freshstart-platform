import type { Metadata } from "next";
import Link from "next/link";
import { V2PageShell } from "@/app/v2/_components/V2PageShell";

export const metadata: Metadata = {
  title: "Privacy — FreshStart-IL",
  description:
    "What FreshStart-IL collects, how we use it, who we share it with, and the choices you have. Plain-English summary with a link to the full policy.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "FreshStart-IL Privacy",
    description:
      "What FreshStart-IL collects, how we use it, who we share it with, and the choices you have.",
    url: "/privacy",
  },
  twitter: {
    title: "FreshStart-IL Privacy",
    description:
      "What FreshStart-IL collects, how we use it, and the choices you have.",
  },
};

export default function PrivacyPage() {
  return (
    <V2PageShell
      idSuffix="privacy"
      eyebrow="Privacy"
      title="Privacy — the short version."
      lede="We collect what we need to run FreshStart-IL, we don't sell your data, and we keep your divorce questionnaires private."
      lastUpdated="2026-05"
      disclaimer={
        <>
          <strong>This is a summary.</strong> The full, controlling Privacy
          Policy lives at{" "}
          <Link href="/legal-info/privacy">/legal-info/privacy</Link>. If
          this summary and the full policy ever disagree, the full policy
          wins.
        </>
      }
    >
      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account info</strong> you give us: email, password
          (stored hashed), optional name.
        </li>
        <li>
          <strong>Case data</strong> you enter into questionnaires and
          generated forms. Stored in your account.
        </li>
        <li>
          <strong>Payment info</strong> processed by Stripe — we don&apos;t
          store full card numbers ourselves.
        </li>
        <li>
          <strong>Basic usage data</strong> (pages visited, clicks). On
          freshstart-il.com production only — Vercel Preview and local dev
          never fire live tracking pixels.
        </li>
      </ul>

      <h2>What we don't do</h2>
      <ul>
        <li>We don&apos;t sell your data to third parties.</li>
        <li>
          We don&apos;t share your case data with marketing partners.
        </li>
        <li>
          We don&apos;t use your questionnaire answers to train AI models
          unless you explicitly opt in.
        </li>
      </ul>

      <h2>Your choices</h2>
      <ul>
        <li>
          Export or delete your account data — email{" "}
          <Link href="mailto:support@freshstart-il.com">
            support@freshstart-il.com
          </Link>
          .
        </li>
        <li>
          Unsubscribe from any non-transactional email with the one-click
          link in the email.
        </li>
        <li>
          Opt out of marketing analytics by leaving production tracking
          disabled in your browser&apos;s privacy controls.
        </li>
      </ul>

      <h2>Full policy</h2>
      <p>
        <Link href="/legal-info/privacy">
          Read the full Privacy Policy →
        </Link>
      </p>
    </V2PageShell>
  );
}
