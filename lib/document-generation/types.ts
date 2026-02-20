/**
 * Type definitions for document generation system
 */

export interface DocumentTemplate {
  id: string;
  type: string;
  name: string;
  filePath: string;
  fieldMappings: FieldMapping[];
}

export interface FieldMapping {
  formField: string; // Field name in the PDF form
  questionId: string; // Question ID from questionnaire
  transform?: (value: any) => any; // Optional transformation function
  defaultValue?: any;
  required?: boolean;
}

export interface DocumentGenerationOptions {
  templateId: string;
  responses: Record<string, any>;
  outputPath?: string;
  format?: "pdf" | "fillable-pdf";
}

export interface GeneratedDocument {
  id: string;
  type: string;
  fileName: string;
  filePath: string;
  status: "draft" | "ready" | "filed" | "accepted" | "rejected";
  generatedAt: Date;
}
