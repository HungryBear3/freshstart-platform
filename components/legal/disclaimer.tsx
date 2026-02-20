import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Info, FileWarning, Scale } from "lucide-react"
import { cn } from "@/lib/utils"

type DisclaimerVariant = 
  | "default"      // Full disclaimer with all details
  | "compact"      // Single line for footers
  | "document"     // For document generation pages
  | "questionnaire" // Before questionnaire submission
  | "footer"       // PDF document footer
  | "banner"       // Top of page banner

interface DisclaimerProps {
  className?: string
  variant?: DisclaimerVariant
  showIcon?: boolean
}

/**
 * Legal Disclaimer Component
 * 
 * Displays appropriate legal disclaimers for different contexts.
 * Required for legal compliance on document preparation platforms.
 */
export function Disclaimer({ 
  className, 
  variant = "default",
  showIcon = true 
}: DisclaimerProps) {
  
  // Compact - Single line for footers and small spaces
  if (variant === "compact") {
    return (
      <div className={cn("text-xs text-muted-foreground italic", className)}>
        <p>
          This information is for educational purposes only and does not constitute legal advice.
          Please consult with an attorney for advice on your specific situation.
        </p>
      </div>
    )
  }

  // Banner - Top of page notice
  if (variant === "banner") {
    return (
      <div className={cn(
        "bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800",
        className
      )}>
        <div className="container mx-auto flex items-center gap-2">
          {showIcon && <Info className="h-4 w-4 flex-shrink-0" />}
          <p>
            <strong>Not Legal Advice:</strong> FreshStart IL provides document preparation assistance only. 
            We are not a law firm and cannot provide legal advice.
          </p>
        </div>
      </div>
    )
  }

  // Document - For document generation/download pages
  if (variant === "document") {
    return (
      <Alert className={cn("border-amber-200 bg-amber-50", className)}>
        {showIcon && <FileWarning className="h-4 w-4 text-amber-600" />}
        <AlertTitle className="text-amber-800">Important: Review Before Filing</AlertTitle>
        <AlertDescription className="text-amber-700 space-y-2">
          <p>
            <strong>These documents are generated based on the information you provided.</strong> 
            Before filing with the court, please:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Review all information carefully for accuracy</li>
            <li>Check that all required fields are complete</li>
            <li>Verify dates, names, and addresses are correct</li>
            <li>Consult with an attorney if you have questions about any section</li>
            <li>Check your county&apos;s specific filing requirements</li>
          </ul>
          <p className="text-sm mt-3">
            FreshStart IL is not a law firm. We provide document preparation assistance only 
            and cannot provide legal advice or represent you in court.
          </p>
        </AlertDescription>
      </Alert>
    )
  }

  // Questionnaire - Before submission
  if (variant === "questionnaire") {
    return (
      <Alert className={cn("border-blue-200 bg-blue-50", className)}>
        {showIcon && <Info className="h-4 w-4 text-blue-600" />}
        <AlertTitle className="text-blue-800">Before You Submit</AlertTitle>
        <AlertDescription className="text-blue-700 space-y-2">
          <p>
            The information you provide will be used to generate legal documents. 
            Please ensure all information is accurate and complete.
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
            <li>Double-check names, dates, and addresses</li>
            <li>Financial information should be current and accurate</li>
            <li>Incomplete information may result in documents that cannot be filed</li>
          </ul>
          <p className="text-sm mt-2">
            <strong>Note:</strong> This platform provides document preparation assistance only. 
            If you have questions about your legal rights or the divorce process, please consult with an attorney.
          </p>
        </AlertDescription>
      </Alert>
    )
  }

  // Footer - For PDF documents
  if (variant === "footer") {
    return (
      <div className={cn("text-xs text-gray-500 border-t pt-2 mt-4", className)}>
        <p className="font-medium mb-1">DISCLAIMER</p>
        <p>
          This document was prepared using FreshStart IL, a document preparation service. 
          FreshStart IL is not a law firm and does not provide legal advice. This document 
          is provided for informational purposes only. Users should review all documents 
          carefully and consult with an attorney before filing with the court. Court 
          requirements may vary by county. Information may not be current due to changes 
          in law.
        </p>
      </div>
    )
  }

  // Default - Full comprehensive disclaimer
  return (
    <Alert variant="warning" className={cn("border-amber-200", className)}>
      {showIcon && <AlertTriangle className="h-4 w-4" />}
      <AlertTitle>Legal Disclaimer</AlertTitle>
      <AlertDescription className="space-y-3">
        <div>
          <p className="font-semibold">This platform provides document preparation assistance only, not legal advice.</p>
        </div>
        
        <div>
          <p className="font-medium text-sm">No Attorney-Client Relationship</p>
          <p className="text-sm">
            FreshStart IL is not a law firm. Using this platform does not create an attorney-client 
            relationship. We cannot provide legal advice, represent you in court, or make decisions 
            on your behalf.
          </p>
        </div>

        <div>
          <p className="font-medium text-sm">Document Review Recommended</p>
          <p className="text-sm">
            All documents generated by this platform should be reviewed carefully before filing. 
            Consider consulting with a licensed Illinois attorney, especially if your situation involves:
          </p>
          <ul className="list-disc list-inside text-sm mt-1 ml-2">
            <li>Contested custody or parenting time disputes</li>
            <li>Significant assets or complex property division</li>
            <li>Business ownership or professional practices</li>
            <li>Domestic violence or safety concerns</li>
            <li>International aspects (citizenship, foreign assets)</li>
          </ul>
        </div>

        <div>
          <p className="font-medium text-sm">County Requirements May Vary</p>
          <p className="text-sm">
            While we use Illinois Supreme Court approved standardized forms, individual counties 
            may have additional requirements, local rules, or specific procedures. Check with 
            your local circuit court clerk&apos;s office for county-specific requirements.
          </p>
        </div>

        <div>
          <p className="font-medium text-sm">Information Currency</p>
          <p className="text-sm">
            Laws and court rules change. While we strive to keep information current, we cannot 
            guarantee that all information reflects the most recent legal developments. Verify 
            current requirements before filing.
          </p>
        </div>

        <div className="pt-2 border-t border-amber-200">
          <p className="text-xs text-muted-foreground">
            By using FreshStart IL, you acknowledge that you have read and understand this disclaimer.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  )
}

