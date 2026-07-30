// FreshStart-IL v2 — public tier definition.
// The public offer is one $149 flat Essential SKU.

export type TierKey = "essential";

export interface PricingTier {
  key: TierKey;
  name: string;
  tagline: string;
  price: string;
  period: string;
  priceNumber: number;
  ctaStyle: "primary" | "ghost";
  bullets: string[];
  excluded: string[] | null;
  audience: string;
  recommended: boolean;
}

export function getTierCount(): 1 {
  return 1;
}

export function getTiers(
  _opts: { count?: 1 | 2 | 3; recommendedTier?: TierKey } = {},
): PricingTier[] {
  return [
    {
      key: "essential",
      name: "Essential",
      tagline: "For straightforward, uncontested filings.",
      price: "$149",
      period: "one-time",
      priceNumber: 149,
      ctaStyle: "primary",
      bullets: [
        "Illinois divorce form drafts prepared from your answers",
        "County-aware filing notes where FreshStart supports them",
        "Step-by-step e-filing walkthrough",
        "Save and resume through your filing process",
        "Email support · 1–2 business day response",
        "60 days of service access · no subscription",
      ],
      excluded: ["No legal advice", "No contested-case mediation"],
      audience:
        "Best for: straightforward uncontested cases where both spouses agree on the basics.",
      recommended: false,
    },
  ];
}

// Add-ons remain stubbed until product and price IDs are approved.
export const STUB_ENDPOINTS = {
  addOn: "/api/_stub/add-on",
} as const;
