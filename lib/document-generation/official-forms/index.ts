/**
 * Official Illinois Court Forms Module
 * 
 * This module provides functionality for filling official Illinois
 * Supreme Court approved divorce and family law forms.
 */

import {
  getFieldMapCompatibility,
  isFieldMapCompatibilityProven,
} from '@/lib/forms/field-map-compatibility'
import { getFormById } from '@/lib/forms/illinois-court-forms'
import { resolveOfficialFormTemplateSource } from './template-source'

// Field Mappings
export {
  type FieldMapping,
  type FieldType,
  PETITION_NO_CHILDREN_FIELD_MAP,
  PETITION_WITH_CHILDREN_FIELD_MAP,
  FINANCIAL_AFFIDAVIT_FIELD_MAP,
  PARENTING_PLAN_FIELD_MAP,
  SUMMONS_FIELD_MAP,
  getFieldMapping,
  applyFieldMappings,
  getRequiredQuestionnaireFields,
  validateFieldsPresent,
  formatDate,
  formatCurrency,
  formatCounty,
  formatGrounds,
  formatEmploymentStatus,
  formatDecisionMaking,
  formatScheduleType,
  formatParent,
  formatExchangeTime,
  formatHolidayApproach,
  formatSummerApproach,
  formatCommunicationMethod,
  formatResponseTime,
  formatExchangeLocation,
  formatTransportation,
} from './field-mappings'

// Petition Filler
export {
  type PetitionData,
  type FillPetitionOptions,
  fillPetition,
  fillPetitionNoChildren,
  fillPetitionWithChildren,
  generateFilledPetitionFromQuestionnaire,
  inspectPdfFormFields,
} from './petition-filler'

// Import for local use in generateOfficialForm
import { generateFilledPetitionFromQuestionnaire } from './petition-filler'

// Financial Affidavit Filler
export {
  type FinancialAffidavitData,
  type FillFinancialAffidavitOptions,
  fillFinancialAffidavit,
  generateFilledFinancialAffidavitFromQuestionnaire,
} from './financial-affidavit-filler'

// Import for local use in generateOfficialForm
import { generateFilledFinancialAffidavitFromQuestionnaire } from './financial-affidavit-filler'

// Parenting Plan Filler
export {
  type ChildInfo,
  type ParentingPlanData,
  type FillParentingPlanOptions,
  fillParentingPlan,
  generateFilledParentingPlanFromQuestionnaire,
} from './parenting-plan-filler'

// Import for local use in generateOfficialForm
import { generateFilledParentingPlanFromQuestionnaire } from './parenting-plan-filler'

// Form Types
/**
 * The identities this module will consider for generation.
 *
 * Membership is earned twice over, and asserted by test both ways: the id is a
 * `CourtForm` row whose authority is `illinois_supreme_court`, AND it has a
 * bound field map in `OFFICIAL_FIELD_MAP_BINDINGS`. It is a literal rather than
 * a derived array only because the union type has to be literal; the test pins
 * it to the derived set so the two cannot drift.
 *
 * The union used to stand on its own and carried all nine legacy identities,
 * so rows the catalog had reclassified kept a live generation identity and a
 * template path. Those four now sit in `QUARANTINED_FORM_TYPES` instead.
 */
export const OFFICIAL_FORM_TYPES = [
  'petition-no-children',
  'petition-with-children',
  'summons',
  'financial-affidavit',
  'parenting-plan',
] as const

export type OfficialFormType = (typeof OFFICIAL_FORM_TYPES)[number]

/**
 * The generation identities this module has a filler for.
 *
 * Narrower than `OFFICIAL_FORM_TYPES` by `summons`: it has a catalog row and a
 * bound field map, so it is a generation identity, but no summons filler has
 * ever been written. Identity and implementation are separate facts, and a
 * verified summons map must not read as "can generate a summons". Kept as an
 * allowlist so a type added to `OFFICIAL_FORM_TYPES` starts out unimplemented.
 */
export const OFFICIAL_FORM_FILLER_TYPES = [
  'petition-no-children',
  'petition-with-children',
  'financial-affidavit',
  'parenting-plan',
] as const satisfies readonly OfficialFormType[]

type OfficialFormFillerType = (typeof OFFICIAL_FORM_FILLER_TYPES)[number]

function hasOfficialFormFiller(formType: string): formType is OfficialFormFillerType {
  return (OFFICIAL_FORM_FILLER_TYPES as readonly string[]).includes(formType)
}

