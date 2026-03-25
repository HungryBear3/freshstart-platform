import Link from "next/link"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section style={{ background: "linear-gradient(to bottom, #f0fdf4, #ffffff)" }} className="min-h-[calc(100vh-200px)] flex items-center">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            Illinois Divorce Paperwork Done Right Without the Attorney Fees
          </h1>
          <p className="mt-4 text-xl text-gray-700">
            Step-by-step guidance court-ready documents checklist tailored to your county Most cases complete in under 2 hours
          </p>
          <div className="mt-8 flex gap-4">
            <Link href="/auth/signup" legacyBehavior>
              <a>
                <Button size="lg" style={{ backgroundColor: "#16a34a", color: "white" }}>
                  Start Free Checklist
                </Button>
              </a>
            </Link>
            <Link href="#how-it-works" legacyBehavior>
              <a>
                <Button size="lg" variant="outline">
                  See How It Works
                </Button>
              </a>
            </Link>
          </div>
          <p className="mt-10 text-gray-600 font-semibold">Trusted by Illinois residents in all 102 counties</p>
          <div className="mt-4 flex flex-wrap gap-4">
            <span style={{ padding: "8px 12px", border: "1px solid #16a34a", borderRadius: "6px", color: "#16a34a", fontWeight: "600" }}>
              Secure and Private
            </span>
            <span style={{ padding: "8px 12px", border: "1px solid #16a34a", borderRadius: "6px", color: "#16a34a", fontWeight: "600" }}>
              Court-Ready Forms
            </span>
            <span style={{ padding: "8px 12px", border: "1px solid #16a34a", borderRadius: "6px", color: "#16a34a", fontWeight: "600" }}>
              Under 2 Hours
            </span>
            <span style={{ padding: "8px 12px", border: "1px solid #16a34a", borderRadius: "6px", color: "#16a34a", fontWeight: "600" }}>
              All 102 IL Counties
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

