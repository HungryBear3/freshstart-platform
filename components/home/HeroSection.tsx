import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="min-h-[calc(100vh-200px)] flex items-center bg-gradient-to-b from-blue-50 to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              FreshStart IL
            </h1>
            <p className="mt-3 text-xl text-gray-600 sm:text-2xl">
              Your guide through the Illinois divorce process
            </p>
            <p className="mt-4 text-lg text-gray-500 max-w-xl">
              Navigate your divorce with confidence. Get step-by-step guidance,
              generate court documents, and track your case progress—all in one place.
              Works for couples with or without prenuptial agreements.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <Link href="/auth/signup">
                <Button size="lg">Get Started</Button>
              </Link>
              <Link href="/auth/signin">
                <Button variant="outline" size="lg">
                  Sign In
                </Button>
              </Link>
              <Link href="/calculators">
                <Button variant="outline" size="lg">
                  Free Calculators
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="lg">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] lg:aspect-square rounded-2xl overflow-hidden shadow-xl">
            <Image
              src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&q=85"
              alt="Person reviewing documents calmly - FreshStart IL helps Illinois residents navigate divorce with confidence"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  )
}
