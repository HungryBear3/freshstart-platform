/**
 * Script to seed sample questionnaires into the database
 */

import { QuestionnaireStructure } from "@/types/questionnaire";
import { prisma } from "@/lib/db";

const sampleQuestionnaires: Array<{
  name: string;
  type: string;
  description: string;
  structure: QuestionnaireStructure;
}> = [
  {
    name: "Petition for Dissolution of Marriage",
    type: "petition",
    description: "Basic information needed to file for divorce in Illinois",
    structure: {
      id: "petition",
      name: "Petition for Dissolution of Marriage",
      type: "petition",
      description: "This questionnaire collects basic information needed to file your divorce petition.",
      sections: [
        {
          id: "personal-info",
          title: "Personal Information",
          description: "Information about you and your spouse",
          questions: [
            {
              id: "petitioner-first-name",
              type: "text",
              label: "Your First Name",
              fieldName: "petitionerFirstName",
              required: true,
              placeholder: "Enter your first name",
            },
            {
              id: "petitioner-last-name",
              type: "text",
              label: "Your Last Name",
              fieldName: "petitionerLastName",
              required: true,
              placeholder: "Enter your last name",
            },
            {
              id: "petitioner-middle-name",
              type: "text",
              label: "Your Middle Name (if any)",
              fieldName: "petitionerMiddleName",
              placeholder: "Enter your middle name",
            },
            {
              id: "spouse-first-name",
              type: "text",
              label: "Spouse's First Name",
              fieldName: "spouseFirstName",
              required: true,
              placeholder: "Enter spouse's first name",
            },
            {
              id: "spouse-last-name",
              type: "text",
              label: "Spouse's Last Name",
              fieldName: "spouseLastName",
              required: true,
              placeholder: "Enter spouse's last name",
            },
            {
              id: "marriage-date",
              type: "date",
              label: "Date of Marriage",
              fieldName: "marriageDate",
              required: true,
              helpText: "The date you were legally married",
            },
            {
              id: "separation-date",
              type: "date",
              label: "Date of Separation (if applicable)",
              fieldName: "separationDate",
              helpText: "The date you and your spouse stopped living together",
            },
          ],
        },
        {
          id: "residency",
          title: "Residency Information",
          description: "Information about where you and your spouse live",
          questions: [
            {
              id: "petitioner-county",
              type: "select",
              label: "Your County of Residence",
              fieldName: "petitionerCounty",
              required: true,
              options: [
                { label: "Cook County", value: "cook" },
                { label: "DuPage County", value: "dupage" },
                { label: "Lake County", value: "lake" },
                { label: "Will County", value: "will" },
                { label: "Kane County", value: "kane" },
                { label: "McHenry County", value: "mchenry" },
                { label: "Winnebago County", value: "winnebago" },
                { label: "Madison County", value: "madison" },
                { label: "St. Clair County", value: "stclair" },
                { label: "Sangamon County", value: "sangamon" },
                { label: "Other", value: "other" },
              ],
            },
            {
              id: "petitioner-address",
              type: "address",
              label: "Your Address",
              fieldName: "petitionerAddress",
              required: true,
              placeholder: "Enter your full address",
            },
            {
              id: "spouse-address",
              type: "address",
              label: "Spouse's Address",
              fieldName: "spouseAddress",
              placeholder: "Enter spouse's address (if different)",
            },
            {
              id: "residency-duration-months",
              type: "number",
              label: "How many months have you lived in Illinois?",
              fieldName: "residencyDurationMonths",
              required: true,
              validation: [
                {
                  type: "min",
                  value: 3,
                  message: "You must have lived in Illinois for at least 3 months (about 90 days)",
                },
              ],
              helpText: "Enter whole months. Minimum 3 months of residency is required.",
            },
          ],
        },
        {
          id: "grounds",
          title: "Grounds for Divorce",
          description: "Reason for seeking divorce",
          questions: [
            {
              id: "grounds-type",
              type: "select",
              label: "Grounds for Divorce",
              fieldName: "groundsType",
              required: true,
              options: [
                { label: "Irreconcilable Differences (No-Fault)", value: "irreconcilable" },
                { label: "Impotence", value: "impotence" },
                { label: "Bigamy", value: "bigamy" },
                { label: "Adultery", value: "adultery" },
                { label: "Desertion", value: "desertion" },
                { label: "Habitual Drunkenness or Drug Use", value: "substance" },
                { label: "Cruelty", value: "cruelty" },
                { label: "Attempted Murder", value: "attempted_murder" },
                { label: "Conviction of a Felony", value: "felony" },
              ],
              helpText: "Most divorces in Illinois are filed under 'Irreconcilable Differences' (no-fault)",
            },
            {
              id: "irreconcilable-duration",
              type: "number",
              label: "If Irreconcilable Differences, how long have differences existed? (in months)",
              fieldName: "irreconcilableDuration",
              conditionalLogic: [
                {
                  field: "grounds-type",
                  operator: "equals",
                  value: "irreconcilable",
                  action: "show",
                },
              ],
              validation: [
                {
                  type: "min",
                  value: 2,
                  message: "Differences must have existed for at least 2 months",
                },
              ],
            },
          ],
        },
        {
          id: "children",
          title: "Children Information",
          description: "Information about any children from the marriage",
          questions: [
            {
              id: "has-children",
              type: "yesno",
              label: "Do you have children from this marriage?",
              fieldName: "hasChildren",
              required: true,
            },
            {
              id: "number-of-children",
              type: "number",
              label: "How many children do you have?",
              fieldName: "numberOfChildren",
              conditionalLogic: [
                {
                  field: "has-children",
                  operator: "equals",
                  value: "yes",
                  action: "show",
                },
              ],
              validation: [
                {
                  type: "min",
                  value: 1,
                  message: "Please enter at least 1",
                },
              ],
            },
          ],
        },
        {
          id: "prenup-info",
          title: "Prenuptial / Postnuptial Agreement",
          description:
            "Let us know if you have any written agreement about property, debts, or support if you divorce. This helps us organize your Illinois divorce, but we do not decide if any agreement is valid or enforceable.",
          questions: [
            {
              id: "has-prenup",
              type: "select",
              label: "Do you and your spouse have a prenuptial or postnuptial agreement?",
              fieldName: "hasPrenup",
              required: true,
              options: [
                { label: "Yes", value: "yes" },
                { label: "No", value: "no" },
                { label: "I’m not sure", value: "not_sure" },
              ],
              helpText:
                "A prenup or postnup is a written agreement about what happens with property, debts, and sometimes support if you divorce. Many Illinois couples sign these before or during marriage.",
            },
            {
              id: "prenup-type",
              type: "select",
              label: "Was your agreement signed before or after you were married?",
              fieldName: "prenupType",
              options: [
                { label: "Before the wedding (prenuptial agreement)", value: "prenup" },
                { label: "After the wedding (postnuptial agreement)", value: "postnup" },
              ],
              conditionalLogic: [
                {
                  field: "has-prenup",
                  operator: "equals",
                  value: "yes",
                  action: "show",
                },
              ],
            },
            {
              id: "prenup-signed-state",
              type: "select",
              label: "Where was the agreement signed?",
              fieldName: "prenupSignedState",
              options: [
                { label: "Illinois", value: "IL" },
                { label: "Another U.S. state", value: "other_us" },
                { label: "Outside the United States", value: "international" },
                { label: "I’m not sure", value: "not_sure" },
              ],
              helpText:
                "This helps us keep your information organized. Courts and attorneys decide which state’s law applies, not this software.",
              conditionalLogic: [
                {
                  field: "has-prenup",
                  operator: "equals",
                  value: "yes",
                  action: "show",
                },
              ],
            },
            {
              id: "prenup-has-copy",
              type: "select",
              label: "Do you have a copy of the signed agreement (and any amendments)?",
              fieldName: "hasPrenupCopy",
              options: [
                { label: "Yes, I have a copy", value: "yes" },
                { label: "No, I don’t have a copy", value: "no" },
                { label: "I’m not sure", value: "not_sure" },
              ],
              conditionalLogic: [
                {
                  field: "has-prenup",
                  operator: "equals",
                  value: "yes",
                  action: "show",
                },
              ],
            },
            {
              id: "prenup-independent-counsel",
              type: "select",
              label: "When you signed the agreement, did each of you have your own lawyer?",
              fieldName: "prenupIndependentCounsel",
              options: [
                { label: "We both had our own lawyers", value: "both" },
                { label: "Only one of us had a lawyer", value: "one" },
                { label: "Neither of us had a lawyer", value: "none" },
                { label: "I’m not sure", value: "not_sure" },
              ],
              helpText:
                "Illinois courts often look at whether each person had a chance to get advice. This question just collects background; it does not decide if your agreement is valid.",
              conditionalLogic: [
                {
                  field: "has-prenup",
                  operator: "equals",
                  value: "yes",
                  action: "show",
                },
              ],
            },
            {
              id: "prenup-full-disclosure",
              type: "select",
              label: "Before signing, did you both share information about your income, property, and debts?",
              fieldName: "prenupFullDisclosure",
              options: [
                { label: "Yes, we both shared", value: "full" },
                { label: "We shared some information", value: "partial" },
                { label: "No, not really", value: "none" },
                { label: "I’m not sure", value: "not_sure" },
              ],
              conditionalLogic: [
                {
                  field: "has-prenup",
                  operator: "equals",
                  value: "yes",
                  action: "show",
                },
              ],
            },
            {
              id: "prenup-follow-status",
              type: "select",
              label: "Right now, do you both want to follow the agreement as written?",
              fieldName: "prenupFollowStatus",
              options: [
                { label: "Yes, we both want to follow it", value: "both_follow" },
                {
                  label: "One or both of us is not sure",
                  value: "unsure",
                },
                {
                  label: "One or both of us does not want to follow it",
                  value: "one_or_both_not_follow",
                },
              ],
              helpText:
                "Changing or challenging an agreement is complex and usually needs legal advice. We’ll help you organize your Illinois case, but we do not decide whether the agreement is enforceable.",
              conditionalLogic: [
                {
                  field: "has-prenup",
                  operator: "equals",
                  value: "yes",
                  action: "show",
                },
              ],
            },
            {
              id: "prenup-pressure-indicator",
              type: "select",
              label: "When you signed the agreement, did you feel pressured or unsafe in any way?",
              fieldName: "prenupPressureIndicator",
              options: [
                { label: "No", value: "no" },
                { label: "Yes, I felt pressured", value: "yes" },
                { label: "Prefer not to say", value: "prefer_not_to_say" },
              ],
              helpText:
                "This information is private and will not be shared with your spouse. If you felt pressured, we can provide resources for getting independent legal advice and support.",
              conditionalLogic: [
                {
                  field: "has-prenup",
                  operator: "equals",
                  value: "yes",
                  action: "show",
                },
              ],
            },
            {
              id: "has-independent-financial-access",
              type: "select",
              label: "Do you currently have access to your own financial accounts and important documents?",
              fieldName: "hasIndependentFinancialAccess",
              options: [
                { label: "Yes", value: "yes" },
                { label: "No", value: "no" },
                { label: "Some access, but limited", value: "partial" },
                { label: "Prefer not to say", value: "prefer_not_to_say" },
              ],
              helpText:
                "In Illinois divorce, you have rights to financial transparency. If you don't have access, we can provide information about your rights and ways to safely gather information.",
              conditionalLogic: [
                {
                  field: "has-prenup",
                  operator: "equals",
                  value: "yes",
                  action: "show",
                },
              ],
            },
          ],
        },
      ],
      metadata: {
        estimatedTime: 15,
        requiredDocuments: ["Marriage certificate"],
      },
    },
  },
  // ============================================================
  // FINANCIAL AFFIDAVIT - COMPREHENSIVE VERSION
  // ============================================================
  {
    name: "Financial Affidavit",
    type: "financial_affidavit",
    description: "Comprehensive financial disclosure required by Illinois courts",
    structure: {
      id: "financial_affidavit",
      name: "Financial Affidavit",
      type: "financial_affidavit",
      description: "This form requires you to disclose all income, expenses, assets, and debts. Complete and accurate information is required by the court.",
      sections: [
        // SECTION 1: PERSONAL INFORMATION
        {
          id: "personal-info",
          title: "Personal Information",
          description: "Basic information about you",
          questions: [
            {
              id: "full-name",
              type: "text",
              label: "Your Full Legal Name",
              fieldName: "fullName",
              required: true,
            },
            {
              id: "date-of-birth",
              type: "date",
              label: "Date of Birth",
              fieldName: "dateOfBirth",
              required: true,
            },
            {
              id: "social-security-last-four",
              type: "text",
              label: "Last 4 digits of Social Security Number",
              fieldName: "ssnLastFour",
              required: true,
              helpText: "For identification purposes only",
            },
            {
              id: "current-address",
              type: "address",
              label: "Current Address",
              fieldName: "currentAddress",
              required: true,
            },
            {
              id: "employer-name",
              type: "text",
              label: "Current Employer Name",
              fieldName: "employerName",
              placeholder: "Enter employer name or 'Self-employed' or 'Unemployed'",
            },
            {
              id: "occupation",
              type: "text",
              label: "Occupation/Job Title",
              fieldName: "occupation",
            },
          ],
        },
        // SECTION 2: EMPLOYMENT INCOME
        {
          id: "employment-income",
          title: "Employment Income",
          description: "Income from your job or self-employment",
          questions: [
            {
              id: "employment-status",
              type: "select",
              label: "Employment Status",
              fieldName: "employmentStatus",
              required: true,
              options: [
                { label: "Employed Full-Time", value: "full_time" },
                { label: "Employed Part-Time", value: "part_time" },
                { label: "Self-Employed", value: "self_employed" },
                { label: "Unemployed", value: "unemployed" },
                { label: "Retired", value: "retired" },
                { label: "Disabled", value: "disabled" },
              ],
            },
            {
              id: "gross-monthly-salary",
              type: "number",
              label: "Gross Monthly Salary/Wages (before taxes)",
              fieldName: "grossMonthlySalary",
              required: true,
              helpText: "If paid hourly, calculate: hourly rate × hours per week × 4.33",
            },
            {
              id: "pay-frequency",
              type: "select",
              label: "How often are you paid?",
              fieldName: "payFrequency",
              required: true,
              options: [
                { label: "Weekly", value: "weekly" },
                { label: "Bi-weekly (every 2 weeks)", value: "biweekly" },
                { label: "Semi-monthly (twice a month)", value: "semimonthly" },
                { label: "Monthly", value: "monthly" },
              ],
            },
            {
              id: "overtime-income",
              type: "number",
              label: "Average Monthly Overtime Income",
              fieldName: "overtimeIncome",
              helpText: "Enter 0 if none",
            },
            {
              id: "bonus-income",
              type: "number",
              label: "Average Monthly Bonus/Commission Income",
              fieldName: "bonusIncome",
              helpText: "Divide annual bonuses by 12",
            },
          ],
        },
        // SECTION 3: OTHER INCOME
        {
          id: "other-income",
          title: "Other Income Sources",
          description: "Income from sources other than employment",
          questions: [
            {
              id: "rental-income",
              type: "number",
              label: "Monthly Rental Income",
              fieldName: "rentalIncome",
              helpText: "Net income after expenses from rental properties",
            },
            {
              id: "investment-income",
              type: "number",
              label: "Monthly Investment/Dividend Income",
              fieldName: "investmentIncome",
              helpText: "Dividends, interest, capital gains (divide annual by 12)",
            },
            {
              id: "social-security-income",
              type: "number",
              label: "Monthly Social Security Benefits",
              fieldName: "socialSecurityIncome",
            },
            {
              id: "pension-income",
              type: "number",
              label: "Monthly Pension/Retirement Income",
              fieldName: "pensionIncome",
            },
            {
              id: "disability-income",
              type: "number",
              label: "Monthly Disability Benefits",
              fieldName: "disabilityIncome",
            },
            {
              id: "unemployment-income",
              type: "number",
              label: "Monthly Unemployment Benefits",
              fieldName: "unemploymentIncome",
            },
            {
              id: "child-support-received",
              type: "number",
              label: "Monthly Child Support Received (from other cases)",
              fieldName: "childSupportReceived",
            },
            {
              id: "spousal-support-received",
              type: "number",
              label: "Monthly Spousal Support Received (from other cases)",
              fieldName: "spousalSupportReceived",
            },
            {
              id: "other-income-amount",
              type: "number",
              label: "Other Monthly Income",
              fieldName: "otherIncomeAmount",
            },
            {
              id: "other-income-description",
              type: "text",
              label: "Description of Other Income",
              fieldName: "otherIncomeDescription",
              placeholder: "Describe the source of other income",
            },
          ],
        },
        // SECTION 4: MONTHLY EXPENSES - HOUSING
        {
          id: "housing-expenses",
          title: "Housing Expenses",
          description: "Monthly costs related to your residence",
          questions: [
            {
              id: "housing-type",
              type: "select",
              label: "Do you rent or own your home?",
              fieldName: "housingType",
              required: true,
              options: [
                { label: "Rent", value: "rent" },
                { label: "Own (with mortgage)", value: "own_mortgage" },
                { label: "Own (no mortgage)", value: "own_free" },
                { label: "Live with family/friends", value: "other" },
              ],
            },
            {
              id: "monthly-rent-mortgage",
              type: "number",
              label: "Monthly Rent or Mortgage Payment",
              fieldName: "monthlyRentMortgage",
              required: true,
            },
            {
              id: "property-taxes",
              type: "number",
              label: "Monthly Property Taxes (if not in mortgage)",
              fieldName: "propertyTaxes",
            },
            {
              id: "homeowners-insurance",
              type: "number",
              label: "Monthly Homeowners/Renters Insurance",
              fieldName: "homeownersInsurance",
            },
            {
              id: "hoa-fees",
              type: "number",
              label: "Monthly HOA/Condo Fees",
              fieldName: "hoaFees",
            },
            {
              id: "home-maintenance",
              type: "number",
              label: "Monthly Home Maintenance/Repairs",
              fieldName: "homeMaintenance",
            },
          ],
        },
        // SECTION 5: MONTHLY EXPENSES - UTILITIES
        {
          id: "utility-expenses",
          title: "Utility Expenses",
          description: "Monthly utility costs",
          questions: [
            {
              id: "electricity",
              type: "number",
              label: "Monthly Electricity",
              fieldName: "electricity",
              required: true,
            },
            {
              id: "gas-heating",
              type: "number",
              label: "Monthly Gas/Heating",
              fieldName: "gasHeating",
            },
            {
              id: "water-sewer",
              type: "number",
              label: "Monthly Water/Sewer",
              fieldName: "waterSewer",
            },
            {
              id: "trash-collection",
              type: "number",
              label: "Monthly Trash Collection",
              fieldName: "trashCollection",
            },
            {
              id: "phone-cell",
              type: "number",
              label: "Monthly Phone/Cell Phone",
              fieldName: "phoneCellPhone",
              required: true,
            },
            {
              id: "internet-cable",
              type: "number",
              label: "Monthly Internet/Cable/Streaming",
              fieldName: "internetCable",
            },
          ],
        },
        // SECTION 6: MONTHLY EXPENSES - TRANSPORTATION
        {
          id: "transportation-expenses",
          title: "Transportation Expenses",
          description: "Monthly costs for vehicles and transportation",
          questions: [
            {
              id: "car-payment",
              type: "number",
              label: "Monthly Car Payment(s)",
              fieldName: "carPayment",
            },
            {
              id: "car-insurance",
              type: "number",
              label: "Monthly Car Insurance",
              fieldName: "carInsurance",
              required: true,
            },
            {
              id: "gas-fuel",
              type: "number",
              label: "Monthly Gas/Fuel",
              fieldName: "gasFuel",
              required: true,
            },
            {
              id: "car-maintenance",
              type: "number",
              label: "Monthly Car Maintenance/Repairs",
              fieldName: "carMaintenance",
            },
            {
              id: "parking-tolls",
              type: "number",
              label: "Monthly Parking/Tolls",
              fieldName: "parkingTolls",
            },
            {
              id: "public-transportation",
              type: "number",
              label: "Monthly Public Transportation",
              fieldName: "publicTransportation",
            },
          ],
        },
        // SECTION 7: MONTHLY EXPENSES - FOOD & PERSONAL
        {
          id: "food-personal-expenses",
          title: "Food and Personal Expenses",
          description: "Monthly food and personal care costs",
          questions: [
            {
              id: "groceries",
              type: "number",
              label: "Monthly Groceries",
              fieldName: "groceries",
              required: true,
            },
            {
              id: "dining-out",
              type: "number",
              label: "Monthly Dining Out/Restaurants",
              fieldName: "diningOut",
            },
            {
              id: "clothing",
              type: "number",
              label: "Monthly Clothing",
              fieldName: "clothing",
            },
            {
              id: "personal-care",
              type: "number",
              label: "Monthly Personal Care (haircuts, toiletries)",
              fieldName: "personalCare",
            },
            {
              id: "dry-cleaning",
              type: "number",
              label: "Monthly Dry Cleaning/Laundry",
              fieldName: "dryCleaning",
            },
          ],
        },
        // SECTION 8: MONTHLY EXPENSES - HEALTHCARE
        {
          id: "healthcare-expenses",
          title: "Healthcare Expenses",
          description: "Monthly health-related costs",
          questions: [
            {
              id: "health-insurance",
              type: "number",
              label: "Monthly Health Insurance Premium (your portion)",
              fieldName: "healthInsurance",
              required: true,
              helpText: "Enter 0 if employer pays 100% or you're uninsured",
            },
            {
              id: "dental-insurance",
              type: "number",
              label: "Monthly Dental Insurance Premium",
              fieldName: "dentalInsurance",
            },
            {
              id: "vision-insurance",
              type: "number",
              label: "Monthly Vision Insurance Premium",
              fieldName: "visionInsurance",
            },
            {
              id: "medical-out-of-pocket",
              type: "number",
              label: "Monthly Out-of-Pocket Medical Expenses",
              fieldName: "medicalOutOfPocket",
              helpText: "Copays, prescriptions, etc.",
            },
            {
              id: "therapy-counseling",
              type: "number",
              label: "Monthly Therapy/Counseling",
              fieldName: "therapyCounseling",
            },
          ],
        },
        // SECTION 9: MONTHLY EXPENSES - CHILDREN (if applicable)
        {
          id: "children-expenses",
          title: "Children's Expenses",
          description: "Monthly costs related to your children",
          questions: [
            {
              id: "has-child-expenses",
              type: "yesno",
              label: "Do you have children with expenses to report?",
              fieldName: "hasChildExpenses",
              required: true,
            },
            {
              id: "childcare-daycare",
              type: "number",
              label: "Monthly Childcare/Daycare",
              fieldName: "childcareDaycare",
              conditionalLogic: [
                { field: "has-child-expenses", operator: "equals", value: "yes", action: "show" },
              ],
            },
            {
              id: "child-tuition",
              type: "number",
              label: "Monthly School Tuition",
              fieldName: "childTuition",
              conditionalLogic: [
                { field: "has-child-expenses", operator: "equals", value: "yes", action: "show" },
              ],
            },
            {
              id: "child-activities",
              type: "number",
              label: "Monthly Extracurricular Activities",
              fieldName: "childActivities",
              conditionalLogic: [
                { field: "has-child-expenses", operator: "equals", value: "yes", action: "show" },
              ],
            },
            {
              id: "child-medical",
              type: "number",
              label: "Monthly Children's Medical Expenses (not covered by insurance)",
              fieldName: "childMedical",
              conditionalLogic: [
                { field: "has-child-expenses", operator: "equals", value: "yes", action: "show" },
              ],
            },
            {
              id: "child-support-paid",
              type: "number",
              label: "Monthly Child Support Paid (from other cases)",
              fieldName: "childSupportPaid",
            },
          ],
        },
        // SECTION 10: OTHER MONTHLY EXPENSES
        {
          id: "other-expenses",
          title: "Other Monthly Expenses",
          description: "Additional monthly costs",
          questions: [
            {
              id: "life-insurance",
              type: "number",
              label: "Monthly Life Insurance Premium",
              fieldName: "lifeInsurance",
            },
            {
              id: "entertainment",
              type: "number",
              label: "Monthly Entertainment/Recreation",
              fieldName: "entertainment",
            },
            {
              id: "subscriptions",
              type: "number",
              label: "Monthly Subscriptions (gym, magazines, apps)",
              fieldName: "subscriptions",
            },
            {
              id: "pet-expenses",
              type: "number",
              label: "Monthly Pet Expenses",
              fieldName: "petExpenses",
            },
            {
              id: "charitable-contributions",
              type: "number",
              label: "Monthly Charitable Contributions",
              fieldName: "charitableContributions",
            },
            {
              id: "misc-expenses",
              type: "number",
              label: "Other Monthly Expenses",
              fieldName: "miscExpenses",
            },
            {
              id: "misc-expenses-description",
              type: "text",
              label: "Description of Other Expenses",
              fieldName: "miscExpensesDescription",
            },
          ],
        },
        // SECTION 11: ASSETS - REAL ESTATE
        {
          id: "real-estate-assets",
          title: "Real Estate",
          description: "Property you own or partially own",
          questions: [
            {
              id: "owns-real-estate",
              type: "yesno",
              label: "Do you own any real estate?",
              fieldName: "ownsRealEstate",
              required: true,
            },
            {
              id: "primary-residence-value",
              type: "number",
              label: "Primary Residence - Estimated Market Value",
              fieldName: "primaryResidenceValue",
              conditionalLogic: [
                { field: "owns-real-estate", operator: "equals", value: "yes", action: "show" },
              ],
            },
            {
              id: "primary-residence-mortgage",
              type: "number",
              label: "Primary Residence - Mortgage Balance Owed",
              fieldName: "primaryResidenceMortgage",
              conditionalLogic: [
                { field: "owns-real-estate", operator: "equals", value: "yes", action: "show" },
              ],
            },
            {
              id: "primary-residence-ownership",
              type: "select",
              label: "Primary Residence - Ownership",
              fieldName: "primaryResidenceOwnership",
              conditionalLogic: [
                { field: "owns-real-estate", operator: "equals", value: "yes", action: "show" },
              ],
              options: [
                { label: "Individual (yours only)", value: "individual" },
                { label: "Joint (with spouse)", value: "joint" },
                { label: "Spouse's only", value: "spouse" },
              ],
            },
            {
              id: "other-property-value",
              type: "number",
              label: "Other Real Estate - Total Estimated Value",
              fieldName: "otherPropertyValue",
              conditionalLogic: [
                { field: "owns-real-estate", operator: "equals", value: "yes", action: "show" },
              ],
              helpText: "Rental properties, vacation homes, land, etc.",
            },
            {
              id: "other-property-mortgage",
              type: "number",
              label: "Other Real Estate - Total Mortgage Balance",
              fieldName: "otherPropertyMortgage",
              conditionalLogic: [
                { field: "owns-real-estate", operator: "equals", value: "yes", action: "show" },
              ],
            },
          ],
        },
        // SECTION 12: ASSETS - VEHICLES
        {
          id: "vehicle-assets",
          title: "Vehicles",
          description: "Cars, trucks, motorcycles, boats, etc.",
          questions: [
            {
              id: "vehicle-1-description",
              type: "text",
              label: "Vehicle 1 - Year, Make, Model",
              fieldName: "vehicle1Description",
              placeholder: "e.g., 2020 Honda Accord",
            },
            {
              id: "vehicle-1-value",
              type: "number",
              label: "Vehicle 1 - Estimated Value",
              fieldName: "vehicle1Value",
            },
            {
              id: "vehicle-1-loan",
              type: "number",
              label: "Vehicle 1 - Loan Balance",
              fieldName: "vehicle1Loan",
            },
            {
              id: "vehicle-2-description",
              type: "text",
              label: "Vehicle 2 - Year, Make, Model (if applicable)",
              fieldName: "vehicle2Description",
            },
            {
              id: "vehicle-2-value",
              type: "number",
              label: "Vehicle 2 - Estimated Value",
              fieldName: "vehicle2Value",
            },
            {
              id: "vehicle-2-loan",
              type: "number",
              label: "Vehicle 2 - Loan Balance",
              fieldName: "vehicle2Loan",
            },
          ],
        },
        // SECTION 13: ASSETS - FINANCIAL ACCOUNTS
        {
          id: "financial-accounts",
          title: "Financial Accounts",
          description: "Bank accounts, investments, and retirement",
          questions: [
            {
              id: "checking-balance",
              type: "number",
              label: "Total Checking Account Balance(s)",
              fieldName: "checkingBalance",
              required: true,
            },
            {
              id: "savings-balance",
              type: "number",
              label: "Total Savings Account Balance(s)",
              fieldName: "savingsBalance",
            },
            {
              id: "investment-balance",
              type: "number",
              label: "Investment/Brokerage Account Balance(s)",
              fieldName: "investmentBalance",
              helpText: "Stocks, bonds, mutual funds (non-retirement)",
            },
            {
              id: "retirement-401k",
              type: "number",
              label: "401(k)/403(b) Balance",
              fieldName: "retirement401k",
            },
            {
              id: "retirement-ira",
              type: "number",
              label: "IRA Balance (Traditional + Roth)",
              fieldName: "retirementIra",
            },
            {
              id: "pension-value",
              type: "number",
              label: "Pension Value (if known)",
              fieldName: "pensionValue",
              helpText: "Contact HR for estimated present value",
            },
            {
              id: "cash-on-hand",
              type: "number",
              label: "Cash on Hand",
              fieldName: "cashOnHand",
            },
          ],
        },
        // SECTION 14: DEBTS
        {
          id: "debts",
          title: "Debts and Liabilities",
          description: "All outstanding debts (excluding mortgages/car loans already listed)",
          questions: [
            {
              id: "credit-card-debt",
              type: "number",
              label: "Total Credit Card Debt",
              fieldName: "creditCardDebt",
              required: true,
            },
            {
              id: "student-loan-debt",
              type: "number",
              label: "Total Student Loan Debt",
              fieldName: "studentLoanDebt",
            },
            {
              id: "personal-loan-debt",
              type: "number",
              label: "Total Personal Loan Debt",
              fieldName: "personalLoanDebt",
            },
            {
              id: "medical-debt",
              type: "number",
              label: "Total Medical Debt",
              fieldName: "medicalDebt",
            },
            {
              id: "tax-debt",
              type: "number",
              label: "Tax Debt Owed (IRS, State)",
              fieldName: "taxDebt",
            },
            {
              id: "other-debt",
              type: "number",
              label: "Other Debts",
              fieldName: "otherDebt",
            },
            {
              id: "other-debt-description",
              type: "text",
              label: "Description of Other Debts",
              fieldName: "otherDebtDescription",
            },
          ],
        },
      ],
      metadata: {
        estimatedTime: 45,
        requiredDocuments: [
          "Recent pay stubs (last 3 months)",
          "Tax returns (last 2 years)",
          "Bank statements (last 3 months)",
          "Investment account statements",
          "Retirement account statements",
          "Mortgage statements",
          "Credit card statements",
        ],
      },
    },
  },
  // ============================================================
  // PARENTING PLAN - COMPREHENSIVE VERSION
  // ============================================================
  {
    name: "Parenting Plan",
    type: "parenting_plan",
    description: "Create a comprehensive parenting plan for child custody and visitation",
    structure: {
      id: "parenting_plan",
      name: "Parenting Plan",
      type: "parenting_plan",
      description: "This questionnaire helps you create a detailed parenting plan that addresses custody, schedules, holidays, and decision-making for your children.",
      sections: [
        // SECTION 1: CHILDREN INFORMATION
        {
          id: "children-info",
          title: "Children Information",
          description: "Information about each child",
          questions: [
            {
              id: "children-count",
              type: "number",
              label: "Number of Minor Children",
              fieldName: "childrenCount",
              required: true,
              validation: [
                { type: "min", value: 1, message: "You must have at least one child" },
              ],
            },
            {
              id: "child-1-name",
              type: "text",
              label: "Child 1 - Full Name",
              fieldName: "child1Name",
              required: true,
            },
            {
              id: "child-1-dob",
              type: "date",
              label: "Child 1 - Date of Birth",
              fieldName: "child1Dob",
              required: true,
            },
            {
              id: "child-1-school",
              type: "text",
              label: "Child 1 - Current School",
              fieldName: "child1School",
            },
            {
              id: "child-1-special-needs",
              type: "textarea",
              label: "Child 1 - Special Needs or Considerations",
              fieldName: "child1SpecialNeeds",
              placeholder: "Medical conditions, allergies, special requirements, etc.",
            },
            {
              id: "child-2-name",
              type: "text",
              label: "Child 2 - Full Name (if applicable)",
              fieldName: "child2Name",
            },
            {
              id: "child-2-dob",
              type: "date",
              label: "Child 2 - Date of Birth",
              fieldName: "child2Dob",
            },
            {
              id: "child-2-school",
              type: "text",
              label: "Child 2 - Current School",
              fieldName: "child2School",
            },
            {
              id: "child-3-name",
              type: "text",
              label: "Child 3 - Full Name (if applicable)",
              fieldName: "child3Name",
            },
            {
              id: "child-3-dob",
              type: "date",
              label: "Child 3 - Date of Birth",
              fieldName: "child3Dob",
            },
          ],
        },
        // SECTION 2: DECISION-MAKING AUTHORITY
        {
          id: "decision-making",
          title: "Decision-Making Authority",
          description: "Who will make major decisions for the children",
          questions: [
            {
              id: "education-authority",
              type: "select",
              label: "Educational Decisions (school choice, tutoring, special education)",
              fieldName: "educationAuthority",
              required: true,
              options: [
                { label: "Joint - Both parents decide together", value: "joint" },
                { label: "Parent 1 (Petitioner) has final say", value: "parent1" },
                { label: "Parent 2 (Respondent) has final say", value: "parent2" },
              ],
            },
            {
              id: "healthcare-authority",
              type: "select",
              label: "Healthcare Decisions (medical treatment, doctors, therapy)",
              fieldName: "healthcareAuthority",
              required: true,
              options: [
                { label: "Joint - Both parents decide together", value: "joint" },
                { label: "Parent 1 (Petitioner) has final say", value: "parent1" },
                { label: "Parent 2 (Respondent) has final say", value: "parent2" },
              ],
            },
            {
              id: "religious-authority",
              type: "select",
              label: "Religious/Spiritual Upbringing",
              fieldName: "religiousAuthority",
              required: true,
              options: [
                { label: "Joint - Both parents decide together", value: "joint" },
                { label: "Parent 1 (Petitioner) has final say", value: "parent1" },
                { label: "Parent 2 (Respondent) has final say", value: "parent2" },
                { label: "Not applicable", value: "na" },
              ],
            },
            {
              id: "extracurricular-authority",
              type: "select",
              label: "Extracurricular Activities (sports, clubs, lessons)",
              fieldName: "extracurricularAuthority",
              required: true,
              options: [
                { label: "Joint - Both parents decide together", value: "joint" },
                { label: "Parent 1 (Petitioner) has final say", value: "parent1" },
                { label: "Parent 2 (Respondent) has final say", value: "parent2" },
              ],
            },
          ],
        },
        // SECTION 3: REGULAR PARENTING SCHEDULE
        {
          id: "regular-schedule",
          title: "Regular Parenting Schedule",
          description: "The typical weekly schedule during the school year",
          questions: [
            {
              id: "schedule-type",
              type: "select",
              label: "What type of schedule do you want?",
              fieldName: "scheduleType",
              required: true,
              options: [
                { label: "Standard - Every other weekend with one parent", value: "standard" },
                { label: "50/50 - Week on/week off", value: "week_on_off" },
                { label: "50/50 - 2-2-3 rotation", value: "2_2_3" },
                { label: "50/50 - 3-4-4-3 rotation", value: "3_4_4_3" },
                { label: "60/40 split", value: "60_40" },
                { label: "Custom schedule", value: "custom" },
              ],
              helpText: "50/50 schedules give each parent equal time",
            },
            {
              id: "primary-residence",
              type: "select",
              label: "Primary Residential Parent (for school enrollment purposes)",
              fieldName: "primaryResidence",
              required: true,
              options: [
                { label: "Parent 1 (Petitioner)", value: "parent1" },
                { label: "Parent 2 (Respondent)", value: "parent2" },
                { label: "Shared - alternating years", value: "shared" },
              ],
            },
            {
              id: "weekday-parent",
              type: "select",
              label: "Who has the children on school nights (Mon-Thu)?",
              fieldName: "weekdayParent",
              options: [
                { label: "Parent 1 (Petitioner)", value: "parent1" },
                { label: "Parent 2 (Respondent)", value: "parent2" },
                { label: "Alternating per schedule", value: "alternating" },
              ],
            },
            {
              id: "weekend-exchange-day",
              type: "select",
              label: "When do weekends start?",
              fieldName: "weekendExchangeDay",
              required: true,
              options: [
                { label: "Friday after school", value: "friday_school" },
                { label: "Friday at 6:00 PM", value: "friday_6pm" },
                { label: "Saturday morning", value: "saturday_morning" },
              ],
            },
            {
              id: "weekend-return-day",
              type: "select",
              label: "When do weekends end?",
              fieldName: "weekendReturnDay",
              required: true,
              options: [
                { label: "Sunday at 6:00 PM", value: "sunday_6pm" },
                { label: "Monday morning (drop at school)", value: "monday_school" },
              ],
            },
            {
              id: "midweek-visit",
              type: "yesno",
              label: "Will the non-custodial parent have a midweek visit?",
              fieldName: "midweekVisit",
            },
            {
              id: "midweek-visit-day",
              type: "select",
              label: "Which day for midweek visit?",
              fieldName: "midweekVisitDay",
              conditionalLogic: [
                { field: "midweek-visit", operator: "equals", value: "yes", action: "show" },
              ],
              options: [
                { label: "Tuesday", value: "tuesday" },
                { label: "Wednesday", value: "wednesday" },
                { label: "Thursday", value: "thursday" },
              ],
            },
          ],
        },
        // SECTION 4: HOLIDAYS
        {
          id: "holidays",
          title: "Holiday Schedule",
          description: "How holidays will be divided between parents",
          questions: [
            {
              id: "holiday-approach",
              type: "select",
              label: "How do you want to handle holidays?",
              fieldName: "holidayApproach",
              required: true,
              options: [
                { label: "Alternate years (odd/even)", value: "alternate" },
                { label: "Split each holiday", value: "split" },
                { label: "Specific holidays to each parent", value: "specific" },
              ],
            },
            {
              id: "thanksgiving-odd-years",
              type: "select",
              label: "Thanksgiving - Odd Years",
              fieldName: "thanksgivingOddYears",
              required: true,
              options: [
                { label: "Parent 1 (Petitioner)", value: "parent1" },
                { label: "Parent 2 (Respondent)", value: "parent2" },
                { label: "Split (rotate morning/evening)", value: "split" },
              ],
            },
            {
              id: "christmas-eve-odd-years",
              type: "select",
              label: "Christmas Eve - Odd Years",
              fieldName: "christmasEveOddYears",
              required: true,
              options: [
                { label: "Parent 1 (Petitioner)", value: "parent1" },
                { label: "Parent 2 (Respondent)", value: "parent2" },
              ],
            },
            {
              id: "christmas-day-odd-years",
              type: "select",
              label: "Christmas Day - Odd Years",
              fieldName: "christmasDayOddYears",
              required: true,
              options: [
                { label: "Parent 1 (Petitioner)", value: "parent1" },
                { label: "Parent 2 (Respondent)", value: "parent2" },
              ],
            },
            {
              id: "mothers-day",
              type: "select",
              label: "Mother's Day",
              fieldName: "mothersDay",
              required: true,
              options: [
                { label: "Always with Mother", value: "mother" },
                { label: "Follow regular schedule", value: "regular" },
              ],
            },
            {
              id: "fathers-day",
              type: "select",
              label: "Father's Day",
              fieldName: "fathersDay",
              required: true,
              options: [
                { label: "Always with Father", value: "father" },
                { label: "Follow regular schedule", value: "regular" },
              ],
            },
            {
              id: "child-birthday",
              type: "select",
              label: "Children's Birthdays",
              fieldName: "childBirthday",
              required: true,
              options: [
                { label: "Alternate years", value: "alternate" },
                { label: "Split the day", value: "split" },
                { label: "Celebrate with both parents together", value: "together" },
                { label: "Each parent celebrates separately", value: "separate" },
              ],
            },
            {
              id: "spring-break",
              type: "select",
              label: "Spring Break",
              fieldName: "springBreak",
              required: true,
              options: [
                { label: "Alternate years", value: "alternate" },
                { label: "Split (first half/second half)", value: "split" },
                { label: "Follow regular schedule", value: "regular" },
              ],
            },
          ],
        },
        // SECTION 5: SUMMER SCHEDULE
        {
          id: "summer-schedule",
          title: "Summer Vacation Schedule",
          description: "Parenting time during summer break",
          questions: [
            {
              id: "summer-approach",
              type: "select",
              label: "How will summer be divided?",
              fieldName: "summerApproach",
              required: true,
              options: [
                { label: "Continue regular schedule", value: "regular" },
                { label: "Extended time with non-custodial parent", value: "extended" },
                { label: "50/50 split (2 weeks each alternating)", value: "fifty_fifty" },
                { label: "Custom arrangement", value: "custom" },
              ],
            },
            {
              id: "summer-vacation-weeks",
              type: "number",
              label: "Weeks of uninterrupted vacation time for each parent",
              fieldName: "summerVacationWeeks",
              helpText: "Each parent may request consecutive weeks for vacation",
            },
            {
              id: "vacation-notice-days",
              type: "number",
              label: "Days notice required for vacation travel",
              fieldName: "vacationNoticeDays",
              helpText: "Typically 30-60 days",
            },
          ],
        },
        // SECTION 6: COMMUNICATION
        {
          id: "communication",
          title: "Communication",
          description: "How parents and children will communicate",
          questions: [
            {
              id: "communication-method",
              type: "select",
              label: "Primary communication method between parents",
              fieldName: "communicationMethod",
              required: true,
              options: [
                { label: "Email", value: "email" },
                { label: "Text message", value: "text" },
                { label: "Co-parenting app (OurFamilyWizard, TalkingParents)", value: "app" },
                { label: "Phone calls", value: "phone" },
              ],
            },
            {
              id: "response-time",
              type: "select",
              label: "Expected response time for non-emergency messages",
              fieldName: "responseTime",
              required: true,
              options: [
                { label: "Within 24 hours", value: "24_hours" },
                { label: "Within 48 hours", value: "48_hours" },
                { label: "Within 72 hours", value: "72_hours" },
              ],
            },
            {
              id: "child-phone-contact",
              type: "yesno",
              label: "Can children call/video chat with the other parent during parenting time?",
              fieldName: "childPhoneContact",
              required: true,
            },
            {
              id: "phone-contact-frequency",
              type: "select",
              label: "How often can the other parent call/video chat with children?",
              fieldName: "phoneContactFrequency",
              conditionalLogic: [
                { field: "child-phone-contact", operator: "equals", value: "yes", action: "show" },
              ],
              options: [
                { label: "Daily", value: "daily" },
                { label: "Every other day", value: "every_other_day" },
                { label: "Twice per week", value: "twice_weekly" },
                { label: "As reasonable", value: "reasonable" },
              ],
            },
          ],
        },
        // SECTION 7: TRANSPORTATION & EXCHANGES
        {
          id: "transportation",
          title: "Transportation and Exchanges",
          description: "How children will be transported between homes",
          questions: [
            {
              id: "exchange-location",
              type: "select",
              label: "Where will exchanges take place?",
              fieldName: "exchangeLocation",
              required: true,
              options: [
                { label: "Parent 1's residence", value: "parent1_home" },
                { label: "Parent 2's residence", value: "parent2_home" },
                { label: "School (drop off/pick up)", value: "school" },
                { label: "Public location (police station, restaurant)", value: "public" },
                { label: "Midpoint between homes", value: "midpoint" },
              ],
            },
            {
              id: "transportation-responsibility",
              type: "select",
              label: "Who is responsible for transportation?",
              fieldName: "transportationResponsibility",
              required: true,
              options: [
                { label: "Receiving parent picks up", value: "receiving" },
                { label: "Sending parent drops off", value: "sending" },
                { label: "Split - each drives one way", value: "split" },
              ],
            },
            {
              id: "exchange-time-flexibility",
              type: "number",
              label: "Grace period for exchanges (minutes)",
              fieldName: "exchangeTimeFlexibility",
              helpText: "Typically 15-30 minutes",
            },
          ],
        },
        // SECTION 8: ADDITIONAL PROVISIONS
        {
          id: "additional-provisions",
          title: "Additional Provisions",
          description: "Other important considerations",
          questions: [
            {
              id: "right-of-first-refusal",
              type: "yesno",
              label: "Right of First Refusal?",
              fieldName: "rightOfFirstRefusal",
              required: true,
              helpText: "If one parent can't care for children, the other parent gets first opportunity before a babysitter",
            },
            {
              id: "refusal-hours",
              type: "number",
              label: "Right of First Refusal applies after how many hours?",
              fieldName: "refusalHours",
              conditionalLogic: [
                { field: "right-of-first-refusal", operator: "equals", value: "yes", action: "show" },
              ],
              helpText: "Typically 4-8 hours",
            },
            {
              id: "relocation-notice",
              type: "number",
              label: "Days notice required before relocating with children",
              fieldName: "relocationNotice",
              required: true,
              helpText: "Illinois requires 60 days notice; can agree to more",
            },
            {
              id: "introduce-partners",
              type: "select",
              label: "When can new romantic partners be introduced to children?",
              fieldName: "introducePartners",
              options: [
                { label: "No restrictions", value: "none" },
                { label: "After 3 months of dating", value: "3_months" },
                { label: "After 6 months of dating", value: "6_months" },
                { label: "Not until engaged/committed", value: "committed" },
              ],
            },
            {
              id: "additional-notes",
              type: "textarea",
              label: "Additional Notes or Special Circumstances",
              fieldName: "additionalNotes",
              placeholder: "Any other provisions you want included in the parenting plan...",
            },
          ],
        },
      ],
      metadata: {
        estimatedTime: 40,
        requiredDocuments: [
          "Children's birth certificates",
          "Current school schedules",
          "Work schedules for both parents",
        ],
      },
    },
  },
  // ============================================================
  // MARITAL SETTLEMENT AGREEMENT
  // ============================================================
  {
    name: "Marital Settlement Agreement",
    type: "marital_settlement",
    description: "Agreement on property division, debts, and support for uncontested divorce",
    structure: {
      id: "marital_settlement",
      name: "Marital Settlement Agreement",
      type: "marital_settlement",
      description: "This questionnaire helps create a marital settlement agreement covering property division, debt allocation, and support arrangements.",
      sections: [
        // SECTION 1: BASIC INFORMATION
        {
          id: "basic-info",
          title: "Basic Information",
          description: "Information about both spouses",
          questions: [
            {
              id: "petitioner-name",
              type: "text",
              label: "Petitioner's Full Legal Name",
              fieldName: "petitionerName",
              required: true,
            },
            {
              id: "respondent-name",
              type: "text",
              label: "Respondent's Full Legal Name",
              fieldName: "respondentName",
              required: true,
            },
            {
              id: "marriage-date",
              type: "date",
              label: "Date of Marriage",
              fieldName: "marriageDate",
              required: true,
            },
            {
              id: "separation-date",
              type: "date",
              label: "Date of Separation",
              fieldName: "separationDate",
            },
            {
              id: "has-children",
              type: "yesno",
              label: "Do you have minor children together?",
              fieldName: "hasChildren",
              required: true,
            },
          ],
        },
        // SECTION 1B: PRENUPTIAL / POSTNUPTIAL AGREEMENT SUMMARY
        {
          id: "prenup-summary",
          title: "Prenuptial / Postnuptial Agreement (if any)",
          description:
            "If you have a written agreement about property, debts, or support, summarize the key terms here in your own words. This helps us align your Illinois Marital Settlement Agreement with your expectations where appropriate.",
          questions: [
            {
              id: "prenup-pre-marital-property-rule",
              type: "select",
              label: "Does your agreement say what happens to property either of you owned before the marriage?",
              fieldName: "prenupPreMaritalPropertyRule",
              options: [
                {
                  label: "Each person keeps property they owned before marriage",
                  value: "each_keeps_own",
                },
                {
                  label: "Some pre-marital property is shared or split",
                  value: "some_shared",
                },
                {
                  label: "It treats most property as shared/marital",
                  value: "mostly_shared",
                },
                { label: "I’m not sure", value: "not_sure" },
                { label: "It doesn’t say", value: "not_addressed" },
              ],
              helpText:
                "Use your best understanding; you do not need to copy legal language. Courts and attorneys decide how to interpret any agreement.",
            },
            {
              id: "prenup-marital-property-rule",
              type: "select",
              label: "Does your agreement say what happens to property or money earned during the marriage?",
              fieldName: "prenupMaritalPropertyRule",
              options: [
                {
                  label: "Each person keeps what is in their own name",
                  value: "each_keeps_own",
                },
                {
                  label: "Some things are shared/split and others are separate",
                  value: "mixed",
                },
                {
                  label: "Most or all property is shared/split between you",
                  value: "mostly_shared",
                },
                { label: "I’m not sure", value: "not_sure" },
                { label: "It doesn’t say", value: "not_addressed" },
              ],
            },
            {
              id: "prenup-debt-rule",
              type: "select",
              label: "Does your agreement say who is responsible for debts (credit cards, loans, etc.)?",
              fieldName: "prenupDebtRule",
              options: [
                {
                  label: "Each person is responsible for debts in their own name",
                  value: "each_keeps_own",
                },
                {
                  label: "Most debts are shared/split between you",
                  value: "mostly_shared",
                },
                { label: "I’m not sure", value: "not_sure" },
                { label: "It doesn’t say", value: "not_addressed" },
              ],
            },
            {
              id: "prenup-maintenance-terms",
              type: "select",
              label: "Does your agreement say anything about spousal maintenance (alimony)?",
              fieldName: "prenupMaintenanceTerms",
              options: [
                { label: "It says there will be no maintenance", value: "waiver" },
                {
                  label: "It sets a formula or specific amount/time period",
                  value: "formula_or_amount",
                },
                {
                  label: "It leaves maintenance up to Illinois law/court decisions",
                  value: "refer_to_law",
                },
                { label: "I’m not sure", value: "not_sure" },
                { label: "It doesn’t say", value: "not_addressed" },
              ],
            },
            {
              id: "prenup-other-key-terms",
              type: "textarea",
              label: "Other parts of your agreement that feel especially important to you",
              fieldName: "prenupOtherKeyTerms",
              placeholder:
                "In your own words, describe any other important parts of your agreement (for example, rules about a business, inheritance, or specific property).",
            },
          ],
        },
        // SECTION 2: REAL ESTATE DIVISION
        {
          id: "real-estate-division",
          title: "Real Estate Division",
          description: "How real property will be divided",
          questions: [
            {
              id: "has-marital-home",
              type: "yesno",
              label: "Do you own a marital home?",
              fieldName: "hasMaritalHome",
              required: true,
            },
            {
              id: "marital-home-address",
              type: "address",
              label: "Marital Home Address",
              fieldName: "maritalHomeAddress",
              conditionalLogic: [
                { field: "has-marital-home", operator: "equals", value: "yes", action: "show" },
              ],
            },
            {
              id: "marital-home-value",
              type: "number",
              label: "Estimated Market Value of Marital Home",
              fieldName: "maritalHomeValue",
              conditionalLogic: [
                { field: "has-marital-home", operator: "equals", value: "yes", action: "show" },
              ],
            },
            {
              id: "marital-home-mortgage",
              type: "number",
              label: "Remaining Mortgage Balance",
              fieldName: "maritalHomeMortgage",
              conditionalLogic: [
                { field: "has-marital-home", operator: "equals", value: "yes", action: "show" },
              ],
            },
            {
              id: "marital-home-disposition",
              type: "select",
              label: "What will happen to the marital home?",
              fieldName: "maritalHomeDisposition",
              conditionalLogic: [
                { field: "has-marital-home", operator: "equals", value: "yes", action: "show" },
              ],
              required: true,
              options: [
                { label: "Petitioner keeps the home", value: "petitioner_keeps" },
                { label: "Respondent keeps the home", value: "respondent_keeps" },
                { label: "Sell and split proceeds", value: "sell_split" },
                { label: "Sell and split proceeds unequally", value: "sell_unequal" },
                { label: "One spouse buys out the other", value: "buyout" },
              ],
            },
            {
              id: "home-buyout-amount",
              type: "number",
              label: "Buyout Amount (if applicable)",
              fieldName: "homeBuyoutAmount",
              conditionalLogic: [
                { field: "marital-home-disposition", operator: "equals", value: "buyout", action: "show" },
              ],
            },
            {
              id: "split-percentage-petitioner",
              type: "number",
              label: "Percentage to Petitioner (if unequal split)",
              fieldName: "splitPercentagePetitioner",
              conditionalLogic: [
                { field: "marital-home-disposition", operator: "equals", value: "sell_unequal", action: "show" },
              ],
              helpText: "Enter percentage (e.g., 60 for 60%)",
            },
          ],
        },
        // SECTION 3: VEHICLE DIVISION
        {
          id: "vehicle-division",
          title: "Vehicle Division",
          description: "How vehicles will be divided",
          questions: [
            {
              id: "vehicle-1-description",
              type: "text",
              label: "Vehicle 1 - Description",
              fieldName: "vehicle1Description",
              placeholder: "Year, Make, Model",
            },
            {
              id: "vehicle-1-owner",
              type: "select",
              label: "Vehicle 1 - Awarded To",
              fieldName: "vehicle1Owner",
              options: [
                { label: "Petitioner", value: "petitioner" },
                { label: "Respondent", value: "respondent" },
                { label: "Sell and split", value: "sell" },
              ],
            },
            {
              id: "vehicle-1-loan-responsibility",
              type: "select",
              label: "Vehicle 1 - Who pays remaining loan?",
              fieldName: "vehicle1LoanResponsibility",
              options: [
                { label: "Person who keeps vehicle", value: "keeper" },
                { label: "Split payments", value: "split" },
                { label: "No loan remaining", value: "none" },
              ],
            },
            {
              id: "vehicle-2-description",
              type: "text",
              label: "Vehicle 2 - Description (if applicable)",
              fieldName: "vehicle2Description",
            },
            {
              id: "vehicle-2-owner",
              type: "select",
              label: "Vehicle 2 - Awarded To",
              fieldName: "vehicle2Owner",
              options: [
                { label: "Petitioner", value: "petitioner" },
                { label: "Respondent", value: "respondent" },
                { label: "Sell and split", value: "sell" },
              ],
            },
          ],
        },
        // SECTION 4: BANK ACCOUNTS & INVESTMENTS
        {
          id: "financial-division",
          title: "Bank Accounts and Investments",
          description: "How financial accounts will be divided",
          questions: [
            {
              id: "bank-account-approach",
              type: "select",
              label: "How will bank accounts be divided?",
              fieldName: "bankAccountApproach",
              required: true,
              options: [
                { label: "Each keeps accounts in their name", value: "keep_own" },
                { label: "Split all accounts 50/50", value: "split_equal" },
                { label: "Custom division", value: "custom" },
              ],
            },
            {
              id: "joint-account-balance",
              type: "number",
              label: "Total Balance of Joint Accounts",
              fieldName: "jointAccountBalance",
            },
            {
              id: "joint-account-split",
              type: "select",
              label: "How will joint accounts be split?",
              fieldName: "jointAccountSplit",
              options: [
                { label: "50/50", value: "fifty_fifty" },
                { label: "60/40 to Petitioner", value: "sixty_forty_p" },
                { label: "60/40 to Respondent", value: "sixty_forty_r" },
                { label: "Other arrangement", value: "other" },
              ],
            },
            {
              id: "retirement-division",
              type: "select",
              label: "How will retirement accounts be divided?",
              fieldName: "retirementDivision",
              required: true,
              options: [
                { label: "Each keeps their own retirement accounts", value: "keep_own" },
                { label: "Divide marital portion 50/50 (requires QDRO)", value: "qdro_split" },
                { label: "Offset with other assets", value: "offset" },
              ],
              helpText: "QDRO (Qualified Domestic Relations Order) is needed to divide 401k/pension",
            },
          ],
        },
        // SECTION 5: DEBT ALLOCATION
        {
          id: "debt-allocation",
          title: "Debt Allocation",
          description: "Who will be responsible for which debts",
          questions: [
            {
              id: "debt-approach",
              type: "select",
              label: "General approach to debt division",
              fieldName: "debtApproach",
              required: true,
              options: [
                { label: "Each responsible for debts in their name", value: "own_debts" },
                { label: "Split all marital debt 50/50", value: "split_equal" },
                { label: "Custom allocation", value: "custom" },
              ],
            },
            {
              id: "credit-card-debt-total",
              type: "number",
              label: "Total Credit Card Debt",
              fieldName: "creditCardDebtTotal",
            },
            {
              id: "credit-card-petitioner-responsibility",
              type: "number",
              label: "Credit Card Debt - Petitioner's Responsibility",
              fieldName: "creditCardPetitionerResponsibility",
            },
            {
              id: "credit-card-respondent-responsibility",
              type: "number",
              label: "Credit Card Debt - Respondent's Responsibility",
              fieldName: "creditCardRespondentResponsibility",
            },
            {
              id: "other-debt-allocation",
              type: "textarea",
              label: "Other Debt Allocation Details",
              fieldName: "otherDebtAllocation",
              placeholder: "Describe who is responsible for student loans, personal loans, medical debt, etc.",
            },
          ],
        },
        // SECTION 6: SPOUSAL MAINTENANCE
        {
          id: "spousal-maintenance",
          title: "Spousal Maintenance (Alimony)",
          description: "Support payments between spouses",
          questions: [
            {
              id: "maintenance-agreement",
              type: "select",
              label: "Spousal Maintenance Agreement",
              fieldName: "maintenanceAgreement",
              required: true,
              options: [
                { label: "No spousal maintenance", value: "none" },
                { label: "Petitioner pays Respondent", value: "petitioner_pays" },
                { label: "Respondent pays Petitioner", value: "respondent_pays" },
                { label: "Reserved for future determination", value: "reserved" },
              ],
            },
            {
              id: "maintenance-amount",
              type: "number",
              label: "Monthly Maintenance Amount",
              fieldName: "maintenanceAmount",
              conditionalLogic: [
                { field: "maintenance-agreement", operator: "notEquals", value: "none", action: "show" },
                { field: "maintenance-agreement", operator: "notEquals", value: "reserved", action: "show" },
              ],
            },
            {
              id: "maintenance-duration",
              type: "number",
              label: "Duration of Maintenance (months)",
              fieldName: "maintenanceDuration",
              conditionalLogic: [
                { field: "maintenance-agreement", operator: "notEquals", value: "none", action: "show" },
                { field: "maintenance-agreement", operator: "notEquals", value: "reserved", action: "show" },
              ],
              helpText: "Enter 0 for permanent/indefinite",
            },
            {
              id: "maintenance-modifiable",
              type: "yesno",
              label: "Can maintenance be modified in the future?",
              fieldName: "maintenanceModifiable",
              conditionalLogic: [
                { field: "maintenance-agreement", operator: "notEquals", value: "none", action: "show" },
                { field: "maintenance-agreement", operator: "notEquals", value: "reserved", action: "show" },
              ],
            },
          ],
        },
        // SECTION 7: CHILD SUPPORT (if applicable)
        {
          id: "child-support",
          title: "Child Support",
          description: "Financial support for children",
          questions: [
            {
              id: "child-support-agreement",
              type: "select",
              label: "Child Support Agreement",
              fieldName: "childSupportAgreement",
              required: true,
              options: [
                { label: "No children / Not applicable", value: "na" },
                { label: "Petitioner pays Respondent", value: "petitioner_pays" },
                { label: "Respondent pays Petitioner", value: "respondent_pays" },
                { label: "No support (equal parenting time)", value: "none" },
                { label: "Calculate per Illinois guidelines", value: "guidelines" },
              ],
            },
            {
              id: "child-support-amount",
              type: "number",
              label: "Monthly Child Support Amount",
              fieldName: "childSupportAmount",
              conditionalLogic: [
                { field: "child-support-agreement", operator: "equals", value: "petitioner_pays", action: "show" },
                { field: "child-support-agreement", operator: "equals", value: "respondent_pays", action: "show" },
              ],
            },
            {
              id: "health-insurance-children",
              type: "select",
              label: "Who provides health insurance for children?",
              fieldName: "healthInsuranceChildren",
              options: [
                { label: "Petitioner", value: "petitioner" },
                { label: "Respondent", value: "respondent" },
                { label: "Both (split cost)", value: "both" },
              ],
            },
            {
              id: "uncovered-medical-split",
              type: "select",
              label: "How are uncovered medical expenses split?",
              fieldName: "uncoveredMedicalSplit",
              options: [
                { label: "50/50", value: "fifty_fifty" },
                { label: "Proportional to income", value: "proportional" },
                { label: "Custom arrangement", value: "custom" },
              ],
            },
          ],
        },
        // SECTION 8: PERSONAL PROPERTY
        {
          id: "personal-property",
          title: "Personal Property",
          description: "Household items and personal belongings",
          questions: [
            {
              id: "personal-property-approach",
              type: "select",
              label: "How will personal property be divided?",
              fieldName: "personalPropertyApproach",
              required: true,
              options: [
                { label: "Already divided / Each keeps what they have", value: "already_divided" },
                { label: "Will divide by agreement", value: "by_agreement" },
                { label: "Need to list specific items", value: "list_items" },
              ],
            },
            {
              id: "petitioner-keeps-items",
              type: "textarea",
              label: "Items Petitioner Will Keep",
              fieldName: "petitionerKeepsItems",
              conditionalLogic: [
                { field: "personal-property-approach", operator: "equals", value: "list_items", action: "show" },
              ],
              placeholder: "List furniture, appliances, jewelry, etc. that Petitioner will keep",
            },
            {
              id: "respondent-keeps-items",
              type: "textarea",
              label: "Items Respondent Will Keep",
              fieldName: "respondentKeepsItems",
              conditionalLogic: [
                { field: "personal-property-approach", operator: "equals", value: "list_items", action: "show" },
              ],
              placeholder: "List items that Respondent will keep",
            },
          ],
        },
        // SECTION 9: FINAL PROVISIONS
        {
          id: "final-provisions",
          title: "Final Provisions",
          description: "Additional terms and agreements",
          questions: [
            {
              id: "name-change",
              type: "yesno",
              label: "Does either party want to restore a former name?",
              fieldName: "nameChange",
            },
            {
              id: "name-to-restore",
              type: "text",
              label: "Name to be Restored",
              fieldName: "nameToRestore",
              conditionalLogic: [
                { field: "name-change", operator: "equals", value: "yes", action: "show" },
              ],
            },
            {
              id: "attorney-fees",
              type: "select",
              label: "How will attorney fees be handled?",
              fieldName: "attorneyFees",
              required: true,
              options: [
                { label: "Each party pays their own", value: "own" },
                { label: "Petitioner pays all fees", value: "petitioner" },
                { label: "Respondent pays all fees", value: "respondent" },
                { label: "Split equally", value: "split" },
              ],
            },
            {
              id: "additional-terms",
              type: "textarea",
              label: "Additional Terms or Special Agreements",
              fieldName: "additionalTerms",
              placeholder: "Any other terms you want included in the settlement agreement...",
            },
          ],
        },
      ],
      metadata: {
        estimatedTime: 60,
        requiredDocuments: [
          "Property deeds and titles",
          "Vehicle titles",
          "Bank and investment statements",
          "Retirement account statements",
          "Debt statements",
          "Tax returns",
        ],
      },
    },
  },
];

export async function seedQuestionnaires() {
  console.log("Seeding questionnaires...");

  for (const questionnaire of sampleQuestionnaires) {
    try {
      await prisma.questionnaire.upsert({
        where: { type: questionnaire.type },
        update: {
          name: questionnaire.name,
          description: questionnaire.description,
          structure: questionnaire.structure as any,
          isActive: true,
        },
        create: {
          name: questionnaire.name,
          type: questionnaire.type,
          description: questionnaire.description,
          structure: questionnaire.structure as any,
          isActive: true,
        },
      });

      console.log(`✓ Upserted questionnaire: ${questionnaire.name}`);
    } catch (error) {
      console.error(`Error creating questionnaire "${questionnaire.name}":`, error);
    }
  }

  console.log("Questionnaire seeding complete!");
}

// Export for use in API routes and scripts
export default seedQuestionnaires;
