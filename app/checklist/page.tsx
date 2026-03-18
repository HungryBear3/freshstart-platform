import type { Metadata } from "next"
import Link from "next/link"
import { MainLayout } from "@/components/layouts/main-layout"
import { ChecklistForm } from "@/components/lead-magnet/checklist-form"
import { CheckCircle2, FileText, Clock, DollarSign, AlertTriangle, Laptop } from "lucide-react"

export const metadata: Metadata = {
  title: "Free Illinois Divorce Checklist | FreshStart IL",
  description:
    "Download the free Illinois Divorce Checklist — required forms, county filing fees, key deadlines, and e-filing instructions. Instant delivery to your inbox.",
  openGraph: {
    title: "Free Illinois Divorce Checklist | FreshStart IL",
    description:
      "Everything you need to file for divorce in Illinois — in one page. Required forms, county fees, deadlines, and what courts reject most often.",
    url: "https://www.freshstart-il.com/checklist",
  },
}

const checklistSections = [
  {
    icon: FileText,
    title: "4 Required Court Forms",
    items: [
      "Petition for Dissolution of Marriage",
      "Financial Affidavit (short or long form)",
      "Parenting Plan (if you have children)",
      "Marital Settlement Agreement",
    ],
  },
  {
    icon: DollarSign,
    title: "County Filing Fees",
    items: [
      "Cook County: $388",
      "DuPage County: $349",
      "Will County: ~$299",
      "Lake & Kane Counties: $280–$350",
    ],
  },
  {
    icon: Clock,
    title: "Deadlines You Can't Miss",
    items: [
      "90-day Illinois residency before filing",
      "30 days to serve your spouse after filing",
      "30-day response window for your spouse",
      "Parenting class before final hearing",
    ],
  },
  {
    icon: AlertTriangle,
    title: "Top Reasons Courts Reject Filings",
    items: [
      "Financial Affidavit not notarized",
      "Wrong county heading on documents",
      "Missing required Parenting Plan provisions",
      "Incorrect case number format",
    ],
  },
  {
    icon: Laptop,
    title: "E-Filing by County",
    items: [
      "Cook, DuPage, Lake: e-filing required",
      "Will, Kane: e-filing available",
      "System: e-fileIL.com (Tyler Technologies)",
      "County clerk reviews within 1–3 business days",
    ],
  },
]

export default function ChecklistPage() {
  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen">
        {/* Hero */}
        <div className="bg-blue-600">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 text-center">
            <p className="text-blue-200 text-sm font-semibold uppercase tracking-wide mb-3">
              Free Resource — No Account Required
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              The Illinois Divorce Checklist
            </h1>
            <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
              Everything you need to file for divorce in Illinois — required forms, county
              filing fees, key deadlines, and what courts reject most often. Instant delivery
              to your inbox.
            </p>
            <div className="bg-white rounded-xl p-6 max-w-md mx-auto shadow-lg">
              <p className="text-gray-700 font-medium mb-4">Enter your email to get it free:</p>
              <ChecklistForm variant="page" />
            </div>
          </div>
        </div>

        {/* Preview of what's inside */}
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            What&apos;s in the checklist
          </h2>
          <p className="text-gray-600 text-center mb-10">
            Illinois-specific. Updated for 2026. Everything in one reference page.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {checklistSections.map((section) => {
              const Icon = section.icon
              return (
                <div key={section.title} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">{section.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>

          {/* Second CTA */}
          <div className="mt-12 bg-white rounded-xl border border-blue-200 p-8 text-center shadow-sm">
            <p className="text-gray-600 mb-2 text-sm">Ready to go further?</p>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Generate your court forms automatically
            </h3>
            <p className="text-gray-600 mb-6 max-w-xl mx-auto text-sm">
              FreshStart IL generates all 4 required Illinois court forms from plain-English
              questions. No legal jargon, no guesswork. 7-day free trial, then $299/year.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Free 7-Day Trial
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                View Pricing
              </Link>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-8">
            This checklist is general information, not legal advice. For complex situations,
            consult a licensed Illinois family law attorney.{" "}
            <Link href="/legal-info/disclaimer" className="underline">
              Full disclaimer
            </Link>
          </p>
        </div>
      </div>
    </MainLayout>
  )
}
