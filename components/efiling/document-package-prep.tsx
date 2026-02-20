"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, CheckCircle2, Info, AlertCircle } from "lucide-react"

const NAMING_CONVENTIONS = [
  {
    document: "Petition for Dissolution of Marriage",
    example: "Petition-Dissolution-Marriage.pdf",
    notes: "Main petition document",
  },
  {
    document: "Financial Affidavit",
    example: "Financial-Affidavit-Short.pdf",
    notes: "Include 'Short' or 'Long' based on form type",
  },
  {
    document: "Parenting Plan",
    example: "Parenting-Plan.pdf",
    notes: "If multiple children, add child name",
  },
  {
    document: "Marital Settlement Agreement",
    example: "Marital-Settlement-Agreement.pdf",
    notes: "Signed by both parties",
  },
  {
    document: "Certificate of Service",
    example: "Certificate-Service-Petition.pdf",
    notes: "Specify which document it serves",
  },
  {
    document: "Notice of Hearing",
    example: "Notice-Hearing-2024-01-15.pdf",
    notes: "Include hearing date in filename",
  },
]

const ORGANIZATION_TIPS = [
  {
    title: "Group Related Documents",
    description:
      "Keep related documents together. For example, group all financial documents, all parenting documents, etc.",
  },
  {
    title: "Use Consistent Naming",
    description:
      "Use the same naming convention throughout. This makes it easier to find documents later.",
  },
  {
    title: "Number Multiple Pages",
    description:
      "If a document has multiple pages, ensure they're in the correct order before uploading.",
  },
  {
    title: "Check File Sizes",
    description:
      "Ensure each file is under 25MB. If a file is too large, consider splitting it or compressing it.",
  },
  {
    title: "Verify Completeness",
    description:
      "Before uploading, verify that all required documents are included and all pages are present.",
  },
]

export function DocumentPackagePrep() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Document Package Preparation</CardTitle>
          <CardDescription>
            Organize and prepare your documents for e-filing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              File Naming Conventions
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Use clear, descriptive file names that identify the document. This helps the court
              process your filing more efficiently.
            </p>

            <div className="space-y-3">
              {NAMING_CONVENTIONS.map((item, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-medium">{item.document}</span>
                    <code className="text-xs bg-white px-2 py-1 rounded border">
                      {item.example}
                    </code>
                  </div>
                  <p className="text-sm text-gray-600">{item.notes}</p>
                </div>
              ))}
            </div>

            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Best Practices:</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside text-sm">
                  <li>Use hyphens or underscores instead of spaces</li>
                  <li>Keep names concise but descriptive</li>
                  <li>Avoid special characters (#, %, &, etc.)</li>
                  <li>Include dates when relevant (YYYY-MM-DD format)</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>

          <div className="pt-6 border-t">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Organization Tips
            </h3>
            <div className="space-y-3">
              {ORGANIZATION_TIPS.map((tip, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-1">{tip.title}</h4>
                  <p className="text-sm text-gray-600">{tip.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t">
            <h3 className="font-semibold mb-3">Pre-Upload Checklist</h3>
            <div className="space-y-2">
              {[
                "All documents are in PDF format",
                "Each file is under 25MB",
                "File names follow naming conventions",
                "Documents are signed (if required)",
                "All required attachments are included",
                "Documents are in correct order",
                "No duplicate files",
                "All pages are included for each document",
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Once you upload and submit documents, you cannot modify
              them. Make sure everything is correct before submitting. If you discover an error after
              submission, you may need to file an amended document.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
