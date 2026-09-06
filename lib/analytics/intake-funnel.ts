/**
 * Guided-intake funnel state machine.
 *
 * This module is deliberately framework-free and side-effect-free: it decides
 * *whether* a funnel event is owed, never *how* it is delivered. That split is
 * what makes the privacy guarantees testable — the only values it can ever
 * produce are a bounded questionnaire-type enum and two small integers.
 *
 * Guarantees enforced here:
 *  - nothing is owed before the intake has finished loading (no hydration hits);
 *  - a resumed draft is never reported as a start, and the sections it already
 *    finished are never re-reported (no cached-state replay);
 *  - each transition is emitted at most once per intake instance.
 */

export const FUNNEL_QUESTIONNAIRE_TYPES = [
  "petition",
  "financial_affidavit",
  "parenting_plan",
  "marital_settlement",
] as const

export type FunnelQuestionnaireType = (typeof FUNNEL_QUESTIONNAIRE_TYPES)[number] | "other"

/** Upper bound on section counts we are willing to report at all. */
const MAX_SECTIONS = 1000

const KNOWN_TYPES = new Set<string>(FUNNEL_QUESTIONNAIRE_TYPES)

/**
 * Collapse a route parameter to a bounded enum. The route segment is
 * user-controllable, so anything not explicitly seeded becomes `other` rather
 * than reaching the analytics boundary.
 */
export function toFunnelQuestionnaireType(raw: string | null | undefined): FunnelQuestionnaireType {
  if (typeof raw !== "string") return "other"
  return KNOWN_TYPES.has(raw) ? (raw as FunnelQuestionnaireType) : "other"
}

export type IntakeFunnelEmission =
  | { name: "questionnaire_start"; questionnaireType: FunnelQuestionnaireType }
  | {
      name: "questionnaire_section_complete"
      questionnaireType: FunnelQuestionnaireType
      sectionIndex: number
      totalSections: number
    }
  | { name: "questionnaire_complete"; questionnaireType: FunnelQuestionnaireType }

function isBoundedIndex(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0 && value < MAX_SECTIONS
}

export class IntakeFunnelTracker {
  readonly questionnaireType: FunnelQuestionnaireType

  private loaded = false
  private started = false
  private completed = false
  private readonly clearedSections = new Set<number>()

  constructor(rawQuestionnaireType: string | null | undefined) {
    this.questionnaireType = toFunnelQuestionnaireType(rawQuestionnaireType)
  }

  /**
   * Record the loaded intake state exactly once. A draft that already has
   * persisted progress counts as started, and every section before the resume
   * point counts as already reported.
   */
  markLoaded(input: { hasPersistedProgress: boolean; resumedSectionIndex?: number }): void {
    if (this.loaded) return
    this.loaded = true
    if (!input.hasPersistedProgress) return
    this.started = true
    const resumedAt = input.resumedSectionIndex
    if (typeof resumedAt !== "number" || !isBoundedIndex(resumedAt)) return
    for (let index = 0; index < resumedAt; index += 1) {
      this.clearedSections.add(index)
    }
  }

  /** A genuine user edit. Owes a start only for an intake with no saved draft. */
  recordUserInput(): IntakeFunnelEmission | null {
    if (!this.loaded || this.started) return null
    this.started = true
    return { name: "questionnaire_start", questionnaireType: this.questionnaireType }
  }

  /** The user left a section whose required questions are all answered. */
  recordSectionCleared(input: { sectionIndex: number; totalSections: number }): IntakeFunnelEmission | null {
    if (!this.loaded) return null
    const { sectionIndex, totalSections } = input
    if (!isBoundedIndex(sectionIndex) || !isBoundedIndex(totalSections)) return null
    if (totalSections === 0 || sectionIndex >= totalSections) return null
    if (this.clearedSections.has(sectionIndex)) return null
    this.clearedSections.add(sectionIndex)
    return {
      name: "questionnaire_section_complete",
      questionnaireType: this.questionnaireType,
      sectionIndex,
      totalSections,
    }
  }

  /** The server acknowledged the completed submission. */
  recordConfirmedCompletion(): IntakeFunnelEmission | null {
    if (!this.loaded || this.completed) return null
    this.completed = true
    return { name: "questionnaire_complete", questionnaireType: this.questionnaireType }
  }
}
