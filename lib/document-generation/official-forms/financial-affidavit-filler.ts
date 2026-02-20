/**
 * Financial Affidavit PDF Filler
 * 
 * Fills official Illinois court Financial Affidavit form
 * using pdf-lib to populate form fields.
 */

import { PDFDocument, PDFForm } from 'pdf-lib'
import { applyFieldMappings, formatCurrency, formatDate } from './field-mappings'

export interface FinancialAffidavitData {
  // Personal Information
  fullName: string
  dateOfBirth: string
  ssnLastFour: string
  currentAddress: string
  employerName?: string
  occupation?: string
  
  // Employment Income
  employmentStatus: string
  grossMonthlySalary: number
  payFrequency: string
  overtimeIncome?: number
  bonusIncome?: number
  
  // Other Income
  rentalIncome?: number
  investmentIncome?: number
  socialSecurityIncome?: number
  pensionIncome?: number
  disabilityIncome?: number
  unemploymentIncome?: number
  childSupportReceived?: number
  spousalSupportReceived?: number
  otherIncomeAmount?: number
  otherIncomeDescription?: string
  
  // Housing Expenses
  housingType: string
  monthlyRentMortgage: number
  propertyTaxes?: number
  homeownersInsurance?: number
  hoaFees?: number
  homeMaintenance?: number
  
  // Utility Expenses
  electricity: number
  gasHeating?: number
  waterSewer?: number
  trashCollection?: number
  phoneCellPhone: number
  internetCable?: number
  
  // Transportation Expenses
  carPayment?: number
  carInsurance: number
  gasFuel: number
  carMaintenance?: number
  parkingTolls?: number
  publicTransportation?: number
  
  // Food & Personal
  groceries: number
  diningOut?: number
  clothing?: number
  personalCare?: number
  dryCleaning?: number
  
  // Healthcare
  healthInsurance: number
  dentalInsurance?: number
  visionInsurance?: number
  medicalOutOfPocket?: number
  therapyCounseling?: number
  
  // Children's Expenses
  hasChildExpenses?: boolean
  childcareDaycare?: number
  childTuition?: number
  childActivities?: number
  childMedical?: number
  childSupportPaid?: number
  
  // Other Expenses
  lifeInsurance?: number
  entertainment?: number
  subscriptions?: number
  petExpenses?: number
  charitableContributions?: number
  miscExpenses?: number
  miscExpensesDescription?: string
  
  // Assets - Real Estate
  ownsRealEstate?: boolean
  primaryResidenceValue?: number
  primaryResidenceMortgage?: number
  primaryResidenceOwnership?: string
  otherPropertyValue?: number
  otherPropertyMortgage?: number
  
  // Assets - Vehicles
  vehicle1Description?: string
  vehicle1Value?: number
  vehicle1Loan?: number
  vehicle2Description?: string
  vehicle2Value?: number
  vehicle2Loan?: number
  
  // Assets - Financial Accounts
  checkingBalance: number
  savingsBalance?: number
  investmentBalance?: number
  retirement401k?: number
  retirementIra?: number
  pensionValue?: number
  cashOnHand?: number
  
  // Debts
  creditCardDebt: number
  studentLoanDebt?: number
  personalLoanDebt?: number
  medicalDebt?: number
  taxDebt?: number
  otherDebt?: number
  otherDebtDescription?: string
}

export interface FillFinancialAffidavitOptions {
  flatten?: boolean
  includeSchedules?: boolean  // Include Schedule A-F attachments
}

/**
 * Fill the Financial Affidavit form
 */
export async function fillFinancialAffidavit(
  data: FinancialAffidavitData,
  options: FillFinancialAffidavitOptions = { flatten: true, includeSchedules: false }
): Promise<Uint8Array> {
  const templatePath = '/forms/financial-affidavit.pdf'
  
  try {
    const response = await fetch(templatePath)
    if (!response.ok) {
      throw new Error(`Failed to load financial affidavit template: ${response.statusText}`)
    }
    
    const templateBytes = await response.arrayBuffer()
    const pdfDoc = await PDFDocument.load(templateBytes)
    const form = pdfDoc.getForm()
    
    // Convert data to questionnaire format for mapping
    const questionnaireData = convertFinancialDataToQuestionnaireFormat(data)
    
    // Get mapped values
    const mappedValues = applyFieldMappings('financial-affidavit', questionnaireData)
    
    // Fill each field
    for (const [fieldName, value] of Object.entries(mappedValues)) {
      try {
        fillFormField(form, fieldName, value)
      } catch (error) {
        console.warn(`Could not fill field ${fieldName}:`, error)
      }
    }
    
    // Fill computed/summary fields
    fillFinancialComputedFields(form, data)
    
    if (options.flatten) {
      form.flatten()
    }
    
    return pdfDoc.save()
  } catch (error) {
    console.error('Error filling financial affidavit PDF:', error)
    throw error
  }
}

