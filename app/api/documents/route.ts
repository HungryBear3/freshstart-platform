/**
 * Document listing API.
 *
 * Two release-boundary rules hold here:
 *
 *   1. A listing is metadata. It must never carry the stored base64 payload, so
 *      the `content` column is not even selected — bytes leave the server only
 *      through `/api/documents/[id]`, which gates them.
 *   2. `Document` rows are free-form and long-lived: a legacy row can name the
 *      federal Income Withholding for Support form even though nothing on this
 *      path ever gated it. Listing such a row advertises a form Fresh Start is
 *      not currently releasing, so an IWO-classified row is omitted whenever the
 *      authoritative availability gate is closed. Same classifier, same gate,
 *      same authoritative stored county as every other IWO surface.
 *
 * The gate is consulted only when an IWO-classified row is actually present, so
 * ordinary listings do not take on a second query.
 */
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/session"
import { isIwoDocument, isIwoReleaseOpen } from "@/lib/forms/iwo-package-guard"

/** Exactly the fields the dashboard renders. Deliberately excludes `content`. */
const LIST_FIELDS = {
  id: true,
  type: true,
  fileName: true,
  status: true,
  generatedAt: true,
  updatedAt: true,
} as const

interface ListRow {
  id: string
  type: string
  fileName: string
  status: string
  generatedAt: Date | string | null
  updatedAt: Date | string | null
}

/**
 * Project a row onto the listed fields.
 *
 * The `select` above already asks the database for these and nothing else; this
 * re-projects at the serialization boundary so a row that arrives with extra
 * columns — a widened select, a helper that returns the whole record — still
 * cannot carry `content` out. Two independent steps, because "we did not ask
 * for it" is a weaker guarantee than "we do not emit it".
 */
function toListRow(doc: ListRow): ListRow {
  return {
    id: doc.id,
    type: doc.type,
    fileName: doc.fileName,
    status: doc.status,
    generatedAt: doc.generatedAt,
    updatedAt: doc.updatedAt,
  }
}

// GET - Retrieve user's documents
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rows: ListRow[] = await prisma.document.findMany({
      where: { userId: user.id },
      orderBy: { generatedAt: "desc" },
      select: LIST_FIELDS,
    })
    const documents = rows.map(toListRow)

    if (!rows.some((doc) => isIwoDocument(doc))) {
      return NextResponse.json({ documents })
    }

    const caseInfo = await prisma.caseInfo.findUnique({
      where: { userId: user.id },
      select: { county: true },
    })

    if (isIwoReleaseOpen({ storedCounty: caseInfo?.county })) {
      return NextResponse.json({ documents })
    }

    // Closed gate: the row is omitted outright. No refusal identity and no
    // explanatory copy is emitted here — the open-path disclosure hold has no
    // owner-approved wording, and a listing is not the surface that would carry
    // it even if it did.
    return NextResponse.json({
      documents: rows.filter((doc) => !isIwoDocument(doc)).map(toListRow),
    })
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    )
  }
}
