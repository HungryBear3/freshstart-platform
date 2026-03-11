/**
 * Document template mapping system
 * Maps questionnaire responses to document form fields
 */

import { FieldMapping, DocumentTemplate } from "./types";

export class DocumentMapper {
  /**
   * Map questionnaire responses to document fields
   */
  static mapResponsesToFields(
    responses: Record<string, any>,
    mappings: FieldMapping[]
  ): Record<string, any> {
    const mappedFields: Record<string, any> = {};

    for (const mapping of mappings) {
      const value = responses[mapping.questionId];

      if (value !== undefined && value !== null) {
        // Apply transformation if provided
        if (mapping.transform) {
          mappedFields[mapping.formField] = mapping.transform(value);
        } else {
          mappedFields[mapping.formField] = value;
        }
      } else if (mapping.defaultValue !== undefined) {
        mappedFields[mapping.formField] = mapping.defaultValue;
      } else if (mapping.required) {
        // Log warning for missing required fields
        console.warn(`Missing required field: ${mapping.formField} (from ${mapping.questionId})`);
      }
    }

    return mappedFields;
  }

  /**
   * Validate that all required fields are present
   */
  static validateMapping(
    responses: Record<string, any>,
    mappings: FieldMapping[]
  ): { valid: boolean; missingFields: string[] } {
    const missingFields: string[] = [];

    for (const mapping of mappings) {
      if (mapping.required) {
        const value = responses[mapping.questionId];
        if (value === undefined || value === null || value === "") {
          missingFields.push(mapping.formField);
        }
      }
    }

    return {
      valid: missingFields.length === 0,
      missingFields,
    };
  }

  /**
   * Get field mappings for a document type
   */
  static getMappingsForType(type: string): FieldMapping[] {
    // This will be populated with actual mappings for each document type
    // For now, return empty array - will be implemented per document type
    return [];
  }
}
