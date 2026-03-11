/**
 * Type definitions for the questionnaire system
 */

export type QuestionType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "select"
  | "radio"
  | "checkbox"
  | "email"
  | "phone"
  | "address"
  | "yesno";

export type ValidationRule = {
  type: "required" | "min" | "max" | "pattern" | "email" | "date" | "custom";
  value?: string | number;
  message: string;
  validator?: (value: any) => boolean;
};

export type ConditionalLogic = {
  field: string; // Field ID to check
  operator: "equals" | "notEquals" | "contains" | "greaterThan" | "lessThan" | "isEmpty" | "isNotEmpty";
  value?: any; // Value to compare against
  action: "show" | "hide" | "enable" | "disable" | "setValue";
  targetValue?: any; // For setValue action
};

export interface Question {
  id: string;
  type: QuestionType;
  label: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: any;
  options?: Array<{ label: string; value: string | number }>; // For select, radio, checkbox
  validation?: ValidationRule[];
  conditionalLogic?: ConditionalLogic[];
  helpText?: string;
  fieldName: string; // Used for form field mapping
}

export interface Section {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  conditionalLogic?: ConditionalLogic[];
}

export interface QuestionnaireStructure {
  id: string;
  name: string;
  type: string;
  description?: string;
  sections: Section[];
  metadata?: {
    estimatedTime?: number; // Minutes
    requiredDocuments?: string[];
    helpResources?: Array<{ title: string; url: string }>;
  };
}

export interface QuestionnaireResponse {
  [questionId: string]: any;
}

export interface QuestionnaireProgress {
  currentSection: number;
  totalSections: number;
  completedSections: number[];
  answeredQuestions: string[];
}
