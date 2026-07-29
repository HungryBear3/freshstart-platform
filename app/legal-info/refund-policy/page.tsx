import type { Metadata } from "next"
import Link from "next/link"
import { MainLayout } from "@/components/layouts/main-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Disclaimer } from "@/components/legal/disclaimer"

export const metadata: Metadata = {
  title: "Refund Policy — FreshStart-IL",
  description:
    "FreshStart-IL 30-day refund policy, eligibility boundaries, and how to request a refund review.",
  alternates: { canonical: "/legal-info/refund-policy" },
}

const SUPPORT_EMAIL = "support@freshstart-il.com"

export default function RefundPolicyPage() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <article className="bg-white">
          <header className="mb-10 pb-6 border-b border-gray-200">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Refund Policy
            </h1>
            <div className="text-sm text-gray-500">
              <p>
                Last Updated:{" "}
                {new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </header>

          <Card className="shadow-sm border-gray-200 mb-8">
            <CardContent className="py-10 px-6 sm:px-10">
              <div className="article-content space-y-6">
                <section>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    FreshStart-IL publishes a 30-day refund policy for its
                    one-time purchase. This page explains the eligibility
                    boundaries and how to request a refund review.
                  </p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">
                    30-day refund policy
                  </h2>
                  <p>
                    If FreshStart-IL isn&apos;t the right fit for you, or if
                    you experience a service or platform issue on our side,
                    you can request a refund review within 30 days of your
                    purchase. Eligible refunds are processed without a
                    retention call.
                  </p>
                  <p className="mt-4">
                    Refunds apply to the FreshStart-IL purchase — currently{" "}
                    <strong>$149 one-time</strong>. Third-party court filing
                    fees, county fees, and any payments to outside service
                    providers are not part of this policy and are governed by
                    those providers&apos; own terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">
                    What refunds are not based on
                  </h2>
                  <p>
                    FreshStart-IL is built for uncontested matters. We
                    don&apos;t mediate contested disputes between spouses, and
                    we don&apos;t make refund decisions based on how a
                    separation unfolds. Specifically, refund eligibility is
                    not affected by:
                  </p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>
                      whether a spouse stopped agreeing or contested any part
                      of the case
                    </li>
                    <li>who caused or initiated a disagreement</li>
                    <li>
                      the outcome of a court hearing, judgment, or related
                      legal proceeding
                    </li>
                    <li>
                      clerk, county, or court-administrative delays outside
                      of FreshStart-IL&apos;s control
                    </li>
                    <li>
                      third-party events — process server delays, opposing
                      counsel actions, financial events — outside of
                      FreshStart-IL&apos;s control
                    </li>
                  </ul>
                  <p className="mt-4">
                    In short: FreshStart-IL stays out of the middle of
                    contested disputes. Refunds are about whether
                    FreshStart-IL did its job, not about the underlying
                    family-law situation.
                  </p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">
                    How to request a refund
                  </h2>
                  <p>
                    Email{" "}
                    <a
                      href={`mailto:${SUPPORT_EMAIL}`}
                      className="text-blue-600 underline"
                    >
                      {SUPPORT_EMAIL}
                    </a>{" "}
                    from the email address on the account, within 30 days of
                    your purchase. Include the order identifier if you have
                    it. We
                    don&apos;t require a reason or a phone call. Eligible
                    refunds are processed under this policy without a
                    retention conversation.
                  </p>
                  <p className="mt-4">
                    If an in-app account/contact flow is available, you can
                    also submit the request from there — the underlying
                    review is the same.
                  </p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">
                    What happens after a refund
                  </h2>
                  <p>
                    When a refund is processed, access to the paid plan ends,
                    and any documents or workspace data tied to that purchase
                    remain governed by our{" "}
                    <Link
                      href="/legal-info/terms"
                      className="text-blue-600 underline"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/legal-info/privacy"
                      className="text-blue-600 underline"
                    >
                      Privacy Policy
                    </Link>
                    . You can request export or deletion of your data
                    separately under those policies.
                  </p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">
                    Not legal advice
                  </h2>
                  <p>
                    Nothing in this policy is legal advice. FreshStart-IL is
                    not a law firm and does not represent you. If you need
                    legal advice about your specific situation, consult a
                    licensed Illinois attorney.
                  </p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">
                    Contact
                  </h2>
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p>
                      <strong>Email:</strong>{" "}
                      <a
                        href={`mailto:${SUPPORT_EMAIL}`}
                        className="text-blue-600 underline"
                      >
                        {SUPPORT_EMAIL}
                      </a>
                    </p>
                    <p className="mt-2">
                      <strong>Website:</strong> www.freshstart-il.com
                    </p>
                  </div>
                </section>
              </div>
            </CardContent>
          </Card>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <Disclaimer />
          </div>
        </article>
      </div>
    </MainLayout>
  )
}
