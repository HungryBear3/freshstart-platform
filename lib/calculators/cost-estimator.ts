/**
 * Cost Estimator for Illinois Divorce
 * Estimates costs based on county, type, and complexity
 */

export interface CostInputs {
  county: string
  type: "uncontested" | "contested"
  hasChildren: boolean
  hasProperty: boolean
  needsServiceOfProcess: boolean
  needsMediation: boolean
}

export interface CostItem {
  category: string
  description: string
  amount: number
  required: boolean
  notes?: string
}

export interface CostEstimate {
  total: number
  breakdown: CostItem[]
  factors: string[]
  disclaimer: string
}

// Base filing fees by county (as of 2024 - should be updated)
const BASE_FILING_FEES: Record<string, number> = {
  cook: 388, // Cook County
  dupage: 388,
  will: 388,
  lake: 388,
  kane: 388,
  mchenry: 388,
  // Default for other counties
  default: 388,
}

// Service of process fees
const SERVICE_FEES = {
  sheriff: 50, // Sheriff service
  private: 75, // Private process server
  publication: 200, // Publication (if spouse can't be found)
}

// Additional costs
const ADDITIONAL_COSTS = {
  mediation: 200, // Per session (typically 2-4 sessions)
  parentingClass: 50, // Parent education class (if required)
  financialAffidavit: 0, // Free (but time-consuming)
  documentPreparation: 0, // Free with platform
}

// Attorney fee estimates (for reference)
const ATTORNEY_FEES = {
  uncontested: 1500, // Flat fee for simple uncontested
  contested: 10000, // Retainer for contested (can be much higher)
  hourly: 250, // Average hourly rate
}

export function estimateCosts(inputs: CostInputs): CostEstimate {
  const {
    county,
    type,
    hasChildren,
    hasProperty,
    needsServiceOfProcess,
    needsMediation,
  } = inputs

  const breakdown: CostItem[] = []
  const factors: string[] = []

  // Base filing fee
  const countyKey = county.toLowerCase().replace(/\s+/g, "")
  const filingFee = BASE_FILING_FEES[countyKey] || BASE_FILING_FEES.default

  breakdown.push({
    category: "Court Filing Fee",
    description: "Filing fee for Petition for Dissolution of Marriage",
    amount: filingFee,
    required: true,
    notes: "Required by all Illinois counties",
  })

  // Service of process
  if (needsServiceOfProcess) {
    breakdown.push({
      category: "Service of Process",
      description: "Fee to serve divorce papers to spouse",
      amount: SERVICE_FEES.sheriff,
      required: true,
      notes: "Sheriff service fee (private servers may charge more)",
    })
  }

  // Parenting class (if children)
  if (hasChildren) {
    breakdown.push({
      category: "Parent Education Class",
      description: "Required parenting education course",
      amount: ADDITIONAL_COSTS.parentingClass,
      required: true,
      notes: "Required in many Illinois counties when children are involved",
    })
    factors.push("Parent education class required (varies by county)")
  }

  // Mediation (if contested or required)
  if (needsMediation || type === "contested") {
    const mediationSessions = type === "contested" ? 3 : 2
    const mediationCost = ADDITIONAL_COSTS.mediation * mediationSessions
    breakdown.push({
      category: "Mediation",
      description: `Mediation sessions (${mediationSessions} sessions estimated)`,
      amount: mediationCost,
      required: type === "contested",
      notes: "May be court-ordered or voluntary",
    })
    factors.push("Mediation may be required or recommended")
  }

  // Additional document fees (if not using platform)
  breakdown.push({
    category: "Document Preparation",
    description: "Platform provides free document generation",
    amount: 0,
    required: false,
    notes: "Using FreshStart IL saves hundreds in document preparation fees",
  })

  // Calculate total
  const total = breakdown.reduce((sum, item) => sum + item.amount, 0)

  // Add attorney fee estimates (for reference)
  if (type === "contested") {
    factors.push(
      `Attorney fees: $${ATTORNEY_FEES.contested.toLocaleString()}+ (if hiring attorney)`
    )
    factors.push(
      `Average hourly rate: $${ATTORNEY_FEES.hourly}/hour (varies by attorney)`
    )
  } else {
    factors.push(
      `Attorney fees: $${ATTORNEY_FEES.uncontested.toLocaleString()}+ (if hiring attorney)`
    )
  }

  if (hasProperty) {
    factors.push("Property division may require appraisals or valuations")
  }

  const disclaimer = `These are estimated costs based on typical Illinois divorce proceedings. Actual costs may vary based on your specific situation, county requirements, and whether you hire an attorney. Court fees are subject to change. Fee waivers may be available for low-income individuals.`

  return {
    total,
    breakdown,
    factors,
    disclaimer,
  }
}

// Get fee waiver information
export function getFeeWaiverInfo() {
  return {
    eligible: "Low-income individuals may qualify for fee waivers",
    requirements: [
      "Income below 125% of federal poverty guidelines",
      "Receiving public assistance",
      "Unable to pay fees without undue hardship",
    ],
    howToApply: "File a Petition for Waiver of Court Fees with your divorce petition",
    moreInfo: "Contact your local circuit clerk's office for fee waiver forms",
  }
}
