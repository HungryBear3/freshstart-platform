/**
 * Illinois Supreme Court Approved Standardized Divorce Forms
 * 
 * These forms are required to be accepted by all Illinois Circuit Courts.
 * Source: https://www.illinoiscourts.gov/forms/approved-forms/forms-circuit-court/divorce-child-support-maintenance
 * 
 * Forms should be downloaded and placed in public/forms/ directory
 */

export interface CourtForm {
  id: string
  name: string
  description: string
  category: FormCategory
  filename: string
  officialUrl: string
  version: string
  lastUpdated: string
  requiredFor: ('with_children' | 'no_children' | 'both')[]
  instructions?: string
  relatedQuestionnaires: string[]
}

export type FormCategory = 
  | 'petition'
  | 'financial'
  | 'parenting'
  | 'service'
  | 'judgment'
  | 'support'

export const FORM_CATEGORIES: Record<FormCategory, { name: string; description: string }> = {
  petition: {
    name: 'Petition Forms',
    description: 'Forms to initiate divorce proceedings'
  },
  financial: {
    name: 'Financial Disclosure Forms',
    description: 'Forms for disclosing income, expenses, assets, and debts'
  },
  parenting: {
    name: 'Parenting Forms',
    description: 'Forms for custody, visitation, and parental responsibilities'
  },
  service: {
    name: 'Service Forms',
    description: 'Forms for serving documents and proof of service'
  },
  judgment: {
    name: 'Judgment Forms',
    description: 'Final judgment and decree forms'
  },
  support: {
    name: 'Support Forms',
    description: 'Child support and maintenance forms'
  }
}

/**
 * Official Illinois Court Forms for Divorce
 * 
 * Download URLs based on illinoiscourts.gov standardized forms
 */
