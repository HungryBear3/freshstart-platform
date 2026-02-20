/**
 * Parenting Plan Templates
 * Common parenting arrangements for Illinois divorces
 */

export interface ParentingPlanTemplate {
  id: string
  name: string
  description: string
  weeklySchedule: any
  arrangement: string
}

export const PARENTING_PLAN_TEMPLATES: ParentingPlanTemplate[] = [
  {
    id: "standard-visitation",
    name: "Standard Visitation",
    description: "Traditional arrangement: One parent has primary custody, other has visitation",
    arrangement: "Primary/Visitation",
    weeklySchedule: {
      monday: { parent: "parent1", notes: "Primary parent" },
      tuesday: { parent: "parent1", notes: "Primary parent" },
      wednesday: { parent: "parent1", notes: "Primary parent" },
      thursday: { parent: "parent1", notes: "Primary parent" },
      friday: { parent: "parent1", notes: "Primary parent" },
      saturday: { parent: "parent2", notes: "Visitation parent - every other weekend" },
      sunday: { parent: "parent2", notes: "Visitation parent - every other weekend" },
    },
  },
  {
    id: "50-50-alternating-weeks",
    name: "50/50 Alternating Weeks",
    description: "Equal time: Parents alternate weeks",
    arrangement: "Equal Time",
    weeklySchedule: {
      monday: { parent: "alternating", notes: "Alternates weekly" },
      tuesday: { parent: "alternating", notes: "Alternates weekly" },
      wednesday: { parent: "alternating", notes: "Alternates weekly" },
      thursday: { parent: "alternating", notes: "Alternates weekly" },
      friday: { parent: "alternating", notes: "Alternates weekly" },
      saturday: { parent: "alternating", notes: "Alternates weekly" },
      sunday: { parent: "alternating", notes: "Alternates weekly" },
    },
  },
  {
    id: "2-2-3",
    name: "2-2-3 Schedule",
    description: "Parent 1: Mon-Tue, Parent 2: Wed-Thu, alternating Fri-Sun",
    arrangement: "Equal Time",
    weeklySchedule: {
      monday: { parent: "parent1", notes: "Week A & B" },
      tuesday: { parent: "parent1", notes: "Week A & B" },
      wednesday: { parent: "parent2", notes: "Week A & B" },
      thursday: { parent: "parent2", notes: "Week A & B" },
      friday: { parent: "alternating", notes: "Alternates weekly" },
      saturday: { parent: "alternating", notes: "Alternates weekly" },
      sunday: { parent: "alternating", notes: "Alternates weekly" },
    },
  },
  {
    id: "3-4-4-3",
    name: "3-4-4-3 Schedule",
    description: "Parent 1: Mon-Wed, Parent 2: Thu-Sun, then alternates",
    arrangement: "Equal Time",
    weeklySchedule: {
      monday: { parent: "alternating", notes: "Week A: Parent 1, Week B: Parent 2" },
      tuesday: { parent: "alternating", notes: "Week A: Parent 1, Week B: Parent 2" },
      wednesday: { parent: "alternating", notes: "Week A: Parent 1, Week B: Parent 2" },
      thursday: { parent: "alternating", notes: "Week A: Parent 2, Week B: Parent 1" },
      friday: { parent: "alternating", notes: "Week A: Parent 2, Week B: Parent 1" },
      saturday: { parent: "alternating", notes: "Week A: Parent 2, Week B: Parent 1" },
      sunday: { parent: "alternating", notes: "Week A: Parent 2, Week B: Parent 1" },
    },
  },
  {
    id: "every-other-weekend",
    name: "Every Other Weekend",
    description: "Parent 1: Weekdays, Parent 2: Every other weekend + one weekday",
    arrangement: "Primary/Visitation",
    weeklySchedule: {
      monday: { parent: "parent1", notes: "Primary parent" },
      tuesday: { parent: "parent1", notes: "Primary parent" },
      wednesday: { parent: "parent1", notes: "Primary parent" },
      thursday: { parent: "parent1", notes: "Primary parent" },
      friday: { parent: "parent1", notes: "Primary parent" },
      saturday: { parent: "alternating", notes: "Every other weekend" },
      sunday: { parent: "alternating", notes: "Every other weekend" },
    },
  },
]

export function getTemplateById(id: string): ParentingPlanTemplate | undefined {
  return PARENTING_PLAN_TEMPLATES.find((t) => t.id === id)
}
