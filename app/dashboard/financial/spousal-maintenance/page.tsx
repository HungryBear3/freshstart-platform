"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatCurrency } from "@/lib/financial/utils"
import { Calculator, AlertCircle, Info } from "lucide-react"
import Link from "next/link"

export default function SpousalMaintenanceCalculatorPage() {
  const [inputs, setInputs] = useState({
    payerGrossIncome: "",
    payeeGrossIncome: "",
    durationOfMarriage: "",
    combinedGrossIncome: "",
  })

  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setInputs((prev) => {
      const updated = { ...prev, [field]: value }
      
      // Auto-calculate combined income if both incomes are provided
      if (field === "payerGrossIncome" || field === "payeeGrossIncome") {
        const payer = field === "payerGrossIncome" ? parseFloat(value) : parseFloat(prev.payerGrossIncome)
        const payee = field === "payeeGrossIncome" ? parseFloat(value) : parseFloat(prev.payeeGrossIncome)
        if (!isNaN(payer) && !isNaN(payee)) {
          updated.combinedGrossIncome = (payer + payee).toString()
        }
      }
      
      return updated
    })
    setError(null)
    setResult(null)
  }

  const handleCalculate = async () => {
    setError(null)
    setLoading(true)

    try {
      const payerGross = parseFloat(inputs.payerGrossIncome) || 0
      const payeeGross = parseFloat(inputs.payeeGrossIncome) || 0
      const combined = parseFloat(inputs.combinedGrossIncome) || payerGross + payeeGross
      const duration = parseFloat(inputs.durationOfMarriage) || 0

      const payload = {
        payerGrossIncome: payerGross,
        payeeGrossIncome: payeeGross,
        durationOfMarriage: duration,
        combinedGrossIncome: combined,
      }

      const response = await fetch("/api/financial/spousal-maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to calculate spousal maintenance")
        return
      }

      setResult(data)
    } catch (err) {
      setError("An error occurred while calculating spousal maintenance")
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/dashboard/financial" className="text-blue-600 hover:underline text-sm">
            ← Back to Financial Tools
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Spousal Maintenance Calculator</h1>
          <p className="mt-2 text-gray-600">
            Calculate Illinois spousal maintenance (alimony) based on statutory guidelines
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Input Information</CardTitle>
              <CardDescription>
                Enter income and marriage duration information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="payerGrossIncome">Payer Annual Gross Income</Label>
                <Input
                  id="payerGrossIncome"
                  type="number"
                  value={inputs.payerGrossIncome}
                  onChange={(e) => handleInputChange("payerGrossIncome", e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The person who would pay maintenance
                </p>
              </div>

              <div>
                <Label htmlFor="payeeGrossIncome">Payee Annual Gross Income</Label>
                <Input
                  id="payeeGrossIncome"
                  type="number"
                  value={inputs.payeeGrossIncome}
                  onChange={(e) => handleInputChange("payeeGrossIncome", e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The person who would receive maintenance
                </p>
              </div>

              <div>
                <Label htmlFor="combinedGrossIncome">Combined Annual Gross Income</Label>
                <Input
                  id="combinedGrossIncome"
                  type="number"
                  value={inputs.combinedGrossIncome}
                  onChange={(e) => handleInputChange("combinedGrossIncome", e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Auto-calculated from payer + payee income
                </p>
              </div>

              <div>
                <Label htmlFor="durationOfMarriage">Duration of Marriage (Years)</Label>
                <Input
                  id="durationOfMarriage"
                  type="number"
                  value={inputs.durationOfMarriage}
                  onChange={(e) => handleInputChange("durationOfMarriage", e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.1"
                />
              </div>

              <Button
                onClick={handleCalculate}
                disabled={loading}
                className="w-full"
              >
                <Calculator className="mr-2 h-4 w-4" />
                {loading ? "Calculating..." : "Calculate Maintenance"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Calculation Results</CardTitle>
              <CardDescription>Spousal maintenance estimate</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {result ? (
                <div className="space-y-4">
                  {result.guidelineAmount > 0 ? (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">Monthly Maintenance Amount</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(result.guidelineAmount)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Guideline Duration</p>
                        <p className="text-lg font-semibold">
                          {result.guidelineDuration} months ({Math.round(result.guidelineDuration / 12 * 10) / 10} years)
                        </p>
                      </div>
                    </>
                  ) : (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Guideline calculation results in $0 maintenance. Court may still award
                        maintenance based on statutory factors.
                      </AlertDescription>
                    </Alert>
                  )}

                  {result.notes && result.notes.length > 0 && (
                    <div className="border-t pt-4">
                      <p className="text-sm font-semibold mb-2">Important Notes</p>
                      <ul className="space-y-2">
                        {result.notes.map((note: string, index: number) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <span className="mr-2">•</span>
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  Enter information and click "Calculate" to see results
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>About This Calculator</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              This calculator is based on Illinois Spousal Maintenance Guidelines (750 ILCS 5/504).
              The calculation considers:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside mb-4">
              <li>Gross income of both parties</li>
              <li>Length of marriage</li>
              <li>Combined gross income (guidelines apply when combined income ≤ $500,000)</li>
            </ul>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-semibold text-blue-900 mb-2">Formula:</p>
              <p className="text-sm text-blue-800">
                Monthly Maintenance = (33.33% of Payer's Gross Income) - (25% of Payee's Gross Income)
              </p>
              <p className="text-sm text-blue-800 mt-2">
                Capped at: 40% of Combined Gross Income - Payee's Gross Income
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              <strong>Disclaimer:</strong> These are guidelines only. Court may deviate based on
              statutory factors including standard of living, age/health, earning capacity,
              contributions to marriage, property division, and other relevant factors. Consult
              with an attorney for legal advice.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
