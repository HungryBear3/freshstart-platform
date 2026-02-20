/**
 * Timeline Calculator for Illinois Divorce
 * Estimates divorce timeline based on various factors
 */

export interface TimelineInputs {
  type: "uncontested" | "contested"
  county: string
  hasChildren: boolean
  hasProperty: boolean
  hasComplexAssets: boolean
  filingDate: Date
}

export interface TimelineMilestone {
  name: string
  estimatedDate: Date
  description: string
  daysFromFiling: number
}

export interface TimelineResult {
  estimatedCompletion: Date
  estimatedDays: number
  milestones: TimelineMilestone[]
  factors: string[]
}

// Base timelines (in days) by divorce type
const BASE_TIMELINES = {
  uncontested: 90, // ~3 months
  contested: 180, // ~6 months
}

// County-specific adjustments (some counties are faster/slower)
const COUNTY_ADJUSTMENTS: Record<string, number> = {
  cook: 30, // Cook County (Chicago) - typically slower
  dupage: -15, // DuPage County - typically faster
  will: -10, // Will County - typically faster
  lake: 0, // Lake County - average
  kane: -5, // Kane County - slightly faster
  // Add more counties as needed
}

// Complexity adjustments
const COMPLEXITY_ADJUSTMENTS = {
  children: 30, // +30 days if children involved
  property: 20, // +20 days if property division needed
  complexAssets: 45, // +45 days if complex assets (businesses, etc.)
}

export function calculateTimeline(inputs: TimelineInputs): TimelineResult {
  const {
    type,
    county,
    hasChildren,
    hasProperty,
    hasComplexAssets,
    filingDate,
  } = inputs

  // Start with base timeline
  let estimatedDays = BASE_TIMELINES[type]

  // Apply county adjustment
  const countyKey = county.toLowerCase().replace(/\s+/g, "")
  const countyAdjustment = COUNTY_ADJUSTMENTS[countyKey] || 0
  estimatedDays += countyAdjustment

  // Apply complexity adjustments
  if (hasChildren) estimatedDays += COMPLEXITY_ADJUSTMENTS.children
  if (hasProperty) estimatedDays += COMPLEXITY_ADJUSTMENTS.property
  if (hasComplexAssets) estimatedDays += COMPLEXITY_ADJUSTMENTS.complexAssets

  // Ensure minimum timeline
  estimatedDays = Math.max(estimatedDays, type === "uncontested" ? 60 : 120)

  // Calculate completion date
  const estimatedCompletion = new Date(filingDate)
  estimatedCompletion.setDate(estimatedCompletion.getDate() + estimatedDays)

  // Generate milestones
  const milestones: TimelineMilestone[] = [
    {
      name: "Filing Date",
      estimatedDate: new Date(filingDate),
      description: "Petition for Dissolution of Marriage filed",
      daysFromFiling: 0,
    },
    {
      name: "Service of Process",
      estimatedDate: new Date(filingDate.getTime() + 14 * 24 * 60 * 60 * 1000),
      description: "Spouse served with divorce papers",
      daysFromFiling: 14,
    },
    {
      name: "Response Deadline",
      estimatedDate: new Date(filingDate.getTime() + 30 * 24 * 60 * 60 * 1000),
      description: "Spouse must respond (30 days from service)",
      daysFromFiling: 30,
    },
  ]

  if (type === "uncontested") {
    milestones.push({
      name: "Agreement Reached",
      estimatedDate: new Date(filingDate.getTime() + 45 * 24 * 60 * 60 * 1000),
      description: "Marital Settlement Agreement finalized",
      daysFromFiling: 45,
    })
    milestones.push({
      name: "Final Hearing",
      estimatedDate: new Date(filingDate.getTime() + 60 * 24 * 60 * 60 * 1000),
      description: "Court hearing to finalize divorce",
      daysFromFiling: 60,
    })
  } else {
    milestones.push({
      name: "Discovery Period",
      estimatedDate: new Date(filingDate.getTime() + 90 * 24 * 60 * 60 * 1000),
      description: "Information gathering and document exchange",
      daysFromFiling: 90,
    })
    milestones.push({
      name: "Mediation/Settlement Conference",
      estimatedDate: new Date(filingDate.getTime() + 120 * 24 * 60 * 60 * 1000),
      description: "Attempt to reach agreement",
      daysFromFiling: 120,
    })
    milestones.push({
      name: "Trial Date",
      estimatedDate: new Date(filingDate.getTime() + 150 * 24 * 60 * 60 * 1000),
      description: "Court trial (if no settlement reached)",
      daysFromFiling: 150,
    })
  }

  milestones.push({
    name: "Final Judgment",
    estimatedDate: estimatedCompletion,
    description: "Divorce finalized by court",
    daysFromFiling: estimatedDays,
  })

  // Collect factors affecting timeline
  const factors: string[] = []
  if (type === "contested") {
    factors.push("Contested divorce (longer timeline)")
  }
  if (hasChildren) {
    factors.push("Children involved (custody/parenting time considerations)")
  }
  if (hasProperty) {
    factors.push("Property division required")
  }
  if (hasComplexAssets) {
    factors.push("Complex assets (businesses, investments) require valuation")
  }
  if (countyAdjustment > 0) {
    factors.push(`${county} County typically has longer processing times`)
  } else if (countyAdjustment < 0) {
    factors.push(`${county} County typically processes faster`)
  }

  return {
    estimatedCompletion,
    estimatedDays,
    milestones,
    factors,
  }
}

// Re-export ILLINOIS_COUNTIES from constants for backward compatibility
export { ILLINOIS_COUNTIES } from "./constants"
