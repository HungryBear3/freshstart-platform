export function StatsBar() {
  return (
    <section className="max-w-7xl mx-auto overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/95 shadow-[0_24px_80px_rgba(15,23,42,0.45)] backdrop-blur">
      <div className="grid gap-8 px-6 py-10 lg:grid-cols-[1.4fr_0.9fr] lg:px-10 lg:py-12">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-300/80">
            Illinois-Focused Platform
          </p>
          <p className="mt-3 text-3xl font-bold text-white md:text-4xl">
            Guided form drafts, calculators, and filing clarity in one place.
          </p>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
            Illinois divorce form drafts, a 90-day process roadmap, and Illinois-specific financial
            tools — built for uncontested cases that need organization and clarity.
          </p>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-6 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">
            Free intro call
          </p>
          <p className="mt-3 text-xl font-semibold text-white">
            Need a gut check before you start?
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            We&apos;ll help you understand whether FreshStart IL is the right fit and point you to the
            next step — no pitch, just clarity.
          </p>
          <a
            href="https://calendly.com/il-support/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
          >
            Book a free 15-min intro call →
          </a>
        </div>
      </div>
    </section>
  )
}
