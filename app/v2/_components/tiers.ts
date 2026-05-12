// FreshStart-IL v2 — tier definitions + feature flag.
// PRICING_TIERS=3 enables Concierge as a third tier; default ships 2-tier.

export type TierKey = "essential" | "plus" | "concierge";

export interface PricingTier {
  key: TierKey;
  name: string;
  tagline: string;
  price: string; // raw with leading $
  period: string;
  priceNumber: number;
  ctaStyle: "primary" | "ghost";
  bullets: string[];
  excluded: string[] | null;
  audience: string;
  recommended: boolean;
}

export function getTierCount(): 2 | 3 {
  return process.env.PRICING_TIERS === "3" ? 3 : 2;
}

export function getTiers(opts: { count?: 2 | 3; recommendedTier?: TierKey } = {}): PricingTier[] {
  const count = opts.count ?? getTierCount();
  const recommended = opts.recommendedTier ?? "plus";

  const all: PricingTier[] = [
    {
      key: "essential",
      name: "Essential",
      tagline: "For straightforward, uncontested filings.",
      price: "$149",
      period: "one-time",
      priceNumber: 149,
      ctaStyle: "ghost",
      bullets: [
        "All required Illinois divorce forms, auto-filled",
        "Available in all 102 Illinois counties · detailed filing instructions for the largest counties",
        "Step-by-step e-filing walkthrough",
        "Save & resume anytime · 60 days of access",
        "Email support · 1–2 business day response",
      ],
      excluded: ["No form updates after 60 days", "No parenting-plan builder"],
      audience:
        "Best for: clean, no-kids, no-shared-property cases ready to file in the next 60 days.",
      recommended: recommended === "essential",
    },
    {
      key: "plus",
      name: "Plus",
      tagline: "For evolving cases — kids, property, or a moving timeline.",
      price: "$299",
      period: "per year",
      priceNumber: 299,
      ctaStyle: "primary",
      bullets: [
        "Everything in Essential",
        "Unlimited form regenerations as your case evolves",
        "Parenting plan & visual custody calendar",
        "Illinois child-support calculator + worksheet",
        "Priority chat support · same-day response",
        "Statute updates auto-applied for 12 months",
      ],
      excluded: null,
      audience: "Best for: cases with kids, shared assets, or anything that may need a redo.",
      recommended: recommended === "plus",
    },
    {
      key: "concierge",
      name: "Concierge",
      tagline: "Done-with-you. We pre-check your forms before filing.",
      price: "$499",
      period: "one-time",
      priceNumber: 499,
      ctaStyle: "ghost",
      bullets: [
        "Everything in Plus, for 12 months",
        "1:1 intake call with a paralegal-level reviewer",
        "Pre-filing form review (catch errors before the court does)",
        "Filing-day text support",
        "Refile assistance if your county rejects",
      ],
      excluded: null,
      audience:
        "Best for: anyone who wants a human in the loop without paying attorney hourly rates.",
      recommended: recommended === "concierge",
    },
  ];

  return count === 3 ? all : all.slice(0, 2);
}

// Comparison table rows. Index 1 = Essential, 2 = Plus, 3 = Concierge.
export const compareRows: Array<[string, string | boolean, string | boolean, string | boolean]> = [
  ["All required Illinois forms (auto-filled)", true, true, true],
  ["Available in all 102 Illinois counties", true, true, true],
  ["Detailed filing instructions (largest counties)", true, true, true],
  ["E-filing step-by-step walkthrough", true, true, true],
  ["Length of access", "60 days", "12 months", "12 months"],
  ["Form regenerations", "3 included", "Unlimited", "Unlimited"],
  ["Parenting plan + custody calendar", false, true, true],
  ["Illinois child-support calculator", false, true, true],
  ["Statute updates auto-applied", false, true, true],
  ["Support response time", "1–2 business days", "Same day", "Same day + filing-day texts"],
  ["1:1 human pre-filing review", false, false, true],
  ["Refile assistance if rejected", false, "$49 add-on", true],
];

// CTA destinations — add-ons remain stubbed until product/price IDs are approved.
export const STUB_ENDPOINTS = {
  addOn: "/api/_stub/add-on",
} as const;
