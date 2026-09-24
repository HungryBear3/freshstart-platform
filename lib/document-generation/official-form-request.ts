/**
 * The generate route's official-form dispatch.
 *
 * Moved out of `app/api/documents/generate/route.ts`, where it caught any
 * official-form error and fell through to the summary PDF — so a request for an
 * official court form could come back 201 carrying a FreshStart summary, with
 * nothing telling the caller the requested output was absent. The route's 409
 * pause makes that path unreachable today; this makes it fail closed if that
 * gate ever moves.
 *
 * Never throws and never produces a summary: the result is either the official
 * form's bytes or a refusal the route returns as-is, with no document written.
 * Nothing here lifts a hold or authorizes generation.
 */
import {
  generateOfficialForm,
  isFormTypeSupported,
  type OfficialFormType,
} from "@/lib/document-generation/official-forms"

/**
 * The release hold on official-form generation. The generate route refuses
 * every official request with 409 while this is true.
 *
 * A constant, not configuration: lifting it is a reviewed code change, never an
 * environment flag. It is a function only so a test can reach the branch behind
 * the hold and prove that branch still refuses with nothing written.
 */
export function isOfficialFormGenerationPaused(): boolean {
  return true
}

// Map document types to official form types
const DOCUMENT_TO_OFFICIAL_FORM: Record<string, OfficialFormType> = {
  petition: "petition-no-children",
  "petition-no-children": "petition-no-children",
  "petition-with-children": "petition-with-children",
  "financial-affidavit": "financial-affidavit",
  financial_affidavit: "financial-affidavit",
  financial_affidavit_short: "financial-affidavit",
  "parenting-plan": "parenting-plan",
  parenting_plan: "parenting-plan",
}

const PETITION_DOCUMENT_TYPES = new Set(["petition", "petition-no-children", "petition-with-children"])

export interface OfficialFormRequest {
  documentType: string
  responses: unknown
  /** Used for parent 1 when the responses carry no petitioner name. */
  fallbackPetitionerName: string
  flatten: boolean
  generatedAt: Date
}

export type OfficialFormRequestResult =
  | { ok: true; formType: OfficialFormType; pdfBytes: Uint8Array; fileName: string }
  | {
      ok: false
      status: 409 | 500
      code: "official_form_unsupported" | "official_form_generation_failed"
      message: string
    }

export async function generateOfficialFormForDocument(
  request: OfficialFormRequest,
): Promise<OfficialFormRequestResult> {
  // Everything inside the try: an error escaping to the route would land in its
  // text-document fallback, which is the same swallowing by another name.
  try {
    const officialFormType = DOCUMENT_TO_OFFICIAL_FORM[request.documentType]
    if (!officialFormType || !isFormTypeSupported(officialFormType)) {
      return {
        ok: false,
        status: 409,
        code: "official_form_unsupported",
        message: `No official court form is available for "${request.documentType}". No document was created.`,
      }
    }

    const responses = request.responses as Record<string, unknown>

    // Determine if case has children (check response data)
    const hasChildren =
      responses["has-children"] === "yes" ||
      responses["hasChildren"] === true ||
      parseInt(String(responses["number-of-children"])) > 0

    // For petition, use the appropriate form based on children
    const formType: OfficialFormType = PETITION_DOCUMENT_TYPES.has(request.documentType)
      ? hasChildren
        ? "petition-with-children"
        : "petition-no-children"
      : officialFormType

    // Get parent names for parenting plan
    const parent1Name = `${responses["petitioner-first-name"]} ${responses["petitioner-last-name"]}`
    const parent2Name = `${responses["spouse-first-name"]} ${responses["spouse-last-name"]}`

    const pdfBytes = await generateOfficialForm(formType, responses, {
      hasChildren,
      parent1Name: parent1Name.trim() || request.fallbackPetitionerName,
      parent2Name: parent2Name.trim() || "Respondent",
      flatten: request.flatten,
    })

    const formLabel = formType.replace(/-/g, "_")
    return {
      ok: true,
      formType,
      pdfBytes,
      fileName: `Official_${formLabel}_${request.generatedAt.toISOString().split("T")[0]}.pdf`,
    }
  } catch (error) {
    console.error("[Document Generate] Official form generation failed:", error)
    return {
      ok: false,
      status: 500,
      code: "official_form_generation_failed",
      message: "The official court form could not be generated. No document was created.",
    }
  }
}
