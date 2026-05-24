import { HelpCircle, FileText, CheckCircle } from "lucide-react"

export function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Answer a few questions",
      description:
        "Our guided questionnaire walks you through your situation — assets, children, income — and builds your case file automatically.",
      icon: HelpCircle,
    },
    {
      number: "02",
      title: "Generate reviewable document drafts",
      description:
        "FreshStart IL prepares Illinois divorce form drafts from your answers. Edit and regenerate anytime your information changes.",
      icon: FileText,
    },
    {
      number: "03",
      title: "Follow the filing steps",
      description:
        "Use step-by-step general guidance and official Illinois filing resources to review, update, and submit your paperwork.",
      icon: CheckCircle,
    },
  ]

  return (
    <section className="mt-24 rounded-[28px] border border-slate-200 bg-white/80 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur" id="how-it-works">
      <h3 className="text-3xl font-bold text-center text-slate-950 mb-3">
        Simple. Guided. Effective.
      </h3>
      <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto text-lg">
        Three steps to navigate your Illinois divorce with confidence.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {steps.map((step) => {
          const Icon = step.icon
          return (
            <div
              key={step.number}
              className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50/80 p-6 text-left shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-sky-400 text-white shadow-[0_14px_30px_rgba(99,102,241,0.28)]">
                  <Icon className="h-7 w-7" />
                </div>
                <div className="text-sm font-semibold tracking-[0.24em] text-slate-400">
                  {step.number}
                </div>
              </div>
              <h4 className="mt-6 text-xl font-semibold text-slate-950">
                {step.title}
              </h4>
              <p className="mt-3 text-sm leading-7 text-slate-600">{step.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
