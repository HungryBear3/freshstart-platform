"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Home,
  Car,
  CreditCard,
  PiggyBank,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  FileText,
  Download,
  RefreshCcw,
  Loader2,
} from "lucide-react"

interface IncomeSource {
  type: string
  source: string
  amount: number
  frequency: string
}

interface Expense {
  category: string
  description: string
  amount: number
  frequency: string
}

interface Asset {
  type: string
  description: string
  value: number
  ownership: string
}

interface Debt {
  type: string
  creditor: string
  balance: number
  ownership: string
}

interface FinancialSummary {
  formType: "short" | "long"
  income: IncomeSource[]
  expenses: Expense[]
  assets: Asset[]
  debts: Debt[]
  totals: {
    monthlyIncome: number
    monthlyExpenses: number
    totalAssets: number
    totalDebts: number
    netWorth: number
    monthlyCashFlow: number
  }
  questionnaireStatus: "not_started" | "in_progress" | "completed"
  lastUpdated?: string
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatCurrencyDetailed = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "housing":
      return Home
    case "transportation":
      return Car
    case "healthcare":
    case "insurance":
      return Briefcase
    case "food":
    case "utilities":
    case "personal":
      return DollarSign
    default:
      return DollarSign
  }
}

const getAssetIcon = (type: string) => {
  switch (type) {
    case "real_estate":
      return Home
    case "vehicle":
      return Car
    case "bank_account":
    case "investment":
      return PiggyBank
    case "retirement":
      return TrendingUp
    default:
      return DollarSign
  }
}

const getDebtIcon = (type: string) => {
  switch (type) {
    case "mortgage":
      return Home
    case "auto_loan":
      return Car
    case "credit_card":
      return CreditCard
    default:
      return DollarSign
  }
}

