// Preview-only mount for the in-flight premium homepage/nav redesign.
//
// The production homepage at "/" continues to render the v2 `HomeView`
// (app/v2/_components/*) and is intentionally NOT changed by this branch —
// so merging the preview cannot accidentally ship the redesign. This route
// composes the dirty premium section components under components/home/* plus
// the dark premium nav, giving the team a reviewable URL to evaluate whether
// the premium treatment improves conversion.
//
// The attorney endorsement band (AttorneyEndorsementBand / "Erin Birt" quote)
// and the duplicate "pre-call" card are deliberately excluded; the safer
// process cards in TestimonialsSection replace the fake-testimonial posture.
import type { Metadata } from "next"
import { Header } from "@/components/navigation/header"
import { HeroSection } from "@/components/home/HeroSection"
import { StatsBar } from "@/components/home/StatsBar"
import { HowItWorksSection } from "@/components/home/HowItWorksSection"
import { TestimonialsSection } from "@/components/home/TestimonialsSection"
import { TrustBadgesSection } from "@/components/home/TrustBadgesSection"
import { IntroCallBanner } from "@/components/home/IntroCallBanner"

export const metadata: Metadata = {
  title: "Premium homepage preview | FreshStart IL",
  description: "Internal preview of the premium homepage redesign candidate.",
  // Preview surface — keep it out of search indexes.
  robots: { index: false, follow: false },
  alternates: { canonical: "/preview/premium-homepage" },
}

export default function PremiumHomepagePreview() {
  return (
    <div className="min-h-screen bg-slate-100">
      <Header forceHomeVariant />
      <main role="main">
        <HeroSection />
        <div className="relative z-10 mx-auto -mt-12 max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <StatsBar />
          <HowItWorksSection />
          <TestimonialsSection />
          <TrustBadgesSection />
          <IntroCallBanner />
        </div>
      </main>
    </div>
  )
}
