// Financial data types for Illinois divorce proceedings

export type IncomeSourceType =
  | "wages"
  | "self_employment"
  | "unemployment"
  | "social_security"
  | "pension"
  | "investment"
  | "rental"
  | "other"

export type ExpenseCategory =
  | "housing"
  | "utilities"
  | "food"
  | "transportation"
  | "healthcare"
  | "childcare"
  | "education"
  | "personal"
  | "insurance"
  | "taxes"
  | "other"

export type AssetType =
  | "real_estate"
  | "vehicle"
  | "bank_account"
  | "investment"
  | "retirement"
  | "business"
  | "personal_property"
  | "other"

export type DebtType =
  | "mortgage"
  | "auto_loan"
  | "credit_card"
  | "student_loan"
  | "personal_loan"
  | "medical"
  | "tax_debt"
  | "other"

export type Frequency = "weekly" | "biweekly" | "monthly" | "yearly" | "one_time"

export type Ownership = "individual" | "joint" | "spouse"

export type FinancialAffidavitFormType = "short" | "long"

export interface IncomeSource {
  id?: string
  type: IncomeSourceType
  source: string
  amount: number
  frequency: Frequency
  startDate?: Date | string
  endDate?: Date | string
  isCurrent: boolean
  notes?: string
}

export interface Expense {
  id?: string
  category: ExpenseCategory
  description: string
  amount: number
  frequency: Frequency
  notes?: string
}

export interface Asset {
  id?: string
  type: AssetType
  description: string
  value: number
  ownership: Ownership
  notes?: string
}

export interface Debt {
  id?: string
  type: DebtType
  creditor: string
  description?: string
  balance: number
  monthlyPayment?: number
  ownership: Ownership
  notes?: string
}

export interface FinancialData {
  id?: string
  userId: string
  formType: FinancialAffidavitFormType
  income: IncomeSource[]
  expenses: Expense[]
  assets: Asset[]
  debts: Debt[]
}

// Illinois Child Support Calculation Types
export interface ChildSupportInput {
  parent1NetIncome: number
  parent2NetIncome: number
  numberOfChildren: number
  parentingTimeParent1: number // Percentage (0-100)
  parentingTimeParent2: number // Percentage (0-100)
  healthInsuranceCost?: number
  childcareCost?: number
  educationalExpenses?: number
  extraordinaryMedicalExpenses?: number
}

export interface ChildSupportCalculation {
  combinedNetIncome: number
  basicObligation: number
  sharedParentingAdjustment: number
  healthInsuranceAdjustment: number
  childcareAdjustment: number
  educationalExpensesAdjustment: number
  medicalExpensesAdjustment: number
  totalObligation: number
  parent1Share: number
  parent2Share: number
  parent1Owed: number // Amount parent 1 owes to parent 2
  parent2Owed: number // Amount parent 2 owes to parent 1
}

// Illinois Spousal Maintenance Calculation Types
export interface SpousalMaintenanceInput {
  payerGrossIncome: number
  payeeGrossIncome: number
  durationOfMarriage: number // Years
  combinedGrossIncome: number
}

export interface SpousalMaintenanceCalculation {
  guidelineAmount: number
  guidelineDuration: number // Months
  adjustedAmount?: number
  adjustedDuration?: number
  notes: string[]
}
