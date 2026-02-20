/**
 * Field Mappings for Official Illinois Court Forms
 * 
 * Maps questionnaire field IDs to official PDF form field names.
 * PDF field names are determined by inspecting the actual court forms.
 * 
 * Note: These mappings need to be verified against the actual PDF forms once downloaded.
 * PDF field names can be found using pdf-lib's form.getFields() method or
 * Adobe Acrobat's form field inspection.
 */

export type FieldType = 'text' | 'checkbox' | 'radio' | 'date' | 'number'

export interface FieldMapping {
  questionnaireField: string  // Field ID from questionnaire
  pdfField: string           // Field name in the official PDF form
  type: FieldType
  transform?: (value: any) => string  // Optional transform function
  section?: string           // Which section of the questionnaire
}

/**
 * Petition for Dissolution - No Children
 * Maps to: petition-dissolution-no-children.pdf
 */
export const PETITION_NO_CHILDREN_FIELD_MAP: FieldMapping[] = [
  // Personal Information
  { questionnaireField: 'petitioner-first-name', pdfField: 'PetitionerFirstName', type: 'text', section: 'personal-info' },
  { questionnaireField: 'petitioner-last-name', pdfField: 'PetitionerLastName', type: 'text', section: 'personal-info' },
  { questionnaireField: 'petitioner-middle-name', pdfField: 'PetitionerMiddleName', type: 'text', section: 'personal-info' },
  { questionnaireField: 'spouse-first-name', pdfField: 'RespondentFirstName', type: 'text', section: 'personal-info' },
  { questionnaireField: 'spouse-last-name', pdfField: 'RespondentLastName', type: 'text', section: 'personal-info' },
  
  // Marriage Information
  { 
    questionnaireField: 'marriage-date', 
    pdfField: 'DateOfMarriage', 
    type: 'date',
    transform: (value) => formatDate(value),
    section: 'personal-info'
  },
  { 
    questionnaireField: 'separation-date', 
    pdfField: 'DateOfSeparation', 
    type: 'date',
    transform: (value) => formatDate(value),
    section: 'personal-info'
  },
  
  // Residency
  { questionnaireField: 'petitioner-county', pdfField: 'County', type: 'text', section: 'residency', transform: (value) => formatCounty(value) },
  { questionnaireField: 'petitioner-address', pdfField: 'PetitionerAddress', type: 'text', section: 'residency' },
  { questionnaireField: 'spouse-address', pdfField: 'RespondentAddress', type: 'text', section: 'residency' },
  
  // Grounds
  { questionnaireField: 'grounds-type', pdfField: 'GroundsForDivorce', type: 'text', section: 'grounds', transform: (value) => formatGrounds(value) },
]

/**
 * Petition for Dissolution - With Children
 * Maps to: petition-dissolution-with-children.pdf
 */
export const PETITION_WITH_CHILDREN_FIELD_MAP: FieldMapping[] = [
  // Include all fields from no-children petition
  ...PETITION_NO_CHILDREN_FIELD_MAP,
  
  // Children Information
  { questionnaireField: 'has-children', pdfField: 'HasMinorChildren', type: 'checkbox', section: 'children', transform: (value) => value === 'yes' ? 'Yes' : 'No' },
  { questionnaireField: 'number-of-children', pdfField: 'NumberOfChildren', type: 'number', section: 'children' },
]

/**
 * Financial Affidavit
 * Maps to: financial-affidavit.pdf
 */
