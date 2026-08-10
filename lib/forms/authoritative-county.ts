/**
 * Authoritative county resolution.
 *
 * SERVER ONLY.
 *
 * Canonical SYNTAX is not authoritative IDENTITY. A requester saying
 * `?county=cook` proves nothing — it is an assertion, not a fact about their
 * case. Policy decisions must therefore never read a county from query string,
 * body, header, or cookie. The server looks the county up itself, from the
 * authenticated user's stored case record, and fails closed on anything it
 * cannot canonically resolve.
 *
 * `CaseInfo.county` is free text today (the UI placeholder is literally
 * "e.g., Cook County"), so the overwhelmingly common outcome is
 * `stored_county_not_canonical` — a refusal. That is correct: an unvalidated
 * free-text string must not authorize release of a gated federal artifact.
 */
import type { NextRequest } from "next/server"

import { isCanonicalCountyId } from "@/lib/counties/county-iwo-workflow"

export type CountyResolutionFailure =
  /** No authenticated session, so no case to bind policy to. */
  | "no_authenticated_case"
  /** Authenticated, but no case record or no stored county. */
  | "no_stored_county"
  /** A county is stored, but it is free-text / noncanonical / unknown. */
  | "stored_county_not_canonical"

export type CountyResolution =
  | { ok: true; countyId: string }
  | { ok: false; reason: CountyResolutionFailure }

/** Resolves the county the SERVER believes this request's case belongs to. */
export type AuthoritativeCountyResolver = (request: NextRequest) => Promise<CountyResolution>

/**
 * Production resolver: authenticated session -> that user's CaseInfo -> strict
 * canonical check. Reuses the same auth + prisma pattern as
 * `app/api/documents/package/route.ts`; no new auth or schema is introduced.
 */
export const resolveAuthoritativeCounty: AuthoritativeCountyResolver = async () => {
  // Imported lazily so that importing this module (e.g. from a test that
  // injects its own resolver) does not pull in auth/prisma.
  const { auth } = await import("@/app/api/auth/[...nextauth]/route")
  const { prisma } = await import("@/lib/db")

  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { ok: false, reason: "no_authenticated_case" }

  const caseInfo = await prisma.caseInfo.findUnique({
    where: { userId },
    select: { county: true },
  })

  const stored = caseInfo?.county
  if (!stored) return { ok: false, reason: "no_stored_county" }

  // No normalization, no coercion. "Cook County", "Cook", " cook " all fail.
  if (!isCanonicalCountyId(stored)) return { ok: false, reason: "stored_county_not_canonical" }

  return { ok: true, countyId: stored }
}

/**
 * Resolver used when a slice has no safe authoritative case-bound read path.
 * Always refuses, so the surface stays dormant rather than guessing.
 */
export const dormantCountyResolver: AuthoritativeCountyResolver = async () => ({
  ok: false,
  reason: "no_authenticated_case",
})
