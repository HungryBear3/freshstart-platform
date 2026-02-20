/**
 * Transform questionnaire responses to FinancialData format for PDF generation
 */

import type { FinancialData, IncomeSource, Expense, Asset, Debt } from "@/lib/financial/types";

interface QuestionnaireResponses {
  [key: string]: any;
}

/**
 * Transform flat questionnaire responses into structured FinancialData
 */
export function transformFinancialResponses(
  responses: QuestionnaireResponses,
  userId: string
): FinancialData {
  const income: IncomeSource[] = [];
  const expenses: Expense[] = [];
  const assets: Asset[] = [];
  const debts: Debt[] = [];

  // Determine form type based on income (short form if under $75k)
  const grossAnnual = responses["gross-annual-income"] || responses["grossAnnualIncome"] || 0;
  const grossMonthly = responses["gross-monthly-salary"] || responses["grossMonthlySalary"] || 0;
  const totalGross = grossAnnual || (grossMonthly * 12);
  const formType = totalGross < 75000 ? "short" : "long";

  // === INCOME SOURCES ===
  
  // Employment income
  if (grossMonthly > 0 || grossAnnual > 0) {
    income.push({
      type: "wages",
      source: responses["employer-name"] || responses["employerName"] || "Employer",
      amount: grossMonthly || (grossAnnual / 12),
      frequency: "monthly",
      isCurrent: true,
    });
  }

  // Overtime
  const overtime = responses["overtime-income"] || responses["overtimeIncome"] || 0;
  if (overtime > 0) {
    income.push({
      type: "wages",
      source: "Overtime Income",
      amount: overtime,
      frequency: "monthly",
      isCurrent: true,
    });
  }

  // Bonus/Commission
  const bonus = responses["bonus-income"] || responses["bonusIncome"] || 0;
  if (bonus > 0) {
    income.push({
      type: "wages",
      source: "Bonus/Commission",
      amount: bonus,
      frequency: "monthly",
      isCurrent: true,
    });
  }

  // Rental income
  const rental = responses["rental-income"] || responses["rentalIncome"] || 0;
  if (rental > 0) {
    income.push({
      type: "rental",
      source: "Rental Property",
      amount: rental,
      frequency: "monthly",
      isCurrent: true,
    });
  }

  // Investment income
  const investment = responses["investment-income"] || responses["investmentIncome"] || 0;
  if (investment > 0) {
    income.push({
      type: "investment",
      source: "Investments/Dividends",
      amount: investment,
      frequency: "monthly",
      isCurrent: true,
    });
  }

  // Social Security
  const socialSecurity = responses["social-security-income"] || responses["socialSecurityIncome"] || 0;
  if (socialSecurity > 0) {
    income.push({
      type: "social_security",
      source: "Social Security",
      amount: socialSecurity,
      frequency: "monthly",
      isCurrent: true,
    });
  }

  // Pension
  const pension = responses["pension-income"] || responses["pensionIncome"] || 0;
  if (pension > 0) {
    income.push({
      type: "pension",
      source: "Pension/Retirement",
      amount: pension,
      frequency: "monthly",
      isCurrent: true,
    });
  }

  // Disability
  const disability = responses["disability-income"] || responses["disabilityIncome"] || 0;
  if (disability > 0) {
    income.push({
      type: "other",
      source: "Disability Benefits",
      amount: disability,
      frequency: "monthly",
      isCurrent: true,
    });
  }

  // Unemployment
  const unemployment = responses["unemployment-income"] || responses["unemploymentIncome"] || 0;
  if (unemployment > 0) {
    income.push({
      type: "unemployment",
      source: "Unemployment Benefits",
      amount: unemployment,
      frequency: "monthly",
      isCurrent: true,
    });
  }

  // Child support received
  const childSupportReceived = responses["child-support-received"] || responses["childSupportReceived"] || 0;
  if (childSupportReceived > 0) {
    income.push({
      type: "other",
      source: "Child Support Received",
      amount: childSupportReceived,
      frequency: "monthly",
      isCurrent: true,
    });
  }

  // Spousal support received
  const spousalReceived = responses["spousal-support-received"] || responses["spousalSupportReceived"] || 0;
  if (spousalReceived > 0) {
    income.push({
      type: "other",
      source: "Spousal Support Received",
      amount: spousalReceived,
      frequency: "monthly",
      isCurrent: true,
    });
  }

  // Other income
  const otherIncome = responses["other-income-amount"] || responses["otherIncomeAmount"] || 0;
  if (otherIncome > 0) {
    income.push({
      type: "other",
      source: responses["other-income-description"] || responses["otherIncomeDescription"] || "Other Income",
      amount: otherIncome,
      frequency: "monthly",
      isCurrent: true,
    });
  }

  // === EXPENSES ===

  // Housing
  const housing = responses["monthly-rent-mortgage"] || responses["monthlyRentMortgage"] || 
                  responses["monthly-housing"] || responses["monthlyHousing"] || 0;
  if (housing > 0) {
    expenses.push({
      category: "housing",
      description: "Rent/Mortgage",
      amount: housing,
      frequency: "monthly",
    });
  }

  // Property taxes
  const propTax = responses["property-taxes"] || responses["propertyTaxes"] || 0;
  if (propTax > 0) {
    expenses.push({
      category: "housing",
      description: "Property Taxes",
      amount: propTax,
      frequency: "monthly",
    });
  }

  // Homeowners insurance
  const homeInsurance = responses["homeowners-insurance"] || responses["homeownersInsurance"] || 0;
  if (homeInsurance > 0) {
    expenses.push({
      category: "insurance",
      description: "Homeowners/Renters Insurance",
      amount: homeInsurance,
      frequency: "monthly",
    });
  }

  // HOA
  const hoa = responses["hoa-fees"] || responses["hoaFees"] || 0;
  if (hoa > 0) {
    expenses.push({
      category: "housing",
      description: "HOA/Condo Fees",
      amount: hoa,
      frequency: "monthly",
    });
  }

  // Utilities
  const electricity = responses["electricity"] || 0;
  const gas = responses["gas-heating"] || responses["gasHeating"] || 0;
  const water = responses["water-sewer"] || responses["waterSewer"] || 0;
  const trash = responses["trash-collection"] || responses["trashCollection"] || 0;
  const phone = responses["phone-cell"] || responses["phoneCellPhone"] || 0;
  const internet = responses["internet-cable"] || responses["internetCable"] || 0;
  const utilities = responses["monthly-utilities"] || responses["monthlyUtilities"] || 0;
  
  const totalUtilities = electricity + gas + water + trash + phone + internet + utilities;
  if (totalUtilities > 0) {
    expenses.push({
      category: "utilities",
      description: "Utilities (electric, gas, water, phone, internet)",
      amount: totalUtilities,
      frequency: "monthly",
    });
  }

  // Transportation
  const carPayment = responses["car-payment"] || responses["carPayment"] || 0;
  const carInsurance = responses["car-insurance"] || responses["carInsurance"] || 0;
  const fuel = responses["gas-fuel"] || responses["gasFuel"] || 0;
  const carMaintenance = responses["car-maintenance"] || responses["carMaintenance"] || 0;
  const parking = responses["parking-tolls"] || responses["parkingTolls"] || 0;
  const publicTransport = responses["public-transportation"] || responses["publicTransportation"] || 0;
  const transport = responses["monthly-transportation"] || responses["monthlyTransportation"] || 0;

  const totalTransport = carPayment + carInsurance + fuel + carMaintenance + parking + publicTransport + transport;
  if (totalTransport > 0) {
    expenses.push({
      category: "transportation",
      description: "Transportation (car, insurance, fuel, etc.)",
      amount: totalTransport,
      frequency: "monthly",
    });
  }

  // Food
  const groceries = responses["groceries"] || 0;
  const dining = responses["dining-out"] || responses["diningOut"] || 0;
  const food = responses["monthly-food"] || responses["monthlyFood"] || 0;
  
  const totalFood = groceries + dining + food;
  if (totalFood > 0) {
    expenses.push({
      category: "food",
      description: "Food (groceries, dining out)",
      amount: totalFood,
      frequency: "monthly",
    });
  }

  // Healthcare
  const healthIns = responses["health-insurance"] || responses["healthInsurance"] || 0;
  const dentalIns = responses["dental-insurance"] || responses["dentalInsurance"] || 0;
  const visionIns = responses["vision-insurance"] || responses["visionInsurance"] || 0;
  const medicalOOP = responses["medical-out-of-pocket"] || responses["medicalOutOfPocket"] || 0;
  const therapy = responses["therapy-counseling"] || responses["therapyCounseling"] || 0;

  const totalHealthcare = healthIns + dentalIns + visionIns + medicalOOP + therapy;
  if (totalHealthcare > 0) {
    expenses.push({
      category: "healthcare",
      description: "Healthcare (insurance, medical expenses)",
      amount: totalHealthcare,
      frequency: "monthly",
    });
  }

  // Childcare
  const childcare = responses["childcare-daycare"] || responses["childcareDaycare"] || 0;
  const tuition = responses["child-tuition"] || responses["childTuition"] || 0;
  const activities = responses["child-activities"] || responses["childActivities"] || 0;
  const childMedical = responses["child-medical"] || responses["childMedical"] || 0;

  const totalChildcare = childcare + tuition + activities + childMedical;
  if (totalChildcare > 0) {
    expenses.push({
      category: "childcare",
      description: "Children (daycare, school, activities, medical)",
      amount: totalChildcare,
      frequency: "monthly",
    });
  }

  // Child support paid
  const childSupportPaid = responses["child-support-paid"] || responses["childSupportPaid"] || 0;
  if (childSupportPaid > 0) {
    expenses.push({
      category: "other",
      description: "Child Support Paid (other cases)",
      amount: childSupportPaid,
      frequency: "monthly",
    });
  }

  // Personal
  const clothing = responses["clothing"] || 0;
  const personalCare = responses["personal-care"] || responses["personalCare"] || 0;
  const dryCleaning = responses["dry-cleaning"] || responses["dryCleaning"] || 0;

  const totalPersonal = clothing + personalCare + dryCleaning;
  if (totalPersonal > 0) {
    expenses.push({
      category: "personal",
      description: "Personal (clothing, grooming)",
      amount: totalPersonal,
      frequency: "monthly",
    });
  }

  // Insurance
  const lifeIns = responses["life-insurance"] || responses["lifeInsurance"] || 0;
  if (lifeIns > 0) {
    expenses.push({
      category: "insurance",
      description: "Life Insurance",
      amount: lifeIns,
      frequency: "monthly",
    });
  }

  // Entertainment/Other
  const entertainment = responses["entertainment"] || 0;
  const subscriptions = responses["subscriptions"] || 0;
  const pets = responses["pet-expenses"] || responses["petExpenses"] || 0;
  const charity = responses["charitable-contributions"] || responses["charitableContributions"] || 0;
  const misc = responses["misc-expenses"] || responses["miscExpenses"] || 0;
  const otherExp = responses["monthly-other"] || responses["monthlyOther"] || 0;

  const totalOther = entertainment + subscriptions + pets + charity + misc + otherExp;
  if (totalOther > 0) {
    expenses.push({
      category: "other",
      description: "Other (entertainment, subscriptions, pets, etc.)",
      amount: totalOther,
      frequency: "monthly",
    });
  }

  // === ASSETS ===

  // Real estate
  const primaryValue = responses["primary-residence-value"] || responses["primaryResidenceValue"] || 0;
  if (primaryValue > 0) {
    assets.push({
      type: "real_estate",
      description: "Primary Residence",
      value: primaryValue,
      ownership: (responses["primary-residence-ownership"] || responses["primaryResidenceOwnership"] || "joint") as any,
    });
  }

  const otherPropValue = responses["other-property-value"] || responses["otherPropertyValue"] || 0;
  if (otherPropValue > 0) {
    assets.push({
      type: "real_estate",
      description: "Other Real Estate",
      value: otherPropValue,
      ownership: "joint",
    });
  }

  // Vehicles
  const vehicle1Value = responses["vehicle-1-value"] || responses["vehicle1Value"] || 0;
  if (vehicle1Value > 0) {
    assets.push({
      type: "vehicle",
      description: responses["vehicle-1-description"] || responses["vehicle1Description"] || "Vehicle 1",
      value: vehicle1Value,
      ownership: "joint",
    });
  }

  const vehicle2Value = responses["vehicle-2-value"] || responses["vehicle2Value"] || 0;
  if (vehicle2Value > 0) {
    assets.push({
      type: "vehicle",
      description: responses["vehicle-2-description"] || responses["vehicle2Description"] || "Vehicle 2",
      value: vehicle2Value,
      ownership: "joint",
    });
  }

  // Bank accounts
  const checking = responses["checking-balance"] || responses["checkingBalance"] || 0;
  if (checking > 0) {
    assets.push({
      type: "bank_account",
      description: "Checking Accounts",
      value: checking,
      ownership: "joint",
    });
  }

  const savings = responses["savings-balance"] || responses["savingsBalance"] || 0;
  if (savings > 0) {
    assets.push({
      type: "bank_account",
      description: "Savings Accounts",
      value: savings,
      ownership: "joint",
    });
  }

  // Investments
  const investmentBal = responses["investment-balance"] || responses["investmentBalance"] || 0;
  if (investmentBal > 0) {
    assets.push({
      type: "investment",
      description: "Investment/Brokerage Accounts",
      value: investmentBal,
      ownership: "joint",
    });
  }

  // Retirement
  const ret401k = responses["retirement-401k"] || responses["retirement401k"] || 0;
  if (ret401k > 0) {
    assets.push({
      type: "retirement",
      description: "401(k)/403(b)",
      value: ret401k,
      ownership: "individual",
    });
  }

  const retIra = responses["retirement-ira"] || responses["retirementIra"] || 0;
  if (retIra > 0) {
    assets.push({
      type: "retirement",
      description: "IRA Accounts",
      value: retIra,
      ownership: "individual",
    });
  }

  const pensionVal = responses["pension-value"] || responses["pensionValue"] || 0;
  if (pensionVal > 0) {
    assets.push({
      type: "retirement",
      description: "Pension",
      value: pensionVal,
      ownership: "individual",
    });
  }

  // Cash
  const cash = responses["cash-on-hand"] || responses["cashOnHand"] || 0;
  if (cash > 0) {
    assets.push({
      type: "other",
      description: "Cash on Hand",
      value: cash,
      ownership: "individual",
    });
  }

  // === DEBTS ===

  // Mortgages
  const primaryMortgage = responses["primary-residence-mortgage"] || responses["primaryResidenceMortgage"] || 0;
  if (primaryMortgage > 0) {
    debts.push({
      type: "mortgage",
      creditor: "Primary Residence Mortgage",
      balance: primaryMortgage,
      ownership: "joint",
    });
  }

  const otherMortgage = responses["other-property-mortgage"] || responses["otherPropertyMortgage"] || 0;
  if (otherMortgage > 0) {
    debts.push({
      type: "mortgage",
      creditor: "Other Property Mortgage",
      balance: otherMortgage,
      ownership: "joint",
    });
  }

  // Vehicle loans
  const vehicle1Loan = responses["vehicle-1-loan"] || responses["vehicle1Loan"] || 0;
  if (vehicle1Loan > 0) {
    debts.push({
      type: "auto_loan",
      creditor: "Vehicle 1 Loan",
      balance: vehicle1Loan,
      ownership: "joint",
    });
  }

  const vehicle2Loan = responses["vehicle-2-loan"] || responses["vehicle2Loan"] || 0;
  if (vehicle2Loan > 0) {
    debts.push({
      type: "auto_loan",
      creditor: "Vehicle 2 Loan",
      balance: vehicle2Loan,
      ownership: "joint",
    });
  }

  // Credit cards
  const creditCards = responses["credit-card-debt"] || responses["creditCardDebt"] || 0;
  if (creditCards > 0) {
    debts.push({
      type: "credit_card",
      creditor: "Credit Cards",
      balance: creditCards,
      ownership: "joint",
    });
  }

  // Student loans
  const studentLoans = responses["student-loan-debt"] || responses["studentLoanDebt"] || 0;
  if (studentLoans > 0) {
    debts.push({
      type: "student_loan",
      creditor: "Student Loans",
      balance: studentLoans,
      ownership: "individual",
    });
  }

  // Personal loans
  const personalLoans = responses["personal-loan-debt"] || responses["personalLoanDebt"] || 0;
  if (personalLoans > 0) {
    debts.push({
      type: "personal_loan",
      creditor: "Personal Loans",
      balance: personalLoans,
      ownership: "joint",
    });
  }

  // Medical debt
  const medicalDebt = responses["medical-debt"] || responses["medicalDebt"] || 0;
  if (medicalDebt > 0) {
    debts.push({
      type: "medical",
      creditor: "Medical Debt",
      balance: medicalDebt,
      ownership: "joint",
    });
  }

  // Tax debt
  const taxDebt = responses["tax-debt"] || responses["taxDebt"] || 0;
  if (taxDebt > 0) {
    debts.push({
      type: "tax_debt",
      creditor: "IRS/State Tax Debt",
      balance: taxDebt,
      ownership: "joint",
    });
  }

  // Other debt
  const otherDebt = responses["other-debt"] || responses["otherDebt"] || 0;
  if (otherDebt > 0) {
    debts.push({
      type: "other",
      creditor: responses["other-debt-description"] || responses["otherDebtDescription"] || "Other Debt",
      balance: otherDebt,
      ownership: "joint",
    });
  }

  return {
    userId,
    formType,
    income,
    expenses,
    assets,
    debts,
  };
}
