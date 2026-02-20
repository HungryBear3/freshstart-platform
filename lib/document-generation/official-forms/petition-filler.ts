/**
 * Petition PDF Filler
 * 
 * Fills official Illinois court Petition for Dissolution forms
 * using pdf-lib to populate form fields.
 */

import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, PDFRadioGroup } from 'pdf-lib'
import { 
  applyFieldMappings, 
  PETITION_NO_CHILDREN_FIELD_MAP,
  PETITION_WITH_CHILDREN_FIELD_MAP,
  formatDate,
  formatCounty,
  formatGrounds
} from './field-mappings'

export interface PetitionData {
  // Personal Information
  petitionerFirstName: string
  petitionerLastName: string
  petitionerMiddleName?: string
  spouseFirstName: string
  spouseLastName: string
  marriageDate: string
  separationDate?: string
  
  // Residency
  petitionerCounty: string
  petitionerAddress: string
  spouseAddress?: string
  residencyDurationMonths: number
  
  // Grounds
  groundsType: string
  irreconcilableDuration?: number
  
  // Children (for with-children petition)
  hasChildren?: boolean
  numberOfChildren?: number
  children?: Array<{
    name: string
    dateOfBirth: string
    age: number
  }>
  
  // Case Information
  caseNumber?: string
  courtDivision?: string
}

export interface FillPetitionOptions {
  flatten?: boolean  // Whether to flatten the form (make it non-editable)
  includeCourtInfo?: boolean
}

/**
 * Fill the Petition for Dissolution (No Children) form
 */
export async function fillPetitionNoChildren(
  data: PetitionData,
  options: FillPetitionOptions = { flatten: true }
): Promise<Uint8Array> {
  // Load the template PDF
  const templatePath = '/forms/petition-dissolution-no-children.pdf'
  
  try {
    // In production, this would fetch from public folder or cloud storage
    const response = await fetch(templatePath)
    if (!response.ok) {
      throw new Error(`Failed to load petition template: ${response.statusText}`)
    }
    
    const templateBytes = await response.arrayBuffer()
    const pdfDoc = await PDFDocument.load(templateBytes)
    const form = pdfDoc.getForm()
    
    // Convert data to questionnaire format for mapping
    const questionnaireData = convertPetitionDataToQuestionnaireFormat(data)
    
    // Get mapped values
    const mappedValues = applyFieldMappings('petition-no-children', questionnaireData)
    
    // Fill each field
    for (const [fieldName, value] of Object.entries(mappedValues)) {
      try {
        fillFormField(form, fieldName, value)
      } catch (error) {
        console.warn(`Could not fill field ${fieldName}:`, error)
        // Continue with other fields
      }
    }
    
    // Fill additional computed fields
    fillPetitionComputedFields(form, data)
    
    // Flatten if requested (makes form non-editable)
    if (options.flatten) {
      form.flatten()
    }
    
    return pdfDoc.save()
  } catch (error) {
    console.error('Error filling petition PDF:', error)
    throw error
  }
}

/**
 * Fill the Petition for Dissolution (With Children) form
 */
export async function fillPetitionWithChildren(
  data: PetitionData,
  options: FillPetitionOptions = { flatten: true }
): Promise<Uint8Array> {
  const templatePath = '/forms/petition-dissolution-with-children.pdf'
  
  try {
    const response = await fetch(templatePath)
    if (!response.ok) {
      throw new Error(`Failed to load petition template: ${response.statusText}`)
    }
    
    const templateBytes = await response.arrayBuffer()
    const pdfDoc = await PDFDocument.load(templateBytes)
    const form = pdfDoc.getForm()
    
    // Convert and map data
    const questionnaireData = convertPetitionDataToQuestionnaireFormat(data)
    const mappedValues = applyFieldMappings('petition-with-children', questionnaireData)
    
    // Fill mapped fields
    for (const [fieldName, value] of Object.entries(mappedValues)) {
      try {
        fillFormField(form, fieldName, value)
      } catch (error) {
        console.warn(`Could not fill field ${fieldName}:`, error)
      }
    }
    
    // Fill computed fields
    fillPetitionComputedFields(form, data)
    
    // Fill children information
    if (data.children && data.children.length > 0) {
      fillChildrenInformation(form, data.children)
    }
    
    if (options.flatten) {
      form.flatten()
    }
    
    return pdfDoc.save()
  } catch (error) {
    console.error('Error filling petition with children PDF:', error)
    throw error
  }
}

/**
 * Auto-select the correct petition form based on data
 */
export async function fillPetition(
  data: PetitionData,
  options: FillPetitionOptions = { flatten: true }
): Promise<Uint8Array> {
  if (data.hasChildren && data.numberOfChildren && data.numberOfChildren > 0) {
    return fillPetitionWithChildren(data, options)
  }
  return fillPetitionNoChildren(data, options)
}

/**
 * Convert PetitionData to questionnaire format for field mapping
 */
function convertPetitionDataToQuestionnaireFormat(data: PetitionData): Record<string, any> {
  return {
    'petitioner-first-name': data.petitionerFirstName,
    'petitioner-last-name': data.petitionerLastName,
    'petitioner-middle-name': data.petitionerMiddleName,
    'spouse-first-name': data.spouseFirstName,
    'spouse-last-name': data.spouseLastName,
    'marriage-date': data.marriageDate,
    'separation-date': data.separationDate,
    'petitioner-county': data.petitionerCounty,
    'petitioner-address': data.petitionerAddress,
    'spouse-address': data.spouseAddress,
    'residency-duration-months': data.residencyDurationMonths,
    'grounds-type': data.groundsType,
    'irreconcilable-duration': data.irreconcilableDuration,
    'has-children': data.hasChildren ? 'yes' : 'no',
    'number-of-children': data.numberOfChildren,
  }
}

