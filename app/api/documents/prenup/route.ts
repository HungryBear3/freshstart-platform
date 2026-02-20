/**
 * API route for fetching user's prenup documents
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all prenup documents for the user
    const documents = await prisma.document.findMany({
      where: {
        userId: session.user.id,
        type: "prenup",
      },
      orderBy: {
        generatedAt: "desc",
      },
    });

    // Parse metadata from content field
    const documentsWithMetadata = documents.map((doc) => {
      let metadata: {
        fileUrl?: string;
        prenupType?: string;
        originalFileName?: string;
        fileSize?: number;
      } = {};
      if (doc.content) {
        try {
          metadata = JSON.parse(doc.content) as typeof metadata;
        } catch {
          // If parsing fails, use empty object
        }
      }

      return {
        id: doc.id,
        fileName: doc.fileName,
        fileUrl: metadata.fileUrl || "",
        documentType: metadata.prenupType || "prenup",
        uploadedAt: doc.generatedAt,
      };
    });

    return NextResponse.json({
      documents: documentsWithMetadata,
    });
  } catch (error) {
    console.error("Error fetching prenup documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}
