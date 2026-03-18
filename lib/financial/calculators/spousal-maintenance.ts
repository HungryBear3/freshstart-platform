// Illinois Spousal Maintenance Calculator
// Based on Illinois Spousal Maintenance Guidelines (750 ILCS 5/504)

import type {
  SpousalMaintenanceInput,
  SpousalMaintenanceCalculation,
} from "../types"

/**
 * Calculate Illinois spousal maintenance (alimony)
 * Based on statutory guidelines effective 2019
 */
export function calculateSpousalMaintenance(
  input: SpousalMaintenanceInput
): SpousalMaintenanceCalculation {
  const {
    payerGrossIncome,
    payeeGrossIncome,
    durationOfMarriage,
    combinedGrossIncome,
  } = input

  const notes: string[] = []

  // Check if guidelines apply
  // Guidelines apply when combined gross income is $500,000 or less
  const GUIDELINE_INCOME_LIMIT = 500000

  if (combinedGrossIncome > GUIDELINE_INCOME_LIMIT) {
    return {
      guidelineAmount: 0,
      guidelineDuration: 0,
      notes: [
        "Guidelines do not apply when combined gross income exceeds $500,000. Court will determine maintenance based on statutory factors.",
      ],
    }
  }

  // Calculate guideline amount
  // Formula: 33.33% of payer's gross income - 25% of payee's gross income
  const guidelineAmount =
    payerGrossIncome * 0.3333 - payeeGrossIncome * 0.25

  // Cap: Maintenance cannot exceed 40% of combined gross income minus payee's gross income
  const maximumMaintenance =
    combinedGrossIncome * 0.4 - payeeGrossIncome

  let finalAmount = Math.max(0, Math.min(guidelineAmount, maximumMaintenance))

  // Calculate guideline duration based on length of marriage
  let guidelineDuration = 0

  if (durationOfMarriage < 5) {
    guidelineDuration = durationOfMarriage * 12 // Months = years * 12
  } else if (durationOfMarriage < 10) {
    guidelineDuration = durationOfMarriage * 12 * 0.6 // 60% of marriage length
  } else if (durationOfMarriage < 15) {
    guidelineDuration = durationOfMarriage * 12 * 0.7 // 70% of marriage length
  } else if (durationOfMarriage < 20) {
    guidelineDuration = durationOfMarriage * 12 * 0.8 // 80% of marriage length
  } else {
    guidelineDuration = durationOfMarriage * 12 // Permanent or until remarriage/death
    notes.push(
      "For marriages of 20+ years, maintenance may be permanent or until remarriage/death of either party."
    )
  }

  // Round duration to nearest month
  guidelineDuration = Math.round(guidelineDuration)

  // Add notes
  if (finalAmount <= 0) {
    notes.push(
      "Guideline calculation results in $0 maintenance. Court may still award maintenance based on statutory factors."
    )
  } else {
    notes.push(
      `Guideline maintenance: $${finalAmount.toFixed(2)}/month for ${guidelineDuration} months (${(guidelineDuration / 12).toFixed(1)} years).`
    )
  }

  notes.push(
    "These are guidelines only. Court may deviate based on statutory factors including: standard of living, age/health, earning capacity, contributions to marriage, property division, and other relevant factors."
  )

  return {
    guidelineAmount: Math.round(finalAmount * 100) / 100,
    guidelineDuration,
    notes,
  }
}

/**
 * Determine if maintenance guidelines apply
 */
export function maintenanceGuidelinesApply(
  combinedGrossIncome: number
): boolean {
  return combinedGrossIncome <= 500000
}