/**
 * Fill a single form field based on its type
 */
function fillFormField(form: PDFForm, fieldName: string, value: string): void {
  try {
    // Try as text field first (most common)
    const textField = form.getTextField(fieldName)
    if (textField) {
      textField.setText(value)
      return
    }
  } catch {
    // Not a text field, try other types
  }
  
  try {
    // Try as checkbox
    const checkbox = form.getCheckBox(fieldName)
    if (checkbox) {
      if (value === 'Yes' || value === 'true' || value === '1') {
        checkbox.check()
      } else {
        checkbox.uncheck()
      }
      return
    }
  } catch {
    // Not a checkbox
  }
  
  try {
    // Try as radio button group
    const radioGroup = form.getRadioGroup(fieldName)
    if (radioGroup) {
      radioGroup.select(value)
      return
    }
  } catch {
    // Not a radio group
  }
  
  // If we get here, the field wasn't found or isn't a supported type
  console.warn(`Field "${fieldName}" not found or unsupported type`)
}

/**
 * Fill computed/derived fields that aren't directly mapped
 */
function fillPetitionComputedFields(form: PDFForm, data: PetitionData): void {
  // Full name fields (combined first + last)
  tryFillTextField(form, 'PetitionerFullName', 
    `${data.petitionerFirstName} ${data.petitionerMiddleName || ''} ${data.petitionerLastName}`.replace(/\s+/g, ' ').trim()
  )
  
  tryFillTextField(form, 'RespondentFullName',
    `${data.spouseFirstName} ${data.spouseLastName}`
  )
  
  // Date filed (today's date)
  tryFillTextField(form, 'DateFiled', formatDate(new Date().toISOString()))
  
  // Case number if provided
  if (data.caseNumber) {
    tryFillTextField(form, 'CaseNumber', data.caseNumber)
  }
  
  // County header
  tryFillTextField(form, 'CountyHeader', formatCounty(data.petitionerCounty))
  
  // Residency statement
  const residencyYears = Math.floor(data.residencyDurationMonths / 12)
  const residencyMonths = data.residencyDurationMonths % 12
  let residencyText = ''
  if (residencyYears > 0) {
    residencyText += `${residencyYears} year${residencyYears > 1 ? 's' : ''}`
  }
  if (residencyMonths > 0) {
    residencyText += `${residencyText ? ' and ' : ''}${residencyMonths} month${residencyMonths > 1 ? 's' : ''}`
  }
  tryFillTextField(form, 'ResidencyDuration', residencyText)
  
  // Marriage duration (computed from marriage date to separation date or today)
  const marriageDate = new Date(data.marriageDate)
  const endDate = data.separationDate ? new Date(data.separationDate) : new Date()
  const marriageYears = Math.floor((endDate.getTime() - marriageDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  tryFillTextField(form, 'YearsOfMarriage', `${marriageYears}`)
}

/**
 * Fill children information for with-children petition
 */
function fillChildrenInformation(form: PDFForm, children: Array<{ name: string; dateOfBirth: string; age: number }>): void {
  children.forEach((child, index) => {
    const childNum = index + 1
    
    tryFillTextField(form, `Child${childNum}Name`, child.name)
    tryFillTextField(form, `Child${childNum}DOB`, formatDate(child.dateOfBirth))
    tryFillTextField(form, `Child${childNum}Age`, String(child.age))
  })
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
 * Get list of all form fields in a PDF (useful for debugging/mapping)
 */
export async function inspectPdfFormFields(pdfBytes: ArrayBuffer): Promise<string[]> {
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const form = pdfDoc.getForm()
  const fields = form.getFields()
  
  return fields.map(field => {
    const name = field.getName()
    const type = field.constructor.name
    return `${name} (${type})`
  })
}

/**
 * Generate a filled petition PDF from questionnaire response data
 * This is the main entry point from the document generation API
 */
export async function generateFilledPetitionFromQuestionnaire(
  questionnaireResponses: Record<string, any>,
  hasChildren: boolean,
  options: FillPetitionOptions = { flatten: true }
): Promise<Uint8Array> {
  // Transform questionnaire responses to PetitionData format
  const petitionData: PetitionData = {
    petitionerFirstName: questionnaireResponses['petitioner-first-name'] || '',
    petitionerLastName: questionnaireResponses['petitioner-last-name'] || '',
    petitionerMiddleName: questionnaireResponses['petitioner-middle-name'],
    spouseFirstName: questionnaireResponses['spouse-first-name'] || '',
    spouseLastName: questionnaireResponses['spouse-last-name'] || '',
    marriageDate: questionnaireResponses['marriage-date'] || '',
    separationDate: questionnaireResponses['separation-date'],
    petitionerCounty: questionnaireResponses['petitioner-county'] || '',
    petitionerAddress: questionnaireResponses['petitioner-address'] || '',
    spouseAddress: questionnaireResponses['spouse-address'],
    residencyDurationMonths: parseInt(questionnaireResponses['residency-duration-months']) || 0,
    groundsType: questionnaireResponses['grounds-type'] || 'irreconcilable',
    irreconcilableDuration: questionnaireResponses['irreconcilable-duration'],
    hasChildren: hasChildren,
    numberOfChildren: hasChildren ? parseInt(questionnaireResponses['number-of-children']) || 0 : 0,
  }
  
  // If has children, try to extract children data
  if (hasChildren && petitionData.numberOfChildren && petitionData.numberOfChildren > 0) {
    petitionData.children = []
    // This would need to be expanded based on actual questionnaire structure for children
  }
  
  return fillPetition(petitionData, options)
}
