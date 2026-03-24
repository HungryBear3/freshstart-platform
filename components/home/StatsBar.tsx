export function StatsBar() {
  return (
    <section className="py-12 bg-blue-900 rounded-2xl max-w-7xl mx-auto">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <p className="text-3xl md:text-4xl font-bold text-white mb-2">
          Illinois-Focused. Court-Ready. Step-by-Step.
        </p>
        <p className="text-blue-100 text-lg mb-6">
          All required court forms, 90-day process guidance, and Illinois statutory
          calculators. No lawyer required for uncontested cases.
        </p>
        <a
          href="https://calendly.com/freshstart-il/intro"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-white text-blue-900 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors text-sm"
        >
          Not sure where to start? Book a free 15-min intro call →
        </a>
      </div>
    </section>
  )
}
