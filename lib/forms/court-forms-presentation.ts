/**
 * Presentation vocabulary for the Court Forms Library — CLIENT-SAFE.
 *
 * Extracted from `illinois-court-forms.ts` so a client component can label a
 * category and format a catalog date without importing the catalog.
 *
 * WHY THIS MODULE EXISTS: `ILLINOIS_COURT_FORMS` is built by top-level `il()` /
 * `unsupported()` CALLS, so no bundler can tree-shake it away from a module that
 * imports any value out of that file. `court-forms-client.tsx` imported three
 * values from it, and the whole 21-row catalog therefore travelled into the
 * browser chunk — every pinned `sha256`, every `officialUrl`, and every
 * `relatedQuestionnaires` slug the read model is careful to strip from the DTO.
 * The DTO boundary governs the serialized props; it cannot govern the module
 * graph. This file holds no rows and makes no module-level calls, so importing it
 * carries nothing with it.
 *
 * Anything added here must stay free of catalog rows and of module-level calls
 * that build them. Guarded by
 * `__tests__/app/court-forms-client-bundle-boundary.test.ts`.
 */
export type FormCategory = "petition" | "financial" | "parenting" | "service" | "judgment" | "support"

export const FORM_CATEGORIES: Record<FormCategory, { name: string; description: string }> = {
  petition:{name:"Petition Forms",description:"Forms to initiate divorce proceedings"}, financial:{name:"Financial Disclosure Forms",description:"Income, expenses, assets, and debts"},
  parenting:{name:"Parenting Forms",description:"Parental responsibilities and parenting time"}, service:{name:"Service Forms",description:"Service and proof of delivery"},
  judgment:{name:"Judgment Forms",description:"Judgment and agreement documents"}, support:{name:"Support Forms",description:"Child support and maintenance forms"},
}

/**
 * The single sentinel used wherever a row has no corroborated artifact to date.
 *
 * It is NOT a date and must never be formatted as one. Stamping a real date on
 * an uncorroborated row — the artifact reconciliation date, say — presents a
 * verification that did not happen.
 */
export const UNVERIFIED_CATALOG_VALUE = "unverified"

/**
 * Customer-visible rendering for `CourtForm.lastUpdated`.
 *
 * Official rows carry MONTH precision (`2025-03`), because the printed revision
 * says `03/25` and nothing on the artifact names a day. Uncorroborated rows
 * carry the sentinel and are rendered as a non-date.
 */
export function formatCatalogLastUpdated(lastUpdated:string){return lastUpdated===UNVERIFIED_CATALOG_VALUE?"not verified":lastUpdated}
