"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle } from "lucide-react"

const CHECKLIST_ITEMS = [
  {
    id: "account",
    category: "Account Setup",
    items: [
      {
        id: "account-created",
        label: "Created Illinois E-Services account",
        description: "Sign up at efile.illinoiscourts.gov if you haven't already",
        required: true,
      },
      {
        id: "account-verified",
        label: "Verified email address",
        description: "Check your email and click the verification link",
        required: true,
      },
      {
        id: "profile-complete",
        label: "Completed profile information",
        description: "Ensure your name, address, and contact information are correct",
        required: true,
      },
    ],
  },
  {
    id: "documents",
    category: "Document Preparation",
    items: [
      {
        id: "documents-complete",
        label: "All required documents are complete",
        description: "Review your documents to ensure all fields are filled",
        required: true,
      },
      {
        id: "documents-signed",
        label: "Documents are signed (if required)",
        description: "Some documents require signatures before filing",
        required: true,
      },
      {
        id: "documents-pdf",
        label: "Documents are in PDF format",
        description: "E-Services requires PDF format for all documents",
        required: true,
      },
      {
        id: "file-names",
        label: "File names follow naming conventions",
        description: "Use clear, descriptive names (e.g., Petition-Dissolution-Marriage.pdf)",
        required: true,
      },
    ],
  },
  {
    id: "case-info",
    category: "Case Information",
    items: [
      {
        id: "case-number",
        label: "Have case number (if filing in existing case)",
        description: "If this is a new case, you'll receive a case number after filing",
        required: false,
      },
      {
        id: "court-info",
        label: "Know the correct court and county",
        description: "Verify you're filing in the correct jurisdiction",
        required: true,
      },
      {
        id: "filing-fees",
        label: "Know the filing fees",
        description: "Check the court's fee schedule and have payment method ready",
        required: true,
      },
    ],
  },
  {
    id: "payment",
    category: "Payment",
    items: [
      {
        id: "payment-method",
        label: "Payment method ready (credit card or e-check)",
        description: "E-Services accepts credit cards and electronic checks",
        required: true,
      },
      {
        id: "fee-waiver",
        label: "Fee waiver application (if applicable)",
        description: "If you qualify for a fee waiver, have the application ready",
        required: false,
      },
    ],
  },
]

export function PreFilingChecklist() {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

  const toggleItem = (itemId: string) => {
    const newChecked = new Set(checkedItems)
    if (newChecked.has(itemId)) {
      newChecked.delete(itemId)
    } else {
      newChecked.add(itemId)
    }
    setCheckedItems(newChecked)
  }

  const allRequiredChecked = CHECKLIST_ITEMS.every((category) =>
    category.items
      .filter((item) => item.required)
      .every((item) => checkedItems.has(item.id))
  )

  const requiredCount = CHECKLIST_ITEMS.reduce(
    (count, category) =>
      count + category.items.filter((item) => item.required).length,
    0
  )
  const checkedRequiredCount = CHECKLIST_ITEMS.reduce(
    (count, category) =>
      count +
      category.items.filter(
        (item) => item.required && checkedItems.has(item.id)
      ).length,
    0
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pre-Filing Checklist</CardTitle>
        <CardDescription>
          Complete this checklist before filing your documents to ensure a smooth e-filing process
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-blue-900">
                Progress: {checkedRequiredCount} / {requiredCount} required items completed
              </p>
              <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${(checkedRequiredCount / requiredCount) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
            {allRequiredChecked && (
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">Ready to File!</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {CHECKLIST_ITEMS.map((category) => (
            <div key={category.id}>
              <h3 className="font-semibold text-lg mb-3">{category.category}</h3>
              <div className="space-y-3">
                {category.items.map((item) => {
                  const isChecked = checkedItems.has(item.id)
                  return (
                    <div
                      key={item.id}
                      className={`flex items-start gap-3 p-3 border rounded-lg ${
                        isChecked ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
                      }`}
                    >
                      <Checkbox
                        id={item.id}
                        checked={isChecked}
                        onCheckedChange={() => toggleItem(item.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={item.id}
                          className={`font-medium cursor-pointer ${
                            isChecked ? "line-through text-gray-500" : ""
                          }`}
                        >
                          {item.label}
                          {item.required && (
                            <span className="text-red-600 ml-1">*</span>
                          )}
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {allRequiredChecked && (
          <Alert className="mt-6 bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Great!</strong> You've completed all required items. You're ready to proceed
              with e-filing. Review the E-Services Walkthrough for step-by-step instructions.
            </AlertDescription>
          </Alert>
        )}

        {!allRequiredChecked && (
          <Alert className="mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please complete all required items (marked with *) before filing. This will help
              ensure your filing is successful and avoid delays.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
