"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { HelpCircle, Search, AlertCircle, CheckCircle2, Info } from "lucide-react"

const COMMON_ISSUES = [
  {
    issue: "Cannot log in to E-Services",
    solutions: [
      "Verify you're using the correct email address",
      "Check if your account is locked (too many failed login attempts)",
      "Try resetting your password",
      "Clear your browser cache and cookies",
      "Try a different browser",
      "Contact E-Services support if issues persist",
    ],
    category: "account",
  },
  {
    issue: "File upload fails or times out",
    solutions: [
      "Check file size (must be under 25MB)",
      "Verify file is in PDF format",
      "Check your internet connection",
      "Try uploading one file at a time",
      "Close other browser tabs/applications",
      "Try a different browser",
    ],
    category: "upload",
  },
  {
    issue: "Payment processing error",
    solutions: [
      "Verify payment method information is correct",
      "Check with your bank that the card/account is active",
      "Ensure sufficient funds are available",
      "Try a different payment method",
      "Contact your bank to ensure no blocks on online transactions",
      "Contact E-Services support for payment issues",
    ],
    category: "payment",
  },
  {
    issue: "Document rejected by court",
    solutions: [
      "Review rejection reason provided by court",
      "Check if document is signed (if signature required)",
      "Verify all required fields are completed",
      "Ensure document type matches what you selected",
      "Check if document format meets court requirements",
      "File an amended or corrected document",
    ],
    category: "rejection",
  },
  {
    issue: "Cannot find case number",
    solutions: [
      "Check your email for filing confirmation (case number is usually included)",
      "Log into E-Services and check 'My Filings' section",
      "Contact the court clerk's office",
      "If it's a new case, wait for processing (may take 1-2 business days)",
    ],
    category: "case",
  },
  {
    issue: "Forgot password or cannot reset",
    solutions: [
      "Click 'Forgot Password' on login page",
      "Check spam/junk folder for reset email",
      "Verify email address is correct",
      "Try using security questions if available",
      "Contact E-Services support for account recovery",
    ],
    category: "account",
  },
  {
    issue: "Browser compatibility issues",
    solutions: [
      "Use supported browsers: Chrome, Firefox, Edge, or Safari (latest versions)",
      "Update your browser to latest version",
      "Disable browser extensions that might interfere",
      "Try incognito/private browsing mode",
      "Clear browser cache and cookies",
    ],
    category: "technical",
  },
  {
    issue: "Filing fees seem incorrect",
    solutions: [
      "Verify you selected the correct document types",
      "Check county-specific fee schedules",
      "Some documents may have additional fees",
      "Contact court clerk to verify fee amounts",
      "Review fee breakdown before submitting payment",
    ],
    category: "payment",
  },
]

export function EFilingTroubleshooting() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredIssues = COMMON_ISSUES.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.issue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.solutions.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = selectedCategory === null || item.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const categories = Array.from(new Set(COMMON_ISSUES.map((item) => item.category)))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Troubleshooting Guide</CardTitle>
        <CardDescription>
          Common issues and solutions for Illinois E-Services
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Search and Filter */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search for issues or solutions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedCategory === null
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                All Categories
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded-full text-sm capitalize ${
                    selectedCategory === category
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {category.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Issues List */}
          {filteredIssues.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No issues found matching your search. Try different keywords or clear filters.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {filteredIssues.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3 mb-3">
                    <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{item.issue}</h3>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <div className="ml-8 space-y-2">
                    <p className="text-sm font-medium text-gray-700 mb-2">Solutions:</p>
                    <ul className="space-y-2">
                      {item.solutions.map((solution, solIndex) => (
                        <li key={solIndex} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{solution}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Additional Help */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Still need help?</strong> If you can't resolve your issue using the solutions
              above, contact Illinois E-Services support:
              <ul className="mt-2 space-y-1 text-sm">
                <li>
                  <strong>Phone:</strong> Check the E-Services portal for current support phone
                  number
                </li>
                <li>
                  <strong>Email:</strong> Available through the E-Services portal contact form
                </li>
                <li>
                  <strong>Hours:</strong> Typically Monday-Friday, 8:00 AM - 5:00 PM (check portal
                  for current hours)
                </li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Quick Tips */}
          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-3">Quick Tips to Avoid Issues</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                "Always use PDF format for documents",
                "Keep file sizes under 25MB",
                "Use supported browsers (Chrome, Firefox, Edge, Safari)",
                "Save your filing confirmation emails",
                "Double-check all information before submitting",
                "Have payment method ready before starting",
                "Complete pre-filing checklist",
                "Keep case numbers in a safe place",
              ].map((tip, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
