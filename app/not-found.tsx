"use client"

import Link from "next/link"
import { Header } from "@/app/v2/_components/Header"
import { Footer } from "@/app/v2/_components/Footer"
import { OrganizationAndWebsiteJsonLd } from "@/app/v2/_components/JsonLd"
import { ArrowLeft, FileText, HelpCircle, Home, Search } from "lucide-react"
import "@/app/v2/_components/styles.css"

export default function NotFound() {
  return (
    <div className="fs-page" data-variant="not-found">
      <OrganizationAndWebsiteJsonLd />
      <Header page="not_found" ctaLabel="Start my filing" />
      <main role="main" className="relative overflow-hidden px-5 py-16 sm:px-8 sm:py-24">
        <div className="fs-hero-bg" aria-hidden="true" />
        <div className="relative z-[1] mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-2xl border border-[var(--fs-border-hi)] bg-white/[0.05] shadow-[var(--fs-shadow-card)]">
            <Search className="h-9 w-9 text-[var(--fs-cyan)]" />
          </div>
          <p className="fs-eyebrow mb-6">
            <span className="fs-eyebrow-dot" />
            Page not found
          </p>
          <h1 className="text-[48px] font-extrabold leading-[1.02] tracking-[-0.05em] text-[var(--fs-text)] sm:text-[72px]">
            This page moved, but your filing path did not.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[var(--fs-text-mid)]">
            We could not find that URL. Head back to the FreshStart IL homepage,
            compare pricing, or jump into the legal info library.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/" className="fs-btn fs-btn-primary fs-btn-lg">
              <Home className="h-4 w-4" />
              Go to homepage
            </Link>
            <button
              type="button"
              className="fs-btn fs-btn-ghost fs-btn-lg"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              Go back
            </button>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 text-left md:grid-cols-3">
            <Link href="/legal" className="rounded-[18px] border border-[var(--fs-border)] bg-[var(--fs-card)] p-5 shadow-[var(--fs-shadow-card)] transition hover:border-[var(--fs-border-hi)]">
              <FileText className="mb-4 h-6 w-6 text-[var(--fs-cyan)]" />
              <h2 className="font-semibold text-[var(--fs-text)]">Legal Info</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--fs-text-mid)]">Illinois divorce topics, forms, and filing basics.</p>
            </Link>
            <Link href="/pricing" className="rounded-[18px] border border-[var(--fs-border)] bg-[var(--fs-card)] p-5 shadow-[var(--fs-shadow-card)] transition hover:border-[var(--fs-border-hi)]">
              <Home className="mb-4 h-6 w-6 text-[var(--fs-purple)]" />
              <h2 className="font-semibold text-[var(--fs-text)]">Pricing</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--fs-text-mid)]">See the Essential and Plus filing plans.</p>
            </Link>
            <Link href="/faq" className="rounded-[18px] border border-[var(--fs-border)] bg-[var(--fs-card)] p-5 shadow-[var(--fs-shadow-card)] transition hover:border-[var(--fs-border-hi)]">
              <HelpCircle className="mb-4 h-6 w-6 text-[var(--fs-green)]" />
              <h2 className="font-semibold text-[var(--fs-text)]">FAQ</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--fs-text-mid)]">Answers before you start the process.</p>
            </Link>
          </div>

          <p className="mt-8 text-sm text-[var(--fs-text-dim)]">
            Need help? <Link href="/contact" className="underline decoration-white/30 underline-offset-4 hover:text-[var(--fs-text)]">Contact support</Link>
          </p>
        </div>
      </main>
      <Footer idSuffix="not-found" />
    </div>
  )
}
