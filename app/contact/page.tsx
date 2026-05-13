import type { Metadata } from "next";
import Link from "next/link";
import { V2PageShell } from "@/app/v2/_components/V2PageShell";
import { DEFAULT_OG_IMAGE, DEFAULT_TWITTER_IMAGE } from "@/lib/seo-metadata";

export const metadata: Metadata = {
  title: "Contact — FreshStart-IL",
  description:
    "Email support@freshstart-il.com for questions, refund requests, or platform issues. Typical response time: 1–2 business days.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact | FreshStart-IL",
    description:
      "Email support@freshstart-il.com for questions, refund requests, or platform issues.",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function ContactPage() {
  return (
    <V2PageShell
      idSuffix="contact"
      eyebrow="Contact"
      title="Talk to us."
      lede="The fastest way to reach us is email. We answer most messages within 1–2 business days, and Plus subscribers usually get a same-day response."
    >
      <h2>Reach the team</h2>
      <ul>
        <li>
          <strong>General support / questions:</strong>{" "}
          <Link href="mailto:support@freshstart-il.com">
            support@freshstart-il.com
          </Link>
        </li>
        <li>
          <strong>Refund requests:</strong> same address — see the{" "}
          <Link href="/legal-info/refund-policy">Refund Policy</Link>
        </li>
        <li>
          <strong>Press / partnerships:</strong>{" "}
          <Link href="mailto:support@freshstart-il.com">
            support@freshstart-il.com
          </Link>
        </li>
      </ul>

      <h2>What we can&apos;t do over email</h2>
      <p>
        We can&apos;t give you legal advice about your case, recommend a
        specific filing strategy, or interpret a court order for you.
        FreshStart-IL is not a law firm. For advice on your specific
        situation, consult a licensed Illinois attorney.
      </p>

      <h2>Useful links</h2>
      <ul>
        <li>
          <Link href="/faq">FAQ</Link>
        </li>
        <li>
          <Link href="/legal">Legal info library</Link>
        </li>
        <li>
          <Link href="/legal-info/refund-policy">Refund Policy</Link>
        </li>
      </ul>
    </V2PageShell>
  );
}
