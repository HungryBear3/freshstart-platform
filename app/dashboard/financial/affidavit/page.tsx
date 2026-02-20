"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, Save } from "lucide-react"
import Link from "next/link"
import { IncomeSection } from "@/components/financial/income-section"
import { ExpenseSection } from "@/components/financial/expense-section"
import { AssetSection } from "@/components/financial/asset-section"
import { DebtSection } from "@/components/financial/debt-section"
import { SummarySection } from "@/components/financial/summary-section"
import type { FinancialData } from "@/lib/financial/types"

type Step = "income" | "expenses" | "assets" | "debts" | "summary"

const STEPS: { id: Step; label: string }[] = [
  { id: "income", label: "Income" },
  { id: "expenses", label: "Expenses" },
  { id: "assets", label: "Assets" },
  { id: "debts", label: "Debts" },
  { id: "summary", label: "Summary" },
]

export default function FinancialAffidavitPage() {
  const [currentStep, setCurrentStep] = useState<Step>("income")
  const [financialData, setFinancialData] = useState<FinancialData>({
    userId: "",
    formType: "short",
    income: [],
    expenses: [],
    assets: [],
    debts: [],
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"success" | "error" | null>(null)

  // Load existing financial data
  useEffect(() => {
    loadFinancialData()
  }, [])

  const loadFinancialData = async () => {
    try {
      const response = await fetch("/api/financial")
      if (response.ok) {
        const data = await response.json()
        setFinancialData({
          userId: data.userId || "",
          formType: data.formType || "short",
          income: data.income || [],
          expenses: data.expenses || [],
          assets: data.assets || [],
          debts: data.debts || [],
        })
      }
    } catch (error) {
      console.error("Error loading financial data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveStatus(null)

    try {
      const response = await fetch("/api/financial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(financialData),
      })

      if (!response.ok) {
        throw new Error("Failed to save")
      }

      const saved = await response.json()
      setFinancialData(saved)
      setSaveStatus("success")
      setTimeout(() => setSaveStatus(null), 3000)
    } catch (error) {
      setSaveStatus("error")
    } finally {
      setSaving(false)
    }
  }

  const updateFinancialData = (updates: Partial<FinancialData>) => {
    setFinancialData((prev) => ({ ...prev, ...updates }))
  }

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep)
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p>Loading...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/dashboard/financial" className="text-blue-600 hover:underline text-sm">
            ← Back to Financial Tools
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Financial Affidavit</h1>
          <p className="mt-2 text-gray-600">
            Complete your Financial Affidavit by providing your financial information
          </p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Step {currentStepIndex + 1} of {STEPS.length}: {STEPS[currentStepIndex].label}
              </span>
              <span className="text-sm text-gray-600">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Save Status */}
        {saveStatus && (
          <Alert
            variant={saveStatus === "success" ? "default" : "destructive"}
            className="mb-6"
          >
            {saveStatus === "success" ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>Financial data saved successfully</AlertDescription>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Failed to save financial data</AlertDescription>
              </>
            )}
          </Alert>
        )}

        {/* Step Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {STEPS.map((step, index) => (
            <Button
              key={step.id}
              variant={currentStep === step.id ? "default" : "outline"}
              onClick={() => setCurrentStep(step.id)}
              className="min-w-[120px]"
            >
              {step.label}
            </Button>
          ))}
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStepIndex].label}</CardTitle>
            <CardDescription>
              {currentStep === "income" && "Enter all sources of income"}
              {currentStep === "expenses" && "Enter your monthly expenses"}
              {currentStep === "assets" && "List all assets and their values"}
              {currentStep === "debts" && "List all debts and liabilities"}
              {currentStep === "summary" && "Review your financial information"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === "income" && (
              <IncomeSection
                income={financialData.income}
                onChange={(income) => updateFinancialData({ income })}
              />
            )}
            {currentStep === "expenses" && (
              <ExpenseSection
                expenses={financialData.expenses}
                onChange={(expenses) => updateFinancialData({ expenses })}
              />
            )}
            {currentStep === "assets" && (
              <AssetSection
                assets={financialData.assets}
                onChange={(assets) => updateFinancialData({ assets })}
              />
            )}
            {currentStep === "debts" && (
              <DebtSection
                debts={financialData.debts}
                onChange={(debts) => updateFinancialData({ debts })}
              />
            )}
            {currentStep === "summary" && (
              <SummarySection financialData={financialData} />
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => {
              const prevIndex = Math.max(0, currentStepIndex - 1)
              setCurrentStep(STEPS[prevIndex].id)
            }}
            disabled={currentStepIndex === 0}
          >
            Previous
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Progress"}
            </Button>

            {currentStepIndex < STEPS.length - 1 ? (
              <Button
                onClick={() => {
                  const nextIndex = Math.min(STEPS.length - 1, currentStepIndex + 1)
                  setCurrentStep(STEPS[nextIndex].id)
                }}
              >
                Next
              </Button>
            ) : (
              <Button onClick={handleSave}>
                Complete & Save
              </Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
