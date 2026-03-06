/**
 * Sample questionnaire structure for Divorce Petition
 * This can be used to seed the database or as a reference
 */

import { QuestionnaireStructure } from "@/types/questionnaire";

export const samplePetitionQuestionnaire: QuestionnaireStructure = {
  id: "petition",
  name: "Divorce Petition",
  type: "petition",
  description:
    "Complete this questionnaire to generate your Divorce Petition. This form is used to initiate your divorce case in Illinois.",
  sections: [
    {
      id: "personal-info",
      title: "Personal Information",
      description: "Basic information about you and your spouse",
      questions: [
        {
          id: "petitioner-first-name",
          type: "text",
          label: "Your First Name",
          fieldName: "petitionerFirstName",
          required: true,
          placeholder: "Enter your first name",
          validation: [
            {
              type: "required",
              message: "First name is required",
            },
          ],
        },
        {
          id: "petitioner-last-name",
          type: "text",
          label: "Your Last Name",
          fieldName: "petitionerLastName",
          required: true,
          placeholder: "Enter your last name",
          validation: [
            {
              type: "required",
              message: "Last name is required",
            },
          ],
        },
        {
          id: "spouse-first-name",
          type: "text",
          label: "Spouse's First Name",
          fieldName: "spouseFirstName",
          required: true,
          placeholder: "Enter your spouse's first name",
          validation: [
            {
              type: "required",
              message: "Spouse's first name is required",
            },
          ],
        },
        {
          id: "spouse-last-name",
          type: "text",
          label: "Spouse's Last Name",
          fieldName: "spouseLastName",
          required: true,
          placeholder: "Enter your spouse's last name",
          validation: [
            {
              type: "required",
              message: "Spouse's last name is required",
            },
          ],
        },
        {
          id: "marriage-date",
          type: "date",
          label: "Date of Marriage",
          fieldName: "marriageDate",
          required: true,
          helpText: "Enter the date you were married",
          validation: [
            {
              type: "required",
              message: "Marriage date is required",
            },
            {
              type: "date",
              message: "Please enter a valid date",
            },
          ],
        },
        {
          id: "separation-date",
          type: "date",
          label: "Date of Separation (if applicable)",
          fieldName: "separationDate",
          helpText: "Leave blank if you are still living together",
        },
      ],
    },
    {
      id: "residence",
      title: "Residence Information",
      description: "Information about where you and your spouse live",
      questions: [
        {
          id: "county",
          type: "select",
          label: "County",
          fieldName: "county",
          required: true,
          options: [
            { label: "Cook", value: "cook" },
            { label: "DuPage", value: "dupage" },
            { label: "Lake", value: "lake" },
            { label: "Will", value: "will" },
            { label: "Kane", value: "kane" },
            { label: "McHenry", value: "mchenry" },
            { label: "Winnebago", value: "winnebago" },
            { label: "Madison", value: "madison" },
            { label: "St. Clair", value: "stclair" },
            { label: "Other", value: "other" },
          ],
          validation: [
            {
              type: "required",
              message: "County is required",
            },
          ],
        },
        {
          id: "petitioner-residence",
          type: "yesno",
          label: "Have you lived in Illinois for at least 90 days?",
          fieldName: "petitionerIllinoisResident",
          required: true,
          helpText: "You must have been an Illinois resident for at least 90 days to file for divorce in Illinois",
          validation: [
            {
              type: "required",
              message: "This question is required",
            },
          ],
        },
        {
          id: "spouse-residence",
          type: "yesno",
          label: "Has your spouse lived in Illinois for at least 90 days?",
          fieldName: "spouseIllinoisResident",
          required: true,
          validation: [
            {
              type: "required",
              message: "This question is required",
            },
          ],
        },
      ],
    },
    {
      id: "grounds",
      title: "Grounds for Divorce",
      description: "Illinois is a no-fault divorce state, but you must specify grounds",
      questions: [
        {
          id: "grounds-type",
          type: "select",
          label: "Grounds for Divorce",
          fieldName: "grounds",
          required: true,
          options: [
            {
              label: "Irreconcilable Differences (No-Fault)",
              value: "irreconcilable",
            },
            {
              label: "Mental Cruelty",
              value: "mental_cruelty",
            },
            {
              label: "Physical Cruelty",
              value: "physical_cruelty",
            },
            {
              label: "Desertion",
              value: "desertion",
            },
            {
              label: "Adultery",
              value: "adultery",
            },
          ],
          validation: [
            {
              type: "required",
              message: "Please select grounds for divorce",
            },
          ],
        },
        {
          id: "irreconcilable-duration",
          type: "number",
          label: "How long have irreconcilable differences existed? (months)",
          fieldName: "irreconcilableDuration",
          conditionalLogic: [
            {
              field: "grounds-type",
              operator: "equals",
              value: "irreconcilable",
              action: "show",
            },
          ],
          helpText: "Enter the number of months",
          validation: [
            {
              type: "min",
              value: 0,
              message: "Duration must be 0 or greater",
            },
          ],
        },
      ],
    },
    {
      id: "children",
      title: "Children",
      description: "Information about any children from the marriage",
      questions: [
        {
          id: "has-children",
          type: "yesno",
          label: "Do you have children from this marriage?",
          fieldName: "hasChildren",
          required: true,
          validation: [
            {
              type: "required",
              message: "This question is required",
            },
          ],
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
              type: "required",
              message: "Number of children is required",
            },
            {
              type: "min",
              value: 1,
              message: "Must have at least 1 child",
            },
          ],
        },
      ],
    },
    {
      id: "relief",
      title: "Relief Requested",
      description: "What are you asking the court to decide?",
      questions: [
        {
          id: "request-divorce",
          type: "checkbox",
          label: "What are you requesting?",
          fieldName: "reliefRequested",
          required: true,
          options: [
            { label: "Dissolution of Marriage", value: "dissolution" },
            { label: "Child Custody", value: "custody" },
            { label: "Child Support", value: "child_support" },
            { label: "Spousal Maintenance (Alimony)", value: "spousal_maintenance" },
            { label: "Division of Property", value: "property_division" },
            { label: "Division of Debts", value: "debt_division" },
          ],
          validation: [
            {
              type: "required",
              message: "Please select at least one option",
            },
          ],
        },
      ],
    },
  ],
  metadata: {
    estimatedTime: 15,
    requiredDocuments: [
      "Marriage certificate",
      "Proof of Illinois residency",
    ],
    helpResources: [
      {
        title: "Illinois Divorce Process Guide",
        url: "/legal-info/process",
      },
      {
        title: "Divorce Requirements",
        url: "/legal-info/requirements",
      },
    ],
  },
};
