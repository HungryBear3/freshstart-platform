import type { QuestionnaireStructure } from "@/types/questionnaire"

// Source: 750 ILCS 5/401, P.A. 99-90 (effective 2016-01-01), retrieved 2026-08-11.
// https://www.ilga.gov/legislation/ILCS/details?MajorTopic=RIGHTS%20AND%20REMEDIES&Chapter=FAMILIES&ActName=Illinois%20Marriage%20and%20Dissolution%20of%20Marriage%20Act.&ActID=2086&ChapterID=59&ChapAct=750+ILCS+5%2F&SeqStart=3900000&SeqEnd=5400000
// Six months living separate creates a presumption; it is not a minimum duration
// for irreconcilable differences and must not be enforced as one in intake.
export const ILLINOIS_DIVORCE_GROUNDS_OPTIONS = [
  {
    label: "Irreconcilable Differences (No-Fault)",
    value: "irreconcilable",
  },
] as const

export const CURRENT_ILLINOIS_PETITION_GROUNDS_LINES = [
  "Irreconcilable differences have caused the irretrievable breakdown of the marriage.",
  "Efforts at reconciliation have failed or future attempts at reconciliation would be",
  "impracticable and not in the best interests of the family.",
] as const

export function normalizeIllinoisPetitionResponses<T extends Record<string, unknown>>(
  responses: T
): T & { "grounds-type": "irreconcilable" } {
  const normalized = {
    ...responses,
    "grounds-type": "irreconcilable" as const,
  }
  delete normalized["irreconcilable-duration"]
  return normalized
}

export function normalizeIllinoisPetitionResponseData(
  formType: string,
  responses: unknown
): unknown {
  if (
    formType !== "petition" ||
    !responses ||
    typeof responses !== "object" ||
    Array.isArray(responses)
  ) {
    return responses
  }

  return normalizeIllinoisPetitionResponses(responses as Record<string, unknown>)
}

export function normalizeIllinoisPetitionGrounds(
  structure: QuestionnaireStructure
): QuestionnaireStructure {
  let foundGroundsQuestion = false

  const sections = structure.sections.map(section => {
    if (section.id !== "grounds") return section

    return {
      ...section,
      questions: section.questions
        .filter(question => question.id !== "irreconcilable-duration")
        .map(question => {
          if (question.id !== "grounds-type") return question

          foundGroundsQuestion = true
          return {
            ...question,
            options: ILLINOIS_DIVORCE_GROUNDS_OPTIONS.map(option => ({ ...option })),
          }
        }),
    }
  })

  if (!foundGroundsQuestion) {
    throw new Error("petition questionnaire is missing grounds-type")
  }

  return { ...structure, sections }
}
