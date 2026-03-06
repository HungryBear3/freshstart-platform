/**
 * PDF generation utility using pdf-lib
 */

import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup } from "pdf-lib";
import * as fs from "fs/promises";
import * as path from "path";
import { DocumentMapper } from "./mapper";
import { FieldMapping } from "./types";

export interface PDFGenerationOptions {
  templatePath: string;
  outputPath: string;
  fieldMappings: FieldMapping[];
  responses: Record<string, any>;
}

export class PDFGenerator {
  /**
   * Generate a PDF from a template and fill it with responses
   */
  static async generatePDF(options: PDFGenerationOptions): Promise<string> {
    try {
      // Read the template PDF
      const templateBytes = await fs.readFile(options.templatePath);
      const pdfDoc = await PDFDocument.load(templateBytes);

      // Get the form from the PDF
      const form = pdfDoc.getForm();

      // Map responses to form fields
      const mappedFields = DocumentMapper.mapResponsesToFields(
        options.responses,
        options.fieldMappings
      );

      // Fill form fields
      await this.fillFormFields(form, mappedFields);

      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      await fs.writeFile(options.outputPath, pdfBytes);

      return options.outputPath;
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Fill form fields in a PDF form
   */
  private static async fillFormFields(
    form: PDFForm,
    fields: Record<string, any>
  ): Promise<void> {
    const formFields = form.getFields();

    for (const [fieldName, value] of Object.entries(fields)) {
      try {
        const field = formFields.find((f) => f.getName() === fieldName);

        if (!field) {
          console.warn(`Field not found in PDF: ${fieldName}`);
          continue;
        }

        // Handle different field types
        const fieldType = field.constructor.name;

        if (fieldType === "PDFTextField") {
          (field as PDFTextField).setText(String(value || ""));
        } else if (fieldType === "PDFCheckBox") {
          const cb = field as PDFCheckBox;
          if (Boolean(value)) {
            cb.check();
          } else {
            cb.uncheck();
          }
        } else if (fieldType === "PDFDropdown") {
          (field as PDFDropdown).select(String(value));
        } else if (fieldType === "PDFRadioGroup") {
          (field as PDFRadioGroup).select(String(value));
        } else {
          console.warn(`Unsupported field type for ${fieldName}: ${fieldType}`);
        }
      } catch (error) {
        console.error(`Error filling field ${fieldName}:`, error);
        // Continue with other fields even if one fails
      }
    }
  }

  /**
   * Create a new PDF from scratch (for documents without templates)
   */
  static async createNewPDF(
    outputPath: string,
    content: { title?: string; text: string }
  ): Promise<string> {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([612, 792]); // US Letter size

      // Add title if provided
      if (content.title) {
        // This is a simplified version - in production, you'd use a proper font
        // For now, we'll just add text
        const { width, height } = page.getSize();
        // Note: pdf-lib doesn't have built-in text rendering, you'd need to use a font
        // This is a placeholder - actual implementation would require font embedding
      }

      const pdfBytes = await pdfDoc.save();
      await fs.writeFile(outputPath, pdfBytes);

      return outputPath;
    } catch (error) {
      console.error("Error creating PDF:", error);
      throw new Error(`Failed to create PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get list of form fields in a PDF template
   */
  static async getTemplateFields(templatePath: string): Promise<string[]> {
    try {
      const templateBytes = await fs.readFile(templatePath);
      const pdfDoc = await PDFDocument.load(templateBytes);
      const form = pdfDoc.getForm();
      const fields = form.getFields();

      return fields.map((field) => field.getName());
    } catch (error) {
      console.error("Error reading template fields:", error);
      throw new Error(`Failed to read template fields: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}
