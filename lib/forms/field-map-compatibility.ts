/**
 * Questionnaire / field-map compatibility for the pinned Illinois artifacts.
 *
 * Compatibility has two halves, and only one of them can be settled inside this
 * repository.
 *
 * The QUESTIONNAIRE half — does every `questionnaireField` a map reads exist in
 * the one questionnaire whose response object generation would receive? — is
 * checked here against the real seeded definitions, and currently holds for all
 * five maps.
 *
 * The ARTIFACT half — are the map's `pdfField` names the AcroForm field names of
 * the exact PDF the catalog pins? — has never been checked for any entry.
 * `field-mappings.ts` says so in its own header ("These mappings need to be
 * verified against the actual PDF forms once downloaded"), and the artifacts are
 * deliberately absent from the repository. So the `pdfField` values are
 * conventional guesses: `PETITION_NO_CHILDREN_FIELD_MAP` is written as though it
 * fills ATJ 103.4 (03/25) without anything here having opened that artifact.
 *
 * This module therefore cannot PROVE compatibility. It makes the absence of
 * proof executable and fails closed, which is a precondition for the field-map
 * and generated-output review (§7.7 of the 2026-09-21 reconciliation review),
 * not a substitute for it. Nothing here is generation, download, packet, filing,
 * or release authority.
 */
import {
  ILLINOIS_COURT_FORMS,
  getFormById,
  type CourtForm,
} from "@/lib/forms/illinois-court-forms"
import { isQuestionnaireId, questionnaireHasField } from "@/lib/questionnaires/registry"
import {
  type FieldMapping,
  PETITION_NO_CHILDREN_FIELD_MAP,
  PETITION_WITH_CHILDREN_FIELD_MAP,
  FINANCIAL_AFFIDAVIT_FIELD_MAP,
  PARENTING_PLAN_FIELD_MAP,
  SUMMONS_FIELD_MAP,
} from "@/lib/document-generation/official-forms/field-mappings"

/**
 * A record that a field map was actually compared against a specific artifact.
 *
 * Every field is checked, not just `sha256`. Matching bytes with a mismatched
 * printed identity means one of the two records is wrong, and a record carrying
 * no method or no real date is not evidence that anyone performed a comparison —
 * accepting either would let a malformed entry unlock generation.
 */
export interface FieldMapArtifactVerification {
  /** Must equal the catalog row's pinned `provenance.printedCode`. */
  printedCode: string
  /** Must equal the catalog row's pinned `provenance.printedRevision`. */
  printedRevision: string
  /** Must equal the catalog row's pinned `provenance.sha256`. */
  sha256: string
  /** When the comparison was performed. Strict `YYYY-MM-DD`, not in the future. */
  verifiedAt: string
  /** How it was performed, e.g. "AcroForm field readback". Must say something. */
  method: string
}

/** Shortest `method` that can describe anything. Blocks "", "  " and "ok". */
const MIN_METHOD_LENGTH = 3

/**
 * Strict `YYYY-MM-DD`, and a real calendar day.
 *
 * `new Date(s)` alone is not enough: it accepts "2026-02-30" and rolls it
 * forward to March 2nd, so a date that never existed would pass as one that did.
 */
function parseVerificationDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const parsed = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString().slice(0, 10) === value ? parsed : null
}

export interface OfficialFieldMapBinding {
  /** A `CourtForm` id. Never a free-form label. */
  formId: string
  mapName: string
  /** The ONE questionnaire whose response object this map reads. */
  questionnaireId: string
  mapping: readonly FieldMapping[]
  /** `null` until the map has been compared against the pinned artifact. */
  verifiedAgainstArtifact: FieldMapArtifactVerification | null
}

/**
 * Every field map that exists, bound to the catalog row it claims to fill.
 *
 * All five verifications are `null`. That is the current state of the evidence,
 * not an oversight: no pinned Illinois artifact is present in this repository to
 * compare against.
 */
