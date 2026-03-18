"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"
import type { IncomeSource, IncomeSourceType, Frequency } from "@/lib/financial/types"
import { formatCurrency } from "@/lib/financial/utils"

const INCOME_TYPES: { value: IncomeSourceType; label: string }[] = [
  { value: "wages", label: "Wages/Salary" },
  { value: "self_employment", label: "Self-Employment" },
  { value: "unemployment", label: "Unemployment Benefits" },
  { value: "social_security", label: "Social Security" },
  { value: "pension", label: "Pension/Retirement" },
  { value: "investment", label: "Investment Income" },
  { value: "rental", label: "Rental Income" },
  { value: "other", label: "Other" },
]

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
]

interface IncomeSectionProps {
  income: IncomeSource[]
  onChange: (income: IncomeSource[]) => void
}

export function IncomeSection({ income, onChange }: IncomeSectionProps) {
  const addIncomeSource = () => {
    onChange([
      ...income,
      {
        type: "wages",
        source: "",
        amount: 0,
        frequency: "monthly",
        isCurrent: true,
      },
    ])
  }

  const updateIncomeSource = (index: number, updates: Partial<IncomeSource>) => {
    const updated = [...income]
    updated[index] = { ...updated[index], ...updates }
    onChange(updated)
  }

  const removeIncomeSource = (index: number) => {
    onChange(income.filter((_, i) => i !== index))
  }

  const calculateTotalMonthly = () => {
    return income
      .filter((inc) => inc.isCurrent)
      .reduce((total, inc) => {
        const monthly = inc.frequency === "weekly" ? inc.amount * 52 / 12 :
                       inc.frequency === "biweekly" ? inc.amount * 26 / 12 :
                       inc.frequency === "monthly" ? inc.amount :
                       inc.frequency === "yearly" ? inc.amount / 12 : 0
        return total + monthly
      }, 0)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Income Sources</h3>
        <Button onClick={addIncomeSource} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Income Source
        </Button>
      </div>

      {income.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">
          No income sources added. Click "Add Income Source" to get started.
        </p>
      ) : (
        <div className="space-y-4">
          {income.map((source, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Income Type</Label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={source.type}
                      onChange={(e) =>
                        updateIncomeSource(index, { type: e.target.value as IncomeSourceType })
                      }
                    >
                      {INCOME_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Source Description</Label>
                    <Input
                      value={source.source}
                      onChange={(e) =>
                        updateIncomeSource(index, { source: e.target.value })
                      }
                      placeholder="e.g., ABC Company, Freelance Design"
                    />
                  </div>

                  <div>
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={source.amount || ""}
                      onChange={(e) =>
                        updateIncomeSource(index, { amount: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <Label>Frequency</Label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={source.frequency}
                      onChange={(e) =>
                        updateIncomeSource(index, { frequency: e.target.value as Frequency })
                      }
                    >
                      {FREQUENCIES.map((freq) => (
                        <option key={freq.value} value={freq.value}>
                          {freq.value}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2 flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={source.isCurrent}
                        onChange={(e) =>
                          updateIncomeSource(index, { isCurrent: e.target.checked })
                        }
                      />
                      <span className="text-sm">Current income source</span>
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeIncomeSource(index)}
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

      {income.length > 0 && (
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Monthly Income:</span>
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
