import { Shield, CheckCircle2, FileCheck, DollarSign } from "lucide-react"

const badges = [
  {
    icon: Shield,
    title: "Illinois-Focused",
    description: "Built for Illinois residents using state-specific document-preparation workflows and official filing resources.",
  },
  {
    icon: CheckCircle2,
    title: "Reviewable Form Drafts",
    description: "Generate editable divorce form drafts from your answers, then review and update them before you file.",
  },
  {
    icon: FileCheck,
    title: "Prenup Organization",
    description: "Helps organize information about prenuptial or postnuptial agreements without deciding legal validity or strategy.",
  },
  {
    icon: DollarSign,
    title: "Lower Than One Attorney Hour",
    description: "Chicago divorce attorneys often charge $300–$500/hr. FreshStart IL is software for paperwork preparation and filing guidance, not a law firm.",
    featured: true,
  },
]

export function TrustBadgesSection() {
  return (
    <section className="mt-24 rounded-[32px] bg-slate-950/60 px-8 py-10 text-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
      <h3 className="text-3xl font-bold text-center text-white mb-3">
        Why FreshStart IL
      </h3>
      <p className="text-center text-slate-300 mb-12 max-w-2xl mx-auto text-lg">
        Software and general information for Illinois residents who want a more organized way to prepare divorce paperwork.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {badges.map((badge, i) => {
          const Icon = badge.icon
          return (
            <div
              key={i}
              className={badge.featured
                ? "flex flex-col rounded-[24px] border border-violet-400/30 bg-gradient-to-br from-violet-500/18 to-sky-400/12 p-6 shadow-[0_20px_60px_rgba(99,102,241,0.18)]"
                : "flex flex-col rounded-[24px] border border-white/10 bg-white/5 p-6 backdrop-blur"
              }
            >
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-5">
                <Icon className="w-6 h-6 text-sky-300" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">
                {badge.title}
              </h4>
              <p className="text-sm leading-7 text-slate-300">{badge.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
