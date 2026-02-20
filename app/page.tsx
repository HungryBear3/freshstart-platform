import Link from "next/link"
import { MainLayout } from "@/components/layouts/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Calendar, Calculator } from "lucide-react"
import { VisitorCounter } from "@/components/visitor-counter"

export default function Home() {
  return (
    <MainLayout>
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col items-center gap-8 text-center">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                FreshStart IL
              </h1>
              <p className="mt-3 text-xl text-gray-600 sm:text-2xl">
                Your guide through the Illinois divorce process
              </p>
              <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
                Navigate your divorce with confidence. Get step-by-step guidance,
                generate court documents, and track your case progress—all in one place.
                Works for couples with or without prenuptial agreements.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:justify-center">
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

            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3 w-full">
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

            <div className="mt-16 w-full">
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
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
