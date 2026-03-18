/**
 * Parenting Plan PDF Filler
 * 
 * Fills official Illinois court Parenting Plan form
 * using pdf-lib to populate form fields.
 */

import { PDFDocument, PDFForm } from 'pdf-lib'
import { 
  applyFieldMappings, 
  formatDate, 
  formatDecisionMaking,
  formatScheduleType,
  formatParent,
  formatExchangeTime,
  formatHolidayApproach,
  formatSummerApproach,
  formatCommunicationMethod,
  formatResponseTime,
  formatExchangeLocation,
  formatTransportation
} from './field-mappings'

export interface ChildInfo {
  name: string
  dateOfBirth: string
  school?: string
  specialNeeds?: string
}

export interface ParentingPlanData {
  // Parent Information
  parent1Name: string
  parent1Address?: string
  parent2Name: string
  parent2Address?: string
  
  // Children Information
  childrenCount: number
  children: ChildInfo[]
  
  // Decision Making
  educationAuthority: 'joint' | 'parent1' | 'parent2'
  healthcareAuthority: 'joint' | 'parent1' | 'parent2'
  religiousAuthority: 'joint' | 'parent1' | 'parent2' | 'na'
  extracurricularAuthority: 'joint' | 'parent1' | 'parent2'
  
  // Regular Schedule
  scheduleType: 'standard' | 'week_on_off' | '2_2_3' | '3_4_4_3' | '60_40' | 'custom'
  primaryResidence: 'parent1' | 'parent2' | 'shared'
  weekdayParent?: 'parent1' | 'parent2' | 'alternating'
  weekendExchangeDay: string
  weekendReturnDay: string
  midweekVisit: boolean
  midweekVisitDay?: string
  customScheduleDetails?: string
  
  // Holidays
  holidayApproach: 'alternate' | 'split' | 'specific'
  thanksgivingOddYears: 'parent1' | 'parent2' | 'split'
  christmasEveOddYears: 'parent1' | 'parent2'
  christmasDayOddYears: 'parent1' | 'parent2'
  mothersDay: 'mother' | 'regular'
  fathersDay: 'father' | 'regular'
  childBirthday: 'alternate' | 'split' | 'together' | 'separate'
  springBreak: 'alternate' | 'split' | 'regular'
  
  // Summer Schedule
  summerApproach: 'regular' | 'extended' | 'fifty_fifty' | 'custom'
  summerVacationWeeks?: number
  vacationNoticeDays?: number
  
  // Communication
  communicationMethod: 'email' | 'text' | 'app' | 'phone'
  responseTime: '24_hours' | '48_hours' | '72_hours'
  childPhoneContact: boolean
  phoneContactFrequency?: 'daily' | 'every_other_day' | 'twice_weekly' | 'reasonable'
  
  // Transportation
  exchangeLocation: 'parent1_home' | 'parent2_home' | 'school' | 'public' | 'midpoint'
  transportationResponsibility: 'receiving' | 'sending' | 'split'
  exchangeTimeFlexibility?: number  // minutes grace period
  
  // Additional Provisions
  rightOfFirstRefusal: boolean
  refusalHours?: number
  relocationNotice: number  // days
  introducePartners?: '3_months' | '6_months' | 'committed' | 'none'
  additionalNotes?: string
  
  // Case Information
  caseNumber?: string
}

export interface FillParentingPlanOptions {
  flatten?: boolean
}

/**
 * Fill the Parenting Plan form
 */
export async function fillParentingPlan(
  data: ParentingPlanData,
  options: FillParentingPlanOptions = { flatten: true }
): Promise<Uint8Array> {
  const templatePath = '/forms/parenting-plan.pdf'
  
  try {
    const response = await fetch(templatePath)
    if (!response.ok) {
      throw new Error(`Failed to load parenting plan template: ${response.statusText}`)
    }
    
    const templateBytes = await response.arrayBuffer()
    const pdfDoc = await PDFDocument.load(templateBytes)
    const form = pdfDoc.getForm()
    
    // Convert data to questionnaire format for mapping
    const questionnaireData = convertParentingDataToQuestionnaireFormat(data)
    
    // Get mapped values
    const mappedValues = applyFieldMappings('parenting-plan', questionnaireData)
    
    // Fill each field
    for (const [fieldName, value] of Object.entries(mappedValues)) {
      try {
        fillFormField(form, fieldName, value)
      } catch (error) {
        console.warn(`Could not fill field ${fieldName}:`, error)
      }
    }
    
    // Fill computed/special fields
    fillParentingPlanComputedFields(form, data)
    
    if (options.flatten) {
      form.flatten()
    }
    
    return pdfDoc.save()
  } catch (error) {
    console.error('Error filling parenting plan PDF:', error)
    throw error
  }
}