/**
 * Convert FinancialAffidavitData to questionnaire format
 */
function convertFinancialDataToQuestionnaireFormat(data: FinancialAffidavitData): Record<string, any> {
  return {
    // Personal Info
    'full-name': data.fullName,
    'date-of-birth': data.dateOfBirth,
    'social-security-last-four': data.ssnLastFour,
    'current-address': data.currentAddress,
    'employer-name': data.employerName,
    'occupation': data.occupation,
    
    // Employment Income
    'employment-status': data.employmentStatus,
    'gross-monthly-salary': data.grossMonthlySalary,
    'pay-frequency': data.payFrequency,
    'overtime-income': data.overtimeIncome,
    'bonus-income': data.bonusIncome,
    
    // Other Income
    'rental-income': data.rentalIncome,
    'investment-income': data.investmentIncome,
    'social-security-income': data.socialSecurityIncome,
    'pension-income': data.pensionIncome,
    'disability-income': data.disabilityIncome,
    'unemployment-income': data.unemploymentIncome,
    'child-support-received': data.childSupportReceived,
    'spousal-support-received': data.spousalSupportReceived,
    'other-income-amount': data.otherIncomeAmount,
    'other-income-description': data.otherIncomeDescription,
    
    // Housing
    'housing-type': data.housingType,
    'monthly-rent-mortgage': data.monthlyRentMortgage,
    'property-taxes': data.propertyTaxes,
    'homeowners-insurance': data.homeownersInsurance,
    'hoa-fees': data.hoaFees,
    'home-maintenance': data.homeMaintenance,
    
    // Utilities
    'electricity': data.electricity,
    'gas-heating': data.gasHeating,
    'water-sewer': data.waterSewer,
    'trash-collection': data.trashCollection,
    'phone-cell': data.phoneCellPhone,
    'internet-cable': data.internetCable,
    
    // Transportation
    'car-payment': data.carPayment,
    'car-insurance': data.carInsurance,
    'gas-fuel': data.gasFuel,
    'car-maintenance': data.carMaintenance,
    'parking-tolls': data.parkingTolls,
    'public-transportation': data.publicTransportation,
    
    // Food & Personal
    'groceries': data.groceries,
    'dining-out': data.diningOut,
    'clothing': data.clothing,
    'personal-care': data.personalCare,
    'dry-cleaning': data.dryCleaning,
    
    // Healthcare
    'health-insurance': data.healthInsurance,
    'dental-insurance': data.dentalInsurance,
    'vision-insurance': data.visionInsurance,
    'medical-out-of-pocket': data.medicalOutOfPocket,
    'therapy-counseling': data.therapyCounseling,
    
    // Children
    'has-child-expenses': data.hasChildExpenses ? 'yes' : 'no',
    'childcare-daycare': data.childcareDaycare,
    'child-tuition': data.childTuition,
    'child-activities': data.childActivities,
    'child-medical': data.childMedical,
    'child-support-paid': data.childSupportPaid,
    
    // Other Expenses
    'life-insurance': data.lifeInsurance,
    'entertainment': data.entertainment,
    'subscriptions': data.subscriptions,
    'pet-expenses': data.petExpenses,
    'charitable-contributions': data.charitableContributions,
    'misc-expenses': data.miscExpenses,
    'misc-expenses-description': data.miscExpensesDescription,
    
    // Real Estate
    'owns-real-estate': data.ownsRealEstate ? 'yes' : 'no',
    'primary-residence-value': data.primaryResidenceValue,
    'primary-residence-mortgage': data.primaryResidenceMortgage,
    'primary-residence-ownership': data.primaryResidenceOwnership,
    'other-property-value': data.otherPropertyValue,
    'other-property-mortgage': data.otherPropertyMortgage,
    
    // Vehicles
    'vehicle-1-description': data.vehicle1Description,
    'vehicle-1-value': data.vehicle1Value,
    'vehicle-1-loan': data.vehicle1Loan,
    'vehicle-2-description': data.vehicle2Description,
    'vehicle-2-value': data.vehicle2Value,
    'vehicle-2-loan': data.vehicle2Loan,
    
    // Financial Accounts
    'checking-balance': data.checkingBalance,
    'savings-balance': data.savingsBalance,
    'investment-balance': data.investmentBalance,
    'retirement-401k': data.retirement401k,
    'retirement-ira': data.retirementIra,
    'pension-value': data.pensionValue,
    'cash-on-hand': data.cashOnHand,
    
    // Debts
    'credit-card-debt': data.creditCardDebt,
    'student-loan-debt': data.studentLoanDebt,
    'personal-loan-debt': data.personalLoanDebt,
    'medical-debt': data.medicalDebt,
    'tax-debt': data.taxDebt,
    'other-debt': data.otherDebt,
    'other-debt-description': data.otherDebtDescription,
  }
}

