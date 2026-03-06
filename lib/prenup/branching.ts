/**
 * Branching logic helpers for prenup-aware divorce flows
 */

export type PrenupStatus = "none" | "uncontested" | "disputed" | "unclear";

export interface PrenupContext {
  hasPrenup: "yes" | "no" | "not_sure";
  prenupFollowStatus?: "both_follow" | "unsure" | "one_or_both_not_follow";
  prenupType?: "prenup" | "postnup";
  prenupSignedState?: string;
  prenupIndependentCounsel?: "both" | "one" | "none" | "not_sure";
  prenupFullDisclosure?: "full" | "partial" | "none" | "not_sure";
  // Safety-related fields
  prenupPressureIndicator?: "yes" | "no" | "prefer_not_to_say";
  hasIndependentFinancialAccess?: "yes" | "no" | "partial" | "prefer_not_to_say";
}

/**
 * Determine the prenup status based on user responses
 */
export function getPrenupStatus(context: PrenupContext): PrenupStatus {
  if (context.hasPrenup === "no" || context.hasPrenup === "not_sure") {
    return "none";
  }

  if (context.hasPrenup === "yes") {
    if (context.prenupFollowStatus === "both_follow") {
      return "uncontested";
    } else if (
      context.prenupFollowStatus === "unsure" ||
      context.prenupFollowStatus === "one_or_both_not_follow"
    ) {
      return "disputed";
    }
  }

  return "unclear";
}

/**
 * Get guidance message based on prenup status
 */
export function getPrenupGuidance(status: PrenupStatus): {
  message: string;
  showCaution: boolean;
  suggestLegalAdvice: boolean;
} {
  switch (status) {
    case "none":
      return {
        message:
          "Most Illinois divorces do not involve a prenup. We'll walk you through the standard process for your situation.",
        showCaution: false,
        suggestLegalAdvice: false,
      };

    case "uncontested":
      return {
        message:
          "You have a prenup that you both seem comfortable with. We'll help you organize your divorce terms in a way that aligns with your agreement where appropriate. Courts make the final decision about whether to follow or modify a prenup/postnup.",
        showCaution: true,
        suggestLegalAdvice: false,
      };

    case "disputed":
    case "unclear":
      return {
        message:
          "This is a complex area. Many prenups are modified or not enforced as written. We'll help you organize your information, but you should strongly consider speaking with an Illinois family law attorney about your agreement. Courts and attorneys decide validity and enforceability—we cannot.",
        showCaution: true,
        suggestLegalAdvice: true,
      };

    default:
      return {
        message: "",
        showCaution: false,
        suggestLegalAdvice: false,
      };
  }
}

/**
 * Check if prenup context suggests potential coercion or safety concerns
 * Returns both general concerns and safety-specific concerns (which trigger safety resources)
 */
export function checkPrenupSafetyConcerns(context: PrenupContext): {
  hasConcerns: boolean;
  hasSafetyConcerns: boolean; // Specific safety concerns that warrant showing safety resources
  concerns: string[];
  safetyConcerns: string[]; // Safety-specific concerns
} {
  const concerns: string[] = [];
  const safetyConcerns: string[] = [];

  // Check for lack of independent counsel (general concern)
  if (
    context.prenupIndependentCounsel === "none" ||
    context.prenupIndependentCounsel === "one"
  ) {
    concerns.push(
      "One or both spouses did not have independent legal counsel when signing the agreement."
    );
  }

  // Check for lack of disclosure (general concern)
  if (
    context.prenupFullDisclosure === "none" ||
    context.prenupFullDisclosure === "partial"
  ) {
    concerns.push(
      "There may not have been full financial disclosure before signing."
    );
  }

  // Check for disagreement (general concern)
  if (context.prenupFollowStatus === "one_or_both_not_follow") {
    concerns.push(
      "One or both spouses do not want to follow the agreement as written."
    );
  }

  // Safety-specific concerns (these trigger safety resources display)
  if (context.prenupPressureIndicator === "yes") {
    safetyConcerns.push(
      "You indicated feeling pressured or unsafe when signing the agreement."
    );
  }

  if (
    context.hasIndependentFinancialAccess === "no" ||
    context.hasIndependentFinancialAccess === "partial"
  ) {
    safetyConcerns.push(
      "You may not have full access to your financial accounts and documents."
    );
  }

  return {
    hasConcerns: concerns.length > 0 || safetyConcerns.length > 0,
    hasSafetyConcerns: safetyConcerns.length > 0,
    concerns,
    safetyConcerns,
  };
}