export default function FinancialSummaryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<FinancialSummary | null>(null)

  useEffect(() => {
    fetchFinancialSummary()
  }, [])

  const fetchFinancialSummary = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/financial/summary")
      
      if (!response.ok) {
        if (response.status === 404) {
          // No questionnaire data yet
          setSummary({
            formType: "short",
            income: [],
            expenses: [],
            assets: [],
            debts: [],
            totals: {
              monthlyIncome: 0,
              monthlyExpenses: 0,
              totalAssets: 0,
              totalDebts: 0,
              netWorth: 0,
              monthlyCashFlow: 0,
            },
            questionnaireStatus: "not_started",
          })
          return
        }
        throw new Error("Failed to fetch financial summary")
      }
      
      const data = await response.json()
      setSummary(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading financial summary...</span>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
              <Button onClick={fetchFinancialSummary} className="mt-4" variant="outline">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  const hasData = summary && summary.questionnaireStatus !== "not_started"

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard/financial"
            className="text-sm font-medium text-blue-600 hover:text-blue-500 inline-flex items-center"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Financial Tools
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financial Summary</h1>
            <p className="mt-2 text-gray-600">
              Overview of your financial situation based on your Financial Affidavit
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-2">
            <Button onClick={fetchFinancialSummary} variant="outline" size="sm">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            {hasData && (
              <Link href="/documents">
                <Button size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Affidavit
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Status Banner */}
        {summary?.questionnaireStatus === "not_started" && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900">Complete Your Financial Affidavit</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      To see your financial summary, please complete the Financial Affidavit questionnaire first.
                    </p>
                  </div>
                </div>
                <Link href="/questionnaires/financial_affidavit">
                  <Button>Start Questionnaire</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {summary?.questionnaireStatus === "in_progress" && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-900">Questionnaire In Progress</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Your financial data below may be incomplete. Continue the questionnaire for accurate totals.
                    </p>
                  </div>
                </div>
                <Link href="/questionnaires/financial_affidavit">
                  <Button variant="outline">Continue Questionnaire</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {summary?.questionnaireStatus === "completed" && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-900">Financial Affidavit Complete</h3>
                  <p className="text-sm text-green-700">
                    Last updated: {summary.lastUpdated ? new Date(summary.lastUpdated).toLocaleDateString() : "Unknown"}
                    {" • "}Form type: {summary.formType === "short" ? "Short Form (under $75k)" : "Long Form"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Monthly Income</CardDescription>
              <CardTitle className="text-2xl text-green-600">
                {formatCurrency(summary?.totals.monthlyIncome || 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-gray-500">
                <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                {summary?.income.length || 0} income source(s)
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Monthly Expenses</CardDescription>
              <CardTitle className="text-2xl text-red-600">
                {formatCurrency(summary?.totals.monthlyExpenses || 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-gray-500">
                <TrendingDown className="h-4 w-4 mr-1 text-red-500" />
                {summary?.expenses.length || 0} expense categories
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Assets</CardDescription>
              <CardTitle className="text-2xl text-blue-600">
                {formatCurrency(summary?.totals.totalAssets || 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-gray-500">
                <PiggyBank className="h-4 w-4 mr-1 text-blue-500" />
                {summary?.assets.length || 0} asset(s)
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Debts</CardDescription>
              <CardTitle className="text-2xl text-orange-600">
                {formatCurrency(summary?.totals.totalDebts || 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-gray-500">
                <CreditCard className="h-4 w-4 mr-1 text-orange-500" />
                {summary?.debts.length || 0} debt(s)
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Net Worth and Cash Flow */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className={summary?.totals.netWorth && summary.totals.netWorth >= 0 ? "border-green-200" : "border-red-200"}>
            <CardHeader>
              <CardDescription>Net Worth (Assets - Debts)</CardDescription>
              <CardTitle className={`text-3xl ${summary?.totals.netWorth && summary.totals.netWorth >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(summary?.totals.netWorth || 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summary?.totals.totalAssets && summary.totals.totalDebts ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Assets</span>
                    <span className="text-green-600">{formatCurrency(summary.totals.totalAssets)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Debts</span>
                    <span className="text-red-600">-{formatCurrency(summary.totals.totalDebts)}</span>
                  </div>
                  <Progress 
                    value={summary.totals.totalAssets > 0 
                      ? Math.min(100, (summary.totals.totalAssets / (summary.totals.totalAssets + summary.totals.totalDebts)) * 100)
                      : 0
                    } 
                    className="h-2"
                  />
                </div>
              ) : (
                <p className="text-sm text-gray-500">Complete questionnaire for details</p>
              )}
            </CardContent>
          </Card>

          <Card className={summary?.totals.monthlyCashFlow && summary.totals.monthlyCashFlow >= 0 ? "border-green-200" : "border-red-200"}>
            <CardHeader>
              <CardDescription>Monthly Cash Flow (Income - Expenses)</CardDescription>
              <CardTitle className={`text-3xl ${summary?.totals.monthlyCashFlow && summary.totals.monthlyCashFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(summary?.totals.monthlyCashFlow || 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summary?.totals.monthlyIncome || summary?.totals.monthlyExpenses ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Income</span>
                    <span className="text-green-600">{formatCurrency(summary?.totals.monthlyIncome || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Expenses</span>
                    <span className="text-red-600">-{formatCurrency(summary?.totals.monthlyExpenses || 0)}</span>
                  </div>
                  <Progress 
                    value={summary?.totals.monthlyIncome && summary.totals.monthlyIncome > 0
                      ? Math.min(100, ((summary.totals.monthlyIncome - (summary.totals.monthlyExpenses || 0)) / summary.totals.monthlyIncome) * 100)
                      : 0
                    } 
                    className="h-2"
                  />
                </div>
              ) : (
                <p className="text-sm text-gray-500">Complete questionnaire for details</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Sections */}
        {hasData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Income Sources
                </CardTitle>
                <CardDescription>Monthly income breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                {summary?.income && summary.income.length > 0 ? (
                  <div className="space-y-3">
                    {summary.income.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium">{item.source}</p>
                          <p className="text-sm text-gray-500 capitalize">{item.type.replace("_", " ")}</p>
                        </div>
                        <span className="text-green-600 font-semibold">
                          {formatCurrencyDetailed(item.amount)}/mo
                        </span>
                      </div>
                    ))}
                    <div className="pt-3 border-t">
                      <div className="flex justify-between font-bold">
                        <span>Total Monthly Income</span>
                        <span className="text-green-600">{formatCurrency(summary.totals.monthlyIncome)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No income sources recorded</p>
                )}
              </CardContent>
            </Card>

            {/* Expense Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  Monthly Expenses
                </CardTitle>
                <CardDescription>Expense breakdown by category</CardDescription>
              </CardHeader>
              <CardContent>
                {summary?.expenses && summary.expenses.length > 0 ? (
                  <div className="space-y-3">
                    {summary.expenses.map((item, index) => {
                      const Icon = getCategoryIcon(item.category)
                      return (
                        <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="font-medium">{item.description}</p>
                              <p className="text-sm text-gray-500 capitalize">{item.category}</p>
                            </div>
                          </div>
                          <span className="text-red-600 font-semibold">
                            {formatCurrencyDetailed(item.amount)}/mo
                          </span>
                        </div>
                      )
                    })}
                    <div className="pt-3 border-t">
                      <div className="flex justify-between font-bold">
                        <span>Total Monthly Expenses</span>
                        <span className="text-red-600">{formatCurrency(summary.totals.monthlyExpenses)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No expenses recorded</p>
                )}
              </CardContent>
            </Card>

            {/* Assets Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PiggyBank className="h-5 w-5 text-blue-600" />
                  Assets
                </CardTitle>
                <CardDescription>Property, accounts, and investments</CardDescription>
              </CardHeader>
              <CardContent>
                {summary?.assets && summary.assets.length > 0 ? (
                  <div className="space-y-3">
                    {summary.assets.map((item, index) => {
                      const Icon = getAssetIcon(item.type)
                      return (
                        <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="font-medium">{item.description}</p>
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-gray-500 capitalize">{item.type.replace("_", " ")}</p>
                                <Badge variant="outline" className="text-xs">
                                  {item.ownership}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <span className="text-blue-600 font-semibold">
                            {formatCurrency(item.value)}
                          </span>
                        </div>
                      )
                    })}
                    <div className="pt-3 border-t">
                      <div className="flex justify-between font-bold">
                        <span>Total Assets</span>
                        <span className="text-blue-600">{formatCurrency(summary.totals.totalAssets)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No assets recorded</p>
                )}
              </CardContent>
            </Card>

            {/* Debts Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-orange-600" />
                  Debts & Liabilities
                </CardTitle>
                <CardDescription>Outstanding balances</CardDescription>
              </CardHeader>
              <CardContent>
                {summary?.debts && summary.debts.length > 0 ? (
                  <div className="space-y-3">
                    {summary.debts.map((item, index) => {
                      const Icon = getDebtIcon(item.type)
                      return (
                        <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="font-medium">{item.creditor}</p>
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-gray-500 capitalize">{item.type.replace("_", " ")}</p>
                                <Badge variant="outline" className="text-xs">
                                  {item.ownership}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <span className="text-orange-600 font-semibold">
                            {formatCurrency(item.balance)}
                          </span>
                        </div>
                      )
                    })}
                    <div className="pt-3 border-t">
                      <div className="flex justify-between font-bold">
                        <span>Total Debts</span>
                        <span className="text-orange-600">{formatCurrency(summary.totals.totalDebts)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No debts recorded</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Actions */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/questionnaires/financial_affidavit">
                <Button variant="outline">
                  {summary?.questionnaireStatus === "not_started" ? "Start" : "Edit"} Financial Affidavit
                </Button>
              </Link>
              <Link href="/dashboard/financial/child-support">
                <Button variant="outline">Calculate Child Support</Button>
              </Link>
              <Link href="/dashboard/financial/spousal-maintenance">
                <Button variant="outline">Calculate Spousal Maintenance</Button>
              </Link>
              <Link href="/dashboard/financial/comparison">
                <Button variant="outline">Compare with Spouse</Button>
              </Link>
              {hasData && (
                <Link href="/documents">
                  <Button>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Documents
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <p className="text-xs text-gray-500 text-center mt-6">
          <strong>Disclaimer:</strong> This summary is based on information you provided in your Financial Affidavit questionnaire. 
          Verify all figures for accuracy before submitting to the court. This is not legal or financial advice.
        </p>
      </div>
    </DashboardLayout>
  )
}
