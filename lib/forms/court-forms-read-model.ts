/**
 * Server-side read model for the Court Forms Library.
 *
 * SERVER ONLY — transitively uses node:fs via the artifact guard.
 *
 * The library UI must never decide for itself whether a gated artifact is
 * offerable, and must never construct a download URL for one. This module emits
 * a rendered DTO in which the download location is a SERVER-DECIDED field
 * (`downloadHref`). The client renders that href or nothing; it does not call
 * `getFormPath` and has no way to derive `/forms/income-withholding-order.pdf`.
 *
 * A form whose gate is closed is REMOVED from `forms` entirely (so no download
 * control can exist for it) and represented as a `gatedNotice` carrying neutral
 * explanatory copy.
 *
 * DORMANT SURFACE: `/legal-info/court-forms` is currently served a 308 permanent redirect to
 * `/legal` by `next.config.ts`. This read model and its page are therefore not
 * reachable in production today. They are wired correctly so the redirect can be
 * lifted safely later; no production reachability is claimed.
 */
import {
  ILLINOIS_COURT_FORMS,
  getFormPath,
  type CourtForm,
  type FormCategory,
} from "@/lib/forms/illinois-court-forms"
import { IWO_FORM_ID } from "@/lib/counties/county-iwo-workflow"
import {
  getIwoAvailability,
  type IwoAccessRefusal,
} from "@/lib/forms/official-artifact-access"
import type { IwoRenewalEvidence } from "@/lib/forms/iwo-provenance"

/** The guarded route that serves the federal IWO. Never a static path. */
export const GUARDED_IWO_HREF = "/api/forms/iwo"

/**
 * What the client is allowed to render. Deliberately NOT `CourtForm`: the
 * client receives a resolved `downloadHref` and never the raw catalog entry,
 * so catalog metadata cannot become a download authorization.
 */
export interface RenderedFormDTO {
  id: string
  name: string
  description: string
  category: FormCategory
  instructions?: string
  officialUrl: string
  version: string
  lastUpdated: string
  requiredFor: CourtForm["requiredFor"]
  relatedQuestionnaires: string[]
  filename: string
  /** Server-decided download location. `null` means: render no download control. */
  downloadHref: string | null
}

export interface GatedFormNotice {
  formId: string
  name: string
  refusal: IwoAccessRefusal
  /** Neutral explanatory copy. No advice, no guarantee, no universal claim. */
  copy: string[]
  requiresManualReview: boolean
}

export interface CourtFormsReadModel {
  forms: RenderedFormDTO[]
  gatedNotices: GatedFormNotice[]
}

export interface CourtFormsReadModelInput {
  /**
   * Canonical county id resolved SERVER-SIDE for this case. Never a value taken
   * from request input. Blank/malformed/noncanonical/unknown fails closed.
   */
  countyId?: string | null
  today?: Date
  artifactDir?: string
  /** Injected ONLY by test factories. */
  renewalEvidence?: IwoRenewalEvidence
}

function toDto(form: CourtForm, downloadHref: string | null): RenderedFormDTO {
  return {
    id: form.id,
    name: form.name,
    description: form.description,
    category: form.category,
    instructions: form.instructions,
    officialUrl: form.officialUrl,
    version: form.version,
    lastUpdated: form.lastUpdated,
    requiredFor: form.requiredFor,
    relatedQuestionnaires: form.relatedQuestionnaires,
    filename: form.filename,
    downloadHref,
  }
}

export function getCourtFormsReadModel(
  input: CourtFormsReadModelInput = {},
): CourtFormsReadModel {
  const availability = getIwoAvailability({
    countyId: input.countyId ?? "",
    today: input.today,
    artifactDir: input.artifactDir,
    renewalEvidence: input.renewalEvidence,
  })

  const forms: RenderedFormDTO[] = []
  const gatedNotices: GatedFormNotice[] = []

  for (const form of ILLINOIS_COURT_FORMS) {
    if (form.id === IWO_FORM_ID) {
      if (availability.available) {
        // Allowed: the ONLY href the client ever sees for this artifact is the
        // guarded route. getFormPath is not consulted and would throw anyway.
        forms.push(toDto(form, GUARDED_IWO_HREF))
      } else {
        gatedNotices.push({
          formId: form.id,
          name: form.name,
          refusal: availability.refusal!,
          copy: availability.copy,
          requiresManualReview: availability.requiresManualReview,
        })
      }
      continue
    }
    forms.push(toDto(form, getFormPath(form)))
  }

  return { forms, gatedNotices }
}
