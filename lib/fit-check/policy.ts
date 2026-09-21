/**
 * The FreshStart fit check.
 *
 * This module answers exactly one mechanical question: does the workflow this
 * product currently implements cover the situation these bounded answers
 * describe? It is a product-scope classifier, not a legal opinion, so every
 * question is a fixed three-way choice, every outcome is one of three neutral
 * results, and every reason is a bounded code that never echoes user input.
 *
 * It is the single classifier shared by `/api/fit-check` (which writes the
 * assessment) and the checkout route (which reads it), so the gate and the
 * questionnaire can never drift apart.
 */

export const FIT_CHECK_POLICY_VERSION = "2026-09-21.1"

/** An assessment is good for 30 days, then the answers must be re-confirmed. */
export const FIT_CHECK_VALIDITY_MS = 30 * 24 * 60 * 60 * 1000

export const FIT_CHECK_CHOICE_VALUES = ["yes", "no", "not_sure"] as const
export type FitCheckChoice = (typeof FIT_CHECK_CHOICE_VALUES)[number]

export type FitCheckQuestionId =
  | "illinoisMatter"
  | "bothSpousesAgreeToDivorce"
  | "agreementOnAllKeyIssues"
  | "spouseWillSignAndParticipate"
  | "safetyOrEmergency"

export type FitCheckResult = "fit" | "review_required" | "out_of_scope"

export interface FitCheckChoiceOption {
  value: FitCheckChoice
  label: string
}

export interface FitCheckQuestion {
  id: FitCheckQuestionId
  prompt: string
  help?: string
  /** The one answer the current workflow covers. */
  supportedAnswer: FitCheckChoice
  /**
   * `scope` questions describe what the workflow can prepare. The `safety`
   * question is different in kind: an unsupported answer there is never a
   * scope refusal, it is a hand-off to a person.
   */
  kind: "scope" | "safety"
  choices: FitCheckChoiceOption[]
}

export type FitCheckAnswers = Record<FitCheckQuestionId, FitCheckChoice>

export interface FitCheckClassification {
  result: FitCheckResult
  reasons: string[]
}

const CHOICES: FitCheckChoiceOption[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "not_sure", label: "I'm not sure" },
]

/**
 * Declaration order is the reason-code order, so a classification reads in the
 * same order the person answered.
 */
export const FIT_CHECK_QUESTIONS: FitCheckQuestion[] = [
  {
    id: "illinoisMatter",
    prompt: "Will this divorce be filed in an Illinois county court?",
    help: "FreshStart only prepares Illinois forms.",
    supportedAnswer: "yes",
    kind: "scope",
    choices: CHOICES,
  },
  {
    id: "bothSpousesAgreeToDivorce",
    prompt: "Do both you and your spouse want the divorce to go ahead?",
    help: "The workflow prepares uncontested paperwork only.",
    supportedAnswer: "yes",
    kind: "scope",
    choices: CHOICES,
  },
  {
    id: "agreementOnAllKeyIssues",
    prompt:
      "Have the two of you already settled every major issue — property, debts, support, and any parenting arrangements?",
    help: "FreshStart writes down an agreement you already have. It does not negotiate one.",
    supportedAnswer: "yes",
    kind: "scope",
    choices: CHOICES,
  },
  {
    id: "spouseWillSignAndParticipate",
    prompt: "Is your spouse willing to sign the paperwork and take part in the filing?",
    help: "Every document in this workflow needs both signatures.",
    supportedAnswer: "yes",
    kind: "scope",
    choices: CHOICES,
  },
  {
    id: "safetyOrEmergency",
    prompt:
      "Is anything urgent going on — safety concerns at home, an order of protection, or a court date within the next two weeks?",
    help: "Urgent situations need a person, not a document workflow.",
    supportedAnswer: "no",
    kind: "safety",
    choices: CHOICES,
  },
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isChoice(value: unknown): value is FitCheckChoice {
  return (
    typeof value === "string" &&
    (FIT_CHECK_CHOICE_VALUES as readonly string[]).includes(value)
  )
}

/**
 * True only for a complete, bounded answer set: exactly the policy's question
 * ids, and nothing else, each holding one of the three allowed values. Any
 * extra key is rejected so free text can never ride along into storage.
 */
export function isFitCheckAnswerSet(value: unknown): value is FitCheckAnswers {
  if (!isRecord(value)) return false
  if (Object.keys(value).length !== FIT_CHECK_QUESTIONS.length) return false
  return FIT_CHECK_QUESTIONS.every((question) => isChoice(value[question.id]))
}

/**
 * Rebuilds the answer set in policy order from a validated input, so what is
 * persisted is exactly the bounded shape this module defines rather than
 * whatever object the caller happened to hand over.
 */
export function normalizeFitCheckAnswers(answers: FitCheckAnswers): FitCheckAnswers {
  const normalized = {} as FitCheckAnswers
  for (const question of FIT_CHECK_QUESTIONS) {
    normalized[question.id] = answers[question.id]
  }
  return normalized
}

/**
 * Classifies any input, failing closed on everything it was not given.
 *
 * Precedence, strongest first:
 *  1. anything unknown or missing (including the safety answer) -> review_required
 *  2. a safety answer that needs a person -> review_required
 *  3. a definite answer the workflow does not cover -> out_of_scope
 *  4. otherwise -> fit
 *
 * `fit` is therefore reachable only from a complete set of covered answers.
 */
export function classifyFitCheck(answers: unknown): FitCheckClassification {
  const record = isRecord(answers) ? answers : {}
  const reasons: string[] = []
  let needsPerson = false
  let indeterminate = false
  let uncovered = false

  for (const question of FIT_CHECK_QUESTIONS) {
    const answer = record[question.id]

    if (answer === undefined || answer === null) {
      reasons.push(`missing:${question.id}`)
      indeterminate = true
      continue
    }
    // An unrecognised value tells us no more than "not sure" does.
    if (!isChoice(answer) || answer === "not_sure") {
      reasons.push(`unknown:${question.id}`)
      indeterminate = true
      continue
    }
    if (answer === question.supportedAnswer) continue

    if (question.kind === "safety") {
      reasons.push("safety_support_needed")
      needsPerson = true
      continue
    }
    reasons.push(`unsupported:${question.id}`)
    uncovered = true
  }

  if (indeterminate || needsPerson) return { result: "review_required", reasons }
  if (uncovered) return { result: "out_of_scope", reasons }
  return { result: "fit", reasons }
}

export type FitCheckGateStatus = "fit" | "fit_check_required" | "fit_check_blocked"

/** The stored columns the gate needs. Deliberately narrower than the row. */
export interface StoredFitCheckAssessment {
  userId: string
  policyVersion: string
  result: string
  expiresAt: Date | string
}

/**
 * The one place that decides whether a persisted assessment still speaks for
 * the user in front of us. Ownership, policy version and expiry are all
 * re-checked here rather than trusted from the query that loaded the row.
 */
export function fitCheckStatusFor(
  assessment: StoredFitCheckAssessment | null | undefined,
  userId: string,
): FitCheckGateStatus {
  if (!assessment) return "fit_check_required"
  if (assessment.userId !== userId) return "fit_check_required"
  if (assessment.policyVersion !== FIT_CHECK_POLICY_VERSION) return "fit_check_required"

  const expiresAt =
    assessment.expiresAt instanceof Date ? assessment.expiresAt : new Date(assessment.expiresAt)
  if (!Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
    return "fit_check_required"
  }

  return assessment.result === "fit" ? "fit" : "fit_check_blocked"
}
