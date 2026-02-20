/**
 * API route for generating documents from questionnaire responses
 * 
 * Documents are stored directly in the database to work with serverless environments
 * where filesystem storage is ephemeral.
 * 
 * Supports two generation modes:
 * - "summary" (default): Generates a summary PDF document
 * - "official": Fills official Illinois court forms
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { sanitizeString } from "@/lib/security/validation";
import { generatePetitionPDF } from "@/lib/document-generation/petition-pdf";
import { generateParentingPlanPDF } from "@/lib/document-generation/parenting-plan-pdf";
import { generateFinancialAffidavitPDF } from "@/lib/document-generation/financial-affidavit-pdf";
import { generateSettlementAgreementPDF } from "@/lib/document-generation/settlement-agreement-pdf";
import { transformFinancialResponses } from "@/lib/document-generation/transform-financial";
import {
  generateOfficialForm,
  isFormTypeSupported,
  type OfficialFormType,
} from "@/lib/document-generation/official-forms";

export const dynamic = "force-dynamic";

// Map document types to official form types
const DOCUMENT_TO_OFFICIAL_FORM: Record<string, OfficialFormType> = {
  'petition': 'petition-no-children',
  'petition-no-children': 'petition-no-children',
  'petition-with-children': 'petition-with-children',
  'financial-affidavit': 'financial-affidavit',
  'financial_affidavit': 'financial-affidavit',
  'financial_affidavit_short': 'financial-affidavit',
  'parenting-plan': 'parenting-plan',
  'parenting_plan': 'parenting-plan',
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    let { 
      questionnaireResponseId, 
      documentType,
      documentId,  // When provided, update existing document (regenerate) instead of creating new
      generationMode = 'summary',  // 'summary' or 'official'
      flatten = true,  // Whether to flatten official forms (make non-editable)
    } = body;

    // Sanitize string inputs
    questionnaireResponseId = sanitizeString(String(questionnaireResponseId || ""));
    documentType = sanitizeString(String(documentType || ""));
    documentId = documentId ? sanitizeString(String(documentId)) : undefined;
    generationMode = sanitizeString(String(generationMode || "summary")) as "summary" | "official";

    if (!questionnaireResponseId || !documentType) {
      return NextResponse.json(
        { error: "Missing required fields: questionnaireResponseId, documentType" },
        { status: 400 }
      );
    }

    // Get the questionnaire response
    const response = await prisma.questionnaireResponse.findUnique({
      where: { id: questionnaireResponseId },
      include: { questionnaire: true },
    });

    if (!response) {
      return NextResponse.json(
        { error: "Questionnaire response not found" },
        { status: 404 }
      );
    }

    // Check ownership
    if (response.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if response is completed
    if (response.status !== "completed") {
      return NextResponse.json(
        { error: "Questionnaire must be completed before generating documents" },
        { status: 400 }
      );
    }

    // Get the form template
    let template = await prisma.formTemplate.findFirst({
      where: {
        type: documentType,
        isActive: true,
      },
    });

    if (!template) {
      // Create a placeholder template so generation can proceed in dev/MVP
      template = await prisma.formTemplate.create({
        data: {
          name: `${documentType} placeholder`,
          type: documentType,
          description: "Auto-created placeholder template",
          filePath: "placeholder.txt",
          isActive: true,
        },
      });
    }

    // Generate PDF based on document type and generation mode
    const generatedAt = new Date();
    let pdfBytes: Uint8Array | undefined;
    let fileName: string = "";
    let isOfficialForm = false;

    console.log("[Document Generate] Generating PDF for type:", documentType, "mode:", generationMode);

    try {
      // Check if user wants official court form and it's supported
      if (generationMode === 'official') {
        const officialFormType = DOCUMENT_TO_OFFICIAL_FORM[documentType];
        
        if (officialFormType && isFormTypeSupported(officialFormType)) {
          console.log("[Document Generate] Generating official form:", officialFormType);
          
          // Determine if case has children (check response data)
          const hasChildren = 
            (response.responses as any)['has-children'] === 'yes' ||
            (response.responses as any)['hasChildren'] === true ||
            parseInt((response.responses as any)['number-of-children']) > 0;
          
          // For petition, use the appropriate form based on children
          let formTypeToUse = officialFormType;
          if (documentType === 'petition' || documentType === 'petition-no-children' || documentType === 'petition-with-children') {
            formTypeToUse = hasChildren ? 'petition-with-children' : 'petition-no-children';
          }
          
          // Get parent names for parenting plan
          const parent1Name = (response.responses as any)['petitioner-first-name'] + ' ' + 
                             (response.responses as any)['petitioner-last-name'];
          const parent2Name = (response.responses as any)['spouse-first-name'] + ' ' + 
                             (response.responses as any)['spouse-last-name'];
          
          try {
            pdfBytes = await generateOfficialForm(
              formTypeToUse,
              response.responses as Record<string, any>,
              {
                hasChildren,
                parent1Name: parent1Name.trim() || session.user.name || 'Petitioner',
                parent2Name: parent2Name.trim() || 'Respondent',
                flatten,
              }
            );
            
            isOfficialForm = true;
            const formLabel = formTypeToUse.replace(/-/g, '_');
            fileName = `Official_${formLabel}_${formatDateForFilename(generatedAt)}.pdf`;
            
            console.log("[Document Generate] Official form generated successfully");
          } catch (officialFormError) {
            console.warn("[Document Generate] Official form generation failed, falling back to summary:", officialFormError);
            // Fall through to summary generation
          }
        }
      }
      
      // Generate summary PDF if not generating official form or if official form failed
      if (!isOfficialForm) {
        switch (documentType) {
          case "petition":
          case "petition-no-children":
          case "petition-with-children":
            pdfBytes = await generatePetitionPDF(response.responses as any, generatedAt);
            fileName = `Petition_for_Dissolution_${formatDateForFilename(generatedAt)}.pdf`;
            break;
          
          case "parenting-plan":
          case "parenting_plan":
            pdfBytes = await generateParentingPlanPDF(
              response.responses as any,
              { name: session.user.name, email: session.user.email || "" }
            );
            fileName = `Parenting_Plan_${formatDateForFilename(generatedAt)}.pdf`;
            break;
          
          case "financial-affidavit":
          case "financial_affidavit":
          case "financial_affidavit_short":
            // Transform questionnaire responses to FinancialData format
            const financialData = transformFinancialResponses(response.responses as any, session.user.id);
            pdfBytes = await generateFinancialAffidavitPDF(
              financialData,
              { name: session.user.name, email: session.user.email || "" }
            );
            fileName = `Financial_Affidavit_${formatDateForFilename(generatedAt)}.pdf`;
            break;
          
          case "marital-settlement":
          case "marital_settlement":
            // Fetch uploaded prenup documents if user has any
            const prenupDocuments = await prisma.document.findMany({
              where: {
                userId: session.user.id,
                type: "prenup",
              },
              orderBy: {
                generatedAt: "desc",
              },
              select: {
                fileName: true,
                content: true, // Contains metadata with fileUrl
              },
            });
            
            // Extract file names from prenup documents
            const prenupFileNames = prenupDocuments.map((doc) => {
              try {
                const metadata = doc.content ? JSON.parse(doc.content) : {};
                return metadata.originalFileName || doc.fileName;
              } catch {
                return doc.fileName;
              }
            });
            
            pdfBytes = await generateSettlementAgreementPDF(
              {
                ...(response.responses as any),
                // Add prenup document references if any exist
                ...(prenupFileNames.length > 0 && {
                  uploadedPrenupDocuments: prenupFileNames,
                }),
              },
              generatedAt
            );
            fileName = `Marital_Settlement_Agreement_${formatDateForFilename(generatedAt)}.pdf`;
            break;
          
          default:
            // Fallback to formatted text for unknown types
            const textContent = buildFormattedTextContent(documentType, response.responses, generatedAt);
            fileName = `${documentType}_${formatDateForFilename(generatedAt)}.txt`;
            
            const document = await prisma.document.create({
              data: {
                userId: session.user.id,
                type: documentType,
                fileName,
                content: textContent,
                mimeType: "text/plain",
                status: "ready",
                questionnaireResponseId,
              },
            });

            return NextResponse.json(
              {
                document: {
                  id: document.id,
                  fileName: document.fileName,
                  type: document.type,
                  status: document.status,
                  generatedAt: document.generatedAt,
                },
                message: "Document generated successfully.",
              },
              { status: 201 }
            );
        }
      }
    } catch (pdfError) {
      console.error("[Document Generate] PDF generation failed:", pdfError);
      // Fallback to text if PDF generation fails
      const textContent = buildFormattedTextContent(documentType, response.responses, generatedAt);
      fileName = `${documentType}_${formatDateForFilename(generatedAt)}.txt`;
      
      const document = await prisma.document.create({
        data: {
          userId: session.user.id,
          type: documentType,
          fileName,
          content: textContent,
          mimeType: "text/plain",
          status: "ready",
          questionnaireResponseId,
        },
      });

      return NextResponse.json(
        {
          document: {
            id: document.id,
            fileName: document.fileName,
            type: document.type,
            status: document.status,
            generatedAt: document.generatedAt,
          },
          message: "Document generated as text (PDF generation unavailable).",
        },
        { status: 201 }
      );
    }

    // Check if PDF was generated
    if (!pdfBytes) {
      console.error("[Document Generate] PDF generation failed - no bytes produced");
      return NextResponse.json(
        { error: "Failed to generate document PDF" },
        { status: 500 }
      );
    }

    // Convert PDF bytes to base64 for database storage
    const pdfBase64 = Buffer.from(pdfBytes).toString("base64");

    console.log("[Document Generate] PDF generated, size:", pdfBytes.length, "bytes");

    let document;

    // Regenerate: update existing document when documentId provided
    if (documentId) {
      const existing = await prisma.document.findUnique({
        where: { id: documentId },
      });
      if (!existing) {
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 }
        );
      }
      if (existing.userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      document = await prisma.document.update({
        where: { id: documentId },
        data: {
          fileName,
          content: pdfBase64,
          mimeType: "application/pdf",
          status: "ready",
          updatedAt: new Date(),
        },
      });
      console.log("[Document Generate] Document regenerated:", document.id);
    } else {
      // Create new document
      document = await prisma.document.create({
        data: {
          userId: session.user.id,
          type: documentType,
          fileName,
          content: pdfBase64,
          mimeType: "application/pdf",
          status: "ready",
          questionnaireResponseId,
        },
      });
    }

    console.log("[Document Generate] Document created:", {
      id: document.id,
      fileName: document.fileName,
      contentLength: pdfBase64.length,
    });

    return NextResponse.json(
      {
        document: {
          id: document.id,
          fileName: document.fileName,
          type: document.type,
          status: document.status,
          generatedAt: document.generatedAt,
          isOfficialForm,
        },
        message: isOfficialForm 
          ? "Official Illinois court form generated successfully."
          : "PDF document generated successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error generating document:", error);
    return NextResponse.json(
      { error: "Failed to generate document" },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check available document types and their official form support
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Return information about supported document types
    const documentTypes = [
      {
        type: 'petition',
        name: 'Petition for Dissolution of Marriage',
        supportsOfficialForm: true,
        officialFormTypes: ['petition-no-children', 'petition-with-children'],
        description: 'Initial petition to file for divorce',
      },
      {
        type: 'financial-affidavit',
        name: 'Financial Affidavit',
        supportsOfficialForm: true,
        officialFormTypes: ['financial-affidavit'],
        description: 'Disclosure of income, expenses, assets, and debts',
      },
      {
        type: 'parenting-plan',
        name: 'Parenting Plan',
        supportsOfficialForm: true,
        officialFormTypes: ['parenting-plan'],
        description: 'Custody and parenting time schedule',
      },
      {
        type: 'marital-settlement',
        name: 'Marital Settlement Agreement',
        supportsOfficialForm: false,
        officialFormTypes: [],
        description: 'Agreement on property division and support',
      },
    ];
    
    return NextResponse.json({ documentTypes });
  } catch (error) {
    console.error("Error getting document types:", error);
    return NextResponse.json(
      { error: "Failed to get document types" },
      { status: 500 }
    );
  }
}

function formatDateForFilename(date: Date): string {
  return date.toISOString().split("T")[0];
}

function buildFormattedTextContent(documentType: string, responses: any, generatedAt: Date): string {
  const lines: string[] = [];
  
  lines.push("═".repeat(60));
  lines.push(`  FRESHSTART IL - ${documentType.toUpperCase().replace(/-/g, " ")}`);
  lines.push("═".repeat(60));
  lines.push("");
  lines.push(`Generated: ${generatedAt.toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}`);
  lines.push("");
  lines.push("─".repeat(60));
  lines.push("  INFORMATION PROVIDED");
  lines.push("─".repeat(60));
  lines.push("");

  // Format each response field nicely
  for (const [key, value] of Object.entries(responses)) {
    const label = key
      .replace(/-/g, " ")
      .replace(/_/g, " ")
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    
    lines.push(`  ${label}:`);
    lines.push(`    ${value}`);
    lines.push("");
  }

  lines.push("─".repeat(60));
  lines.push("");
  lines.push("DISCLAIMER: This document is generated for informational purposes");
  lines.push("only. This is not legal advice. Please consult with an attorney");
  lines.push("before filing with the court.");
  lines.push("");
  lines.push("═".repeat(60));

  return lines.join("\n");
}
