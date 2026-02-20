// Illinois Child Support Calculator
// Based on Illinois Child Support Guidelines (750 ILCS 5/505)

import type {
  ChildSupportInput,
  ChildSupportCalculation,
} from "../types"

// Basic support obligation table (as of 2024)
// This is a simplified version - actual calculations may vary
const BASIC_SUPPORT_TABLE: Record<number, number> = {
  1: 0.20, // 20% of combined net income for 1 child
  2: 0.28, // 28% for 2 children
  3: 0.32, // 32% for 3 children
  4: 0.40, // 40% for 4 children
  5: 0.45, // 45% for 5 children
  6: 0.50, // 50% for 6+ children
}

const MAX_COMBINED_NET_INCOME = 12000 // Maximum combined net income for table (as of 2024)

/**
 * Calculate Illinois child support obligation
 */
export function calculateChildSupport(
  input: ChildSupportInput
): ChildSupportCalculation {
  const {
    parent1NetIncome,
    parent2NetIncome,
    numberOfChildren,
    parentingTimeParent1,
    parentingTimeParent2,
    healthInsuranceCost = 0,
    childcareCost = 0,
    educationalExpenses = 0,
    extraordinaryMedicalExpenses = 0,
  } = input

  // Calculate combined net income
  const combinedNetIncome = parent1NetIncome + parent2NetIncome

  // Get basic support percentage based on number of children
  const supportPercentage =
    BASIC_SUPPORT_TABLE[numberOfChildren] ||
    BASIC_SUPPORT_TABLE[6] // Default to 50% for 6+ children

  // Calculate basic obligation
  let basicObligation = combinedNetIncome * supportPercentage

  // Cap at maximum if combined income exceeds table maximum
  if (combinedNetIncome > MAX_COMBINED_NET_INCOME) {
    const excessIncome = combinedNetIncome - MAX_COMBINED_NET_INCOME
    basicObligation =
      MAX_COMBINED_NET_INCOME * supportPercentage + excessIncome * 0.1
  }

  // Calculate each parent's share based on income
  const parent1Share = parent1NetIncome / combinedNetIncome
  const parent2Share = parent2NetIncome / combinedNetIncome

  // Shared parenting adjustment (if both parents have significant parenting time)
  let sharedParentingAdjustment = 0
  const significantTimeThreshold = 20 // 20% or more is considered significant
  const isSharedParenting =
    parentingTimeParent1 >= significantTimeThreshold &&
    parentingTimeParent2 >= significantTimeThreshold

  if (isSharedParenting) {
    // Adjust based on parenting time difference
    const timeDifference = Math.abs(parentingTimeParent1 - parentingTimeParent2)
    const adjustmentFactor = timeDifference / 100 // Percentage difference
    sharedParentingAdjustment = basicObligation * adjustmentFactor * 0.5
  }

  // Calculate adjustments
  const healthInsuranceAdjustment = healthInsuranceCost * parent1Share
  const childcareAdjustment = childcareCost * parent1Share
  const educationalExpensesAdjustment = educationalExpenses * parent1Share
  const medicalExpensesAdjustment =
    extraordinaryMedicalExpenses * parent1Share

  // Calculate total obligation
  const totalObligation =
    basicObligation +
    sharedParentingAdjustment +
    healthInsuranceAdjustment +
    childcareAdjustment +
    educationalExpensesAdjustment +
    medicalExpensesAdjustment

  // Calculate each parent's share of total obligation
  const parent1Obligation = totalObligation * parent1Share
  const parent2Obligation = totalObligation * parent2Share

  // Determine who owes what
  // The parent with less parenting time typically pays support to the parent with more time
  let parent1Owed = 0
  let parent2Owed = 0

  if (parentingTimeParent1 < parentingTimeParent2) {
    // Parent 1 has less time, so they pay the difference
    parent1Owed = Math.max(0, parent1Obligation - parent2Obligation)
    parent2Owed = 0
  } else if (parentingTimeParent2 < parentingTimeParent1) {
    // Parent 2 has less time, so they pay the difference
    parent1Owed = 0
    parent2Owed = Math.max(0, parent2Obligation - parent1Obligation)
  } else {
    // Equal time - the parent with higher income pays the difference
    if (parent1NetIncome > parent2NetIncome) {
      parent1Owed = Math.max(0, parent1Obligation - parent2Obligation)
    } else if (parent2NetIncome > parent1NetIncome) {
      parent2Owed = Math.max(0, parent2Obligation - parent1Obligation)
    }
    // If incomes are equal and time is equal, no support owed
  }

  return {
    combinedNetIncome: Math.round(combinedNetIncome * 100) / 100,
    basicObligation: Math.round(basicObligation * 100) / 100,
    sharedParentingAdjustment: Math.round(sharedParentingAdjustment * 100) / 100,
    healthInsuranceAdjustment: Math.round(healthInsuranceAdjustment * 100) / 100,
    childcareAdjustment: Math.round(childcareAdjustment * 100) / 100,
    educationalExpensesAdjustment:
      Math.round(educationalExpensesAdjustment * 100) / 100,
    medicalExpensesAdjustment: Math.round(medicalExpensesAdjustment * 100) / 100,
    totalObligation: Math.round(totalObligation * 100) / 100,
    parent1Share: Math.round(parent1Share * 100) / 100,
    parent2Share: Math.round(parent2Share * 100) / 100,
    parent1Owed: Math.round(parent1Owed * 100) / 100,
    parent2Owed: Math.round(parent2Owed * 100) / 100,
  }
}

/**
 * Calculate net income from gross income (simplified)
 * In practice, this should use actual deductions
 */
export function calculateNetIncome(
  grossIncome: number,
  deductions: {
    taxes?: number
    socialSecurity?: number
    medicare?: number
    healthInsurance?: number
    retirement?: number
    other?: number
  } = {}
): number {
  const {
    taxes = grossIncome * 0.25, // Estimate 25% for taxes
    socialSecurity = grossIncome * 0.062, // 6.2% Social Security
    medicare = grossIncome * 0.0145, // 1.45% Medicare
    healthInsurance = 0,
    retirement = 0,
    other = 0,
  } = deductions

  return (
    grossIncome -
    taxes -
    socialSecurity -
    medicare -
    healthInsurance -
    retirement -
    other
  )
}
