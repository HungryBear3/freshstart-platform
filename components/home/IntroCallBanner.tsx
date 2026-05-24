import Link from "next/link"
import { ClipboardList } from "lucide-react"
import { Button } from "@/components/ui/button"

export function IntroCallBanner() {
  return (
    <section className="mt-20 rounded-[28px] border border-white/10 bg-slate-900/95 px-6 py-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.32)]">
      <div className="flex flex-col gap-4 max-w-5xl mx-auto sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
            <ClipboardList className="h-5 w-5 text-sky-300" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
              Start free
            </p>
            <p className="mt-2 text-xl font-semibold text-white">
              Most people just start with the free checklist.
            </p>
            <p className="text-slate-300 text-sm mt-1.5 leading-6 max-w-2xl">
              See what your Illinois filing involves, step by step. Prefer to talk it through first? A
              free 15-minute orientation call is available too — no pitch, just clarity.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-shrink-0 sm:items-end">
          <Button
            asChild
            className="w-full rounded-full bg-violet-500 px-5 text-white hover:bg-violet-400 sm:w-auto"
          >
            <Link href="/checklist">Get the free checklist</Link>
          </Button>
          <a
            href="https://calendly.com/il-support/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-slate-300 underline-offset-4 transition hover:text-white hover:underline"
          >
            Or book a free orientation call →
          </a>
        </div>
      </div>
    </section>
  )
}
