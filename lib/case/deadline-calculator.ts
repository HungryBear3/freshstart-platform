/**
 * Illinois Divorce Deadline Calculator
 * Calculates important deadlines based on Illinois divorce statutes
 */

export interface DeadlineRule {
  name: string
  description: string
  daysFromFiling: number
  category: "response" | "discovery" | "hearing" | "motion" | "other"
}

/**
 * Common Illinois divorce deadlines
 * Based on Illinois Compiled Statutes and court rules
 */
export const ILLINOIS_DEADLINE_RULES: DeadlineRule[] = [
  {
    name: "Response to Petition",
    description: "Time to file response to petition for dissolution",
    daysFromFiling: 30,
    category: "response",
  },
  {
    name: "Financial Disclosure",
    description: "Deadline to exchange Financial Affidavits (typically 60 days from filing)",
    daysFromFiling: 60,
    category: "discovery",
  },
  {
    name: "Discovery Response",
    description: "Time to respond to discovery requests (interrogatories, requests for production)",
    daysFromFiling: 28,
    category: "discovery",
  },
  {
    name: "Motion Response",
    description: "Time to respond to motions (varies by motion type)",
    daysFromFiling: 21,
    category: "motion",
  },
  {
    name: "Status Hearing",
    description: "First status hearing typically scheduled 60-90 days after filing",
    daysFromFiling: 75,
    category: "hearing",
  },
]

/**
 * Calculate deadline date from a filing date
 */
export function calculateDeadline(
  filingDate: Date,
  daysFromFiling: number
): Date {
  const deadline = new Date(filingDate)
  deadline.setDate(deadline.getDate() + daysFromFiling)
  return deadline
}

/**
 * Get all standard deadlines for a case based on filing date
 */
export function getStandardDeadlines(filingDate: Date): Array<{
  rule: DeadlineRule
  dueDate: Date
}> {
  return ILLINOIS_DEADLINE_RULES.map((rule) => ({
    rule,
    dueDate: calculateDeadline(filingDate, rule.daysFromFiling),
  }))
}

/**
 * Calculate days until deadline
 */
export function daysUntilDeadline(deadline: Date): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dueDate = new Date(deadline)
  dueDate.setHours(0, 0, 0, 0)
  
  const diffTime = dueDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

/**
 * Check if deadline is overdue
 */
export function isDeadlineOverdue(deadline: Date): boolean {
  return daysUntilDeadline(deadline) < 0
}

/**
 * Check if deadline is approaching (within specified days)
 */
export function isDeadlineApproaching(deadline: Date, daysWarning: number = 7): boolean {
  const daysUntil = daysUntilDeadline(deadline)
  return daysUntil >= 0 && daysUntil <= daysWarning
}

/**
 * Get deadline status
 */
export function getDeadlineStatus(deadline: Date, completed: boolean): {
  status: "completed" | "overdue" | "approaching" | "upcoming"
  daysUntil: number
} {
  if (completed) {
    return { status: "completed", daysUntil: 0 }
  }

  const daysUntil = daysUntilDeadline(deadline)

  if (daysUntil < 0) {
    return { status: "overdue", daysUntil }
  } else if (daysUntil <= 7) {
    return { status: "approaching", daysUntil }
  } else {
    return { status: "upcoming", daysUntil }
  }
}