/**
 * Convert ParentingPlanData to questionnaire format
 */
function convertParentingDataToQuestionnaireFormat(data: ParentingPlanData): Record<string, any> {
  const result: Record<string, any> = {
    // Children
    'children-count': data.childrenCount,
    
    // Decision Making
    'education-authority': data.educationAuthority,
    'healthcare-authority': data.healthcareAuthority,
    'religious-authority': data.religiousAuthority,
    'extracurricular-authority': data.extracurricularAuthority,
    
    // Regular Schedule
    'schedule-type': data.scheduleType,
    'primary-residence': data.primaryResidence,
    'weekday-parent': data.weekdayParent,
    'weekend-exchange-day': data.weekendExchangeDay,
    'weekend-return-day': data.weekendReturnDay,
    'midweek-visit': data.midweekVisit ? 'yes' : 'no',
    'midweek-visit-day': data.midweekVisitDay,
    
    // Holidays
    'holiday-approach': data.holidayApproach,
    'thanksgiving-odd-years': data.thanksgivingOddYears,
    'christmas-eve-odd-years': data.christmasEveOddYears,
    'christmas-day-odd-years': data.christmasDayOddYears,
    'mothers-day': data.mothersDay,
    'fathers-day': data.fathersDay,
    'child-birthday': data.childBirthday,
    'spring-break': data.springBreak,
    
    // Summer
    'summer-approach': data.summerApproach,
    'summer-vacation-weeks': data.summerVacationWeeks,
    'vacation-notice-days': data.vacationNoticeDays,
    
    // Communication
    'communication-method': data.communicationMethod,
    'response-time': data.responseTime,
    'child-phone-contact': data.childPhoneContact ? 'yes' : 'no',
    'phone-contact-frequency': data.phoneContactFrequency,
    
    // Transportation
    'exchange-location': data.exchangeLocation,
    'transportation-responsibility': data.transportationResponsibility,
    'exchange-time-flexibility': data.exchangeTimeFlexibility,
    
    // Additional
    'right-of-first-refusal': data.rightOfFirstRefusal ? 'yes' : 'no',
    'refusal-hours': data.refusalHours,
    'relocation-notice': data.relocationNotice,
    'introduce-partners': data.introducePartners,
    'additional-notes': data.additionalNotes,
  }
  
  // Add children information
  data.children.forEach((child, index) => {
    const num = index + 1
    result[`child-${num}-name`] = child.name
    result[`child-${num}-dob`] = child.dateOfBirth
    result[`child-${num}-school`] = child.school
    result[`child-${num}-special-needs`] = child.specialNeeds
  })
  
  return result
}

/**
 * Fill computed/special fields
 */
