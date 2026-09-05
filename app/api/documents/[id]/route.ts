/**
 * API route to serve document content from the database.
 *
 * This is a RELEASE BOUNDARY, not just a reader, so the handler itself lives in
 * `lib/documents/serve-document-handler.ts` as a dependency-injected factory —
 * its real behavior, including the exact bytes it hands out, is testable without
 * a database or a session. This file owns the production dependencies:
 * authentication, the row lookup, and the authoritative stored-county lookup.
 *
 * The IWO policy inputs (clock, renewal evidence, disclosure approval, artifact
 * directory) are supplied BY OMISSION, i.e. the pinned production defaults —
 * which hold distribution closed.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { createDocumentServeHandler } from "@/lib/documents/serve-document-handler";

export const dynamic = "force-dynamic";

export const GET = createDocumentServeHandler({
  getUserId: async () => {
    const session = await auth();
    return session?.user?.id ?? null;
  },
  loadDocument: (id) => prisma.document.findUnique({ where: { id } }),
  loadStoredCounty: async (userId) => {
    const caseInfo = await prisma.caseInfo.findUnique({
      where: { userId },
      select: { county: true },
    });
    return caseInfo?.county;
  },
});

/**
 * Delete a document
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    console.log("[Document Delete] Deleting document:", id);

    // Get the document to verify ownership
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Check ownership
    if (document.userId !== session.user.id) {
      console.log("[Document Delete] Forbidden - user mismatch");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete the document
    await prisma.document.delete({
      where: { id },
    });

    console.log("[Document Delete] Document deleted successfully:", id);

    return NextResponse.json({ success: true, message: "Document deleted" });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
