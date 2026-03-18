"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ChevronLeft, ChevronRight, ExternalLink, CheckCircle2, Info } from "lucide-react"

const STEPS = [
  {
    id: "1",
    title: "Create E-Services Account",
    description: "Set up your account on the Illinois E-Services portal",
    content: (
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Step 1: Visit the Portal</h4>
          <p className="text-sm text-gray-600 mb-2">
            Go to{" "}
            <a
              href="https://efile.illinoiscourts.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              efile.illinoiscourts.gov
            </a>
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Step 2: Click 'Register'</h4>
          <p className="text-sm text-gray-600">
            Click the "Register" or "Create Account" button on the homepage.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Step 3: Enter Your Information</h4>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside ml-4">
            <li>Full legal name (as it appears on your ID)</li>
            <li>Email address (use one you check regularly)</li>
            <li>Create a secure password</li>
            <li>Security questions for account recovery</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Step 4: Verify Your Email</h4>
          <p className="text-sm text-gray-600">
            Check your email and click the verification link to activate your account.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "2",
    title: "Prepare Your Documents",
    description: "Ensure your documents are ready for e-filing",
    content: (
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Document Requirements</h4>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside ml-4">
            <li>Documents must be in PDF format</li>
            <li>Each file must be under 25MB</li>
            <li>Documents must be signed (if signature required)</li>
            <li>Use clear, descriptive file names</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">File Naming Convention</h4>
          <p className="text-sm text-gray-600 mb-2">
            Use descriptive names that identify the document:
          </p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside ml-4">
            <li>Petition-Dissolution-Marriage.pdf</li>
            <li>Financial-Affidavit-Short.pdf</li>
            <li>Parenting-Plan.pdf</li>
            <li>Avoid: document1.pdf, file.pdf, etc.</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Check Document Completeness</h4>
          <p className="text-sm text-gray-600">
            Review each document to ensure all required fields are completed and all necessary
            attachments are included.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "3",
    title: "Log In to E-Services",
    description: "Access your account on the portal",
    content: (
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Step 1: Go to Login Page</h4>
          <p className="text-sm text-gray-600">
            Visit{" "}
            <a
              href="https://efile.illinoiscourts.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              efile.illinoiscourts.gov
            </a>{" "}
            and click "Login" or "Sign In".
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Step 2: Enter Credentials</h4>
          <p className="text-sm text-gray-600">
            Enter your email address and password that you created during registration.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Step 3: Complete Security Check</h4>
          <p className="text-sm text-gray-600">
            If prompted, complete any security verification (CAPTCHA, two-factor authentication,
            etc.).
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "4",
    title: "Start New Filing",
    description: "Begin the e-filing process",
    content: (
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Step 1: Navigate to File Documents</h4>
          <p className="text-sm text-gray-600">
            Once logged in, look for options like "File Documents", "New Filing", or "E-File" in
            the main menu.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Step 2: Select Case Type</h4>
          <p className="text-sm text-gray-600 mb-2">Choose the appropriate case type:</p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside ml-4">
            <li>New Case (if starting a new case)</li>
            <li>Existing Case (if filing in an existing case - you'll need the case number)</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Step 3: Select Court and County</h4>
          <p className="text-sm text-gray-600">
            Choose the correct court and county where you're filing. Make sure this matches your
            jurisdiction.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "5",
    title: "Upload Documents",
    description: "Upload your prepared PDF documents",
    content: (
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Step 1: Click Upload</h4>
          <p className="text-sm text-gray-600">
            Click the "Upload" or "Browse" button to select files from your computer.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Step 2: Select Your Documents</h4>
          <p className="text-sm text-gray-600">
            Select all the PDF documents you want to file. You can select multiple files at once.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Step 3: Verify Upload</h4>
          <p className="text-sm text-gray-600 mb-2">
            After uploading, verify that:
          </p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside ml-4">
            <li>All documents uploaded successfully</li>
            <li>File names are correct</li>
            <li>File sizes are acceptable (under 25MB each)</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Step 4: Categorize Documents</h4>
          <p className="text-sm text-gray-600">
            For each document, select the appropriate document type from the dropdown menu (e.g.,
            "Petition", "Financial Affidavit", "Supporting Document").
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "6",
    title: "Enter Case Information",
    description: "Provide required case details",
    content: (
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Required Information</h4>
          <p className="text-sm text-gray-600 mb-2">You'll need to provide:</p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside ml-4">
            <li>Case number (if filing in existing case)</li>
            <li>Party names (Petitioner and Respondent)</li>
            <li>Case type (Dissolution of Marriage, etc.)</li>
            <li>Any other required case details</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Double-Check Information</h4>
          <p className="text-sm text-gray-600">
            Review all entered information carefully. Errors can cause delays or rejection of your
            filing.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "7",
    title: "Review and Submit",
    description: "Review your filing before submission",
    content: (
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Step 1: Review Summary</h4>
          <p className="text-sm text-gray-600">
            Review the filing summary page which shows all documents, case information, and fees.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Step 2: Check for Errors</h4>
          <p className="text-sm text-gray-600 mb-2">Verify:</p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside ml-4">
            <li>All documents are listed correctly</li>
            <li>Case information is accurate</li>
            <li>Filing fees are correct</li>
            <li>No error messages or warnings</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Step 3: Submit Filing</h4>
          <p className="text-sm text-gray-600">
            Click "Submit" or "File Documents" to proceed to payment.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "8",
    title: "Make Payment",
    description: "Pay filing fees online",
    content: (
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Step 1: Review Fees</h4>
          <p className="text-sm text-gray-600">
            Review the total filing fees displayed. Fees vary by document type and county.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Step 2: Select Payment Method</h4>
          <p className="text-sm text-gray-600 mb-2">E-Services accepts:</p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside ml-4">
            <li>Credit cards (Visa, MasterCard, American Express, Discover)</li>
            <li>Electronic checks (e-check)</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Step 3: Enter Payment Information</h4>
          <p className="text-sm text-gray-600">
            Enter your payment details securely. The portal uses encrypted payment processing.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Step 4: Confirm Payment</h4>
          <p className="text-sm text-gray-600">
            Review and confirm your payment. You'll receive a payment confirmation email.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "9",
    title: "Receive Confirmation",
    description: "Get confirmation of your filing",
    content: (
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Filing Confirmation</h4>
          <p className="text-sm text-gray-600">
            After successful submission and payment, you'll receive:
          </p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside ml-4">
            <li>An on-screen confirmation with filing number</li>
            <li>An email confirmation (save this for your records)</li>
            <li>A receipt for payment</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Case Number</h4>
          <p className="text-sm text-gray-600">
            If this is a new case, you'll receive a case number. Save this number - you'll need it
            for all future filings in this case.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Track Your Filing</h4>
          <p className="text-sm text-gray-600">
            You can track the status of your filing in your E-Services account. The court will
            review and process your documents.
          </p>
        </div>
      </div>
    ),
  },
]

export function EFilingWalkthrough() {
  const [currentStep, setCurrentStep] = useState(0)

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>E-Services Step-by-Step Walkthrough</CardTitle>
        <CardDescription>
          Follow these steps to successfully e-file your documents
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(((currentStep + 1) / STEPS.length) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Navigation Dots */}
        <div className="flex flex-wrap gap-2 mb-6">
          {STEPS.map((step, index) => (
            <button
              key={step.id}
              onClick={() => goToStep(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? "bg-blue-600 w-8"
                  : index < currentStep
                  ? "bg-green-500 w-6"
                  : "bg-gray-300 w-6"
              }`}
              title={step.title}
            />
          ))}
        </div>

        {/* Current Step Content */}
        <div className="mb-6">
          <div className="mb-4">
            <h3 className="text-xl font-semibold mb-2">{STEPS[currentStep].title}</h3>
            <p className="text-gray-600">{STEPS[currentStep].description}</p>
          </div>
          <div className="p-6 bg-gray-50 rounded-lg">
            {STEPS[currentStep].content}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={previousStep}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button onClick={nextStep}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold">Walkthrough Complete!</span>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <Alert className="mt-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Ready to file?</strong>{" "}
            <a
              href="https://efile.illinoiscourts.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-medium"
            >
              Go to Illinois E-Services Portal{" "}
              <ExternalLink className="inline h-3 w-3" />
            </a>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
