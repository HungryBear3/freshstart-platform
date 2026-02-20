"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileDown, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import type { FinancialData } from "@/lib/financial/types"
import {
  calculateTotalMonthlyIncome,
  calculateTotalMonthlyExpenses,
  calculateNetIncome,
  formatCurrency,
} from "@/lib/financial/utils"

interface SummarySectionProps {
  financialData: FinancialData
}

export function SummarySection({ financialData }: SummarySectionProps) {
  const [generating, setGenerating] = useState(false)
  const [generateStatus, setGenerateStatus] = useState<"success" | "error" | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>("")

  const totalIncome = calculateTotalMonthlyIncome(financialData.income)
  const totalExpenses = calculateTotalMonthlyExpenses(financialData.expenses)
  const netIncome = calculateNetIncome(totalIncome, totalExpenses)
  const totalAssets = financialData.assets.reduce((sum, asset) => sum + asset.value, 0)
  const totalDebts = financialData.debts.reduce((sum, debt) => sum + debt.balance, 0)
  const netWorth = totalAssets - totalDebts

  const handleGeneratePDF = async () => {
    setGenerating(true)
    setGenerateStatus(null)
    setErrorMessage("")

    try {
      const response = await fetch("/api/financial/generate-pdf", {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to generate PDF")
      }

      // Get the PDF blob
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `financial-affidavit-${financialData.formType}-${Date.now()}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setGenerateStatus("success")
      setTimeout(() => setGenerateStatus(null), 3000)
    } catch (error) {
      console.error("Error generating PDF:", error)
      setGenerateStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Failed to generate PDF")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Financial Summary</h3>
        <p className="text-sm text-gray-600 mb-6">
          Review your financial information before completing your Financial Affidavit.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Monthly Income:</span>
                <span className="font-semibold">{formatCurrency(totalIncome)}</span>
              </div>
              <div className="text-sm text-gray-500">
                {financialData.income.length} income source{financialData.income.length !== 1 ? "s" : ""}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Monthly Expenses:</span>
                <span className="font-semibold">{formatCurrency(totalExpenses)}</span>
              </div>
              <div className="text-sm text-gray-500">
                {financialData.expenses.length} expense{financialData.expenses.length !== 1 ? "s" : ""}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Asset Value:</span>
                <span className="font-semibold">{formatCurrency(totalAssets)}</span>
              </div>
              <div className="text-sm text-gray-500">
                {financialData.assets.length} asset{financialData.assets.length !== 1 ? "s" : ""}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Debts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Debt Balance:</span>
                <span className="font-semibold">{formatCurrency(totalDebts)}</span>
              </div>
              <div className="text-sm text-gray-500">
                {financialData.debts.length} debt{financialData.debts.length !== 1 ? "s" : ""}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg">Net Calculations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Net Monthly Income</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(netIncome)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Income - Expenses
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Net Worth</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(netWorth)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Assets - Debts
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Form Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">
                {financialData.formType === "long" ? "Long Form" : "Short Form"} Financial Affidavit
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {financialData.formType === "long"
                  ? "Required when combined gross income exceeds $75,000 or court requires it"
                  : "Standard form for most cases"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> This summary is for review purposes. Make sure all information is
          accurate and complete before submitting your Financial Affidavit to the court.
        </p>
      </div>

      {generateStatus && (
        <Alert
          variant={generateStatus === "success" ? "default" : "destructive"}
          className="mt-4"
        >
          {generateStatus === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            {generateStatus === "success"
              ? "PDF generated successfully! Download should start automatically."
              : errorMessage || "Failed to generate PDF. Please try again."}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-center mt-6">
        <Button
          onClick={handleGeneratePDF}
          disabled={generating}
          size="lg"
          className="min-w-[200px]"
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <FileDown className="mr-2 h-4 w-4" />
              Generate PDF
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
