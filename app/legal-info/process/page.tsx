import { MainLayout } from "@/components/layouts/main-layout"
import { StepByStepGuide, type Step } from "@/components/legal/step-by-step-guide"
import { Disclaimer } from "@/components/legal/disclaimer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const divorceSteps: Step[] = [
  {
    id: "1",
    title: "Meet Residency Requirements",
    description: "Ensure you meet Illinois residency requirements",
    estimatedTime: "90 days",
    required: true,
    content: (
      <div className="space-y-3 text-sm text-gray-700">
        <p>
          At least one spouse must have lived in Illinois for at least 90 days before filing
          for divorce.
        </p>
        <p>
          You must file in the county where either spouse has lived for at least 90 days.
        </p>
      </div>
    ),
  },
  {
    id: "2",
    title: "Prepare and File Petition",
    description: "File the Petition for Dissolution of Marriage with the court",
    estimatedTime: "1-2 weeks",
    required: true,
    content: (
      <div className="space-y-3 text-sm text-gray-700">
        <p>
          Complete the Petition for Dissolution of Marriage form. This document states:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Grounds for divorce (typically irreconcilable differences)</li>
          <li>What you're requesting (custody, support, property division)</li>
          <li>Basic information about you, your spouse, and any children</li>
        </ul>
        <p>
          File the petition with the circuit clerk in your county and pay the filing fee (or
          file for a fee waiver if eligible).
        </p>
      </div>
    ),
  },
  {
    id: "3",
    title: "Serve Your Spouse",
    description: "Legally notify your spouse about the divorce filing",
    estimatedTime: "1-2 weeks",
    required: true,
    content: (
      <div className="space-y-3 text-sm text-gray-700">
        <p>
          Your spouse must be formally notified (served) with the divorce papers. This can be
          done by:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Sheriff's office (typically $50)</li>
          <li>Private process server</li>
          <li>Certified mail (if spouse agrees to accept)</li>
          <li>Publication (if spouse cannot be found)</li>
        </ul>
        <p>
          You must file proof of service with the court showing your spouse was served.
        </p>
      </div>
    ),
  },
  {
    id: "4",
    title: "Wait for Response",
    description: "Spouse has 30 days to respond to the petition",
    estimatedTime: "30 days",
    required: true,
    content: (
      <div className="space-y-3 text-sm text-gray-700">
        <p>
          Your spouse has 30 days from being served to file a response. They can:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Agree with your petition (uncontested)</li>
          <li>File a response disagreeing (contested)</li>
          <li>Not respond (default judgment may be possible)</li>
        </ul>
      </div>
    ),
  },
  {
    id: "5",
    title: "Complete Financial Disclosure",
    description: "Exchange financial information with your spouse",
    estimatedTime: "2-4 weeks",
    required: true,
    content: (
      <div className="space-y-3 text-sm text-gray-700">
        <p>
          Both spouses must complete and exchange Financial Affidavits disclosing:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Income from all sources</li>
          <li>Monthly expenses</li>
          <li>Assets (property, bank accounts, investments)</li>
          <li>Debts and liabilities</li>
        </ul>
        <p>
          This information is used to determine child support, spousal maintenance, and property
          division.
        </p>
      </div>
    ),
  },
  {
    id: "6",
    title: "Negotiate Settlement",
    description: "Work with your spouse to reach an agreement",
    estimatedTime: "1-3 months",
    required: false,
    content: (
      <div className="space-y-3 text-sm text-gray-700">
        <p>
          If both spouses can agree on all issues, you can create a Marital Settlement
          Agreement covering:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Property division</li>
          <li>Child custody and parenting time</li>
          <li>Child support</li>
          <li>Spousal maintenance</li>
        </ul>
        <p>
          Mediation may help if you're having trouble reaching agreement. An uncontested
          divorce is faster and less expensive.
        </p>
      </div>
    ),
  },
  {
    id: "7",
    title: "Attend Final Hearing",
    description: "Appear in court for the final divorce hearing",
    estimatedTime: "1 day",
    required: true,
    content: (
      <div className="space-y-3 text-sm text-gray-700">
        <p>
          The court will schedule a final hearing where:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>You testify that the marriage is irretrievably broken</li>
          <li>The judge reviews your settlement agreement (if uncontested)</li>
          <li>The judge enters the final judgment of dissolution</li>
        </ul>
        <p>
          In uncontested cases, the hearing is typically brief. In contested cases, it may
          involve a full trial.
        </p>
      </div>
    ),
  },
  {
    id: "8",
    title: "Receive Final Judgment",
    description: "Court issues the final divorce decree",
    estimatedTime: "1-2 weeks after hearing",
    required: true,
    content: (
      <div className="space-y-3 text-sm text-gray-700">
        <p>
          After the hearing, the court will issue a Final Judgment of Dissolution of Marriage
          that:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Officially ends your marriage</li>
          <li>Includes all orders regarding property, custody, and support</li>
          <li>Becomes effective immediately (unless otherwise stated)</li>
        </ul>
        <p>
          Make sure to keep copies of all court documents for your records.
        </p>
      </div>
    ),
  },
]

export default function ProcessPage() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Illinois Divorce Process
          </h1>
          <p className="text-lg text-gray-600">
            A step-by-step guide to the Illinois divorce process, from filing to final judgment.
          </p>
        </div>

        <div className="mb-8">
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle>Quick Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-700">
              <p>
                The Illinois divorce process typically takes 3-6 months for uncontested
                divorces and 6-18 months (or longer) for contested divorces.
              </p>
              <p>
                Use our{" "}
                <Link href="/legal-info/timeline-calculator" className="text-blue-600 hover:underline">
                  Timeline Calculator
                </Link>{" "}
                to get a personalized estimate based on your situation.
              </p>
            </CardContent>
          </Card>
        </div>

        <StepByStepGuide
          title="Steps in the Divorce Process"
          description="Follow these steps to complete your Illinois divorce. Click on each step to see detailed information."
          steps={divorceSteps}
        />

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Our platform can help you through each step:
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Generate required court documents</li>
                <li>• Track your progress and deadlines</li>
                <li>• Calculate child support and maintenance</li>
                <li>• Organize your financial information</li>
              </ul>
              <Link href="/auth/signup">
                <Button className="w-full mt-4">Get Started</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/legal-info/requirements" className="block text-blue-600 hover:underline text-sm">
                → Residency Requirements
              </Link>
              <Link href="/legal-info/timeline-calculator" className="block text-blue-600 hover:underline text-sm">
                → Timeline Calculator
              </Link>
              <Link href="/legal-info/cost-estimator" className="block text-blue-600 hover:underline text-sm">
                → Cost Estimator
              </Link>
              <Link href="/legal-info/court-resources" className="block text-blue-600 hover:underline text-sm">
                → Court Resources & Forms
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12">
          <Disclaimer />
        </div>
      </div>
    </MainLayout>
  )
}
