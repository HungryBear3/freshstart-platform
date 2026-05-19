import type { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/app/v2/_components/Header"
import { Footer } from "@/app/v2/_components/Footer"
import { OrganizationAndWebsiteJsonLd } from "@/app/v2/_components/JsonLd"
import { ChecklistForm } from "@/components/lead-magnet/checklist-form"
import { CheckCircle2, FileText, Clock, DollarSign, AlertTriangle, Laptop } from "lucide-react"
import { DEFAULT_OG_IMAGE } from "@/lib/seo-metadata"
import "@/app/v2/_components/styles.css"

export const metadata: Metadata = {
  title: "Free Illinois Divorce Checklist",
  description:
    "Download the free Illinois Divorce Checklist — required forms, county filing fees, key deadlines, and e-filing instructions. Instant delivery to your inbox.",
  alternates: { canonical: "/checklist" },
  openGraph: {
    title: "Free Illinois Divorce Checklist | FreshStart IL",
    description:
      "Everything you need to file for divorce in Illinois — in one page. Required forms, county fees, deadlines, and what courts reject most often.",
    url: "https://www.freshstart-il.com/checklist",
    images: [DEFAULT_OG_IMAGE],
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
    <div className="fs-page" data-variant="checklist">
      <OrganizationAndWebsiteJsonLd />
      <Header page="checklist" ctaLabel="Start my filing" />
      <main role="main">
        <section className="relative overflow-hidden px-5 py-16 sm:px-8 sm:py-20">
          <div className="fs-hero-bg" aria-hidden="true" />
          <div className="relative z-[1] mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="fs-eyebrow mb-6">
                <span className="fs-eyebrow-dot" />
                Free resource — no account required
              </p>
              <h1 className="text-[42px] font-extrabold leading-[1.04] tracking-[-0.05em] text-[var(--fs-text)] sm:text-[58px]">
                The Illinois divorce checklist, without the legal fog.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--fs-text-mid)]">
                Required forms, county filing fees, key deadlines, e-filing steps, and the
                mistakes Illinois courts reject most often. Instant delivery to your inbox.
              </p>
              <div className="mt-8 flex flex-col gap-3 text-sm text-[var(--fs-text-mid)] sm:flex-row sm:flex-wrap">
                <span className="rounded-full border border-[var(--fs-border)] bg-white/[0.04] px-4 py-2">Updated for 2026</span>
                <span className="rounded-full border border-[var(--fs-border)] bg-white/[0.04] px-4 py-2">All 102 Illinois counties</span>
                <span className="rounded-full border border-[var(--fs-border)] bg-white/[0.04] px-4 py-2">Plain-English next steps</span>
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--fs-border-hi)] bg-[var(--fs-card)] p-6 shadow-[var(--fs-shadow-card)]">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--fs-purple)]">Get the checklist</p>
              <h2 className="mb-3 text-2xl font-bold tracking-[-0.03em] text-[var(--fs-text)]">Send it to my inbox</h2>
              <p className="mb-5 text-sm leading-6 text-[var(--fs-text-mid)]">
                No account needed. Use it first, then move into guided filing when you are ready.
              </p>
              <div className="rounded-2xl border border-white/10 bg-white p-5 text-slate-950">
                <ChecklistForm variant="page" />
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-14 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="fs-section-head fs-section-head-c">
              <p className="fs-section-eyebrow">What is inside</p>
              <h2 className="fs-h2">A filing roadmap you can actually use.</h2>
              <p className="mx-auto mt-4 max-w-2xl text-[var(--fs-text-mid)]">
                Illinois-specific. Court-focused. Built to help you avoid the common rejections before you start.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {checklistSections.map((section) => {
                const Icon = section.icon
                return (
                  <article key={section.title} className="rounded-[18px] border border-[var(--fs-border)] bg-[var(--fs-card)] p-6 shadow-[var(--fs-shadow-card)]">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="rounded-xl border border-[var(--fs-border)] bg-white/[0.05] p-2">
                        <Icon className="h-5 w-5 text-[var(--fs-cyan)]" />
                      </div>
                      <h3 className="font-semibold text-[var(--fs-text)]">{section.title}</h3>
                    </div>
                    <ul className="space-y-2">
                      {section.items.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm leading-6 text-[var(--fs-text-mid)]">
                          <CheckCircle2 className="mt-1 h-4 w-4 flex-shrink-0 text-[var(--fs-green)]" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </article>
                )
              })}
            </div>

            <div className="mt-10 rounded-[22px] border border-[var(--fs-border-hi)] bg-[var(--fs-grad-soft)] p-8 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--fs-cyan)]">Ready to go further?</p>
              <h3 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[var(--fs-text)]">Generate your Illinois court forms automatically.</h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[var(--fs-text-mid)]">
                FreshStart IL turns plain-English answers into your divorce packet — petition,
                financial affidavit, parenting plan, and filing instructions.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/auth/signup" className="fs-btn fs-btn-primary fs-btn-lg">
                  Start my filing <span className="fs-arrow">→</span>
                </Link>
                <Link href="/pricing" className="fs-btn fs-btn-ghost fs-btn-lg">
                  View pricing
                </Link>
              </div>
            </div>

            <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-6 text-[var(--fs-text-dim)]">
              This checklist is general information, not legal advice. For complex situations,
              consult a licensed Illinois family law attorney. <Link href="/disclaimer" className="underline decoration-white/30 underline-offset-4 hover:text-[var(--fs-text)]">Full disclaimer</Link>
            </p>
          </div>
        </section>
      </main>
      <Footer idSuffix="checklist" />
    </div>
  )
}
