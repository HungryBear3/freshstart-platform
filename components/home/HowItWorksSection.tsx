import { FileText, Calendar, Upload } from "lucide-react"

export function HowItWorksSection() {
  const steps = [
    {
      title: "Generate Documents",
      description:
        "Answer guided questions and we'll fill out all required Illinois divorce forms. Edit and regenerate anytime your info changes.",
      icon: FileText,
    },
    {
      title: "Manage Your Case",
      description:
        "Track deadlines, court dates, and milestones. Get email reminders before important dates. Stay organized throughout your divorce.",
      icon: Calendar,
    },
    {
      title: "File with the Court",
      description:
        "E-file through Illinois E-Services with our guidance. We help you with county-specific requirements and document packaging.",
      icon: Upload,
    },
  ]

  return (
    <section className="mt-24">
      <h3 className="text-2xl font-bold text-center text-gray-900 mb-2">
        Simple. Guided. Effective.
      </h3>
      <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
        Three steps to navigate your Illinois divorce with confidence.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        {steps.map((step, i) => {
          const Icon = step.icon
          return (
            <div key={i} className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-blue-600" />
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
