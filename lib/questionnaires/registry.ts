/**
 * The questionnaires this repository actually defines.
 *
 * DERIVED from `SEED_QUESTIONNAIRES`, never listed by hand. A hand-written list
 * would drift from what is seeded, and every membership check built on it would
 * go quietly vacuous — passing because the list was stale rather than because
 * the field exists.
 *
 * This is a statement about the REPOSITORY, not the deployed database:
 * `scripts/remediate-current-illinois-grounds.ts` mutates a stored structure
 * directly, so a deployed questionnaire can differ from these definitions.
 */
import { SEED_QUESTIONNAIRES } from "@/lib/questionnaires/seed-structures"
import type { Question, Section } from "@/types/questionnaire"

function fieldIdsOf(sections: Section[]): string[] {
  return sections.flatMap((section: Section) => section.questions.map((q: Question) => q.id))
}

const FIELD_IDS_BY_QUESTIONNAIRE: ReadonlyMap<string, ReadonlySet<string>> = new Map(
  SEED_QUESTIONNAIRES.map((q) => [q.type, new Set(fieldIdsOf(q.structure.sections))] as const),
)

/**
 * The questionnaire identifiers in use. These are the `type` values, which are
 * what `/questionnaires/[type]` routes on and what the seeder upserts by.
 */
export const QUESTIONNAIRE_IDS: readonly string[] = SEED_QUESTIONNAIRES.map((q) => q.type)

export function isQuestionnaireId(id: string): boolean {
  return FIELD_IDS_BY_QUESTIONNAIRE.has(id)
}

/**
 * The question ids of one questionnaire, or `null` when it does not exist.
 *
 * `null` rather than `[]` on purpose: an empty array reads as "this
 * questionnaire has no fields" and would let a caller answer a field question
 * about a questionnaire that was never defined.
 */
export function getQuestionnaireFieldIds(id: string): string[] | null {
  const fields = FIELD_IDS_BY_QUESTIONNAIRE.get(id)
  return fields ? [...fields] : null
}

/**
 * Whether ONE questionnaire carries a field.
 *
 * Scoped to a single questionnaire deliberately. Generation receives one
 * questionnaire response object, so a field that exists in some OTHER
 * questionnaire fills nothing — asking "does any questionnaire have this?"
 * would report a map as compatible while it emitted blanks.
 */
export function questionnaireHasField(questionnaireId: string, fieldId: string): boolean {
  return FIELD_IDS_BY_QUESTIONNAIRE.get(questionnaireId)?.has(fieldId) ?? false
}

/**
 * Split declared questionnaire links into the ones that name a real
 * questionnaire and the ones that do not.
 *
 * Both halves are returned. Dropping the unresolved half would hide that a
 * surface is claiming a questionnaire this product has never defined; returning
 * only a boolean would hide WHICH claim is unsupported.
 */
export function resolveQuestionnaireLinks(links: readonly string[]): {
  resolved: string[]
  unresolved: string[]
} {
  const resolved: string[] = []
  const unresolved: string[] = []
  for (const link of links) {
    ;(isQuestionnaireId(link) ? resolved : unresolved).push(link)
  }
  return { resolved, unresolved }
}
