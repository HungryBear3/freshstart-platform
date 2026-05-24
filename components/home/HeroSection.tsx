import Link from "next/link"
import { ArrowRight, CheckCircle2, Lock, PlayCircle, Sparkles, Stars } from "lucide-react"

const heroPills = [
  { label: "Secure & Private", icon: Lock },
  { label: "Under 2 Hours", icon: Sparkles },
  { label: "Reviewable Form Drafts", icon: CheckCircle2 },
  { label: "All 102 IL Counties", icon: Stars },
]

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.35),transparent_38%),linear-gradient(180deg,#0f172a_0%,#111827_45%,#0b1023_100%)]" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(148,163,184,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.18)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-300/40 to-transparent" />

      <div className="relative mx-auto flex min-h-[calc(100vh-200px)] max-w-7xl items-center justify-center px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-medium text-slate-100 shadow-[0_0_30px_rgba(59,130,246,0.12)] backdrop-blur">
            <span className="flex items-center gap-0.5 text-amber-300" aria-hidden="true">
              <Stars className="h-4 w-4 fill-current stroke-current" />
              <Stars className="h-4 w-4 fill-current stroke-current" />
              <Stars className="h-4 w-4 fill-current stroke-current" />
            </span>
            Trusted by residents in all 102 Illinois counties
          </div>

          <h1 className="mt-8 text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl">
            <span className="block">Illinois Divorce</span>
            <span className="mt-2 block bg-gradient-to-r from-indigo-200 via-violet-300 to-sky-300 bg-clip-text text-transparent">
              Done Right.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
            Step-by-step guidance, reviewable document drafts, and filing checklists based on official Illinois resources. Most
            cases complete in under 2 hours — with software support instead of attorney-led representation.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 px-6 py-3 text-base font-semibold text-white shadow-[0_14px_40px_rgba(99,102,241,0.45)] transition hover:scale-[1.01] hover:from-violet-400 hover:to-indigo-400"
            >
              Get My Free Checklist
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-base font-medium text-slate-100 transition hover:bg-white/10"
            >
              <PlayCircle className="h-5 w-5 text-sky-300" />
              See how it works
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            {heroPills.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-medium text-slate-100 backdrop-blur"
              >
                <Icon className="h-4 w-4 text-sky-300" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

