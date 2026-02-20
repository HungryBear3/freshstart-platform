/**
 * Public Calculators Landing Page
 * Accessible without login - serves as a marketing tool to showcase the platform's value
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Calculator, DollarSign, Clock, TrendingDown, ArrowRight } from "lucide-react"

export const metadata = {
  title: "Divorce Calculators | FreshStart IL",
  description: "Free Illinois divorce calculators for child support, spousal maintenance, timeline estimates, and cost estimation. Based on official Illinois guidelines.",
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
              Free tools to help you understand your divorce costs, support obligations, and timeline. 
              Based on official Illinois statutory guidelines.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          
          {/* Child Support Calculator */}
          <Card className="hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-100">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Calculator className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Child Support Calculator</CardTitle>
                  <CardDescription>Illinois Guidelines (750 ILCS 5/505)</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Calculate monthly child support obligations based on:
              </p>
              <ul className="text-sm text-gray-500 space-y-1 mb-6">
                <li>• Combined net income of both parents</li>
                <li>• Number of children</li>
                <li>• Parenting time percentages</li>
                <li>• Healthcare, childcare, and education costs</li>
              </ul>
              <Link href="/dashboard/financial/child-support">
                <Button className="w-full">
                  Calculate Child Support
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Spousal Maintenance Calculator */}
          <Card className="hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-100">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Spousal Maintenance Calculator</CardTitle>
                  <CardDescription>Illinois Guidelines (750 ILCS 5/504)</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Estimate spousal maintenance (alimony) including:
              </p>
              <ul className="text-sm text-gray-500 space-y-1 mb-6">
                <li>• Monthly maintenance amount</li>
                <li>• Duration based on marriage length</li>
                <li>• Formula: 33.33% of payer - 25% of payee income</li>
                <li>• 40% cap on combined income</li>
              </ul>
              <Link href="/dashboard/financial/spousal-maintenance">
                <Button className="w-full">
                  Calculate Maintenance
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Timeline Calculator */}
          <Card className="hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-100">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Timeline Calculator</CardTitle>
                  <CardDescription>Estimate Your Divorce Timeline</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Get a realistic timeline estimate based on:
              </p>
              <ul className="text-sm text-gray-500 space-y-1 mb-6">
                <li>• Contested vs. uncontested divorce</li>
                <li>• Children and custody issues</li>
                <li>• Property and debt complexity</li>
                <li>• County-specific processing times</li>
              </ul>
              <Link href="/legal-info/timeline-calculator">
                <Button className="w-full">
                  Estimate Timeline
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Cost Estimator */}
          <Card className="hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-100">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <TrendingDown className="h-8 w-8 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Cost Estimator</CardTitle>
                  <CardDescription>Estimate Your Divorce Costs</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Understand the costs involved including:
              </p>
              <ul className="text-sm text-gray-500 space-y-1 mb-6">
                <li>• Court filing fees by county</li>
                <li>• Service of process costs</li>
                <li>• Parent education requirements</li>
                <li>• Mediation and attorney fee ranges</li>
              </ul>
              <Link href="/legal-info/cost-estimator">
                <Button className="w-full">
                  Estimate Costs
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
                FreshStart IL guides you through the entire Illinois divorce process with 
                questionnaires, document generation, and step-by-step instructions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signup">
                  <Button size="lg">
                    Get Started Free
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
            <strong>Disclaimer:</strong> These calculators provide estimates based on Illinois 
            statutory guidelines. Actual court orders may vary based on specific circumstances 
            and judicial discretion. This is not legal advice. Consult with an attorney for 
            advice specific to your situation.
          </p>
        </div>
      </div>
    </div>
  )
}
