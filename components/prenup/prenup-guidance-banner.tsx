/**
 * Component that shows guidance based on prenup status
 */

"use client";

import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Info, ExternalLink } from "lucide-react";
import Link from "next/link";
import { PrenupStatus, getPrenupGuidance } from "@/lib/prenup/branching";

interface PrenupGuidanceBannerProps {
  status: PrenupStatus;
  className?: string;
  onView?: () => void;
}

export function PrenupGuidanceBanner({
  status,
  className,
  onView,
}: PrenupGuidanceBannerProps) {
  const guidance = getPrenupGuidance(status);

  // Track view when component is rendered
  useEffect(() => {
    if (onView && status !== "none" && guidance.message) {
      onView();
    }
  }, [onView, status, guidance.message]);

  if (status === "none" || !guidance.message) {
    return null;
  }

  return (
    <Alert
      className={className}
      variant={guidance.showCaution ? "default" : "default"}
    >
      <Info className="h-4 w-4" />
      <AlertTitle>
        {status === "uncontested"
          ? "Prenup/Postnup Detected"
          : "Important Information About Your Agreement"}
      </AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{guidance.message}</p>
        {guidance.suggestLegalAdvice && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-sm font-medium mb-2">
              When to talk to an attorney:
            </p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>You are unsure what your agreement means</li>
              <li>You felt pressured or unsafe when you signed it</li>
              <li>Your financial situation has changed significantly</li>
              <li>One spouse wants to follow the agreement and the other does not</li>
            </ul>
            <Link
              href="/legal-info/prenups-in-illinois"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-2"
            >
              Learn more about prenups in Illinois
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
