"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"
import type { Debt, DebtType, Ownership } from "@/lib/financial/types"
import { formatCurrency } from "@/lib/financial/utils"

const DEBT_TYPES: { value: DebtType; label: string }[] = [
  { value: "mortgage", label: "Mortgage" },
  { value: "auto_loan", label: "Auto Loan" },
  { value: "credit_card", label: "Credit Card" },
  { value: "student_loan", label: "Student Loan" },
  { value: "personal_loan", label: "Personal Loan" },
  { value: "medical", label: "Medical Debt" },
  { value: "tax_debt", label: "Tax Debt" },
  { value: "other", label: "Other" },
]

const OWNERSHIP_TYPES: { value: Ownership; label: string }[] = [
  { value: "individual", label: "Individual" },
  { value: "joint", label: "Joint" },
  { value: "spouse", label: "Spouse's" },
]

interface DebtSectionProps {
  debts: Debt[]
  onChange: (debts: Debt[]) => void
}

export function DebtSection({ debts, onChange }: DebtSectionProps) {
  const addDebt = () => {
    onChange([
      ...debts,
      {
        type: "credit_card",
        creditor: "",
        balance: 0,
        ownership: "individual",
      },
    ])
  }

  const updateDebt = (index: number, updates: Partial<Debt>) => {
    const updated = [...debts]
    updated[index] = { ...updated[index], ...updates }
    onChange(updated)
  }

  const removeDebt = (index: number) => {
    onChange(debts.filter((_, i) => i !== index))
  }

  const calculateTotalBalance = () => {
    return debts.reduce((total, debt) => total + debt.balance, 0)
  }

  const calculateTotalMonthlyPayments = () => {
    return debts.reduce((total, debt) => total + (debt.monthlyPayment || 0), 0)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Debts and Liabilities</h3>
        <Button onClick={addDebt} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Debt
        </Button>
      </div>

      {debts.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">
          No debts added. Click "Add Debt" to get started.
        </p>
      ) : (
        <div className="space-y-4">
          {debts.map((debt, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Debt Type</Label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={debt.type}
                      onChange={(e) =>
                        updateDebt(index, { type: e.target.value as DebtType })
                      }
                    >
                      {DEBT_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Creditor Name</Label>
                    <Input
                      value={debt.creditor}
                      onChange={(e) =>
                        updateDebt(index, { creditor: e.target.value })
                      }
                      placeholder="e.g., Bank of America, Chase"
                    />
                  </div>

                  <div>
                    <Label>Description (Optional)</Label>
                    <Input
                      value={debt.description || ""}
                      onChange={(e) =>
                        updateDebt(index, { description: e.target.value })
                      }
                      placeholder="Additional details"
                    />
                  </div>

                  <div>
                    <Label>Current Balance</Label>
                    <Input
                      type="number"
                      value={debt.balance || ""}
                      onChange={(e) =>
                        updateDebt(index, { balance: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <Label>Monthly Payment (Optional)</Label>
                    <Input
                      type="number"
                      value={debt.monthlyPayment || ""}
                      onChange={(e) =>
                        updateDebt(index, { monthlyPayment: parseFloat(e.target.value) || undefined })
                      }
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <Label>Ownership</Label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={debt.ownership}
                      onChange={(e) =>
                        updateDebt(index, { ownership: e.target.value as Ownership })
                      }
                    >
                      {OWNERSHIP_TYPES.map((own) => (
                        <option key={own.value} value={own.value}>
                          {own.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDebt(index)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {debts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Debt Balance:</span>
                <span className="text-xl font-bold text-blue-600">
                  {formatCurrency(calculateTotalBalance())}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Monthly Payments:</span>
                <span className="text-xl font-bold text-blue-600">
                  {formatCurrency(calculateTotalMonthlyPayments())}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
