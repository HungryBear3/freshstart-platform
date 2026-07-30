import { MainLayout } from "@/components/layouts/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Disclaimer } from "@/components/legal/disclaimer"
import { ExternalLink, Info, ReceiptText } from "lucide-react"

const ILLINOIS_CIRCUIT_COURTS = "https://www.illinoiscourts.gov/courts/circuit-court"
const ILLINOIS_FEE_WAIVER = "https://www.illinoiscourts.gov/documents-and-forms/approved-forms/circuit-court-standardized-forms-suites/fee-waiver-civil/"

export default function CostEstimatorPage() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">Illinois Divorce Cost Planning</h1>
          <p className="text-lg text-gray-600">
            Court charges and other case costs vary by county and circumstances. FreshStart does not publish a calculated total because local fees and requirements can change.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ReceiptText className="h-5 w-5 text-blue-600" />Verify Current Court Charges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-700">
              <p>Ask the circuit clerk for the current filing charge and any local charges that may apply before filing.</p>
              <p>Service, copies, classes, mediation, evaluations, and professional help may add costs only when applicable to the case.</p>
              <a className="inline-flex items-center gap-2 font-medium text-blue-700 underline" href={ILLINOIS_CIRCUIT_COURTS} target="_blank" rel="noopener noreferrer">
                Illinois Courts circuit-court directory <ExternalLink className="h-4 w-4" />
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5 text-blue-600" />Fee-Waiver Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-700">
              <p>Illinois Courts publishes statewide civil fee-waiver forms and instructions. Eligibility depends on the facts provided to the court.</p>
              <a className="inline-flex items-center gap-2 font-medium text-blue-700 underline" href={ILLINOIS_FEE_WAIVER} target="_blank" rel="noopener noreferrer">
                Official Illinois fee-waiver forms <ExternalLink className="h-4 w-4" />
              </a>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8 border-blue-200 bg-blue-50">
          <CardContent className="pt-6 text-sm text-blue-950">
            <strong>FreshStart service price:</strong> $149 one-time for 60 days of service access. No subscription. Court charges and third-party costs are separate and are not paid to FreshStart.
          </CardContent>
        </Card>

        <div className="mt-8"><Disclaimer /></div>
      </div>
    </MainLayout>
  )
}