/**
 * Fill computed/summary fields
 */
function fillFinancialComputedFields(form: PDFForm, data: FinancialAffidavitData): void {
  // Calculate total monthly income
  const totalIncome = calculateTotalMonthlyIncome(data)
  tryFillTextField(form, 'TotalMonthlyIncome', formatCurrency(totalIncome))
  tryFillTextField(form, 'TotalGrossIncome', formatCurrency(totalIncome))
  
  // Calculate total monthly expenses
  const totalExpenses = calculateTotalMonthlyExpenses(data)
  tryFillTextField(form, 'TotalMonthlyExpenses', formatCurrency(totalExpenses))
  
  // Net monthly income (income - expenses)
  const netIncome = totalIncome - totalExpenses
  tryFillTextField(form, 'NetMonthlyIncome', formatCurrency(netIncome))
  
  // Calculate total assets
  const totalAssets = calculateTotalAssets(data)
  tryFillTextField(form, 'TotalAssets', formatCurrency(totalAssets))
  
  // Calculate total debts/liabilities
  const totalDebts = calculateTotalDebts(data)
  tryFillTextField(form, 'TotalLiabilities', formatCurrency(totalDebts))
  tryFillTextField(form, 'TotalDebts', formatCurrency(totalDebts))
  
  // Net worth (assets - debts)
  const netWorth = totalAssets - totalDebts
  tryFillTextField(form, 'NetWorth', formatCurrency(netWorth))
  
  // Date prepared
  tryFillTextField(form, 'DatePrepared', formatDate(new Date().toISOString()))
  
  // Sub-totals for sections
  const housingTotal = (data.monthlyRentMortgage || 0) + 
    (data.propertyTaxes || 0) + 
    (data.homeownersInsurance || 0) + 
    (data.hoaFees || 0) + 
    (data.homeMaintenance || 0)
  tryFillTextField(form, 'HousingSubtotal', formatCurrency(housingTotal))
  
  const utilityTotal = (data.electricity || 0) + 
    (data.gasHeating || 0) + 
    (data.waterSewer || 0) + 
    (data.trashCollection || 0) + 
    (data.phoneCellPhone || 0) + 
    (data.internetCable || 0)
  tryFillTextField(form, 'UtilitySubtotal', formatCurrency(utilityTotal))
  
  const transportationTotal = (data.carPayment || 0) + 
    (data.carInsurance || 0) + 
    (data.gasFuel || 0) + 
    (data.carMaintenance || 0) + 
    (data.parkingTolls || 0) + 
    (data.publicTransportation || 0)
  tryFillTextField(form, 'TransportationSubtotal', formatCurrency(transportationTotal))
  
  const foodPersonalTotal = (data.groceries || 0) + 
    (data.diningOut || 0) + 
    (data.clothing || 0) + 
    (data.personalCare || 0) + 
    (data.dryCleaning || 0)
  tryFillTextField(form, 'FoodPersonalSubtotal', formatCurrency(foodPersonalTotal))
  
  const healthcareTotal = (data.healthInsurance || 0) + 
    (data.dentalInsurance || 0) + 
    (data.visionInsurance || 0) + 
    (data.medicalOutOfPocket || 0) + 
    (data.therapyCounseling || 0)
  tryFillTextField(form, 'HealthcareSubtotal', formatCurrency(healthcareTotal))
}

