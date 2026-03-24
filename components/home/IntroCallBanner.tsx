import { Phone } from "lucide-react"
import { Button } from "@/components/ui/button"

export function IntroCallBanner() {
  return (
    <section className="mt-20 bg-blue-50 rounded-2xl border border-blue-100 px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 max-w-4xl mx-auto">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 bg-blue-100 p-3 rounded-xl">
            <Phone className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-gray-900 font-semibold text-base">
              Not sure where to start?
            </p>
            <p className="text-gray-600 text-sm mt-0.5">
              We offer a free 15-minute orientation call to point you in the right direction — no pitch, just clarity.
            </p>
          </div>
        </div>
        <div className="sm:flex-shrink-0">
          <Button asChild variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100 w-full sm:w-auto">
            <a href="https://calendly.com/freshstart-il-support/15min" target="_blank" rel="noopener noreferrer">
              Book a Free Call
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}
