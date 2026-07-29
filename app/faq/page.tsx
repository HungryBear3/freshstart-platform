import type { Metadata } from "next";
import Link from "next/link";
import { V2PageShell } from "@/app/v2/_components/V2PageShell";
import { DEFAULT_OG_IMAGE, DEFAULT_TWITTER_IMAGE } from "@/lib/seo-metadata";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Common questions about FreshStart-IL: what it is, what it costs, refunds, support, and where to read the full Illinois divorce information.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "FreshStart-IL FAQ — Illinois divorce questions, answered",
    description:
      "What FreshStart-IL is, what it costs, how refunds work, and how to handle an uncontested Illinois divorce without a law firm.",
    url: "/faq",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    title: "FreshStart-IL FAQ",
    description:
      "Common questions about FreshStart-IL — pricing, refunds, support, and the Illinois divorce process.",
    images: [DEFAULT_TWITTER_IMAGE],
  },
};

const FAQS: Array<{ q: string; a: React.ReactNode }> = [
  {
    q: "What is FreshStart-IL?",
    a: (
      <>
        FreshStart-IL is software that walks Illinois residents through
        the divorce process — questionnaires, generated form drafts, and
        county-aware filing steps. It is not a law firm.
      </>
    ),
  },
  {
    q: "Is FreshStart-IL a law firm?",
    a: (
      <>
        No. We don&apos;t provide legal advice or representation. We give
        you information and tools to handle an uncontested Illinois
        divorce. For your specific situation, consult a licensed
        Illinois attorney.
      </>
    ),
  },
  {
    q: "What does it cost?",
    a: (
      <>
        FreshStart is <strong>$149 one-time</strong>, with no subscription. See the{" "}
        <Link href="/pricing">pricing page</Link> for what is included.
      </>
    ),
  },
  {
    q: "Do you offer refunds?",
    a: (
      <>
        You can request a refund review within 30 days if FreshStart-IL
        isn&apos;t the right fit or if there&apos;s a service issue on our side.
        Eligibility under the published policy is not tied to
        spouse contestation, court outcomes, or county delays. See the{" "}
        <Link href="/legal-info/refund-policy">Refund Policy</Link>.
      </>
    ),
  },
  {
    q: "Do I need an attorney?",
    a: (
      <>
        FreshStart-IL cannot determine whether you need an attorney and
        does not provide legal advice. If your case is contested, involves a
        business, or you and your spouse can&apos;t agree on a parenting
        plan, talk to a flat-fee attorney first.
      </>
    ),
  },
  {
    q: "What documents can I generate?",
    a: (
      <>
        Supported Illinois divorce form drafts depend on your answers and the
        current product catalog. Review the catalog at{" "}
        <Link href="/legal-info/court-forms">/legal-info/court-forms</Link>.
      </>
    ),
  },
  {
    q: "How can I get support?",
    a: (
      <>
        Email{" "}
        <Link href="mailto:support@freshstart-il.com">
          support@freshstart-il.com
        </Link>
        . We usually respond within 1–2 business days.
      </>
    ),
  },
  {
    q: "Where can I read more?",
    a: (
      <>
        The full legal-info library is at{" "}
        <Link href="/legal-info">/legal-info</Link>. Quick start:{" "}
        <Link href="/grounds-for-divorce">grounds for divorce</Link>,{" "}
        <Link href="/property-division">property division</Link>,{" "}
        <Link href="/child-custody">parenting time</Link>,{" "}
        <Link href="/support-calculations">support calculations</Link>.
      </>
    ),
  },
];

export default function FaqPage() {
  return (
    <V2PageShell
      idSuffix="faq"
      eyebrow="FAQ"
      title="Frequently asked questions."
      lede="The short answers. For deeper write-ups on Illinois divorce law, see the legal info library."
      lastUpdated="2026-07"
    >
      {FAQS.map(({ q, a }) => (
        <section key={q}>
          <h2>{q}</h2>
          <p>{a}</p>
        </section>
      ))}

      <div className="fs-doc-cta-row">
        <Link href="/pricing" className="fs-btn fs-btn-primary fs-btn-md">
          See pricing →
        </Link>
        <Link href="/contact" className="fs-btn fs-btn-ghost fs-btn-md">
          Contact support
        </Link>
      </div>
    </V2PageShell>
  );
}
