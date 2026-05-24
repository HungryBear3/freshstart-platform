import { ClipboardCheck, FileText, ShieldCheck } from "lucide-react"

const processCards = [
  {
    icon: ClipboardCheck,
    title: "Guided intake",
    description:
      "Plain-English questions help organize the information commonly needed for Illinois divorce paperwork.",
  },
  {
    icon: FileText,
    title: "Document preparation",
    description:
      "FreshStart IL uses your answers to prepare editable form drafts for you to review before filing.",
  },
  {
    icon: ShieldCheck,
    title: "Clear boundaries",
    description:
      "We provide software and general information — not legal advice, legal representation, or court-outcome promises.",
  },
]

export function TestimonialsSection() {
  return (
    <section className="mt-24 rounded-[32px] border border-slate-200 bg-white/80 px-8 py-10 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
      <h3 className="text-3xl font-bold text-center text-slate-950 mb-3">
        A clearer way to prepare your paperwork.
      </h3>
      <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto text-lg">
        FreshStart IL is built around a simple document-preparation workflow: organize your details, generate drafts, review everything, then follow filing instructions from official sources.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {processCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.title}
              className="rounded-[24px] border border-slate-200 bg-slate-950/60 p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.22)]"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                <Icon className="h-6 w-6 text-sky-300" />
              </div>
              <h4 className="mb-3 text-lg font-semibold text-white">{card.title}</h4>
              <p className="text-slate-100 leading-7">{card.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
