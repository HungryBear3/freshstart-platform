/**
 * Unit tests for spouse financial comparison utilities
 */

import {
  calculateTotals,
  detectDiscrepancies,
  type SpouseFinancialData,
} from "@/lib/financial/comparison";
import type { FinancialData } from "@/lib/financial/types";

describe("lib/financial/comparison", () => {
  describe("calculateTotals", () => {
    it("should calculate monthly income from monthly frequency", () => {
      const data: FinancialData = {
        userId: "u1",
        formType: "short",
        income: [
          { type: "wages", source: "Job", amount: 4000, frequency: "monthly", isCurrent: true },
        ],
        expenses: [],
        assets: [],
        debts: [],
      };
      const totals = calculateTotals(data);
      expect(totals.monthlyIncome).toBe(4000);
    });

    it("should convert yearly income to monthly", () => {
      const data: FinancialData = {
        userId: "u1",
        formType: "short",
        income: [
          { type: "wages", source: "Job", amount: 60000, frequency: "yearly", isCurrent: true },
        ],
        expenses: [],
        assets: [],
        debts: [],
      };
      const totals = calculateTotals(data);
      expect(totals.monthlyIncome).toBe(5000);
    });

    it("should sum multiple income sources", () => {
      const data: FinancialData = {
        userId: "u1",
        formType: "short",
        income: [
          { type: "wages", source: "Job", amount: 3000, frequency: "monthly", isCurrent: true },
          { type: "rental", source: "Rental", amount: 500, frequency: "monthly", isCurrent: true },
        ],
        expenses: [],
        assets: [],
        debts: [],
      };
      const totals = calculateTotals(data);
      expect(totals.monthlyIncome).toBe(3500);
    });

    it("should calculate total assets and debts", () => {
      const data: FinancialData = {
        userId: "u1",
        formType: "short",
        income: [],
        expenses: [],
        assets: [
          { type: "bank_account", description: "Checking", value: 5000, ownership: "individual" },
          { type: "real_estate", description: "Home", value: 300000, ownership: "joint" },
        ],
        debts: [
          { type: "mortgage", creditor: "Bank", balance: 200000, ownership: "joint" },
        ],
      };
      const totals = calculateTotals(data);
      expect(totals.totalAssets).toBe(305000);
      expect(totals.totalDebts).toBe(200000);
      expect(totals.netWorth).toBe(105000);
    });
  });

  describe("detectDiscrepancies", () => {
    it("should flag income discrepancy when difference exceeds 10%", () => {
      const user: FinancialData = {
        userId: "u1",
        formType: "short",
        income: [
          { type: "wages", source: "Job", amount: 5000, frequency: "monthly", isCurrent: true },
        ],
        expenses: [],
        assets: [],
        debts: [],
      };
      const spouse: SpouseFinancialData = {
        income: [
          { type: "wages", source: "Job", amount: 3000, frequency: "monthly", isCurrent: true },
        ],
        expenses: [],
        assets: [],
        debts: [],
      };
      const discrepancies = detectDiscrepancies(user, spouse);
      const incomeDisc = discrepancies.find((d) => d.field === "Monthly Income");
      expect(incomeDisc).toBeDefined();
      expect(incomeDisc!.percentDiff).toBeGreaterThanOrEqual(10);
    });

    it("should not flag when values are within 10%", () => {
      const user: FinancialData = {
        userId: "u1",
        formType: "short",
        income: [
          { type: "wages", source: "Job", amount: 5000, frequency: "monthly", isCurrent: true },
        ],
        expenses: [],
        assets: [],
        debts: [],
      };
      const spouse: SpouseFinancialData = {
        income: [
          { type: "wages", source: "Job", amount: 4800, frequency: "monthly", isCurrent: true },
        ],
        expenses: [],
        assets: [],
        debts: [],
      };
      const discrepancies = detectDiscrepancies(user, spouse);
      const incomeDisc = discrepancies.find((d) => d.field === "Monthly Income");
      expect(incomeDisc).toBeUndefined();
    });

    it("should flag user_missing when spouse has data and user does not", () => {
      const user: FinancialData = {
        userId: "u1",
        formType: "short",
        income: [],
        expenses: [],
        assets: [],
        debts: [],
      };
      const spouse: SpouseFinancialData = {
        income: [
          { type: "wages", source: "Job", amount: 4000, frequency: "monthly", isCurrent: true },
        ],
        expenses: [],
        assets: [{ type: "bank_account", description: "Savings", value: 10000, ownership: "joint" }],
        debts: [],
      };
      const discrepancies = detectDiscrepancies(user, spouse);
      const incomeMissing = discrepancies.find((d) => d.type === "user_missing" && d.category === "income");
      const assetMissing = discrepancies.find((d) => d.type === "user_missing" && d.category === "assets");
      expect(incomeMissing).toBeDefined();
      expect(assetMissing).toBeDefined();
    });
  });
});