export const FINANCIAL_AFFIDAVIT_FIELD_MAP: FieldMapping[] = [
  // Personal Information
  { questionnaireField: 'full-name', pdfField: 'FullName', type: 'text', section: 'personal-info' },
  { questionnaireField: 'date-of-birth', pdfField: 'DateOfBirth', type: 'date', transform: (value) => formatDate(value), section: 'personal-info' },
  { questionnaireField: 'social-security-last-four', pdfField: 'SSNLast4', type: 'text', section: 'personal-info' },
  { questionnaireField: 'current-address', pdfField: 'CurrentAddress', type: 'text', section: 'personal-info' },
  { questionnaireField: 'employer-name', pdfField: 'EmployerName', type: 'text', section: 'personal-info' },
  { questionnaireField: 'occupation', pdfField: 'Occupation', type: 'text', section: 'personal-info' },
  
  // Employment Income
  { questionnaireField: 'employment-status', pdfField: 'EmploymentStatus', type: 'text', section: 'employment-income', transform: (value) => formatEmploymentStatus(value) },
  { questionnaireField: 'gross-monthly-salary', pdfField: 'GrossMonthlyIncome', type: 'number', section: 'employment-income', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'overtime-income', pdfField: 'OvertimeIncome', type: 'number', section: 'employment-income', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'bonus-income', pdfField: 'BonusIncome', type: 'number', section: 'employment-income', transform: (value) => formatCurrency(value) },
  
  // Other Income
  { questionnaireField: 'rental-income', pdfField: 'RentalIncome', type: 'number', section: 'other-income', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'investment-income', pdfField: 'InvestmentIncome', type: 'number', section: 'other-income', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'social-security-income', pdfField: 'SocialSecurityIncome', type: 'number', section: 'other-income', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'pension-income', pdfField: 'PensionIncome', type: 'number', section: 'other-income', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'disability-income', pdfField: 'DisabilityIncome', type: 'number', section: 'other-income', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'unemployment-income', pdfField: 'UnemploymentIncome', type: 'number', section: 'other-income', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'child-support-received', pdfField: 'ChildSupportReceived', type: 'number', section: 'other-income', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'spousal-support-received', pdfField: 'SpousalSupportReceived', type: 'number', section: 'other-income', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'other-income-amount', pdfField: 'OtherIncome', type: 'number', section: 'other-income', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'other-income-description', pdfField: 'OtherIncomeDescription', type: 'text', section: 'other-income' },
  
  // Housing Expenses
  { questionnaireField: 'monthly-rent-mortgage', pdfField: 'RentMortgage', type: 'number', section: 'housing-expenses', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'property-taxes', pdfField: 'PropertyTaxes', type: 'number', section: 'housing-expenses', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'homeowners-insurance', pdfField: 'HomeInsurance', type: 'number', section: 'housing-expenses', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'hoa-fees', pdfField: 'HOAFees', type: 'number', section: 'housing-expenses', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'home-maintenance', pdfField: 'HomeMaintenance', type: 'number', section: 'housing-expenses', transform: (value) => formatCurrency(value) },
  
  // Utility Expenses
  { questionnaireField: 'electricity', pdfField: 'Electricity', type: 'number', section: 'utility-expenses', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'gas-heating', pdfField: 'GasHeating', type: 'number', section: 'utility-expenses', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'water-sewer', pdfField: 'WaterSewer', type: 'number', section: 'utility-expenses', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'phone-cell', pdfField: 'PhoneCell', type: 'number', section: 'utility-expenses', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'internet-cable', pdfField: 'InternetCable', type: 'number', section: 'utility-expenses', transform: (value) => formatCurrency(value) },
  
  // Transportation Expenses
  { questionnaireField: 'car-payment', pdfField: 'CarPayment', type: 'number', section: 'transportation-expenses', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'car-insurance', pdfField: 'CarInsurance', type: 'number', section: 'transportation-expenses', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'gas-fuel', pdfField: 'GasFuel', type: 'number', section: 'transportation-expenses', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'car-maintenance', pdfField: 'CarMaintenance', type: 'number', section: 'transportation-expenses', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'parking-tolls', pdfField: 'ParkingTolls', type: 'number', section: 'transportation-expenses', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'public-transportation', pdfField: 'PublicTransportation', type: 'number', section: 'transportation-expenses', transform: (value) => formatCurrency(value) },
  
  // Food & Personal
  { questionnaireField: 'groceries', pdfField: 'Groceries', type: 'number', section: 'food-personal-expenses', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'dining-out', pdfField: 'DiningOut', type: 'number', section: 'food-personal-expenses', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'clothing', pdfField: 'Clothing', type: 'number', section: 'food-personal-expenses', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'personal-care', pdfField: 'PersonalCare', type: 'number', section: 'food-personal-expenses', transform: (value) => formatCurrency(value) },
  
  // Healthcare Expenses
  { questionnaireField: 'health-insurance', pdfField: 'HealthInsurance', type: 'number', section: 'healthcare-expenses', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'dental-insurance', pdfField: 'DentalInsurance', type: 'number', section: 'healthcare-expenses', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'medical-out-of-pocket', pdfField: 'MedicalOutOfPocket', type: 'number', section: 'healthcare-expenses', transform: (value) => formatCurrency(value) },
  
  // Children's Expenses
  { questionnaireField: 'childcare-daycare', pdfField: 'ChildcareDaycare', type: 'number', section: 'children-expenses', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'child-tuition', pdfField: 'ChildTuition', type: 'number', section: 'children-expenses', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'child-activities', pdfField: 'ChildActivities', type: 'number', section: 'children-expenses', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'child-support-paid', pdfField: 'ChildSupportPaid', type: 'number', section: 'children-expenses', transform: (value) => formatCurrency(value) },
  
  // Other Expenses
  { questionnaireField: 'life-insurance', pdfField: 'LifeInsurance', type: 'number', section: 'other-expenses', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'entertainment', pdfField: 'Entertainment', type: 'number', section: 'other-expenses', transform: (value) => formatCurrency(value) },
  
  // Assets - Real Estate
  { questionnaireField: 'primary-residence-value', pdfField: 'PrimaryResidenceValue', type: 'number', section: 'real-estate-assets', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'primary-residence-mortgage', pdfField: 'PrimaryResidenceMortgage', type: 'number', section: 'real-estate-assets', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'other-property-value', pdfField: 'OtherPropertyValue', type: 'number', section: 'real-estate-assets', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'other-property-mortgage', pdfField: 'OtherPropertyMortgage', type: 'number', section: 'real-estate-assets', transform: (value) => formatCurrency(value) },
  
  // Assets - Vehicles
  { questionnaireField: 'vehicle-1-description', pdfField: 'Vehicle1Description', type: 'text', section: 'vehicle-assets' },
  { questionnaireField: 'vehicle-1-value', pdfField: 'Vehicle1Value', type: 'number', section: 'vehicle-assets', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'vehicle-1-loan', pdfField: 'Vehicle1Loan', type: 'number', section: 'vehicle-assets', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'vehicle-2-description', pdfField: 'Vehicle2Description', type: 'text', section: 'vehicle-assets' },
  { questionnaireField: 'vehicle-2-value', pdfField: 'Vehicle2Value', type: 'number', section: 'vehicle-assets', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'vehicle-2-loan', pdfField: 'Vehicle2Loan', type: 'number', section: 'vehicle-assets', transform: (value) => formatCurrency(value) },
  
  // Assets - Financial Accounts
  { questionnaireField: 'checking-balance', pdfField: 'CheckingBalance', type: 'number', section: 'financial-accounts', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'savings-balance', pdfField: 'SavingsBalance', type: 'number', section: 'financial-accounts', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'investment-balance', pdfField: 'InvestmentBalance', type: 'number', section: 'financial-accounts', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'retirement-401k', pdfField: 'Retirement401k', type: 'number', section: 'financial-accounts', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'retirement-ira', pdfField: 'RetirementIRA', type: 'number', section: 'financial-accounts', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'pension-value', pdfField: 'PensionValue', type: 'number', section: 'financial-accounts', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'cash-on-hand', pdfField: 'CashOnHand', type: 'number', section: 'financial-accounts', transform: (value) => formatCurrency(value) },
  
  // Debts
  { questionnaireField: 'credit-card-debt', pdfField: 'CreditCardDebt', type: 'number', section: 'debts', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'student-loan-debt', pdfField: 'StudentLoanDebt', type: 'number', section: 'debts', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'personal-loan-debt', pdfField: 'PersonalLoanDebt', type: 'number', section: 'debts', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'medical-debt', pdfField: 'MedicalDebt', type: 'number', section: 'debts', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'tax-debt', pdfField: 'TaxDebt', type: 'number', section: 'debts', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'other-debt', pdfField: 'OtherDebt', type: 'number', section: 'debts', transform: (value) => formatCurrency(value) },
  { questionnaireField: 'other-debt-description', pdfField: 'OtherDebtDescription', type: 'text', section: 'debts' },
]