export const ILLINOIS_COURT_FORMS: CourtForm[] = [
  // ========== PETITION FORMS ==========
  {
    id: 'petition-no-children',
    name: 'Petition for Dissolution of Marriage (No Children)',
    description: 'Initial petition to start divorce proceedings when there are no minor children from the marriage.',
    category: 'petition',
    filename: 'petition-dissolution-no-children.pdf',
    officialUrl: 'https://www.illinoiscourts.gov/documents-and-forms/approved-forms/circuit-court-standardized-forms-suites/divorce-child-support-maintenance/',
    version: '2024',
    lastUpdated: '2024-01-01',
    requiredFor: ['no_children'],
    instructions: 'Complete all sections about petitioner, respondent, marriage details, and grounds for divorce.',
    relatedQuestionnaires: ['basic-information', 'marriage-details']
  },
  {
    id: 'petition-with-children',
    name: 'Petition for Dissolution of Marriage (With Children)',
    description: 'Initial petition to start divorce proceedings when there are minor children from the marriage.',
    category: 'petition',
    filename: 'petition-dissolution-with-children.pdf',
    officialUrl: 'https://www.illinoiscourts.gov/documents-and-forms/approved-forms/circuit-court-standardized-forms-suites/divorce-child-support-maintenance/',
    version: '2024',
    lastUpdated: '2024-01-01',
    requiredFor: ['with_children'],
    instructions: 'Complete all sections including information about each minor child.',
    relatedQuestionnaires: ['basic-information', 'marriage-details', 'children-information']
  },
  {
    id: 'summons',
    name: 'Summons - Dissolution of Marriage',
    description: 'Official notice to respondent that divorce proceedings have been filed.',
    category: 'petition',
    filename: 'summons-dissolution.pdf',
    officialUrl: 'https://www.illinoiscourts.gov/documents-and-forms/approved-forms/circuit-court-standardized-forms-suites/divorce-child-support-maintenance/',
    version: '2024',
    lastUpdated: '2024-01-01',
    requiredFor: ['both'],
    instructions: 'Must be served on respondent along with the petition.',
    relatedQuestionnaires: ['basic-information']
  },
  {
    id: 'appearance',
    name: 'Appearance',
    description: 'Form for respondent to file acknowledging receipt of petition.',
    category: 'petition',
    filename: 'appearance.pdf',
    officialUrl: 'https://www.illinoiscourts.gov/documents-and-forms/approved-forms/circuit-court-standardized-forms-suites/divorce-child-support-maintenance/',
    version: '2024',
    lastUpdated: '2024-01-01',
    requiredFor: ['both'],
    instructions: 'Respondent files this to enter an appearance in the case.',
    relatedQuestionnaires: []
  },

  // ========== FINANCIAL FORMS ==========
  {
    id: 'financial-affidavit',
    name: 'Financial Affidavit (Family & Divorce Cases)',
    description: 'Comprehensive disclosure of income, expenses, assets, and debts required in all divorce cases.',
    category: 'financial',
    filename: 'financial-affidavit.pdf',
    officialUrl: 'https://www.illinoiscourts.gov/documents-and-forms/approved-forms/circuit-court-standardized-forms-suites/financial-affidavit/',
    version: '2025',
    lastUpdated: '2025-06-01',
    requiredFor: ['both'],
    instructions: 'Both parties must complete and exchange. Must be updated if circumstances change.',
    relatedQuestionnaires: ['financial-information', 'income-employment', 'assets-debts']
  },
  {
    id: 'schedule-a-child-support',
    name: 'Schedule A - Child Support Worksheet',
    description: 'Worksheet to calculate child support based on Illinois guidelines.',
    category: 'financial',
    filename: 'schedule-a-child-support.pdf',
    officialUrl: 'https://www.illinoiscourts.gov/documents-and-forms/approved-forms/circuit-court-standardized-forms-suites/financial-affidavit/',
    version: '2025',
    lastUpdated: '2025-06-01',
    requiredFor: ['with_children'],
    instructions: 'Use income figures from Financial Affidavit to calculate support.',
    relatedQuestionnaires: ['financial-information', 'children-information']
  },
  {
    id: 'schedule-b-health-insurance',
    name: 'Schedule B - Health Insurance',
    description: 'Details about health insurance coverage for children.',
    category: 'financial',
    filename: 'schedule-b-health-insurance.pdf',
    officialUrl: 'https://www.illinoiscourts.gov/documents-and-forms/approved-forms/circuit-court-standardized-forms-suites/financial-affidavit/',
    version: '2025',
    lastUpdated: '2025-06-01',
    requiredFor: ['with_children'],
    instructions: 'Complete information about current and proposed health insurance for children.',
    relatedQuestionnaires: ['children-information', 'financial-information']
  },
  {
    id: 'schedule-c-debts',
    name: 'Schedule C - Debts',
    description: 'Detailed listing of all marital and individual debts.',
    category: 'financial',
    filename: 'schedule-c-debts.pdf',
    officialUrl: 'https://www.illinoiscourts.gov/documents-and-forms/approved-forms/circuit-court-standardized-forms-suites/financial-affidavit/',
    version: '2025',
    lastUpdated: '2025-06-01',
    requiredFor: ['both'],
    instructions: 'List all debts including credit cards, loans, mortgages, etc.',
    relatedQuestionnaires: ['assets-debts']
  },
  {
    id: 'schedule-d-accounts',
    name: 'Schedule D - Bank/Investment Accounts',
    description: 'Detailed listing of all bank accounts and investments.',
    category: 'financial',
    filename: 'schedule-d-accounts.pdf',
    officialUrl: 'https://www.illinoiscourts.gov/documents-and-forms/approved-forms/circuit-court-standardized-forms-suites/financial-affidavit/',
    version: '2025',
    lastUpdated: '2025-06-01',
    requiredFor: ['both'],
    instructions: 'List all checking, savings, investment, and brokerage accounts.',
    relatedQuestionnaires: ['assets-debts']
  },
  {
    id: 'schedule-e-business',
    name: 'Schedule E - Business Interests',
    description: 'Details about any business ownership or interests.',
    category: 'financial',
    filename: 'schedule-e-business.pdf',
    officialUrl: 'https://www.illinoiscourts.gov/documents-and-forms/approved-forms/circuit-court-standardized-forms-suites/financial-affidavit/',
    version: '2025',
    lastUpdated: '2025-06-01',
    requiredFor: ['both'],
    instructions: 'Complete only if you or spouse own a business or have business interests.',
    relatedQuestionnaires: ['assets-debts', 'income-employment']
  },
  {
    id: 'schedule-f-retirement',
    name: 'Schedule F - Retirement Accounts',
    description: 'Details about retirement accounts, pensions, and 401(k)s.',
    category: 'financial',
    filename: 'schedule-f-retirement.pdf',
    officialUrl: 'https://www.illinoiscourts.gov/documents-and-forms/approved-forms/circuit-court-standardized-forms-suites/financial-affidavit/',
    version: '2025',
    lastUpdated: '2025-06-01',
    requiredFor: ['both'],
    instructions: 'List all retirement accounts including 401(k), IRA, pension plans.',
    relatedQuestionnaires: ['assets-debts']
  },

  // ========== PARENTING FORMS ==========
  {
    id: 'parenting-plan',
    name: 'Parenting Plan',
    description: 'Comprehensive plan for allocation of parental responsibilities and parenting time.',
    category: 'parenting',
    filename: 'parenting-plan.pdf',
    officialUrl: 'https://www.illinoiscourts.gov/documents-and-forms/approved-forms/circuit-court-standardized-forms-suites/divorce-child-support-maintenance/',
    version: '2024',
    lastUpdated: '2024-01-01',
    requiredFor: ['with_children'],
    instructions: 'Must be filed in all cases with minor children. Covers decision-making and parenting time.',
    relatedQuestionnaires: ['children-information', 'parenting-plan']
  },
  {
    id: 'allocation-judgment',
    name: 'Allocation Judgment',
    description: 'Court order establishing parental responsibilities and parenting time.',
    category: 'parenting',
    filename: 'allocation-judgment.pdf',
    officialUrl: 'https://www.illinoiscourts.gov/documents-and-forms/approved-forms/circuit-court-standardized-forms-suites/divorce-child-support-maintenance/',
    version: '2024',
    lastUpdated: '2024-01-01',
    requiredFor: ['with_children'],
    instructions: 'Final court order based on approved parenting plan.',
    relatedQuestionnaires: ['parenting-plan']
  },

  // ========== SERVICE FORMS ==========
  {
    id: 'certificate-of-service',
    name: 'Certificate of Service',
    description: 'Proof that documents were properly served on the other party.',
    category: 'service',
    filename: 'certificate-of-service.pdf',
    officialUrl: 'https://www.illinoiscourts.gov/documents-and-forms/approved-forms/circuit-court-standardized-forms-suites/divorce-child-support-maintenance/',
    version: '2024',
    lastUpdated: '2024-01-01',
    requiredFor: ['both'],
    instructions: 'File with court to prove service of documents on other party.',
    relatedQuestionnaires: []
  },
  {
    id: 'affidavit-service-special-process',
    name: 'Affidavit of Service by Special Process Server',
    description: 'Sworn statement from process server confirming service.',
    category: 'service',
    filename: 'affidavit-service-special.pdf',
    officialUrl: 'https://www.illinoiscourts.gov/documents-and-forms/approved-forms/circuit-court-standardized-forms-suites/divorce-child-support-maintenance/',
    version: '2024',
    lastUpdated: '2024-01-01',
    requiredFor: ['both'],
    instructions: 'Used when petition is served by special process server rather than sheriff.',
    relatedQuestionnaires: []
  },
  {
    id: 'waiver-service',
    name: 'Waiver of Service',
    description: 'Form for respondent to waive formal service of process.',
    category: 'service',
    filename: 'waiver-service.pdf',
    officialUrl: 'https://www.illinoiscourts.gov/documents-and-forms/approved-forms/circuit-court-standardized-forms-suites/divorce-child-support-maintenance/',
    version: '2024',
    lastUpdated: '2024-01-01',
    requiredFor: ['both'],
    instructions: 'Respondent can sign this to waive formal service, saving time and cost.',
    relatedQuestionnaires: []
  },

  // ========== JUDGMENT FORMS ==========
  {
    id: 'judgment-no-children',
    name: 'Judgment of Dissolution of Marriage (No Children)',
    description: 'Final divorce decree when there are no minor children.',
    category: 'judgment',
    filename: 'judgment-dissolution-no-children.pdf',
    officialUrl: 'https://www.illinoiscourts.gov/documents-and-forms/approved-forms/circuit-court-standardized-forms-suites/divorce-child-support-maintenance/',
    version: '2024',
    lastUpdated: '2024-01-01',
    requiredFor: ['no_children'],
    instructions: 'Submitted for judge signature at final hearing.',
    relatedQuestionnaires: ['basic-information', 'marriage-details', 'assets-debts']
  },
  {
    id: 'judgment-with-children',
    name: 'Judgment of Dissolution of Marriage/Civil Union (With Children)',
    description: 'Final divorce decree when there are minor children.',
    category: 'judgment',
    filename: 'judgment-dissolution-with-children.pdf',
    officialUrl: 'https://www.illinoiscourts.gov/documents-and-forms/approved-forms/circuit-court-standardized-forms-suites/divorce-child-support-maintenance/',
    version: '2024',
    lastUpdated: '2024-01-01',
    requiredFor: ['with_children'],
    instructions: 'Submitted for judge signature at final hearing. Includes provisions for children.',
    relatedQuestionnaires: ['basic-information', 'marriage-details', 'children-information', 'parenting-plan']
  },
  {
    id: 'marital-settlement-agreement',
    name: 'Marital Settlement Agreement',
    description: 'Agreement between parties on division of property, debts, and other matters.',
    category: 'judgment',
    filename: 'marital-settlement-agreement.pdf',
    officialUrl: 'https://www.illinoiscourts.gov/documents-and-forms/approved-forms/circuit-court-standardized-forms-suites/divorce-child-support-maintenance/',
    version: '2024',
    lastUpdated: '2024-01-01',
    requiredFor: ['both'],
    instructions: 'Both parties must sign. Becomes part of the final judgment.',
    relatedQuestionnaires: ['assets-debts', 'property-division']
  },

  // ========== SUPPORT FORMS ==========
  {
    id: 'child-support-order',
    name: 'Child Support Order',
    description: 'Court order establishing child support obligations.',
    category: 'support',
    filename: 'child-support-order.pdf',
    officialUrl: 'https://www.illinoiscourts.gov/documents-and-forms/approved-forms/circuit-court-standardized-forms-suites/divorce-child-support-maintenance/',
    version: '2024',
    lastUpdated: '2024-01-01',
    requiredFor: ['with_children'],
    instructions: 'Based on child support worksheet calculations.',
    relatedQuestionnaires: ['financial-information', 'children-information']
  },
  {
    id: 'income-withholding-order',
    name: 'Income Withholding for Support Order',
    description: 'Order directing employer to withhold support from wages.',
    category: 'support',
    filename: 'income-withholding-order.pdf',
    officialUrl: 'https://www.illinoiscourts.gov/documents-and-forms/approved-forms/circuit-court-standardized-forms-suites/divorce-child-support-maintenance/',
    version: '2024',
    lastUpdated: '2024-01-01',
    requiredFor: ['with_children'],
    instructions: 'Required in most cases where support is ordered.',
    relatedQuestionnaires: ['financial-information']
  }
]

