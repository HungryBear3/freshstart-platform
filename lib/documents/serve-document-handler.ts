/**
 * Handler for serving a single stored `Document`'s bytes.
 *
 * SERVER ONLY.
 *
 * Built as a dependency-injected factory for the same reason
 * `lib/documents/package-handler.ts` and `lib/forms/iwo-route-factory.ts` are:
 * this is a RELEASE BOUNDARY, and its branches must be exercisable against the
 * REAL handler without a database, a session, or a mutable global. In particular
 * the federal IWO gate is held closed by a pinned constant in production, so the
 * successful byte path can only be reached — and therefore only be tested — by
 * injecting an explicit approval.
 *
 * `app/api/documents/[id]/route.ts` owns the production dependencies:
 * authentication, the row lookup, and the authoritative stored-county lookup.
 * The policy inputs (clock, renewal evidence, disclosure approval, artifact
 * directory) are supplied by OMISSION there, i.e. the pinned defaults.
 */
import { NextResponse, type NextRequest } from "next/server"

import {
  isIwoDocument,
  isIwoReleaseOpen,
  validateIwoPayload,
} from "@/lib/forms/iwo-package-guard"
import type { IwoRenewalEvidence } from "@/lib/forms/iwo-provenance"
import type { IwoOpenPathDisclosureApproval } from "@/lib/forms/iwo-distribution-hold"

/** The row fields this boundary reads. A superset is fine. */
export interface ServeDocumentRow {
  id: string
  userId: string
  type: string
  fileName: string
  content?: string | null
  mimeType?: string | null
}

export interface ServeDocumentDeps {
  /** Authenticated user id, or null. Nothing is loaded before this resolves. */
  getUserId: () => Promise<string | null>
  loadDocument: (id: string) => Promise<ServeDocumentRow | null>
  /**
   * SERVER-side county for the AUTHENTICATED user. The only source of county
   * truth on this path; request input is never consulted.
   */
  loadStoredCounty: (userId: string) => Promise<string | null | undefined>
  /** Injectable clock. Defaults to real time. */
  now?: () => Date
  /** Injected ONLY by test factories. */
  renewalEvidence?: IwoRenewalEvidence
  /**
   * Injected ONLY by test factories. Defaults to the pinned constant, which is
   * `pending` — so the production route is held closed.
   */
  disclosureApproval?: IwoOpenPathDisclosureApproval
  /** Injected ONLY by test factories. */
  artifactDir?: string
}

const NO_STORE = { "Cache-Control": "no-store, max-age=0, must-revalidate" }

/**
 * Refusal for a row this request may not receive bytes for.
 *
 * Deliberately the SAME 403 body the route already returns for an ownership
 * failure. It carries no cause, no blocker list and no refusal identity, and it
 * introduces no customer-facing wording: the gate can close for the open-path
 * disclosure hold, which has no owner-approved wording at all, so anything more
 * specific would be either an internal token or unapproved legal-adjacent copy.
 * Zero bytes either way.
 */
function refused() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: NO_STORE })
}

/** The pre-existing 404 for a row that cannot produce bytes. Copy unchanged. */
function noContent() {
  return NextResponse.json(
    {
      error:
        "Document content not available. This document was created before database storage was implemented. Please generate a new document.",
    },
    { status: 404 },
  )
}

export function createDocumentServeHandler(deps: ServeDocumentDeps) {
  return async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ): Promise<Response> {
    try {
      const userId = await deps.getUserId()
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const { id } = await params
      console.log("[Document Serve] Fetching document:", id)

      const document = await deps.loadDocument(id)

      if (!document) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 })
      }

      // Check ownership
      if (document.userId !== userId) {
        console.log("[Document Serve] Forbidden - user mismatch:", userId, "vs", document.userId)
        return refused()
      }

      // Check if download is requested
      const { searchParams } = new URL(request.url)
      const isDownload = searchParams.get("download") === "true"
      const disposition = `${isDownload ? "attachment" : "inline"}; filename="${document.fileName}"`

      // Federal IWO gate. Consulted only for a row that names the instrument,
      // and only after ownership, so an unrelated caller learns nothing from it.
      if (isIwoDocument(document)) {
        const storedCounty = await deps.loadStoredCounty(userId)

        const open = isIwoReleaseOpen({
          storedCounty,
          today: deps.now?.() ?? new Date(),
          artifactDir: deps.artifactDir,
          renewalEvidence: deps.renewalEvidence,
          disclosureApproval: deps.disclosureApproval,
        })

        if (!open) {
          console.log("[Document Serve] Gated form withheld:", id)
          return refused()
        }

        // Policy authorized the FORM. It never authorized these bytes.
        //
        // The stored payload is pinned against the canonical federal print by
        // the SAME validator the packager applies, so a row that merely names
        // the instrument while holding a different, truncated, empty, or
        // undecodable payload is refused rather than released as the federal
        // form. The rejection reason is internal and is deliberately not
        // surfaced; the refusal is the generic one.
        const check = validateIwoPayload(document)
        if (!check.ok) {
          console.log("[Document Serve] Payload failed the federal pin:", id, check.reason)
          return refused()
        }

        // Wrapped exactly as `iwo-route-factory` does: the validated `Buffer` is
        // not assignable to `BodyInit` under this lib config. Same bytes.
        return new Response(new Uint8Array(check.bytes), {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": disposition,
            ...NO_STORE,
          },
        })
      }

      // Check if content exists
      if (!document.content || document.content.trim().length === 0) {
        console.log("[Document Serve] No content for document:", id)
        return noContent()
      }

      // Handle PDF content (stored as base64) vs text content
      if (document.mimeType === "application/pdf") {
        // PDF is stored as base64, decode it
        const buffer = Buffer.from(document.content, "base64")
        // `Buffer.from` is lenient: an undecodable payload yields zero bytes
        // rather than throwing. Serving that as a 200 hands the browser an empty
        // "PDF" that fails to open, so it is refused on the same footing as a
        // row that has no content at all.
        if (buffer.length === 0) {
          console.log("[Document Serve] Undecodable content for document:", id)
          return noContent()
        }
        return new Response(buffer, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": disposition,
          },
        })
      }

      // Text content is stored as-is
      return new Response(document.content, {
        headers: {
          "Content-Type": document.mimeType || "text/plain",
          "Content-Disposition": disposition,
        },
      })
    } catch (error) {
      console.error("Error serving document:", error)
      return NextResponse.json({ error: "Failed to serve document" }, { status: 500 })
    }
  }
}
