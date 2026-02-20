/**
 * Questionnaire rendering engine
 * Handles dynamic form generation, conditional logic, and validation
 */

import {
  QuestionnaireStructure,
  Question,
  Section,
  ConditionalLogic,
  ValidationRule,
  QuestionnaireResponse,
} from "@/types/questionnaire";

export class QuestionnaireEngine {
  private structure: QuestionnaireStructure;
  private responses: QuestionnaireResponse;

  constructor(structure: QuestionnaireStructure, responses: QuestionnaireResponse = {}) {
    this.structure = structure;
    this.responses = responses;
  }

  /**
   * Get all visible sections based on conditional logic
   */
  getVisibleSections(): Section[] {
    return this.structure.sections.filter((section) =>
      this.evaluateConditionalLogic(section.conditionalLogic)
    );
  }

  /**
   * Get visible questions for a section
   */
  getVisibleQuestions(sectionId: string): Question[] {
    const section = this.structure.sections.find((s) => s.id === sectionId);
    if (!section) return [];

    return section.questions.filter((question) =>
      this.evaluateConditionalLogic(question.conditionalLogic)
    );
  }

  /**
   * Evaluate conditional logic rules
   */
  private evaluateConditionalLogic(logic?: ConditionalLogic[]): boolean {
    if (!logic || logic.length === 0) return true;

    // All conditions must be met (AND logic)
    return logic.every((condition) => {
      const fieldValue = this.responses[condition.field];
      return this.evaluateCondition(condition, fieldValue);
    });
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: ConditionalLogic, fieldValue: any): boolean {
    switch (condition.operator) {
      case "equals":
        return fieldValue === condition.value;
      case "notEquals":
        return fieldValue !== condition.value;
      case "contains":
        if (Array.isArray(fieldValue)) {
          return fieldValue.includes(condition.value);
        }
        return String(fieldValue).includes(String(condition.value));
      case "greaterThan":
        return Number(fieldValue) > Number(condition.value);
      case "lessThan":
        return Number(fieldValue) < Number(condition.value);
      case "isEmpty":
        return !fieldValue || fieldValue === "" || (Array.isArray(fieldValue) && fieldValue.length === 0);
      case "isNotEmpty":
        return fieldValue !== undefined && fieldValue !== null && fieldValue !== "" && 
               (!Array.isArray(fieldValue) || fieldValue.length > 0);
      default:
        return true;
    }
  }

  /**
   * Validate a question's answer
   */
  validateQuestion(question: Question, value: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!question.validation || question.validation.length === 0) {
      return { valid: true, errors: [] };
    }

    for (const rule of question.validation) {
      const error = this.validateRule(rule, value, question);
      if (error) {
        errors.push(error);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate a single validation rule
   */
  private validateRule(rule: ValidationRule, value: any, question: Question): string | null {
    switch (rule.type) {
      case "required":
        if (question.required && (value === undefined || value === null || value === "")) {
          return rule.message || `${question.label} is required`;
        }
        break;

      case "min":
        if (value !== undefined && value !== null && value !== "") {
          const numValue = Number(value);
          if (isNaN(numValue) || numValue < Number(rule.value)) {
            return rule.message || `${question.label} must be at least ${rule.value}`;
          }
        }
        break;

      case "max":
        if (value !== undefined && value !== null && value !== "") {
          const numValue = Number(value);
          if (isNaN(numValue) || numValue > Number(rule.value)) {
            return rule.message || `${question.label} must be at most ${rule.value}`;
          }
        }
        break;

      case "pattern":
        if (value && rule.value) {
          const regex = new RegExp(String(rule.value));
          if (!regex.test(String(value))) {
            return rule.message || `${question.label} format is invalid`;
          }
        }
        break;

      case "email":
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
          return rule.message || `${question.label} must be a valid email address`;
        }
        break;

      case "date":
        if (value) {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            return rule.message || `${question.label} must be a valid date`;
          }
        }
        break;

      case "custom":
        if (rule.validator && !rule.validator(value)) {
          return rule.message || `${question.label} is invalid`;
        }
        break;
    }

    return null;
  }

  /**
   * Validate all visible questions
   */
  validateAll(): { valid: boolean; errors: Record<string, string[]> } {
    const errors: Record<string, string[]> = {};
    let isValid = true;

    const visibleSections = this.getVisibleSections();
    for (const section of visibleSections) {
      const visibleQuestions = this.getVisibleQuestions(section.id);
      for (const question of visibleQuestions) {
        const value = this.responses[question.id];
        const validation = this.validateQuestion(question, value);
        if (!validation.valid) {
          errors[question.id] = validation.errors;
          isValid = false;
        }
      }
    }

    return { valid: isValid, errors };
  }

  /**
   * Get progress information
   */
  getProgress(): {
    currentSection: number;
    totalSections: number;
    completedSections: number[];
    answeredQuestions: string[];
    progressPercentage: number;
  } {
    const visibleSections = this.getVisibleSections();
    const totalSections = visibleSections.length;
    const answeredQuestions: string[] = [];
    const completedSections: number[] = [];

    visibleSections.forEach((section, sectionIndex) => {
      const visibleQuestions = this.getVisibleQuestions(section.id);
      const sectionQuestions = visibleQuestions.map((q) => q.id);
      const answeredInSection = sectionQuestions.filter((qId) => {
        const question = this.findQuestion(qId);
        if (!question) return false;
        const value = this.responses[qId];
        const validation = this.validateQuestion(question, value);
        return validation.valid && value !== undefined && value !== null && value !== "";
      });

      answeredQuestions.push(...answeredInSection);

      // Section is complete if all required questions are answered
      const requiredQuestions = visibleQuestions.filter((q) => q.required);
      const allRequiredAnswered = requiredQuestions.every((q) => {
        const value = this.responses[q.id];
        return value !== undefined && value !== null && value !== "";
      });

      if (allRequiredAnswered && requiredQuestions.length > 0) {
        completedSections.push(sectionIndex);
      }
    });

    const progressPercentage =
      totalSections > 0 ? Math.round((completedSections.length / totalSections) * 100) : 0;

    return {
      currentSection: 0, // Will be set by the UI
      totalSections,
      completedSections,
      answeredQuestions,
      progressPercentage,
    };
  }

  /**
   * Find a question by ID
   */
  private findQuestion(questionId: string): Question | undefined {
    for (const section of this.structure.sections) {
      const question = section.questions.find((q) => q.id === questionId);
      if (question) return question;
    }
    return undefined;
  }

  /**
   * Update responses
   */
  updateResponses(responses: QuestionnaireResponse): void {
    this.responses = { ...this.responses, ...responses };
  }

  /**
   * Get current responses
   */
  getResponses(): QuestionnaireResponse {
    return { ...this.responses };
  }

  /**
   * Get the questionnaire structure
   */
  getStructure(): QuestionnaireStructure {
    return this.structure;
  }
}