export const OFFICIAL_FIELD_MAP_BINDINGS: readonly OfficialFieldMapBinding[] = [
  {
    formId: "petition-no-children",
    mapName: "PETITION_NO_CHILDREN_FIELD_MAP",
    questionnaireId: "petition",
    mapping: PETITION_NO_CHILDREN_FIELD_MAP,
    verifiedAgainstArtifact: null,
  },
  {
    formId: "petition-with-children",
    mapName: "PETITION_WITH_CHILDREN_FIELD_MAP",
    questionnaireId: "petition",
    mapping: PETITION_WITH_CHILDREN_FIELD_MAP,
    verifiedAgainstArtifact: null,
  },
  {
    formId: "summons",
    mapName: "SUMMONS_FIELD_MAP",
    questionnaireId: "petition",
    mapping: SUMMONS_FIELD_MAP,
    verifiedAgainstArtifact: null,
  },
  {
    formId: "financial-affidavit",
    mapName: "FINANCIAL_AFFIDAVIT_FIELD_MAP",
    questionnaireId: "financial_affidavit",
    mapping: FINANCIAL_AFFIDAVIT_FIELD_MAP,
    verifiedAgainstArtifact: null,
  },
  {
    formId: "parenting-plan",
    mapName: "PARENTING_PLAN_FIELD_MAP",
    questionnaireId: "parenting_plan",
    mapping: PARENTING_PLAN_FIELD_MAP,
    verifiedAgainstArtifact: null,
  },
]

export type FieldMapCompatibilityStatus =
  /** The catalog row has no field map at all. */
  | "no_field_map"
  /** The map names a questionnaire this product does not define. */
  | "questionnaire_unresolved"
  /** The map reads fields its own questionnaire does not carry. */
  | "questionnaire_fields_missing"
  /** Both questionnaire checks pass; the map has not been checked against the PDF. */
  | "artifact_unverified"
  /** Every check passes. No entry holds this today. */
  | "compatible"

export interface FieldMapCompatibility {
  formId: string
  status: FieldMapCompatibilityStatus
  /** `null` when the row has no field map. */
  questionnaireId: string | null
  missingQuestionnaireFields: string[]
  verifiedAgainstArtifact: FieldMapArtifactVerification | null
  /** Human-readable, one per unmet condition. Empty only when `compatible`. */
  blockers: string[]
}

const BINDING_BY_FORM_ID: ReadonlyMap<string, OfficialFieldMapBinding> = new Map(
  OFFICIAL_FIELD_MAP_BINDINGS.map((b) => [b.formId, b] as const),
)

export interface FieldMapCompatibilityOptions {
  /** Injected so nothing here depends on the wall clock. Defaults to now. */
  today?: Date
}

/**
 * Evaluate one binding. Exported so a candidate binding can be asserted against
 * without being added to the shipped list.
 *
 * The questionnaire checks are ordered and stop at the first failure: a map
 * whose questionnaire does not exist has no meaningful field check, and a map
 * that cannot read its inputs has no meaningful artifact question. The artifact
 * checks are NOT ordered — every defect in a verification record is reported at
 * once, because a reviewer told about one field at a time learns the record is
 * sound when the complaints stop, which is a different thing.
 */
