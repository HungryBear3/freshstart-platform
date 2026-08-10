/**
 * Guarded download route for the federal Income Withholding for Support
 * artifact (OMB 0970-0154).
 *
 * This is the ONLY path by which those bytes can reach a client. The artifact
 * lives in `private/official-forms/`, outside `public/`, so there is no static
 * URL for it. Every request re-validates provenance, expiration, renewal state,
 * and county disposition immediately before any bytes are written.
 *
 * The county is resolved SERVER-SIDE from the authenticated case record. A
 * `?county=` query parameter is ignored — canonical syntax is not authoritative
 * identity, so a requester cannot substitute one county for another.
 *
 * A closed gate returns 403 with a neutral JSON explanation and ZERO bytes.
 */
import { resolveAuthoritativeCounty } from "@/lib/forms/authoritative-county"
import { createIwoRouteHandler } from "@/lib/forms/iwo-route-factory"

export const dynamic = "force-dynamic"

export const GET = createIwoRouteHandler({ resolveCounty: resolveAuthoritativeCounty })
