import { Shield, CheckCircle2, FileCheck } from "lucide-react"

const badges = [
  {
    icon: Shield,
    title: "Illinois-Specific",
    description: "All forms and guidance tailored to Illinois law and court requirements.",
  },
  {
    icon: CheckCircle2,
    title: "Court-Ready Forms",
    description: "All required divorce forms filled correctly per Illinois Compiled Statutes.",
  },
  {
    icon: FileCheck,
    title: "Prenup Support",
    description: "Works for couples with or without prenuptial agreements.",
  },
]

export function TrustBadgesSection() {
  return (
    <section className="mt-24">
      <h3 className="text-2xl font-bold text-center text-gray-900 mb-2">
        Why FreshStart IL
      </h3>
      <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
        Trusted by Illinois residents to navigate divorce with confidence.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        {badges.map((badge, i) => {
          const Icon = badge.icon
          return (
            <div
              key={i}
              className="flex flex-col items-center text-center p-6 rounded-lg bg-white border border-gray-200 shadow-sm"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                {badge.title}
              </h4>
              <p className="text-gray-600 text-sm">{badge.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
