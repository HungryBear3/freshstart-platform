/**
 * Factory for the guarded federal IWO download handler.
 *
 * SERVER ONLY.
 *
 * The handler is built from explicit dependencies — authoritative county
 * resolver, clock, renewal evidence, artifact directory — so tests can drive
 * every branch deterministically against the REAL handler rather than against
 * helpers or a mutable global.
 *
 * Security invariant: the county used for the policy decision comes ONLY from
 * `deps.resolveCounty`, which reads server-side state. Request input is never
 * consulted for county. Supplying `?county=cook` cannot change the outcome.
 */
import { NextResponse, type NextRequest } from "next/server"

import {
  readGuardedIwoArtifact,
  type IwoAccessRefusal,
} from "@/lib/forms/official-artifact-access"
import {
  type AuthoritativeCountyResolver,
  type CountyResolutionFailure,
} from "@/lib/forms/authoritative-county"
import type { IwoRenewalEvidence } from "@/lib/forms/iwo-provenance"
import type { IwoOpenPathDisclosureApproval } from "@/lib/forms/iwo-distribution-hold"

export interface IwoRouteDeps {
  /** SERVER-side county lookup. The only source of county truth. */
  resolveCounty: AuthoritativeCountyResolver
  /** Injectable clock. Defaults to real time. */
  now?: () => Date
  /** Injectable pinned renewal evidence. Defaults to the pinned constant. */
  renewalEvidence?: IwoRenewalEvidence
  /**
   * Injectable open-path disclosure approval. Defaults to the pinned constant,
   * which is `pending` — so the production route is held closed.
   */
  disclosureApproval?: IwoOpenPathDisclosureApproval
  /** Injectable artifact directory. Defaults to the guarded dir. */
  artifactDir?: string
}

const NO_STORE = { "Cache-Control": "no-store, max-age=0, must-revalidate" }

const RESOLUTION_REFUSAL: Record<CountyResolutionFailure, IwoAccessRefusal> = {
  no_authenticated_case: "county_unknown_or_noncanonical",
  no_stored_county: "county_unknown_or_noncanonical",
  stored_county_not_canonical: "county_unknown_or_noncanonical",
}

const RESOLUTION_MESSAGE: Record<CountyResolutionFailure, string> = {
  no_authenticated_case:
    "This form's availability depends on the county recorded for a specific case. No case context was available for this request.",
  no_stored_county:
    "This form's availability depends on the county recorded for the case. No county is recorded yet.",
  stored_county_not_canonical:
    "The county recorded for this case could not be matched to a supported county. This item is set aside for manual review.",
}

export function createIwoRouteHandler(deps: IwoRouteDeps) {
  return async function GET(request: NextRequest): Promise<NextResponse> {
    // County is resolved server-side. Any `?county=` in the URL is ignored
    // outright — it is an assertion by the requester, not case identity.
    const resolution = await deps.resolveCounty(request)

    if (!resolution.ok) {
      return NextResponse.json(
        {
          available: false,
          refusal: RESOLUTION_REFUSAL[resolution.reason],
          countyResolution: resolution.reason,
          blockers: [resolution.reason],
          message: [RESOLUTION_MESSAGE[resolution.reason]],
        },
        { status: 403, headers: NO_STORE },
      )
    }

    const result = readGuardedIwoArtifact({
      countyId: resolution.countyId,
      today: deps.now?.() ?? new Date(),
      artifactDir: deps.artifactDir,
      renewalEvidence: deps.renewalEvidence,
      disclosureApproval: deps.disclosureApproval,
    })

    if (!result.allowed) {
      return NextResponse.json(
        {
          available: false,
          refusal: result.refusal,
          blockers: result.blockers,
          message: result.copy,
        },
        { status: 403, headers: NO_STORE },
      )
    }

    return new NextResponse(new Uint8Array(result.bytes), {
      status: 200,
      headers: {
        "Content-Type": result.contentType,
        "Content-Length": String(result.byteLength),
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "X-Artifact-SHA256": result.sha256,
        ...NO_STORE,
      },
    })
  }
}