/**
 * Parenting Plan
 * Maps to: parenting-plan.pdf
 */
export const PARENTING_PLAN_FIELD_MAP: FieldMapping[] = [
  // Children Information
  { questionnaireField: 'children-count', pdfField: 'NumberOfChildren', type: 'number', section: 'children-info' },
  { questionnaireField: 'child-1-name', pdfField: 'Child1Name', type: 'text', section: 'children-info' },
  { questionnaireField: 'child-1-dob', pdfField: 'Child1DOB', type: 'date', section: 'children-info', transform: (value) => formatDate(value) },
  { questionnaireField: 'child-1-school', pdfField: 'Child1School', type: 'text', section: 'children-info' },
  { questionnaireField: 'child-1-special-needs', pdfField: 'Child1SpecialNeeds', type: 'text', section: 'children-info' },
  { questionnaireField: 'child-2-name', pdfField: 'Child2Name', type: 'text', section: 'children-info' },
  { questionnaireField: 'child-2-dob', pdfField: 'Child2DOB', type: 'date', section: 'children-info', transform: (value) => formatDate(value) },
  { questionnaireField: 'child-2-school', pdfField: 'Child2School', type: 'text', section: 'children-info' },
  { questionnaireField: 'child-3-name', pdfField: 'Child3Name', type: 'text', section: 'children-info' },
  { questionnaireField: 'child-3-dob', pdfField: 'Child3DOB', type: 'date', section: 'children-info', transform: (value) => formatDate(value) },
  
  // Decision Making
  { questionnaireField: 'education-authority', pdfField: 'EducationDecisionMaking', type: 'text', section: 'decision-making', transform: (value) => formatDecisionMaking(value) },
  { questionnaireField: 'healthcare-authority', pdfField: 'HealthcareDecisionMaking', type: 'text', section: 'decision-making', transform: (value) => formatDecisionMaking(value) },
  { questionnaireField: 'religious-authority', pdfField: 'ReligiousDecisionMaking', type: 'text', section: 'decision-making', transform: (value) => formatDecisionMaking(value) },
  { questionnaireField: 'extracurricular-authority', pdfField: 'ExtracurricularDecisionMaking', type: 'text', section: 'decision-making', transform: (value) => formatDecisionMaking(value) },
  
  // Regular Schedule
  { questionnaireField: 'schedule-type', pdfField: 'ScheduleType', type: 'text', section: 'regular-schedule', transform: (value) => formatScheduleType(value) },
  { questionnaireField: 'primary-residence', pdfField: 'PrimaryResidence', type: 'text', section: 'regular-schedule', transform: (value) => formatParent(value) },
  { questionnaireField: 'weekend-exchange-day', pdfField: 'WeekendStart', type: 'text', section: 'regular-schedule', transform: (value) => formatExchangeTime(value) },
  { questionnaireField: 'weekend-return-day', pdfField: 'WeekendEnd', type: 'text', section: 'regular-schedule', transform: (value) => formatExchangeTime(value) },
  { questionnaireField: 'midweek-visit', pdfField: 'MidweekVisit', type: 'checkbox', section: 'regular-schedule', transform: (value) => value === 'yes' ? 'Yes' : 'No' },
  { questionnaireField: 'midweek-visit-day', pdfField: 'MidweekVisitDay', type: 'text', section: 'regular-schedule' },
  
  // Holidays
  { questionnaireField: 'holiday-approach', pdfField: 'HolidayApproach', type: 'text', section: 'holidays', transform: (value) => formatHolidayApproach(value) },
  { questionnaireField: 'thanksgiving-odd-years', pdfField: 'ThanksgivingOdd', type: 'text', section: 'holidays', transform: (value) => formatParent(value) },
  { questionnaireField: 'christmas-eve-odd-years', pdfField: 'ChristmasEveOdd', type: 'text', section: 'holidays', transform: (value) => formatParent(value) },
  { questionnaireField: 'christmas-day-odd-years', pdfField: 'ChristmasDayOdd', type: 'text', section: 'holidays', transform: (value) => formatParent(value) },
  { questionnaireField: 'spring-break', pdfField: 'SpringBreak', type: 'text', section: 'holidays' },
  
  // Summer Schedule
  { questionnaireField: 'summer-approach', pdfField: 'SummerSchedule', type: 'text', section: 'summer-schedule', transform: (value) => formatSummerApproach(value) },
  { questionnaireField: 'summer-vacation-weeks', pdfField: 'VacationWeeks', type: 'number', section: 'summer-schedule' },
  { questionnaireField: 'vacation-notice-days', pdfField: 'VacationNotice', type: 'number', section: 'summer-schedule' },
  
  // Communication
  { questionnaireField: 'communication-method', pdfField: 'CommunicationMethod', type: 'text', section: 'communication', transform: (value) => formatCommunicationMethod(value) },
  { questionnaireField: 'response-time', pdfField: 'ResponseTime', type: 'text', section: 'communication', transform: (value) => formatResponseTime(value) },
  { questionnaireField: 'child-phone-contact', pdfField: 'ChildPhoneContact', type: 'checkbox', section: 'communication', transform: (value) => value === 'yes' ? 'Yes' : 'No' },
  
  // Transportation
  { questionnaireField: 'exchange-location', pdfField: 'ExchangeLocation', type: 'text', section: 'transportation', transform: (value) => formatExchangeLocation(value) },
  { questionnaireField: 'transportation-responsibility', pdfField: 'TransportationResponsibility', type: 'text', section: 'transportation', transform: (value) => formatTransportation(value) },
  
  // Additional Provisions
  { questionnaireField: 'right-of-first-refusal', pdfField: 'RightOfFirstRefusal', type: 'checkbox', section: 'additional-provisions', transform: (value) => value === 'yes' ? 'Yes' : 'No' },
  { questionnaireField: 'refusal-hours', pdfField: 'RefusalHours', type: 'number', section: 'additional-provisions' },
  { questionnaireField: 'relocation-notice', pdfField: 'RelocationNotice', type: 'number', section: 'additional-provisions' },
  { questionnaireField: 'additional-notes', pdfField: 'AdditionalProvisions', type: 'text', section: 'additional-provisions' },
]

