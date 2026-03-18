"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react"

const DOCUMENT_TYPES = [
  "Petition for Dissolution of Marriage",
  "Financial Affidavit",
  "Parenting Plan",
  "Marital Settlement Agreement",
  "Response to Petition",
  "Motion",
  "Response to Motion",
  "Notice of Hearing",
  "Certificate of Service",
  "Other",
]

const ELIGIBILITY_RULES: Record<string, { eligible: boolean; notes: string }> = {
  "Petition for Dissolution of Marriage": {
    eligible: true,
    notes: "Can be e-filed. Must include all required attachments.",
  },
  "Financial Affidavit": {
    eligible: true,
    notes: "Can be e-filed. Must be signed and notarized if required by your county.",
  },
  "Parenting Plan": {
    eligible: true,
    notes: "Can be e-filed. Usually filed with the Petition or as a separate document.",
  },
  "Marital Settlement Agreement": {
    eligible: true,
    notes: "Can be e-filed. Must be signed by both parties.",
  },
  "Response to Petition": {
    eligible: true,
    notes: "Can be e-filed. Must be filed within the required timeframe.",
  },
  "Motion": {
    eligible: true,
    notes: "Most motions can be e-filed. Some emergency motions may require in-person filing.",
  },
  "Response to Motion": {
    eligible: true,
    notes: "Can be e-filed. Check the deadline for responding.",
  },
  "Notice of Hearing": {
    eligible: true,
    notes: "Can be e-filed. Must be served on all parties.",
  },
  "Certificate of Service": {
    eligible: true,
    notes: "Can be e-filed. Must accompany documents that require service.",
  },
  "Other": {
    eligible: false,
    notes: "Please check with your court clerk or review county-specific requirements.",
  },
}

export function DocumentEligibilityChecker() {
  const [selectedDocument, setSelectedDocument] = useState("")
  const [result, setResult] = useState<{ eligible: boolean; notes: string } | null>(null)

  const checkEligibility = () => {
    if (!selectedDocument) {
      setResult(null)
      return
    }

    const rule = ELIGIBILITY_RULES[selectedDocument] || {
      eligible: false,
      notes: "Please check with your court clerk for eligibility.",
    }

    setResult(rule)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Eligibility Checker</CardTitle>
        <CardDescription>
          Check if your document can be e-filed through Illinois E-Services
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="document-type">Document Type</Label>
            <Select value={selectedDocument} onValueChange={setSelectedDocument}>
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={checkEligibility} className="w-full" disabled={!selectedDocument}>
            Check Eligibility
          </Button>

          {result && (
            <Alert
              variant={result.eligible ? "default" : "destructive"}
              className={result.eligible ? "bg-green-50 border-green-200" : ""}
            >
              {result.eligible ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription
                className={result.eligible ? "text-green-800" : ""}
              >
                <div className="font-semibold mb-2">
                  {result.eligible
                    ? "✓ This document can be e-filed"
                    : "✗ This document may not be eligible for e-filing"}
                </div>
                <p className="text-sm">{result.notes}</p>
              </AlertDescription>
            </Alert>
          )}

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> Eligibility may vary by county. Some counties have specific
              requirements or restrictions. Always verify with your court clerk if you're unsure.
            </AlertDescription>
          </Alert>

          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-3">General E-Filing Requirements</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Document must be in PDF format</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>File size must be under 25MB per document</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Document must be signed (if signature required)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>All required attachments must be included</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Payment method must be ready (credit card or e-check)</span>
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
