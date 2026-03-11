/**
 * Official Illinois Court Forms Module
 * 
 * This module provides functionality for filling official Illinois
 * Supreme Court approved divorce and family law forms.
 */

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
export type OfficialFormType = 
  | 'petition-no-children'
  | 'petition-with-children'
  | 'financial-affidavit'
  | 'parenting-plan'
  | 'summons'
  | 'certificate-of-service'
  | 'judgment-no-children'
  | 'judgment-with-children'
  | 'marital-settlement-agreement'

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
    
    default:
      throw new Error(`Form type "${formType}" is not yet implemented`)
  }
}

/**
 * Check if a form type is supported for filling
 */
export function isFormTypeSupported(formType: string): boolean {
  const supportedTypes: OfficialFormType[] = [
    'petition-no-children',
    'petition-with-children',
    'financial-affidavit',
    'parenting-plan',
  ]
  
  return supportedTypes.includes(formType as OfficialFormType)
}

/**
 * Get the PDF template path for a form type
 */
export function getFormTemplatePath(formType: OfficialFormType): string {
  const templates: Record<OfficialFormType, string> = {
    'petition-no-children': '/forms/petition-dissolution-no-children.pdf',
    'petition-with-children': '/forms/petition-dissolution-with-children.pdf',
    'financial-affidavit': '/forms/financial-affidavit.pdf',
    'parenting-plan': '/forms/parenting-plan.pdf',
    'summons': '/forms/summons-dissolution.pdf',
    'certificate-of-service': '/forms/certificate-of-service.pdf',
    'judgment-no-children': '/forms/judgment-dissolution-no-children.pdf',
    'judgment-with-children': '/forms/judgment-dissolution-with-children.pdf',
    'marital-settlement-agreement': '/forms/marital-settlement-agreement.pdf',
  }
  
  return templates[formType]
}
