import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/session"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { TrendingUp, FileText, PieChart } from "lucide-react"

export default async function FinancialToolsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/signin")
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Financial Tools</h1>
          <p className="mt-2 text-gray-600">
            Manage the financial information used in supported document-preparation workflows
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Financial Affidavit</CardTitle>
              <CardDescription>
                Complete your Financial Affidavit with income, expenses, assets, and debts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/financial/affidavit">
                <Button variant="outline" className="w-full">
                  Complete Affidavit
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <PieChart className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Financial Summary</CardTitle>
              <CardDescription>
                View a summary of your financial data including income, expenses, assets, and debts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/financial/summary">
                <Button variant="outline" className="w-full">
                  View Summary
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <FileText className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Spouse Comparison</CardTitle>
              <CardDescription>
                Compare your financial affidavit with your spouse&apos;s to identify discrepancies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/financial/comparison">
                <Button variant="outline" className="w-full">
                  Compare with Spouse
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <FileText className="h-8 w-8 text-blue-600 mb-2" />
            <CardTitle>About Financial Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <div>
              <h3 className="font-semibold mb-2">Financial Affidavit</h3>
              <p className="text-sm text-gray-600">
                Enter income, expense, asset, and debt information if a Financial Affidavit is
                required in your case. Confirm the current form and disclosure requirements with
                the court or your circuit clerk before relying on this tool.
              </p>
            </div>
            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500">
                <strong>Disclaimer:</strong> Fresh Start IL does not calculate child support or
                spousal maintenance. Verify current official requirements and consult a qualified
                attorney for case-specific legal advice.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