/**
 * Summons
 * Maps to: summons-dissolution.pdf
 */
export const SUMMONS_FIELD_MAP: FieldMapping[] = [
  { questionnaireField: 'petitioner-first-name', pdfField: 'PetitionerName', type: 'text' },
  { questionnaireField: 'petitioner-last-name', pdfField: 'PetitionerLastName', type: 'text' },
  { questionnaireField: 'spouse-first-name', pdfField: 'RespondentName', type: 'text' },
  { questionnaireField: 'spouse-last-name', pdfField: 'RespondentLastName', type: 'text' },
  { questionnaireField: 'spouse-address', pdfField: 'RespondentAddress', type: 'text' },
  { questionnaireField: 'petitioner-county', pdfField: 'County', type: 'text', transform: (value) => formatCounty(value) },
]

// ============================================================
// TRANSFORM FUNCTIONS
// ============================================================

/**
 * Format a date value for PDF form
 */
export function formatDate(value: any): string {
  if (!value) return ''
  
  try {
    const date = new Date(value)
    if (isNaN(date.getTime())) return ''
    
    // Format as MM/DD/YYYY for Illinois courts
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const year = date.getFullYear()
    
    return `${month}/${day}/${year}`
  } catch {
    return ''
  }
}

/**
 * Format currency value
 */
