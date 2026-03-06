"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, CheckCircle2, AlertCircle, ExternalLink, BookOpen, HelpCircle } from "lucide-react"
import Link from "next/link"
import { EFilingWalkthrough } from "@/components/efiling/efiling-walkthrough"
import { PreFilingChecklist } from "@/components/efiling/prefiling-checklist"
import { DocumentEligibilityChecker } from "@/components/efiling/document-eligibility-checker"
import { DocumentPackagePrep } from "@/components/efiling/document-package-prep"
import { EFilingTroubleshooting } from "@/components/efiling/troubleshooting"
import { CountyInstructions } from "@/components/efiling/county-instructions"

export default function EFilingPage() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">E-Filing Guidance</h1>
          <p className="mt-2 text-gray-600">
            Step-by-step guidance for filing documents through Illinois E-Services
          </p>
        </div>

        <div className="space-y-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {[
                { id: "overview", label: "Overview", icon: BookOpen },
                { id: "checklist", label: "Pre-Filing Checklist", icon: CheckCircle2 },
                { id: "eligibility", label: "Document Eligibility", icon: FileText },
                { id: "county", label: "County Instructions", icon: FileText },
                { id: "walkthrough", label: "E-Services Walkthrough", icon: ExternalLink },
                { id: "package", label: "Document Package", icon: FileText },
                { id: "troubleshooting", label: "Troubleshooting", icon: HelpCircle },
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {activeTab === "overview" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Illinois E-Services Overview</CardTitle>
                  <CardDescription>
                    Learn about electronic filing in Illinois courts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">What is E-Filing?</h3>
                    <p className="text-sm text-gray-600">
                      E-Filing allows you to submit court documents electronically through the
                      Illinois E-Services portal, eliminating the need to visit the courthouse in
                      person for most filings.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Benefits of E-Filing</h3>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside ml-4">
                      <li>File documents 24/7 from anywhere</li>
                      <li>Receive instant confirmation of filing</li>
                      <li>Track document status online</li>
                      <li>Reduce travel time and costs</li>
                      <li>Faster processing by the court</li>
                    </ul>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Important:</strong> Not all documents can be e-filed. Some documents
                      require physical filing or special procedures. Use the Document Eligibility
                      Checker to verify which documents can be e-filed.
                    </AlertDescription>
                  </Alert>

                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-2">Quick Links</h3>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <a
                        href="https://efile.illinoiscourts.gov/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Illinois E-Services Portal
                      </a>
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab("checklist")}
                        className="justify-start"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Pre-Filing Checklist
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab("walkthrough")}
                        className="justify-start"
                      >
                        <BookOpen className="mr-2 h-4 w-4" />
                        Step-by-Step Guide
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab("eligibility")}
                        className="justify-start"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Check Document Eligibility
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "checklist" && <PreFilingChecklist />}

          {activeTab === "eligibility" && <DocumentEligibilityChecker />}

          {activeTab === "county" && <CountyInstructions />}

          {activeTab === "walkthrough" && <EFilingWalkthrough />}

          {activeTab === "package" && <DocumentPackagePrep />}

          {activeTab === "troubleshooting" && <EFilingTroubleshooting />}
        </div>
      </div>
    </DashboardLayout>
  )
}
