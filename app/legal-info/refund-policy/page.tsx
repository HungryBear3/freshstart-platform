import type { Metadata } from "next"
import Link from "next/link"
import { V2PageShell } from "@/app/v2/_components/V2PageShell"

export const metadata: Metadata = {
  title: "Refund Policy — FreshStart-IL",
  description:
    "FreshStart-IL 30-day refund policy, eligibility boundaries, and how to request a refund review.",
  alternates: { canonical: "/legal-info/refund-policy" },
}

const SUPPORT_EMAIL = "support@freshstart-il.com"

export default function RefundPolicyPage() {
  return (
    <V2PageShell
      idSuffix="refund-policy"
      eyebrow="Refunds"
      title="Refund Policy"
      lede="Our published 30-day policy for the $149 one-time FreshStart-IL purchase, including eligibility boundaries and how to request a review."
      lastUpdated="2026-07"
      disclaimer={
        <>
          <strong>General information only.</strong> FreshStart IL is not a law
          firm, does not provide legal advice or representation, and does not
          review your documents. Using this service does not create an
          attorney-client relationship. Court forms and requirements may vary by
          county and may change; verify current requirements with official court
          resources or a licensed Illinois attorney.
        </>
      }
    >
      <h2>30-day refund policy</h2>
      <p>
        If FreshStart-IL isn&apos;t the right fit for you, or if you
        experience a service or platform issue on our side, you can request a
        refund review within 30 days of your purchase. Eligible refunds are
        processed without a retention call.
      </p>
      <p>
        Refunds apply to the FreshStart-IL purchase — currently{" "}
        <strong>$149 one-time for 60 days of service access</strong>. Third-party
        court filing fees, county fees, and payments to outside service providers
        are not part of this policy and are governed by those providers&apos; terms.
      </p>

      <h2>What refunds are not based on</h2>
      <p>
        FreshStart-IL is built for uncontested matters. We don&apos;t mediate
        contested disputes between spouses, and refund decisions are not based on
        how a separation unfolds. Refund eligibility is not affected by:
      </p>
      <ul>
        <li>whether a spouse stopped agreeing or contested any part of the case</li>
        <li>who caused or initiated a disagreement</li>
        <li>the outcome of a court hearing, judgment, or related proceeding</li>
        <li>clerk, county, or court-administrative delays outside our control</li>
        <li>
          third-party events, including process-server delays, opposing-counsel
          actions, or financial events outside our control
        </li>
      </ul>
      <p>
        In short: refunds are about whether FreshStart-IL did its job, not about
        the underlying family-law situation.
      </p>

      <h2>How to request a refund</h2>
      <p>
        Email <Link href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</Link> from
        the email address on the account within 30 days of purchase. Include the
        order identifier if you have it. We don&apos;t require a reason or a phone
        call. Eligible refunds are processed without a retention conversation.
      </p>
      <p>
        If an in-app account or contact flow is available, you may submit the
        request there; the review is the same.
      </p>

      <h2>What happens after a refund</h2>
      <p>
        When a refund is processed, access to the paid plan ends. Documents and
        workspace data tied to that purchase remain governed by our{" "}
        <Link href="/legal-info/terms">Terms of Service</Link> and{" "}
        <Link href="/legal-info/privacy">Privacy Policy</Link>. You may request
        export or deletion of your data separately under those policies.
      </p>

      <h2>Contact</h2>
      <p>
        Email: <Link href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</Link>
        <br />
        Website: www.freshstart-il.com
      </p>
    </V2PageShell>
  )
}
