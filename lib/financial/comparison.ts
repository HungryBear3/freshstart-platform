/**
 * Spouse financial comparison utilities
 * Detects discrepancies between user and spouse financial data
 */

import type { FinancialData } from "@/lib/financial/types";

export interface SpouseFinancialData {
  income: FinancialData["income"];
  expenses: FinancialData["expenses"];
  assets: FinancialData["assets"];
  debts: FinancialData["debts"];
}

export interface ComparisonTotals {
  user: {
    monthlyIncome: number;
    monthlyExpenses: number;
    totalAssets: number;
    totalDebts: number;
    netWorth: number;
    monthlyCashFlow: number;
  };
  spouse: {
    monthlyIncome: number;
    monthlyExpenses: number;
    totalAssets: number;
    totalDebts: number;
    netWorth: number;
    monthlyCashFlow: number;
  };
}

export interface Discrepancy {
  category: "income" | "expenses" | "assets" | "debts";
  field: string;
  userValue: number;
  spouseValue: number;
  percentDiff: number;
  type: "amount_mismatch" | "user_missing" | "spouse_missing" | "both_present_mismatch";
  description: string;
}

const THRESHOLD_PERCENT = 10; // Flag if difference exceeds 10%

function toMonthly(amount: number, freq: string): number {
  switch (freq) {
    case "yearly":
      return amount / 12;
    case "weekly":
      return amount * 4.33;
    case "biweekly":
      return amount * 2.17;
    default:
      return amount;
  }
}

export function calculateTotals(data: FinancialData | SpouseFinancialData): ComparisonTotals["user"] {
  const monthlyIncome = (data.income || []).reduce((sum, item) => sum + toMonthly(item.amount, item.frequency || "monthly"), 0);
  const monthlyExpenses = (data.expenses || []).reduce((sum, item) => sum + toMonthly(item.amount, item.frequency || "monthly"), 0);
  const totalAssets = (data.assets || []).reduce((sum, item) => sum + item.value, 0);
  const totalDebts = (data.debts || []).reduce((sum, item) => sum + item.balance, 0);
  const netWorth = totalAssets - totalDebts;
  const monthlyCashFlow = monthlyIncome - monthlyExpenses;
  return {
    monthlyIncome: Math.round(monthlyIncome * 100) / 100,
    monthlyExpenses: Math.round(monthlyExpenses * 100) / 100,
    totalAssets: Math.round(totalAssets * 100) / 100,
    totalDebts: Math.round(totalDebts * 100) / 100,
    netWorth: Math.round(netWorth * 100) / 100,
    monthlyCashFlow: Math.round(monthlyCashFlow * 100) / 100,
  };
}

export function detectDiscrepancies(
  userData: FinancialData,
  spouseData: SpouseFinancialData
): Discrepancy[] {
  const discrepancies: Discrepancy[] = [];
  const userTotals = calculateTotals(userData);
  const spouseTotals = calculateTotals(spouseData);

  // Compare totals
  const compareTotal = (
    category: Discrepancy["category"],
    field: string,
    userVal: number,
    spouseVal: number
  ) => {
    if (userVal === 0 && spouseVal === 0) return;
    const maxVal = Math.max(userVal, spouseVal, 1);
    const percentDiff = Math.abs(userVal - spouseVal) / maxVal * 100;
    if (percentDiff >= THRESHOLD_PERCENT) {
      discrepancies.push({
        category,
        field,
        userValue: userVal,
        spouseValue: spouseVal,
        percentDiff,
        type: "amount_mismatch",
        description: `${field}: You report $${userVal.toLocaleString()} vs spouse $${spouseVal.toLocaleString()} (${percentDiff.toFixed(0)}% difference)`,
      });
    }
  };

  compareTotal("income", "Monthly Income", userTotals.monthlyIncome, spouseTotals.monthlyIncome);
  compareTotal("expenses", "Monthly Expenses", userTotals.monthlyExpenses, spouseTotals.monthlyExpenses);
  compareTotal("assets", "Total Assets", userTotals.totalAssets, spouseTotals.totalAssets);
  compareTotal("debts", "Total Debts", userTotals.totalDebts, spouseTotals.totalDebts);
  compareTotal("income", "Net Worth", userTotals.netWorth, spouseTotals.netWorth);

  // Flag missing categories: spouse has income/expenses/assets/debts user doesn't
  if (spouseData.income.length > 0 && userData.income.length === 0) {
    discrepancies.push({
      category: "income",
      field: "Income",
      userValue: 0,
      spouseValue: spouseTotals.monthlyIncome,
      percentDiff: 100,
      type: "user_missing",
      description: "You have no income recorded; spouse reports income.",
    });
  }
  if (spouseData.assets.length > 0 && userData.assets.length === 0) {
    discrepancies.push({
      category: "assets",
      field: "Assets",
      userValue: 0,
      spouseValue: spouseTotals.totalAssets,
      percentDiff: 100,
      type: "user_missing",
      description: "You have no assets recorded; spouse reports assets.",
    });
  }
  if (spouseData.debts.length > 0 && userData.debts.length === 0) {
    discrepancies.push({
      category: "debts",
      field: "Debts",
      userValue: 0,
      spouseValue: spouseTotals.totalDebts,
      percentDiff: 100,
      type: "user_missing",
      description: "You have no debts recorded; spouse reports debts.",
    });
  }

  return discrepancies;
}
