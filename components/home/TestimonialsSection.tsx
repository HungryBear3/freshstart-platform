import Image from "next/image"

const testimonials = [
  {
    quote:
      "I wish I had used FreshStart IL. It would've saved me at least $5,000.",
    name: "Sarah M.",
    location: "Chicago, IL",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop&crop=face",
  },
  {
    quote:
      "FreshStart IL could have saved me thousands of dollars and weeks of headaches.",
    name: "Michael R.",
    location: "Springfield, IL",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=face",
  },
  {
    quote:
      "FreshStart IL makes it so much easier to fill out complex forms correctly. The step-by-step guidance was exactly what I needed.",
    name: "Jennifer L.",
    location: "Naperville, IL",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=96&h=96&fit=crop&crop=face",
  },
]

export function TestimonialsSection() {
  return (
    <section className="mt-24">
      <h3 className="text-2xl font-bold text-center text-gray-900 mb-2">
        Learn from people who&apos;ve been through it.
      </h3>
      <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
        Illinois residents are navigating divorce with confidence using FreshStart IL.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {testimonials.map((t, i) => (
          <div
            key={i}
            className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <p className="text-gray-700 mb-4 italic">&ldquo;{t.quote}&rdquo;</p>
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src={t.image}
                  alt={t.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-gray-900 text-sm">{t.name}</span>
                <span className="text-gray-500 text-sm">{t.location}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
