import { HelpCircle, FileText, CheckCircle } from "lucide-react"

export function HowItWorksSection() {
  const steps = [
    {
      number: 1,
      title: "Answer a few questions",
      description:
        "Our guided questionnaire walks you through your situation — assets, children, income — and builds your case file automatically.",
      icon: HelpCircle,
    },
    {
      number: 2,
      title: "Get your court-ready documents",
      description:
        "We fill out all required Illinois divorce forms using your answers. Edit and regenerate anytime your information changes.",
      icon: FileText,
    },
    {
      number: 3,
      title: "File with confidence",
      description:
        "E-file through Illinois E-Services with step-by-step guidance. We handle county-specific requirements so nothing gets rejected.",
      icon: CheckCircle,
    },
  ]

  return (
    <section className="mt-24" id="how-it-works">
      <h3 className="text-2xl font-bold text-center text-gray-900 mb-2">
        Simple. Guided. Effective.
      </h3>
      <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
        Three steps to navigate your Illinois divorce with confidence.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        {steps.map((step) => {
          const Icon = step.icon
          return (
            <div key={step.number} className="flex flex-col items-center text-center">
              {/* Step number circle */}
              <div className="relative mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Icon className="w-8 h-8 text-blue-600" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {step.number}
                </div>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                {step.title}
              </h4>
              <p className="text-gray-600 text-sm">{step.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
