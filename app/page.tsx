import type { Metadata } from "next"
import Link from "next/link"
import { MainLayout } from "@/components/layouts/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Calendar, Calculator, Download } from "lucide-react"
import { VisitorCounter } from "@/components/visitor-counter"
import {
  HeroSection,
  StatsBar,
  HowItWorksSection,
  TestimonialsSection,
  TrustBadgesSection,

  IntroCallBanner,
} from "@/components/home"
import { ChecklistForm } from "@/components/lead-magnet/checklist-form"

export const metadata: Metadata = {
  title: "Illinois Divorce Guidance | Get Court-Ready Forms",
  description: "FreshStart IL guides Illinois residents through every step of the divorce process — questionnaires, court-ready documents, and expert guidance. Start free.",
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "FreshStart IL",
  url: "https://www.freshstart-il.com",
  description: "Illinois divorce guidance platform — questionnaires, document generation, and court-ready forms for Cook County and statewide.",
  areaServed: {
    "@type": "AdministrativeArea",
    name: "Illinois",
  },
  serviceType: "Divorce Document Preparation",
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <MainLayout>
      <div className="bg-gray-50">
        {/* Hero Section */}
        <HeroSection />

        {/* Lead Magnet Banner */}
        <div className="bg-blue-600">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-shrink-0 hidden sm:block">
                <div className="bg-blue-500 p-3 rounded-xl">
                  <Download className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-base leading-tight">
                  Free Illinois Divorce Checklist
                </p>
                <p className="text-blue-200 text-sm mt-0.5">
                  Required forms, county fees, deadlines — instant email delivery, no account needed
                </p>
              </div>
              <div className="sm:flex-shrink-0 sm:w-auto w-full">
                <ChecklistForm variant="inline" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-8">
          <StatsBar />
        </div>

        {/* Feature Cards */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 w-full">
            <Link href="/legal-info/document-guide" className="block">
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <FileText className="h-10 w-10 text-blue-600 mb-2" />
                  <CardTitle>Document Generation</CardTitle>
                  <CardDescription>
                    Automatically fill and generate all required court documents
                    with our guided questionnaire system. Edit and regenerate when your info changes.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/dashboard/case" className="block">
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <Calendar className="h-10 w-10 text-blue-600 mb-2" />
                  <CardTitle>Case Management</CardTitle>
                  <CardDescription>
                    Track deadlines, court dates, and case milestones with email
                    reminders before important dates. Stay organized throughout your divorce.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/calculators" className="block">
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <Calculator className="h-10 w-10 text-blue-600 mb-2" />
                  <CardTitle>Financial Tools</CardTitle>
                  <CardDescription>
                    Calculate child support and spousal maintenance using
                    Illinois statutory guidelines.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>

          {/* How It Works */}
          <HowItWorksSection />

          {/* Trust Badges */}
          <TrustBadgesSection />

          {/* Testimonials */}
          <TestimonialsSection />

          {/* Legal Information & Resources */}
          <div className="mt-24 w-full">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Legal Information & Resources
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Learn about Illinois divorce law, requirements, and get answers to common questions.
              </p>
            </div>
            <Card className="w-full">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link
                    href="/legal-info/grounds-for-divorce"
                    className="text-blue-600 hover:text-blue-700 hover:underline flex items-start gap-2"
                  >
                    <span className="mt-0.5">→</span>
                    <span>Grounds for Divorce in Illinois</span>
                  </Link>
                  <Link
                    href="/legal-info/property-division"
                    className="text-blue-600 hover:text-blue-700 hover:underline flex items-start gap-2"
                  >
                    <span className="mt-0.5">→</span>
                    <span>Property Division Rules</span>
                  </Link>
                  <Link
                    href="/legal-info/child-custody"
                    className="text-blue-600 hover:text-blue-700 hover:underline flex items-start gap-2"
                  >
                    <span className="mt-0.5">→</span>
                    <span>Child Custody & Parenting Time</span>
                  </Link>
                  <Link
                    href="/legal-info/spousal-maintenance"
                    className="text-blue-600 hover:text-blue-700 hover:underline flex items-start gap-2"
                  >
                    <span className="mt-0.5">→</span>
                    <span>Spousal Maintenance (Alimony)</span>
                  </Link>
                  <Link
                    href="/legal-info/residency-requirements"
                    className="text-blue-600 hover:text-blue-700 hover:underline flex items-start gap-2"
                  >
                    <span className="mt-0.5">→</span>
                    <span>Residency Requirements</span>
                  </Link>
                  <Link
                    href="/legal-info/prenups-in-illinois"
                    className="text-blue-600 hover:text-blue-700 hover:underline flex items-start gap-2"
                  >
                    <span className="mt-0.5">→</span>
                    <span>Prenuptial and Postnuptial Agreements</span>
                  </Link>
                  <Link
                    href="/legal-info"
                    className="text-blue-600 hover:text-blue-700 hover:underline flex items-start gap-2 font-semibold"
                  >
                    <span className="mt-0.5">→</span>
                    <span>View All Legal Resources</span>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 flex justify-center">
            <VisitorCounter showToday={true} className="text-center" />
          </div>

          {/* Intro Call Banner */}
          <IntroCallBanner />
        </div>
      </div>
    </MainLayout>
    </>
  )
}
