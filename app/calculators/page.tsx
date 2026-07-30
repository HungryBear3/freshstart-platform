/**
 * Public Calculators Landing Page
 * Accessible without login - serves as a marketing tool to showcase the platform's value
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Calculator, FileText, ArrowRight } from "lucide-react"

import type { Metadata } from "next"
import { DEFAULT_OG_IMAGE, DEFAULT_TWITTER_IMAGE } from "@/lib/seo-metadata";

export const metadata: Metadata = {
  title: "Divorce Calculators",
  description: "General educational Illinois divorce planning tools for support, timeline, and filing-cost research. Verify results with current official sources.",
  alternates: { canonical: "/calculators" },
  openGraph: {
    title: "Divorce Calculators | FreshStart IL",
    description: "General educational Illinois divorce planning tools. Verify results with current official sources.",
    images: [DEFAULT_OG_IMAGE],
  },
}

export default function CalculatorsLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <Link
              href="/"
              className="text-sm font-medium text-blue-100 hover:text-white"
            >
              ← Back to Home
            </Link>
          </div>
          <div className="text-center">
            <Calculator className="h-16 w-16 mx-auto mb-4 opacity-90" />
            <h1 className="text-4xl font-bold mb-4">Illinois Divorce Calculators</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              General educational tools for planning and identifying information to verify.
              Results are not legal advice or court calculations.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          
          {/* Calculator availability */}
          <Card className="md:col-span-2 border-2 border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-xl">Support and timeline calculators are unavailable</CardTitle>
              <CardDescription>Validation in progress</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                We have removed these tools while their formulas, source data, and legal boundaries are independently validated. Use current official court and statutory resources, or consult a qualified attorney, for case-specific calculations and timing questions.
              </p>
            </CardContent>
          </Card>

          {/* Court Cost Reference */}
          <Card className="hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-100">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <FileText className="h-8 w-8 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Court Cost Reference</CardTitle>
                  <CardDescription>Review Common Filing-Related Costs</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Review common filing-related cost categories, including:
              </p>
              <ul className="text-sm text-gray-500 space-y-1 mb-6">
                <li>• Court filing fees by county</li>
                <li>• Service of process costs</li>
                <li>• Parent education requirements</li>
                <li>• Current amounts to verify with the clerk or provider</li>
              </ul>
              <Link href="/legal">
                <Button className="w-full">
                  Review Legal Information
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <Card className="max-w-3xl mx-auto bg-blue-50 border-blue-200">
            <CardContent className="py-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to Start Your Divorce Journey?
              </h2>
              <p className="text-gray-600 mb-6 max-w-xl mx-auto">
                FreshStart IL prepares supported uncontested-divorce form drafts from your
                answers. The $149 one-time purchase includes 60 days of service access. You review
                everything and file it yourself.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signup?redirect=%2Fpricing&subscribe=true&plan=one_time&source=calculators_cta">
                  <Button size="lg">
                    Start $149 / 60-day access
                  </Button>
                </Link>
                <Link href="/legal-info">
                  <Button size="lg" variant="outline">
                    Learn More
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 max-w-3xl mx-auto">
          <p className="text-xs text-gray-500 text-center">
            <strong>Disclaimer:</strong> These are general educational estimates, not court
            calculations. Inputs, law, and official methods may change. Verify current official
            sources. This is not legal advice; consult an attorney for advice about your situation.
          </p>
        </div>
      </div>
    </div>
  )
}
