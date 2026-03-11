export const BADGE_DEFINITIONS = {
  onboarding: {
    id: "onboarding",
    name: "Getting Started",
    description: "Completed the onboarding wizard",
    icon: "🎯",
  },
  first_petition: {
    id: "first_petition",
    name: "Petition Pro",
    description: "Completed the petition questionnaire",
    icon: "📝",
  },
  first_document: {
    id: "first_document",
    name: "Document Ready",
    description: "Generated your first court document",
    icon: "📄",
  },
  case_info: {
    id: "case_info",
    name: "Case Manager",
    description: "Added your case information",
    icon: "⚖️",
  },
} as const

export type BadgeId = keyof typeof BADGE_DEFINITIONS