/**
 * Identities this module accepted for generation before the catalog was
 * reconciled, now closed — recorded rather than deleted.
 *
 * Deleting them would lose the fact that this surface once offered to generate
 * a document FreshStart authored, and one for which no official artifact was
 * ever corroborated. Each is still a catalog row, so a test can assert it is
 * refused rather than merely absent.
 */
export const QUARANTINED_FORM_TYPES = [
  {
    formType: 'certificate-of-service',
    reason: 'unverified_identity: no corroborated official artifact of any authority',
  },
  {
    formType: 'judgment-no-children',
    reason: 'statewide artifact pinned, but no field map has ever been written for it',
  },
  {
    formType: 'judgment-with-children',
    reason: 'statewide artifact pinned, but no field map has ever been written for it',
  },
  {
    formType: 'marital-settlement-agreement',
    reason: 'freshstart_template: authored by FreshStart, never an official court form',
  },
] as const

/**
 * Generate a filled official form based on type and questionnaire data
 */
export async function generateOfficialForm(
  formType: OfficialFormType,
  questionnaireData: Record<string, any>,
  additionalParams?: {
    hasChildren?: boolean
    parent1Name?: string
    parent2Name?: string
    flatten?: boolean
  }
): Promise<Uint8Array> {
  const flatten = additionalParams?.flatten ?? true

  // Identity first, before any filler is selected. Each filler also refuses at
  // the template choke point; this refuses earlier so no filler is entered and
  // no request is issued.
  //
  // An id off the catalog entirely — a quarantined identity a caller still
  // holds, or a row since retired — must refuse here rather than fall through
  // to a compatibility lookup that throws about a form that does not exist.
  if (!getFormById(formType)) {
    throw new Error(
      `${formType} is not a catalog entry. No official form was generated.`
    )
  }
  // A generation identity with no filler is refused as such, whatever its field
  // map's state: a proven map would otherwise be reported as the only blocker.
  if (!hasOfficialFormFiller(formType)) {
    throw new Error(
      `${formType} has no filler in this module; generation is not implemented for it. No official form was generated.`
    )
  }
  // Deliberately NOT worded "not yet implemented": these four maps exist and
  // are fully written, and the blocker is that none has been compared against
  // the PDF the catalog pins for it.
  if (!isFieldMapCompatibilityProven(formType)) {
    const { status, blockers } = getFieldMapCompatibility(formType)
    throw new Error(
      `${formType} has no verified field map (${status}): ${blockers.join('; ')}. No official form was generated.`
    )
  }

  switch (formType) {
    case 'petition-no-children':
      return generateFilledPetitionFromQuestionnaire(questionnaireData, false, { flatten })
    
    case 'petition-with-children':
      return generateFilledPetitionFromQuestionnaire(questionnaireData, true, { flatten })
    
    case 'financial-affidavit':
      return generateFilledFinancialAffidavitFromQuestionnaire(questionnaireData, { flatten })
    
    case 'parenting-plan':
      if (!additionalParams?.parent1Name || !additionalParams?.parent2Name) {
        throw new Error('Parent names are required for parenting plan')
      }
      return generateFilledParentingPlanFromQuestionnaire(
        questionnaireData,
        additionalParams.parent1Name,
        additionalParams.parent2Name,
        { flatten }
      )
    
    default: {
      // Unreachable: every filler type has a case above, which `never` enforces.
      const unhandled: never = formType
      throw new Error(`${unhandled} has no filler in this module. No official form was generated.`)
    }
  }
}

/**
 * Whether a form type may be filled.
 *
 * Requires both a filler in this module and proven field-map compatibility. The
 * previous hand-kept list named four types whose maps had never been compared
 * against any artifact, so "supported" meant only that someone had written a
 * map; compatibility alone would repeat that for `summons`, which has a map and
 * no filler.
 */
export function isFormTypeSupported(formType: string): boolean {
  return hasOfficialFormFiller(formType) && isFieldMapCompatibilityProven(formType)
}

/**
 * Where an official template may be read from.
 *
 * Was a 9-entry table returning `/forms/<filename>` with no gate of any kind —
 * including for `certificate-of-service` (unverified identity) and
 * `marital-settlement-agreement` (FreshStart template). It now goes through the
 * one choke point, which refuses for every entry.
 */
export function getFormTemplatePath(formType: OfficialFormType): string {
  return resolveOfficialFormTemplateSource(formType)
}
