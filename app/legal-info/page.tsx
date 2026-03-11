import type { Metadata } from "next"
import Image from "next/image"
import { MainLayout } from "@/components/layouts/main-layout"

export const metadata: Metadata = {
  title: "Legal Information & Resources",
  description: "Comprehensive Illinois divorce information - process, requirements, court forms, and resources.",
  openGraph: {
    title: "Legal Information | FreshStart IL",
    description: "Illinois divorce process, requirements, and court resources.",
  },
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  FileText,
  BookOpen,
  Calculator,
  DollarSign,
  ListChecks,
  ExternalLink,
} from "lucide-react"

export default function LegalInfoPage() {
  return (
    <MainLayout>
      {/* Hero Banner */}
      <div className="relative h-48 md:h-64 w-full overflow-hidden bg-blue-900">
        <Image
          src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&q=85"
          alt="Professional legal resources - Illinois divorce information"
          fill
          className="object-cover opacity-40"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 flex items-center justify-center bg-blue-900/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Legal Information & Resources
            </h1>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              Comprehensive information about the Illinois divorce process, requirements, and
              resources to help you navigate your divorce.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <FileText className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Divorce Process</CardTitle>
              <CardDescription>
                Step-by-step guide to the Illinois divorce process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/legal-info/process">
                <Button variant="outline" className="w-full">
                  Learn More
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <ListChecks className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Requirements</CardTitle>
              <CardDescription>
                Residency requirements, grounds for divorce, and what you need to file
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/legal-info/requirements">
                <Button variant="outline" className="w-full">
                  View Requirements
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <BookOpen className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Glossary</CardTitle>
              <CardDescription>
                Legal terms and definitions explained in plain language
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/legal-info/glossary">
                <Button variant="outline" className="w-full">
                  Browse Glossary
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <Calculator className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Timeline Calculator</CardTitle>
              <CardDescription>
                Estimate how long your divorce process will take
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/legal-info/timeline-calculator">
                <Button variant="outline" className="w-full">
                  Calculate Timeline
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <DollarSign className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Cost Estimator</CardTitle>
              <CardDescription>
                Estimate the costs associated with your divorce
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/legal-info/cost-estimator">
                <Button variant="outline" className="w-full">
                  Estimate Costs
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <ExternalLink className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Court Resources</CardTitle>
              <CardDescription>
                Links to official Illinois court resources and forms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/legal-info/court-resources">
                <Button variant="outline" className="w-full">
                  View Resources
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <FileText className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Prenuptial & Postnuptial Agreements</CardTitle>
              <CardDescription>
                Learn about prenups and postnups in Illinois and how they affect divorce
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/legal-info/prenups-in-illinois">
                <Button variant="outline" className="w-full">
                  Learn More
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Legal Articles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/legal-info/grounds-for-divorce"
              className="text-blue-600 hover:text-blue-700 hover:underline"
            >
              → Grounds for Divorce in Illinois
            </Link>
            <Link
              href="/legal-info/property-division"
              className="text-blue-600 hover:text-blue-700 hover:underline"
            >
              → Property Division Rules
            </Link>
            <Link
              href="/legal-info/child-custody"
              className="text-blue-600 hover:text-blue-700 hover:underline"
            >
              → Child Custody & Parenting Time
            </Link>
            <Link
              href="/legal-info/spousal-maintenance"
              className="text-blue-600 hover:text-blue-700 hover:underline"
            >
              → Spousal Maintenance (Alimony)
            </Link>
            <Link
              href="/legal-info/residency-requirements"
              className="text-blue-600 hover:text-blue-700 hover:underline"
            >
              → Residency Requirements
            </Link>
            <Link
              href="/legal-info/prenups-in-illinois"
              className="text-blue-600 hover:text-blue-700 hover:underline"
            >
              → Prenuptial and Postnuptial Agreements
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
