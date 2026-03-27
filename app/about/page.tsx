import type { Metadata } from "next"
import { MainLayout } from "@/components/layouts/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Heart, Shield, Users, BookOpen } from "lucide-react"

export const metadata: Metadata = {
  title: "About FreshStart IL | Illinois Divorce Guidance",
  description: "FreshStart IL helps Illinois residents navigate divorce with clear guidance, court-ready documents, and step-by-step tools. Learn who we are and why we built this.",
}

const values = [
  {
    icon: Heart,
    title: "Built for Real People",
    description:
      "Divorce is one of the hardest things a person can go through. We built FreshStart IL to make the process clearer, less stressful, and more affordable — without the legal jargon.",
  },
  {
    icon: Shield,
    title: "Honest & Transparent",
    description:
      "We're not a law firm. We don't pretend to be. We provide clear, accurate information about Illinois divorce law so you can make informed decisions — with or without an attorney.",
  },
  {
    icon: BookOpen,
    title: "Step-by-Step Guidance",
    description:
      "No more wondering what comes next. Our platform walks you through every stage of the Illinois divorce process — from filing requirements to final documents.",
  },
  {
    icon: Users,
    title: "Made for Illinois",
    description:
      "Illinois divorce law has its own rules, timelines, and court procedures. FreshStart IL is built specifically for Illinois residents, with content tailored to Cook County and the rest of the state.",
  },
]

export default function AboutPage() {
  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen">
        {/* Hero */}
        <div className="bg-white border-b border-gray-200">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              About FreshStart IL
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We help Illinois residents navigate divorce with confidence — clear guidance, court-ready documents, and tools that actually make sense.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
          {/* Mission */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              Divorce doesn&apos;t have to mean months of confusion and thousands in attorney fees just to understand what&apos;s happening. We built FreshStart IL because too many Illinois residents were showing up to court unprepared — not because they didn&apos;t care, but because the information they needed was buried in legal language or hidden behind expensive consultations.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed">
              Our goal is simple: give every Illinois resident access to the same clarity that used to require hiring a lawyer just to understand the basics.
            </p>
          </div>

          {/* Values */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">What We Stand For</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {values.map((v) => (
                <Card key={v.title} className="border border-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <v.icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <CardTitle className="text-base">{v.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">{v.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Disclaimer note */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-12">
            <p className="text-sm text-amber-800">
              <strong>Important:</strong> FreshStart IL is an information and document preparation platform — not a law firm. We do not provide legal advice or legal representation. For advice specific to your situation, please consult a licensed Illinois attorney.
            </p>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
            <p className="text-gray-600 mb-6">
              Thousands of Illinois residents have used FreshStart IL to understand the divorce process and prepare their documents.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/auth/signup">
                <Button size="lg">Get Started Free</Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline">Contact Us</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