export function formatCurrency(value: any): string {
  if (value === null || value === undefined || value === '') return '$0.00'
  
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '$0.00'
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num)
}

/**
 * Format county name
 */
export function formatCounty(value: string): string {
  if (!value) return ''
  
  const countyNames: Record<string, string> = {
    'cook': 'Cook County',
    'dupage': 'DuPage County',
    'lake': 'Lake County',
    'will': 'Will County',
    'kane': 'Kane County',
    'mchenry': 'McHenry County',
    'winnebago': 'Winnebago County',
    'madison': 'Madison County',
    'stclair': 'St. Clair County',
    'sangamon': 'Sangamon County',
    'other': 'Other County'
  }
  
  return countyNames[value.toLowerCase()] || value
}

/**
 * Format grounds for divorce
 */
export function formatGrounds(value: string): string {
  const groundsText: Record<string, string> = {
    'irreconcilable': 'Irreconcilable Differences',
    'impotence': 'Impotence',
    'bigamy': 'Bigamy',
    'adultery': 'Adultery',
    'desertion': 'Willful Desertion',
    'substance': 'Habitual Drunkenness or Drug Addiction',
    'cruelty': 'Extreme and Repeated Mental or Physical Cruelty',
    'attempted_murder': 'Attempt on Life of Spouse',
    'felony': 'Conviction of a Felony or Other Infamous Crime'
  }
  
  return groundsText[value] || value
}

