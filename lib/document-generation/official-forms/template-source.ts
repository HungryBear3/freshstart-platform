/**
 * The single place an official form template location may come from.
 *
 * `getFormPath` in the catalog throws for all 21 entries. Three other builders
 * of the same `/forms/<filename>` public path outlived that change — a table in
 * `official-forms/index.ts` and five hardcoded constants across the fillers —
 * each with no gate of its own. They were unreachable only because the generate
 * route returns 409 for `generationMode === "official"` before dispatch; one
 * moved check and five live artifact fetches come back.
 *
 * Every template lookup goes through here instead, and here refuses until the
 * form's field map has been compared against the exact artifact the catalog
 * pins. It returns a location only in that case, which is no case today.
 */
import { getFormById } from "@/lib/forms/illinois-court-forms"
import {
  getFieldMapCompatibility,
  isFieldMapCompatibilityProven,
} from "@/lib/forms/field-map-compatibility"

/**
 * Resolve where an official template may be read from, or throw.
 *
 * Never returns a `/forms/` path for an unproven entry, and never falls back to
 * one: a fallback would reintroduce exactly the ungoverned path this replaces.
 */
export function resolveOfficialFormTemplateSource(formId: string): string {
  const form = getFormById(formId)
  if (!form) {
    throw new Error(`${formId} is not a catalog entry; it has no official template`)
  }
  if (!isFieldMapCompatibilityProven(formId)) {
    const { status, blockers } = getFieldMapCompatibility(formId)
    throw new Error(
      `${formId} has no verified field map (${status}): ${blockers.join("; ")}. No official template location is available.`,
    )
  }
  // Unreachable today. Left to throw rather than guessing a location, so that
  // clearing a field map never silently publishes an artifact path as well.
  throw new Error(
    `${formId} has a verified field map but no approved template location; artifact serving is a separate decision`,
  )
}
