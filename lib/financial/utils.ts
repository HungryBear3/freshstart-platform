// Financial utility functions

import type { Frequency, IncomeSource, Expense } from "./types"

/**
 * Convert income/expense amount to monthly
 */
export function toMonthly(amount: number, frequency: Frequency): number {
  switch (frequency) {
    case "weekly":
      return amount * 52 / 12 // 52 weeks / 12 months
    case "biweekly":
      return amount * 26 / 12 // 26 pay periods / 12 months
    case "monthly":
      return amount
    case "yearly":
      return amount / 12
    case "one_time":
      return 0 // One-time expenses don't count as monthly
    default:
      return amount
  }
}

/**
 * Calculate total monthly income from income sources
 */
export function calculateTotalMonthlyIncome(
  incomeSources: IncomeSource[]
): number {
  return incomeSources
    .filter((income) => income.isCurrent)
    .reduce((total, income) => {
      return total + toMonthly(income.amount, income.frequency)
    }, 0)
}

/**
 * Calculate total monthly expenses
 */
export function calculateTotalMonthlyExpenses(expenses: Expense[]): number {
  return expenses.reduce((total, expense) => {
    return total + toMonthly(expense.amount, expense.frequency)
  }, 0)
}

/**
 * Calculate net income (income - expenses)
 */
export function calculateNetIncome(
  monthlyIncome: number,
  monthlyExpenses: number
): number {
  return monthlyIncome - monthlyExpenses
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Determine if Financial Affidavit should be short or long form
 * Long form required if:
 * - Combined gross income > $75,000
 * - Or if court specifically requires it
 */
export function determineFormType(
  combinedGrossIncome: number,
  courtRequiresLong?: boolean
): "short" | "long" {
  if (courtRequiresLong) {
    return "long"
  }
  return combinedGrossIncome > 75000 ? "long" : "short"
}
