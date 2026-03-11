"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"
import type { Expense, ExpenseCategory, Frequency } from "@/lib/financial/types"
import { formatCurrency, toMonthly } from "@/lib/financial/utils"

const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "housing", label: "Housing (Rent/Mortgage)" },
  { value: "utilities", label: "Utilities" },
  { value: "food", label: "Food/Groceries" },
  { value: "transportation", label: "Transportation" },
  { value: "healthcare", label: "Healthcare" },
  { value: "childcare", label: "Childcare" },
  { value: "education", label: "Education" },
  { value: "personal", label: "Personal Expenses" },
  { value: "insurance", label: "Insurance" },
  { value: "taxes", label: "Taxes" },
  { value: "other", label: "Other" },
]

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "one_time", label: "One-time" },
]

interface ExpenseSectionProps {
  expenses: Expense[]
  onChange: (expenses: Expense[]) => void
}

export function ExpenseSection({ expenses, onChange }: ExpenseSectionProps) {
  const addExpense = () => {
    onChange([
      ...expenses,
      {
        category: "housing",
        description: "",
        amount: 0,
        frequency: "monthly",
      },
    ])
  }

  const updateExpense = (index: number, updates: Partial<Expense>) => {
    const updated = [...expenses]
    updated[index] = { ...updated[index], ...updates }
    onChange(updated)
  }

  const removeExpense = (index: number) => {
    onChange(expenses.filter((_, i) => i !== index))
  }

  const calculateTotalMonthly = () => {
    return expenses.reduce((total, exp) => total + toMonthly(exp.amount, exp.frequency), 0)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Monthly Expenses</h3>
        <Button onClick={addExpense} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {expenses.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">
          No expenses added. Click "Add Expense" to get started.
        </p>
      ) : (
        <div className="space-y-4">
          {expenses.map((expense, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={expense.category}
                      onChange={(e) =>
                        updateExpense(index, { category: e.target.value as ExpenseCategory })
                      }
                    >
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Input
                      value={expense.description}
                      onChange={(e) =>
                        updateExpense(index, { description: e.target.value })
                      }
                      placeholder="e.g., Rent payment, Groceries"
                    />
                  </div>

                  <div>
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={expense.amount || ""}
                      onChange={(e) =>
                        updateExpense(index, { amount: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <Label>Frequency</Label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={expense.frequency}
                      onChange={(e) =>
                        updateExpense(index, { frequency: e.target.value as Frequency })
                      }
                    >
                      {FREQUENCIES.map((freq) => (
                        <option key={freq.value} value={freq.value}>
                          {freq.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExpense(index)}
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

      {expenses.length > 0 && (
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Monthly Expenses:</span>
              <span className="text-xl font-bold text-blue-600">
                {formatCurrency(calculateTotalMonthly())}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