/**
 * Format employment status
 */
export function formatEmploymentStatus(value: string): string {
  const statusText: Record<string, string> = {
    'full_time': 'Employed Full-Time',
    'part_time': 'Employed Part-Time',
    'self_employed': 'Self-Employed',
    'unemployed': 'Unemployed',
    'retired': 'Retired',
    'disabled': 'Disabled'
  }
  
  return statusText[value] || value
}

/**
 * Format decision making authority
 */
export function formatDecisionMaking(value: string): string {
  const authorityText: Record<string, string> = {
    'joint': 'Joint (Both Parents)',
    'parent1': 'Petitioner (Parent 1)',
    'parent2': 'Respondent (Parent 2)',
    'na': 'Not Applicable'
  }
  
  return authorityText[value] || value
}

/**
 * Format schedule type
 */
export function formatScheduleType(value: string): string {
  const scheduleText: Record<string, string> = {
    'standard': 'Standard (Every Other Weekend)',
    'week_on_off': '50/50 - Week On/Week Off',
    '2_2_3': '50/50 - 2-2-3 Rotation',
    '3_4_4_3': '50/50 - 3-4-4-3 Rotation',
    '60_40': '60/40 Split',
    'custom': 'Custom Schedule'
  }
  
  return scheduleText[value] || value
}

/**
 * Format parent reference
 */
export function formatParent(value: string): string {
  const parentText: Record<string, string> = {
    'parent1': 'Petitioner (Parent 1)',
    'parent2': 'Respondent (Parent 2)',
    'shared': 'Shared (Alternating)',
    'mother': 'Mother',
    'father': 'Father',
    'split': 'Split Between Parents'
  }
  
  return parentText[value] || value
}

/**
 * Format exchange time
 */
export function formatExchangeTime(value: string): string {
  const timeText: Record<string, string> = {
    'friday_school': 'Friday after school',
    'friday_6pm': 'Friday at 6:00 PM',
    'saturday_morning': 'Saturday morning',
    'sunday_6pm': 'Sunday at 6:00 PM',
    'monday_school': 'Monday (drop at school)'
  }
  
  return timeText[value] || value
}

/**
 * Format holiday approach
 */
