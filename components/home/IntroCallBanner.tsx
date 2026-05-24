import { Phone } from "lucide-react"
import { Button } from "@/components/ui/button"

export function IntroCallBanner() {
  return (
    <section className="mt-20 rounded-[28px] border border-white/10 bg-slate-900/95 px-6 py-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.32)]">
      <div className="flex flex-col gap-4 max-w-5xl mx-auto sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
            <Phone className="h-5 w-5 text-sky-300" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
              Free orientation call
            </p>
            <p className="mt-2 text-xl font-semibold text-white">
              Not sure where to start?
            </p>
            <p className="text-slate-300 text-sm mt-1.5 leading-6 max-w-2xl">
              We offer a free 15-minute orientation call to point you in the right direction — no
              pitch, just clarity.
            </p>
          </div>
        </div>
        <div className="sm:flex-shrink-0">
          <Button
            asChild
            className="w-full rounded-full bg-white px-5 text-slate-950 hover:bg-slate-100 sm:w-auto"
          >
            <a href="https://calendly.com/il-support/30min" target="_blank" rel="noopener noreferrer">
              Book a Free Call
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}