function fillParentingPlanComputedFields(form: PDFForm, data: ParentingPlanData): void {
  // Date prepared
  tryFillTextField(form, 'DatePrepared', formatDate(new Date().toISOString()))
  
  // Case number
  if (data.caseNumber) {
    tryFillTextField(form, 'CaseNumber', data.caseNumber)
  }
  
  // Parent names
  tryFillTextField(form, 'Parent1Name', data.parent1Name)
  tryFillTextField(form, 'Parent2Name', data.parent2Name)
  tryFillTextField(form, 'PetitionerName', data.parent1Name)
  tryFillTextField(form, 'RespondentName', data.parent2Name)
  
  // Parent addresses
  if (data.parent1Address) {
    tryFillTextField(form, 'Parent1Address', data.parent1Address)
  }
  if (data.parent2Address) {
    tryFillTextField(form, 'Parent2Address', data.parent2Address)
  }
  
  // Children information with ages
  data.children.forEach((child, index) => {
    const num = index + 1
    tryFillTextField(form, `Child${num}Name`, child.name)
    tryFillTextField(form, `Child${num}DOB`, formatDate(child.dateOfBirth))
    
    // Calculate age
    const birthDate = new Date(child.dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    tryFillTextField(form, `Child${num}Age`, String(age))
    
    if (child.school) {
      tryFillTextField(form, `Child${num}School`, child.school)
    }
    if (child.specialNeeds) {
      tryFillTextField(form, `Child${num}SpecialNeeds`, child.specialNeeds)
    }
  })
  
  // Generate schedule description
  const scheduleDescription = generateScheduleDescription(data)
  tryFillTextField(form, 'ScheduleDescription', scheduleDescription)
  
  // Generate holiday schedule description
  const holidayDescription = generateHolidayDescription(data)
  tryFillTextField(form, 'HolidayScheduleDescription', holidayDescription)
  
  // Transportation details
  const transportDetails = generateTransportationDetails(data)
  tryFillTextField(form, 'TransportationDetails', transportDetails)
}

/**
 * Generate a readable description of the parenting schedule
 */
function generateScheduleDescription(data: ParentingPlanData): string {
  const scheduleTypes: Record<string, string> = {
    'standard': 'The children will primarily reside with ' + formatParent(data.primaryResidence) + 
      '. The non-residential parent will have parenting time every other weekend.',
    'week_on_off': 'The parents will share equal parenting time on a week-on/week-off basis, ' +
      'with exchanges occurring on Sundays.',
    '2_2_3': 'The parents will share equal parenting time using a 2-2-3 rotation: ' +
      'Parent 1 has Monday-Tuesday, Parent 2 has Wednesday-Thursday, ' +
      'weekends alternate starting Friday.',
    '3_4_4_3': 'The parents will share equal parenting time using a 3-4-4-3 rotation: ' +
      'Parent 1 has Thursday-Sunday one week, Parent 2 has Thursday-Sunday the next.',
    '60_40': 'The children will primarily reside with ' + formatParent(data.primaryResidence) + 
      ' (approximately 60% of the time). The other parent will have parenting time ' +
      'every other weekend plus one weeknight.',
    'custom': data.customScheduleDetails || 'Custom schedule as agreed by the parties.'
  }
  
  let description = scheduleTypes[data.scheduleType] || ''
  
  if (data.midweekVisit && data.midweekVisitDay) {
    description += ` The non-custodial parent will also have a midweek visit on ${data.midweekVisitDay}s.`
  }
  
  return description
}

/**
 * Generate holiday schedule description
 */
function generateHolidayDescription(data: ParentingPlanData): string {
  const lines: string[] = []
  
  if (data.holidayApproach === 'alternate') {
    lines.push('Holidays will alternate by year (odd/even):')
    lines.push(`- Thanksgiving: ${formatParent(data.thanksgivingOddYears)} in odd years`)
    lines.push(`- Christmas Eve: ${formatParent(data.christmasEveOddYears)} in odd years`)
    lines.push(`- Christmas Day: ${formatParent(data.christmasDayOddYears)} in odd years`)
  } else if (data.holidayApproach === 'split') {
    lines.push('Holidays will be split each year.')
  }
  
  if (data.mothersDay === 'mother') {
    lines.push("- Mother's Day: Always with Mother")
  }
  if (data.fathersDay === 'father') {
    lines.push("- Father's Day: Always with Father")
  }
  
  const birthdayApproaches: Record<string, string> = {
    'alternate': "Children's birthdays will alternate between parents each year.",
    'split': "Children's birthdays will be split between parents (morning/afternoon).",
    'together': "Children's birthdays will be celebrated with both parents together.",
    'separate': "Each parent will celebrate children's birthdays separately."
  }
  lines.push(birthdayApproaches[data.childBirthday] || '')
  
  return lines.filter(l => l).join('\n')
}

/**
 * Generate transportation details
 */
function generateTransportationDetails(data: ParentingPlanData): string {
  const location = formatExchangeLocation(data.exchangeLocation)
  const responsibility = formatTransportation(data.transportationResponsibility)
  
  let details = `Exchanges will occur at ${location}. ${responsibility}.`
  
  if (data.exchangeTimeFlexibility) {
    details += ` A grace period of ${data.exchangeTimeFlexibility} minutes is allowed.`
  }
  
  return details
}

/**
 * Fill a form field safely
 */
function fillFormField(form: PDFForm, fieldName: string, value: string): void {
  try {
    const textField = form.getTextField(fieldName)
    if (textField) {
      textField.setText(value)
    }
  } catch {
    // Try checkbox
    try {
      const checkbox = form.getCheckBox(fieldName)
      if (checkbox) {
        if (value === 'Yes' || value === 'true' || value === '1') {
          checkbox.check()
        } else {
          checkbox.uncheck()
        }
      }
    } catch {
      // Field doesn't exist
    }
  }
}

/**
 * Safely try to fill a text field
 */
function tryFillTextField(form: PDFForm, fieldName: string, value: string): void {
  try {
    const field = form.getTextField(fieldName)
    if (field) {
      field.setText(value)
    }
  } catch {
    // Field doesn't exist, silently skip
  }
}

/**
 * Generate filled Parenting Plan from questionnaire responses
 */
export async function generateFilledParentingPlanFromQuestionnaire(
  questionnaireResponses: Record<string, any>,
  parent1Name: string,
  parent2Name: string,
  options: FillParentingPlanOptions = { flatten: true }
): Promise<Uint8Array> {
  // Extract children information
  const childrenCount = parseInt(questionnaireResponses['children-count']) || 0
  const children: ChildInfo[] = []
  
  for (let i = 1; i <= Math.min(childrenCount, 5); i++) {
    const name = questionnaireResponses[`child-${i}-name`]
    const dob = questionnaireResponses[`child-${i}-dob`]
    
    if (name && dob) {
      children.push({
        name,
        dateOfBirth: dob,
        school: questionnaireResponses[`child-${i}-school`],
        specialNeeds: questionnaireResponses[`child-${i}-special-needs`]
      })
    }
  }
  
  const data: ParentingPlanData = {
    parent1Name,
    parent2Name,
    
    childrenCount,
    children,
    
    educationAuthority: questionnaireResponses['education-authority'] || 'joint',
    healthcareAuthority: questionnaireResponses['healthcare-authority'] || 'joint',
    religiousAuthority: questionnaireResponses['religious-authority'] || 'joint',
    extracurricularAuthority: questionnaireResponses['extracurricular-authority'] || 'joint',
    
    scheduleType: questionnaireResponses['schedule-type'] || 'standard',
    primaryResidence: questionnaireResponses['primary-residence'] || 'parent1',
    weekdayParent: questionnaireResponses['weekday-parent'],
    weekendExchangeDay: questionnaireResponses['weekend-exchange-day'] || 'friday_6pm',
    weekendReturnDay: questionnaireResponses['weekend-return-day'] || 'sunday_6pm',
    midweekVisit: questionnaireResponses['midweek-visit'] === 'yes',
    midweekVisitDay: questionnaireResponses['midweek-visit-day'],
    
    holidayApproach: questionnaireResponses['holiday-approach'] || 'alternate',
    thanksgivingOddYears: questionnaireResponses['thanksgiving-odd-years'] || 'parent1',
    christmasEveOddYears: questionnaireResponses['christmas-eve-odd-years'] || 'parent1',
    christmasDayOddYears: questionnaireResponses['christmas-day-odd-years'] || 'parent2',
    mothersDay: questionnaireResponses['mothers-day'] || 'mother',
    fathersDay: questionnaireResponses['fathers-day'] || 'father',
    childBirthday: questionnaireResponses['child-birthday'] || 'alternate',
    springBreak: questionnaireResponses['spring-break'] || 'alternate',
    
    summerApproach: questionnaireResponses['summer-approach'] || 'regular',
    summerVacationWeeks: parseInt(questionnaireResponses['summer-vacation-weeks']) || undefined,
    vacationNoticeDays: parseInt(questionnaireResponses['vacation-notice-days']) || 30,
    
    communicationMethod: questionnaireResponses['communication-method'] || 'email',
    responseTime: questionnaireResponses['response-time'] || '24_hours',
    childPhoneContact: questionnaireResponses['child-phone-contact'] === 'yes',
    phoneContactFrequency: questionnaireResponses['phone-contact-frequency'],
    
    exchangeLocation: questionnaireResponses['exchange-location'] || 'parent1_home',
    transportationResponsibility: questionnaireResponses['transportation-responsibility'] || 'receiving',
    exchangeTimeFlexibility: parseInt(questionnaireResponses['exchange-time-flexibility']) || 15,
    
    rightOfFirstRefusal: questionnaireResponses['right-of-first-refusal'] === 'yes',
    refusalHours: parseInt(questionnaireResponses['refusal-hours']) || undefined,
    relocationNotice: parseInt(questionnaireResponses['relocation-notice']) || 60,
    introducePartners: questionnaireResponses['introduce-partners'],
    additionalNotes: questionnaireResponses['additional-notes'],
  }
  
  return fillParentingPlan(data, options)
}
