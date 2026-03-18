import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/session"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Calculator, DollarSign, TrendingUp, FileText, PieChart } from "lucide-react"

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
            Manage your financial information and calculate support obligations
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <Calculator className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Child Support Calculator</CardTitle>
              <CardDescription>
                Calculate Illinois child support obligations based on income and parenting time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/financial/child-support">
                <Button variant="outline" className="w-full">
                  Calculate Child Support
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <DollarSign className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Spousal Maintenance</CardTitle>
              <CardDescription>
                Calculate spousal maintenance (alimony) based on Illinois guidelines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/financial/spousal-maintenance">
                <Button variant="outline" className="w-full">
                  Calculate Maintenance
                </Button>
              </Link>
            </CardContent>
          </Card>

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
              <h3 className="font-semibold mb-2">Child Support Calculator</h3>
              <p className="text-sm text-gray-600">
                Based on Illinois Child Support Guidelines (750 ILCS 5/505), this calculator
                determines child support obligations based on combined net income, number of
                children, and parenting time arrangements.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Spousal Maintenance Calculator</h3>
              <p className="text-sm text-gray-600">
                Based on Illinois Spousal Maintenance Guidelines (750 ILCS 5/504), this calculator
                estimates spousal maintenance (alimony) amounts and duration based on income and
                length of marriage.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Financial Affidavit</h3>
              <p className="text-sm text-gray-600">
                Complete your Financial Affidavit (short or long form) by entering your income,
                expenses, assets, and debts. This information is required for divorce proceedings
                and will be used in support calculations.
              </p>
            </div>
            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500">
                <strong>Disclaimer:</strong> These calculators provide estimates based on Illinois
                statutory guidelines. Actual court orders may vary based on specific circumstances
                and judicial discretion. Consult with an attorney for legal advice.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
