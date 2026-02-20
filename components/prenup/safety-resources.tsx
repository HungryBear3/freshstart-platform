/**
 * Component that displays Illinois-specific safety and legal resources
 * Shown when prenup safety concerns are detected
 */

"use client";

import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Shield, Phone, ExternalLink, Scale } from "lucide-react";
import Link from "next/link";

interface SafetyResourcesProps {
  className?: string;
  variant?: "banner" | "card";
  onView?: () => void;
}

export function SafetyResources({ className, variant = "banner", onView }: SafetyResourcesProps) {
  // Track view when component is rendered
  useEffect(() => {
    if (onView) {
      onView();
    }
  }, [onView]);

  const content = (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-2">Your Safety and Rights</h3>
        <p className="text-sm text-gray-700 mb-3">
          If you felt pressured when signing your agreement, or if you don't have access to your financial information, 
          you have rights and resources available in Illinois.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <h4 className="font-medium text-sm mb-1 flex items-center gap-2">
            <Scale className="h-4 w-4 text-blue-600" />
            Legal Resources
          </h4>
          <ul className="text-sm space-y-1 ml-6 list-disc">
            <li>
              <strong>Illinois State Bar Association Lawyer Referral Service:</strong>{" "}
              <a 
                href="https://www.isba.org/lawyerreferral" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                Find a lawyer
                <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>
              <strong>Illinois Legal Aid Online:</strong>{" "}
              <a 
                href="https://www.illinoislegalaid.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                Free legal help
                <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>
              <strong>Illinois Family Law Self-Help Center:</strong>{" "}
              <a 
                href="https://www.illinoiscourts.gov/self-help/family-law/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                Court resources
                <ExternalLink className="h-3 w-3" />
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-medium text-sm mb-1 flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-600" />
            Safety Resources
          </h4>
          <ul className="text-sm space-y-1 ml-6 list-disc">
            <li>
              <strong>Illinois Domestic Violence Hotline:</strong>{" "}
              <a 
                href="tel:877-863-6338" 
                className="text-blue-600 hover:underline"
              >
                877-863-6338
              </a>{" "}
              (24/7, free, confidential)
            </li>
            <li>
              <strong>National Domestic Violence Hotline:</strong>{" "}
              <a 
                href="tel:800-799-7233" 
                className="text-blue-600 hover:underline"
              >
                800-799-7233
              </a>{" "}
              or text START to 88788
            </li>
            <li>
              <strong>Illinois Coalition Against Domestic Violence:</strong>{" "}
              <a 
                href="https://www.ilcadv.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                Get help
                <ExternalLink className="h-3 w-3" />
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-medium text-sm mb-1 flex items-center gap-2">
            <Phone className="h-4 w-4 text-purple-600" />
            Financial Rights
          </h4>
          <p className="text-sm ml-6">
            In Illinois, you have the right to financial transparency during divorce. If you don't have access to 
            financial documents, you can request them through the discovery process. Consider speaking with an attorney 
            about your rights to financial disclosure.
          </p>
        </div>
      </div>

      <div className="pt-3 border-t">
        <p className="text-xs text-gray-600">
          <strong>Important:</strong> Your responses to safety questions are private and will not be shared with your 
          spouse. This information helps us provide you with appropriate resources and guidance.
        </p>
      </div>
    </div>
  );

  if (variant === "card") {
    return (
      <Card className={`border-orange-200 bg-orange-50 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <AlertTriangle className="h-5 w-5" />
            Safety & Support Resources
          </CardTitle>
          <CardDescription>
            Illinois-specific resources for legal help, safety, and financial rights
          </CardDescription>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    );
  }

  return (
    <Alert className={`border-orange-200 bg-orange-50 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-900">Safety & Support Resources</AlertTitle>
      <AlertDescription className="text-gray-800">{content}</AlertDescription>
    </Alert>
  );
}