export function formatHolidayApproach(value: string): string {
  const approachText: Record<string, string> = {
    'alternate': 'Alternate Years (Odd/Even)',
    'split': 'Split Each Holiday',
    'specific': 'Specific Holidays Assigned'
  }
  
  return approachText[value] || value
}

/**
 * Format summer approach
 */
export function formatSummerApproach(value: string): string {
  const approachText: Record<string, string> = {
    'regular': 'Continue Regular Schedule',
    'extended': 'Extended Time with Non-Custodial Parent',
    'fifty_fifty': '50/50 Split (2 weeks alternating)',
    'custom': 'Custom Arrangement'
  }
  
  return approachText[value] || value
}

/**
 * Format communication method
 */
export function formatCommunicationMethod(value: string): string {
  const methodText: Record<string, string> = {
    'email': 'Email',
    'text': 'Text Message',
    'app': 'Co-Parenting App',
    'phone': 'Phone Calls'
  }
  
  return methodText[value] || value
}

/**
 * Format response time
 */
export function formatResponseTime(value: string): string {
  const timeText: Record<string, string> = {
    '24_hours': 'Within 24 hours',
    '48_hours': 'Within 48 hours',
    '72_hours': 'Within 72 hours'
  }
  
  return timeText[value] || value
}

/**
 * Format exchange location
 */
export function formatExchangeLocation(value: string): string {
  const locationText: Record<string, string> = {
    'parent1_home': "Parent 1's Residence",
    'parent2_home': "Parent 2's Residence",
    'school': 'School (Drop Off/Pick Up)',
    'public': 'Public Location',
    'midpoint': 'Midpoint Between Homes'
  }
  
  return locationText[value] || value
}

/**
 * Format transportation responsibility
 */
export function formatTransportation(value: string): string {
  const responsibilityText: Record<string, string> = {
    'receiving': 'Receiving Parent Picks Up',
    'sending': 'Sending Parent Drops Off',
    'split': 'Split (Each Drives One Way)'
  }
  
  return responsibilityText[value] || value
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Get field mapping for a specific form type
 */
export function getFieldMapping(formType: string): FieldMapping[] {
  const mappings: Record<string, FieldMapping[]> = {
    'petition-no-children': PETITION_NO_CHILDREN_FIELD_MAP,
    'petition-with-children': PETITION_WITH_CHILDREN_FIELD_MAP,
    'financial-affidavit': FINANCIAL_AFFIDAVIT_FIELD_MAP,
    'parenting-plan': PARENTING_PLAN_FIELD_MAP,
    'summons': SUMMONS_FIELD_MAP,
  }
  
  return mappings[formType] || []
}

/**
 * Apply field mappings to questionnaire data
 * Returns an object with PDF field names as keys and formatted values
 */
export function applyFieldMappings(
  formType: string, 
  questionnaireData: Record<string, any>
): Record<string, string> {
  const mappings = getFieldMapping(formType)
  const result: Record<string, string> = {}
  
  for (const mapping of mappings) {
    const value = questionnaireData[mapping.questionnaireField]
    
    if (value !== undefined && value !== null && value !== '') {
      // Apply transform if defined, otherwise convert to string
      result[mapping.pdfField] = mapping.transform 
        ? mapping.transform(value)
        : String(value)
    }
  }
  
  return result
}

/**
 * Get all questionnaire fields needed for a form type
 */
export function getRequiredQuestionnaireFields(formType: string): string[] {
  const mappings = getFieldMapping(formType)
  return mappings.map(m => m.questionnaireField)
}

/**
 * Validate that all required fields are present
 */
export function validateFieldsPresent(
  formType: string,
  questionnaireData: Record<string, any>
): { valid: boolean; missingFields: string[] } {
  const mappings = getFieldMapping(formType)
  const missingFields: string[] = []
  
  for (const mapping of mappings) {
    const value = questionnaireData[mapping.questionnaireField]
    if (value === undefined || value === null || value === '') {
      missingFields.push(mapping.questionnaireField)
    }
  }
  
  return {
    valid: missingFields.length === 0,
    missingFields
  }
}
