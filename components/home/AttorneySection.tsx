import { Shield } from "lucide-react"

export function AttorneySection() {
  return (
    <section className="mt-24">
      <div className="text-center mb-10">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Guidance you can trust</h3>
        <p className="text-gray-600 max-w-2xl mx-auto">
          FreshStart IL is built around Illinois law — every form, deadline, and calculator is
          tailored to Illinois courts and the Illinois Marriage and Dissolution of Marriage Act.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm relative">
          {/* Blue left accent bar */}
          <div className="absolute left-0 top-4 bottom-4 w-1 bg-blue-500 rounded-r" />

          {/* Attorney-Reviewed badge */}
          <div className="flex items-center gap-2 mb-4 pl-4">
            <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full border border-blue-100">
              <Shield className="w-3.5 h-3.5" />
              Attorney-Reviewed Guidance
            </span>
          </div>

          {/* Quote */}
          <blockquote className="pl-4">
            <p className="text-gray-800 text-base italic leading-relaxed mb-4">
              &ldquo;Illinois divorce law is complex. FreshStart IL gets the forms right.&rdquo;
            </p>
            <footer className="text-sm text-gray-500">
              Illinois Family Law Attorney &mdash; Legal Advisor{" "}
              <span className="text-gray-400">(partnership in progress)</span>
            </footer>
          </blockquote>
        </div>
      </div>
    </section>
  )
}