/**
 * Calculate total monthly income
 */
function calculateTotalMonthlyIncome(data: FinancialAffidavitData): number {
  return (
    (data.grossMonthlySalary || 0) +
    (data.overtimeIncome || 0) +
    (data.bonusIncome || 0) +
    (data.rentalIncome || 0) +
    (data.investmentIncome || 0) +
    (data.socialSecurityIncome || 0) +
    (data.pensionIncome || 0) +
    (data.disabilityIncome || 0) +
    (data.unemploymentIncome || 0) +
    (data.childSupportReceived || 0) +
    (data.spousalSupportReceived || 0) +
    (data.otherIncomeAmount || 0)
  )
}

/**
 * Calculate total monthly expenses
 */
function calculateTotalMonthlyExpenses(data: FinancialAffidavitData): number {
  return (
    // Housing
    (data.monthlyRentMortgage || 0) +
    (data.propertyTaxes || 0) +
    (data.homeownersInsurance || 0) +
    (data.hoaFees || 0) +
    (data.homeMaintenance || 0) +
    // Utilities
    (data.electricity || 0) +
    (data.gasHeating || 0) +
    (data.waterSewer || 0) +
    (data.trashCollection || 0) +
    (data.phoneCellPhone || 0) +
    (data.internetCable || 0) +
    // Transportation
    (data.carPayment || 0) +
    (data.carInsurance || 0) +
    (data.gasFuel || 0) +
    (data.carMaintenance || 0) +
    (data.parkingTolls || 0) +
    (data.publicTransportation || 0) +
    // Food & Personal
    (data.groceries || 0) +
    (data.diningOut || 0) +
    (data.clothing || 0) +
    (data.personalCare || 0) +
    (data.dryCleaning || 0) +
    // Healthcare
    (data.healthInsurance || 0) +
    (data.dentalInsurance || 0) +
    (data.visionInsurance || 0) +
    (data.medicalOutOfPocket || 0) +
    (data.therapyCounseling || 0) +
    // Children
    (data.childcareDaycare || 0) +
    (data.childTuition || 0) +
    (data.childActivities || 0) +
    (data.childMedical || 0) +
    (data.childSupportPaid || 0) +
    // Other
    (data.lifeInsurance || 0) +
    (data.entertainment || 0) +
    (data.subscriptions || 0) +
    (data.petExpenses || 0) +
    (data.charitableContributions || 0) +
    (data.miscExpenses || 0)
  )
}

/**
 * Calculate total assets
 */
function calculateTotalAssets(data: FinancialAffidavitData): number {
  return (
    // Real Estate (net of mortgages)
    Math.max(0, (data.primaryResidenceValue || 0) - (data.primaryResidenceMortgage || 0)) +
    Math.max(0, (data.otherPropertyValue || 0) - (data.otherPropertyMortgage || 0)) +
    // Vehicles (net of loans)
    Math.max(0, (data.vehicle1Value || 0) - (data.vehicle1Loan || 0)) +
    Math.max(0, (data.vehicle2Value || 0) - (data.vehicle2Loan || 0)) +
    // Financial Accounts
    (data.checkingBalance || 0) +
    (data.savingsBalance || 0) +
    (data.investmentBalance || 0) +
    (data.retirement401k || 0) +
    (data.retirementIra || 0) +
    (data.pensionValue || 0) +
    (data.cashOnHand || 0)
  )
}

/**
 * Calculate total debts
 */
