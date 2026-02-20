"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatCurrency } from "@/lib/financial/utils"
import { Calculator, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function ChildSupportCalculatorPage() {
  const [inputs, setInputs] = useState({
    parent1NetIncome: "",
    parent2NetIncome: "",
    numberOfChildren: "1",
    parentingTimeParent1: "50",
    parentingTimeParent2: "50",
    healthInsuranceCost: "",
    childcareCost: "",
    educationalExpenses: "",
    extraordinaryMedicalExpenses: "",
  })

  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setInputs((prev) => ({ ...prev, [field]: value }))
    setError(null)
    setResult(null)
  }

  const handleCalculate = async () => {
    setError(null)
    setLoading(true)

    try {
      const payload = {
        parent1NetIncome: parseFloat(inputs.parent1NetIncome) || 0,
        parent2NetIncome: parseFloat(inputs.parent2NetIncome) || 0,
        numberOfChildren: parseInt(inputs.numberOfChildren) || 1,
        parentingTimeParent1: parseFloat(inputs.parentingTimeParent1) || 0,
        parentingTimeParent2: parseFloat(inputs.parentingTimeParent2) || 0,
        healthInsuranceCost: parseFloat(inputs.healthInsuranceCost) || 0,
        childcareCost: parseFloat(inputs.childcareCost) || 0,
        educationalExpenses: parseFloat(inputs.educationalExpenses) || 0,
        extraordinaryMedicalExpenses: parseFloat(inputs.extraordinaryMedicalExpenses) || 0,
      }

      const response = await fetch("/api/financial/child-support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to calculate child support")
        return
      }

      setResult(data)
    } catch (err) {
      setError("An error occurred while calculating child support")
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
          <h1 className="text-3xl font-bold text-gray-900">Child Support Calculator</h1>
          <p className="mt-2 text-gray-600">
            Calculate Illinois child support obligations based on statutory guidelines
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Input Information</CardTitle>
              <CardDescription>
                Enter financial and parenting time information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="parent1NetIncome">Parent 1 Net Monthly Income</Label>
                <Input
                  id="parent1NetIncome"
                  type="number"
                  value={inputs.parent1NetIncome}
                  onChange={(e) => handleInputChange("parent1NetIncome", e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div>
                <Label htmlFor="parent2NetIncome">Parent 2 Net Monthly Income</Label>
                <Input
                  id="parent2NetIncome"
                  type="number"
                  value={inputs.parent2NetIncome}
                  onChange={(e) => handleInputChange("parent2NetIncome", e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div>
                <Label htmlFor="numberOfChildren">Number of Children</Label>
                <Input
                  id="numberOfChildren"
                  type="number"
                  value={inputs.numberOfChildren}
                  onChange={(e) => handleInputChange("numberOfChildren", e.target.value)}
                  min="1"
                />
              </div>

              <div>
                <Label htmlFor="parentingTimeParent1">Parent 1 Parenting Time (%)</Label>
                <Input
                  id="parentingTimeParent1"
                  type="number"
                  value={inputs.parentingTimeParent1}
                  onChange={(e) => handleInputChange("parentingTimeParent1", e.target.value)}
                  min="0"
                  max="100"
                />
              </div>

              <div>
                <Label htmlFor="parentingTimeParent2">Parent 2 Parenting Time (%)</Label>
                <Input
                  id="parentingTimeParent2"
                  type="number"
                  value={inputs.parentingTimeParent2}
                  onChange={(e) => handleInputChange("parentingTimeParent2", e.target.value)}
                  min="0"
                  max="100"
                />
              </div>

              <div>
                <Label htmlFor="healthInsuranceCost">Monthly Health Insurance Cost (Optional)</Label>
                <Input
                  id="healthInsuranceCost"
                  type="number"
                  value={inputs.healthInsuranceCost}
                  onChange={(e) => handleInputChange("healthInsuranceCost", e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div>
                <Label htmlFor="childcareCost">Monthly Childcare Cost (Optional)</Label>
                <Input
                  id="childcareCost"
                  type="number"
                  value={inputs.childcareCost}
                  onChange={(e) => handleInputChange("childcareCost", e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div>
                <Label htmlFor="educationalExpenses">Monthly Educational Expenses (Optional)</Label>
                <Input
                  id="educationalExpenses"
                  type="number"
                  value={inputs.educationalExpenses}
                  onChange={(e) => handleInputChange("educationalExpenses", e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div>
                <Label htmlFor="extraordinaryMedicalExpenses">Monthly Extraordinary Medical Expenses (Optional)</Label>
                <Input
                  id="extraordinaryMedicalExpenses"
                  type="number"
                  value={inputs.extraordinaryMedicalExpenses}
                  onChange={(e) => handleInputChange("extraordinaryMedicalExpenses", e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <Button
                onClick={handleCalculate}
                disabled={loading}
                className="w-full"
              >
                <Calculator className="mr-2 h-4 w-4" />
                {loading ? "Calculating..." : "Calculate Child Support"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Calculation Results</CardTitle>
              <CardDescription>Child support obligation breakdown</CardDescription>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Combined Net Income</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(result.combinedNetIncome)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Basic Obligation</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(result.basicObligation)}
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm font-semibold mb-2">Adjustments</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shared Parenting:</span>
                        <span>{formatCurrency(result.sharedParentingAdjustment)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Health Insurance:</span>
                        <span>{formatCurrency(result.healthInsuranceAdjustment)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Childcare:</span>
                        <span>{formatCurrency(result.childcareAdjustment)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Educational Expenses:</span>
                        <span>{formatCurrency(result.educationalExpensesAdjustment)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Medical Expenses:</span>
                        <span>{formatCurrency(result.medicalExpensesAdjustment)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm font-semibold mb-2">Total Monthly Obligation</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(result.totalObligation)}
                    </p>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm font-semibold mb-2">Support Amount</p>
                    {result.parent1Owed > 0 && (
                      <p className="text-lg">
                        Parent 1 owes: <strong>{formatCurrency(result.parent1Owed)}/month</strong>
                      </p>
                    )}
                    {result.parent2Owed > 0 && (
                      <p className="text-lg">
                        Parent 2 owes: <strong>{formatCurrency(result.parent2Owed)}/month</strong>
                      </p>
                    )}
                    {result.parent1Owed === 0 && result.parent2Owed === 0 && (
                      <p className="text-sm text-gray-600">No support obligation calculated</p>
                    )}
                  </div>
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
              This calculator is based on Illinois Child Support Guidelines (750 ILCS 5/505).
              The calculation considers:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Combined net income of both parents</li>
              <li>Number of children</li>
              <li>Parenting time arrangements</li>
              <li>Additional expenses (health insurance, childcare, etc.)</li>
            </ul>
            <p className="text-xs text-gray-500 mt-4">
              <strong>Disclaimer:</strong> This is an estimate based on statutory guidelines.
              Actual court orders may vary. Consult with an attorney for legal advice.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