/**
 * Inline disclaimer for specific contexts
 */
export function InlineDisclaimer({ 
  text, 
  className 
}: { 
  text?: string
  className?: string 
}) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      {text || "This is not legal advice. Consult an attorney for advice on your situation."}
    </p>
  )
}

/**
 * Court form disclaimer - specific to official form generation
 */
export function CourtFormDisclaimer({ className }: { className?: string }) {
  return (
    <Alert className={cn("border-blue-200 bg-blue-50", className)}>
      <Scale className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-800">Official Illinois Court Form</AlertTitle>
      <AlertDescription className="text-blue-700 space-y-2">
        <p>
          This document uses an official Illinois Supreme Court approved standardized form. 
          These forms are required to be accepted by all Illinois Circuit Courts.
        </p>
        <p className="text-sm">
          <strong>Before filing:</strong> Verify all information is accurate, sign where required, 
          and check your county&apos;s specific filing procedures and fees.
        </p>
      </AlertDescription>
    </Alert>
  )
}

/**
 * Get disclaimer text for PDF footer
 */
export function getDisclaimerText(): string {
  return `DISCLAIMER: This document was prepared using FreshStart IL, a document preparation service. FreshStart IL is not a law firm and does not provide legal advice. This document is provided for informational purposes only. Users should review all documents carefully and consult with an attorney before filing with the court. Court requirements may vary by county.`
}