function calculateTotalDebts(data: FinancialAffidavitData): number {
  return (
    (data.primaryResidenceMortgage || 0) +
    (data.otherPropertyMortgage || 0) +
    (data.vehicle1Loan || 0) +
    (data.vehicle2Loan || 0) +
    (data.creditCardDebt || 0) +
    (data.studentLoanDebt || 0) +
    (data.personalLoanDebt || 0) +
    (data.medicalDebt || 0) +
    (data.taxDebt || 0) +
    (data.otherDebt || 0)
  )
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
    // Field doesn't exist
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
 * Generate filled Financial Affidavit from questionnaire responses
 */
export async function generateFilledFinancialAffidavitFromQuestionnaire(
  questionnaireResponses: Record<string, any>,
  options: FillFinancialAffidavitOptions = { flatten: true }
): Promise<Uint8Array> {
  const data: FinancialAffidavitData = {
    // Personal Info
    fullName: questionnaireResponses['full-name'] || '',
    dateOfBirth: questionnaireResponses['date-of-birth'] || '',
    ssnLastFour: questionnaireResponses['social-security-last-four'] || '',
    currentAddress: questionnaireResponses['current-address'] || '',
    employerName: questionnaireResponses['employer-name'],
    occupation: questionnaireResponses['occupation'],
    
    // Employment Income
    employmentStatus: questionnaireResponses['employment-status'] || '',
    grossMonthlySalary: parseFloat(questionnaireResponses['gross-monthly-salary']) || 0,
    payFrequency: questionnaireResponses['pay-frequency'] || '',
    overtimeIncome: parseFloat(questionnaireResponses['overtime-income']) || 0,
    bonusIncome: parseFloat(questionnaireResponses['bonus-income']) || 0,
    
    // Other Income
    rentalIncome: parseFloat(questionnaireResponses['rental-income']) || 0,
    investmentIncome: parseFloat(questionnaireResponses['investment-income']) || 0,
    socialSecurityIncome: parseFloat(questionnaireResponses['social-security-income']) || 0,
    pensionIncome: parseFloat(questionnaireResponses['pension-income']) || 0,
    disabilityIncome: parseFloat(questionnaireResponses['disability-income']) || 0,
    unemploymentIncome: parseFloat(questionnaireResponses['unemployment-income']) || 0,
    childSupportReceived: parseFloat(questionnaireResponses['child-support-received']) || 0,
    spousalSupportReceived: parseFloat(questionnaireResponses['spousal-support-received']) || 0,
    otherIncomeAmount: parseFloat(questionnaireResponses['other-income-amount']) || 0,
    otherIncomeDescription: questionnaireResponses['other-income-description'],
    
    // Housing
    housingType: questionnaireResponses['housing-type'] || '',
    monthlyRentMortgage: parseFloat(questionnaireResponses['monthly-rent-mortgage']) || 0,
    propertyTaxes: parseFloat(questionnaireResponses['property-taxes']) || 0,
    homeownersInsurance: parseFloat(questionnaireResponses['homeowners-insurance']) || 0,
    hoaFees: parseFloat(questionnaireResponses['hoa-fees']) || 0,
    homeMaintenance: parseFloat(questionnaireResponses['home-maintenance']) || 0,
    
    // Utilities
    electricity: parseFloat(questionnaireResponses['electricity']) || 0,
    gasHeating: parseFloat(questionnaireResponses['gas-heating']) || 0,
    waterSewer: parseFloat(questionnaireResponses['water-sewer']) || 0,
    trashCollection: parseFloat(questionnaireResponses['trash-collection']) || 0,
    phoneCellPhone: parseFloat(questionnaireResponses['phone-cell']) || 0,
    internetCable: parseFloat(questionnaireResponses['internet-cable']) || 0,
    
    // Transportation
    carPayment: parseFloat(questionnaireResponses['car-payment']) || 0,
    carInsurance: parseFloat(questionnaireResponses['car-insurance']) || 0,
    gasFuel: parseFloat(questionnaireResponses['gas-fuel']) || 0,
    carMaintenance: parseFloat(questionnaireResponses['car-maintenance']) || 0,
    parkingTolls: parseFloat(questionnaireResponses['parking-tolls']) || 0,
    publicTransportation: parseFloat(questionnaireResponses['public-transportation']) || 0,
    
    // Food & Personal
    groceries: parseFloat(questionnaireResponses['groceries']) || 0,
    diningOut: parseFloat(questionnaireResponses['dining-out']) || 0,
    clothing: parseFloat(questionnaireResponses['clothing']) || 0,
    personalCare: parseFloat(questionnaireResponses['personal-care']) || 0,
    dryCleaning: parseFloat(questionnaireResponses['dry-cleaning']) || 0,
    
    // Healthcare
    healthInsurance: parseFloat(questionnaireResponses['health-insurance']) || 0,
    dentalInsurance: parseFloat(questionnaireResponses['dental-insurance']) || 0,
    visionInsurance: parseFloat(questionnaireResponses['vision-insurance']) || 0,
    medicalOutOfPocket: parseFloat(questionnaireResponses['medical-out-of-pocket']) || 0,
    therapyCounseling: parseFloat(questionnaireResponses['therapy-counseling']) || 0,
    
    // Children
    hasChildExpenses: questionnaireResponses['has-child-expenses'] === 'yes',
    childcareDaycare: parseFloat(questionnaireResponses['childcare-daycare']) || 0,
    childTuition: parseFloat(questionnaireResponses['child-tuition']) || 0,
    childActivities: parseFloat(questionnaireResponses['child-activities']) || 0,
    childMedical: parseFloat(questionnaireResponses['child-medical']) || 0,
    childSupportPaid: parseFloat(questionnaireResponses['child-support-paid']) || 0,
    
    // Other Expenses
    lifeInsurance: parseFloat(questionnaireResponses['life-insurance']) || 0,
    entertainment: parseFloat(questionnaireResponses['entertainment']) || 0,
    subscriptions: parseFloat(questionnaireResponses['subscriptions']) || 0,
    petExpenses: parseFloat(questionnaireResponses['pet-expenses']) || 0,
    charitableContributions: parseFloat(questionnaireResponses['charitable-contributions']) || 0,
    miscExpenses: parseFloat(questionnaireResponses['misc-expenses']) || 0,
    miscExpensesDescription: questionnaireResponses['misc-expenses-description'],
    
    // Real Estate
    ownsRealEstate: questionnaireResponses['owns-real-estate'] === 'yes',
    primaryResidenceValue: parseFloat(questionnaireResponses['primary-residence-value']) || 0,
    primaryResidenceMortgage: parseFloat(questionnaireResponses['primary-residence-mortgage']) || 0,
    primaryResidenceOwnership: questionnaireResponses['primary-residence-ownership'],
    otherPropertyValue: parseFloat(questionnaireResponses['other-property-value']) || 0,
    otherPropertyMortgage: parseFloat(questionnaireResponses['other-property-mortgage']) || 0,
    
    // Vehicles
    vehicle1Description: questionnaireResponses['vehicle-1-description'],
    vehicle1Value: parseFloat(questionnaireResponses['vehicle-1-value']) || 0,
    vehicle1Loan: parseFloat(questionnaireResponses['vehicle-1-loan']) || 0,
    vehicle2Description: questionnaireResponses['vehicle-2-description'],
    vehicle2Value: parseFloat(questionnaireResponses['vehicle-2-value']) || 0,
    vehicle2Loan: parseFloat(questionnaireResponses['vehicle-2-loan']) || 0,
    
    // Financial Accounts
    checkingBalance: parseFloat(questionnaireResponses['checking-balance']) || 0,
    savingsBalance: parseFloat(questionnaireResponses['savings-balance']) || 0,
    investmentBalance: parseFloat(questionnaireResponses['investment-balance']) || 0,
    retirement401k: parseFloat(questionnaireResponses['retirement-401k']) || 0,
    retirementIra: parseFloat(questionnaireResponses['retirement-ira']) || 0,
    pensionValue: parseFloat(questionnaireResponses['pension-value']) || 0,
    cashOnHand: parseFloat(questionnaireResponses['cash-on-hand']) || 0,
    
    // Debts
    creditCardDebt: parseFloat(questionnaireResponses['credit-card-debt']) || 0,
    studentLoanDebt: parseFloat(questionnaireResponses['student-loan-debt']) || 0,
    personalLoanDebt: parseFloat(questionnaireResponses['personal-loan-debt']) || 0,
    medicalDebt: parseFloat(questionnaireResponses['medical-debt']) || 0,
    taxDebt: parseFloat(questionnaireResponses['tax-debt']) || 0,
    otherDebt: parseFloat(questionnaireResponses['other-debt']) || 0,
    otherDebtDescription: questionnaireResponses['other-debt-description'],
  }
  
  return fillFinancialAffidavit(data, options)
}