export function evaluateFieldMapBinding(
  binding: OfficialFieldMapBinding,
  options: FieldMapCompatibilityOptions = {},
): FieldMapCompatibility {
  const base = {
    formId: binding.formId,
    questionnaireId: binding.questionnaireId,
    verifiedAgainstArtifact: binding.verifiedAgainstArtifact,
  }

  if (!isQuestionnaireId(binding.questionnaireId)) {
    return {
      ...base,
      status: "questionnaire_unresolved",
      missingQuestionnaireFields: [],
      blockers: [
        `${binding.mapName} reads questionnaire "${binding.questionnaireId}", which this product does not define`,
      ],
    }
  }

  const missing = [
    ...new Set(
      binding.mapping
        .map((m) => m.questionnaireField)
        .filter((field) => !questionnaireHasField(binding.questionnaireId, field)),
    ),
  ]
  if (missing.length > 0) {
    return {
      ...base,
      status: "questionnaire_fields_missing",
      missingQuestionnaireFields: missing,
      blockers: [
        `${binding.mapName} reads ${missing.length} field(s) absent from questionnaire "${binding.questionnaireId}": ${missing.join(", ")}`,
      ],
    }
  }

  const form = getFormById(binding.formId)
  const pinned = form?.provenance ?? null
  const verification = binding.verifiedAgainstArtifact
  const unverified = (reasons: string[]): FieldMapCompatibility => ({
    ...base,
    status: "artifact_unverified",
    missingQuestionnaireFields: [],
    blockers: reasons,
  })

  if (!pinned) {
    return unverified([
      `${binding.formId} pins no artifact, so ${binding.mapName} has no artifact to be verified against`,
    ])
  }
  if (!verification) {
    return unverified([
      `${binding.mapName} has never been compared against the pinned artifact for ${binding.formId} (${pinned.printedCode} ${pinned.printedRevision})`,
    ])
  }

  const defects: string[] = []
  if (verification.sha256 !== pinned.sha256) {
    defects.push(
      `${binding.mapName} records SHA-256 ${verification.sha256}, which is not the artifact pinned for ${binding.formId} (${pinned.sha256})`,
    )
  }
  if (verification.printedCode !== pinned.printedCode) {
    defects.push(
      `${binding.mapName} records printed code "${verification.printedCode}", but ${binding.formId} pins "${pinned.printedCode}"`,
    )
  }
  if (verification.printedRevision !== pinned.printedRevision) {
    defects.push(
      `${binding.mapName} records printed revision "${verification.printedRevision}", but ${binding.formId} pins "${pinned.printedRevision}"`,
    )
  }
  if (verification.method.trim().length < MIN_METHOD_LENGTH) {
    defects.push(
      `${binding.mapName} records no usable verification method ("${verification.method}")`,
    )
  }
  const verifiedAt = parseVerificationDate(verification.verifiedAt)
  if (!verifiedAt) {
    defects.push(
      `${binding.mapName} records "${verification.verifiedAt}", which is not a real calendar date in YYYY-MM-DD form`,
    )
  } else if (verifiedAt.getTime() > (options.today ?? new Date()).getTime()) {
    defects.push(
      `${binding.mapName} records verification date ${verification.verifiedAt}, which is in the future`,
    )
  }

  if (defects.length > 0) return unverified(defects)

  return {
    ...base,
    status: "compatible",
    missingQuestionnaireFields: [],
    blockers: [],
  }
}

/** Throws for an id the catalog does not contain: a status for a form that does
 * not exist is a claim about nothing, and silently returning one would let a
 * retired identity keep reporting. */
export function getFieldMapCompatibility(
  formId: string,
  options: FieldMapCompatibilityOptions = {},
): FieldMapCompatibility {
  const form = getFormById(formId)
  if (!form) throw new Error(`${formId} is not a catalog entry`)

  const binding = BINDING_BY_FORM_ID.get(formId)
  if (!binding) {
    return {
      formId,
      status: "no_field_map",
      questionnaireId: null,
      missingQuestionnaireFields: [],
      verifiedAgainstArtifact: null,
      blockers: [`${formId} has no field map`],
    }
  }
  return evaluateFieldMapBinding(binding, options)
}

export function getAllFieldMapCompatibility(): FieldMapCompatibility[] {
  return ILLINOIS_COURT_FORMS.map((form: CourtForm) => getFieldMapCompatibility(form.id))
}

/**
 * The one question every generation surface asks.
 *
 * False for an unknown id as well as for an incompatible one — a caller holding
 * a retired identity must not be told it is cleared.
 */
export function isFieldMapCompatibilityProven(formId: string): boolean {
  if (!getFormById(formId)) return false
  return getFieldMapCompatibility(formId).status === "compatible"
}
