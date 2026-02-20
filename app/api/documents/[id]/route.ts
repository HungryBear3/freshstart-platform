/**
 * API route to serve document content from the database
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    console.log("[Document Serve] Fetching document:", id);

    // Get the document
    const document = await prisma.document.findUnique({
      where: { id },
    });

    console.log("[Document Serve] Found document:", document ? {
      id: document.id,
      fileName: document.fileName,
      hasContent: !!document.content,
      contentLength: document.content?.length || 0,
      mimeType: document.mimeType,
    } : "null");

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Check ownership
    if (document.userId !== session.user.id) {
      console.log("[Document Serve] Forbidden - user mismatch:", session.user.id, "vs", document.userId);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if content exists
    if (!document.content) {
      console.log("[Document Serve] No content for document:", id);
      return NextResponse.json(
        { error: "Document content not available. This document was created before database storage was implemented. Please generate a new document." },
        { status: 404 }
      );
    }

    // Check if download is requested
    const { searchParams } = new URL(request.url);
    const isDownload = searchParams.get("download") === "true";
    const disposition = `${isDownload ? "attachment" : "inline"}; filename="${document.fileName}"`;

    // Handle PDF content (stored as base64) vs text content
    if (document.mimeType === "application/pdf") {
      // PDF is stored as base64, decode it
      const buffer = Buffer.from(document.content, "base64");
      return new Response(buffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": disposition,
        },
      });
    }

    // Text content is stored as-is
    return new Response(document.content, {
      headers: {
        "Content-Type": document.mimeType || "text/plain",
        "Content-Disposition": disposition,
      },
    });
  } catch (error) {
    console.error("Error serving document:", error);
    return NextResponse.json(
      { error: "Failed to serve document" },
      { status: 500 }
    );
  }
}

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