/**
 * Get forms by category
 */
export function getFormsByCategory(category: FormCategory): CourtForm[] {
  return ILLINOIS_COURT_FORMS.filter(form => form.category === category)
}

/**
 * Get forms required for a case type
 */
export function getFormsForCaseType(hasChildren: boolean): CourtForm[] {
  const caseType = hasChildren ? 'with_children' : 'no_children'
  return ILLINOIS_COURT_FORMS.filter(
    form => form.requiredFor.includes(caseType) || form.requiredFor.includes('both')
  )
}

/**
 * Get form by ID
 */
export function getFormById(id: string): CourtForm | undefined {
  return ILLINOIS_COURT_FORMS.find(form => form.id === id)
}

/**
 * Get forms related to a questionnaire
 */
export function getFormsForQuestionnaire(questionnaireSlug: string): CourtForm[] {
  return ILLINOIS_COURT_FORMS.filter(
    form => form.relatedQuestionnaires.includes(questionnaireSlug)
  )
}

/**
 * Get the local path to a form PDF
 */
export function getFormPath(form: CourtForm): string {
  return `/forms/${form.filename}`
}

/**
 * Check if form PDF exists locally (client-side check)
 */
export async function checkFormExists(form: CourtForm): Promise<boolean> {
  try {
    const response = await fetch(getFormPath(form), { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Forms download instructions for manual setup
 */
export const FORMS_DOWNLOAD_INSTRUCTIONS = `
# Illinois Court Forms Download Instructions

The following forms need to be downloaded from illinoiscourts.gov and placed in the public/forms/ directory.

## Divorce Forms (With & Without Children)
Download from: https://www.illinoiscourts.gov/documents-and-forms/approved-forms/circuit-court-standardized-forms-suites/divorce-child-support-maintenance/

Required files:
- petition-dissolution-no-children.pdf
- petition-dissolution-with-children.pdf
- summons-dissolution.pdf
- appearance.pdf
- parenting-plan.pdf
- allocation-judgment.pdf
- certificate-of-service.pdf
- affidavit-service-special.pdf
- waiver-service.pdf
- judgment-dissolution-no-children.pdf
- judgment-dissolution-with-children.pdf
- marital-settlement-agreement.pdf
- child-support-order.pdf
- income-withholding-order.pdf

## Financial Affidavit Forms
Download from: https://www.illinoiscourts.gov/documents-and-forms/approved-forms/circuit-court-standardized-forms-suites/financial-affidavit/

Required files:
- financial-affidavit.pdf
- schedule-a-child-support.pdf
- schedule-b-health-insurance.pdf
- schedule-c-debts.pdf
- schedule-d-accounts.pdf
- schedule-e-business.pdf
- schedule-f-retirement.pdf

## Notes
1. Download each PDF form
2. Rename to match the filename listed above
3. Place in public/forms/ directory
4. Forms will be available at /forms/[filename] in the app
`
