/**
 * API route for uploading spouse's Financial Affidavit (for comparison)
 * Requires legal authorization - caller must have confirmed before upload
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { uploadFile, validateFile } from "@/lib/storage";
import { prisma } from "@/lib/db";
import { validateFileName } from "@/lib/security/validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const authorizationConfirmed = formData.get("authorizationConfirmed") === "true";

    if (!authorizationConfirmed) {
      return NextResponse.json(
        {
          error:
            "You must confirm that you have legal authorization to possess and use this document before uploading.",
        },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const validatedFileName = validateFileName(file.name);
    if (!validatedFileName) {
      return NextResponse.json(
        { error: "Invalid file name." },
        { status: 400 }
      );
    }

    const validation = await validateFile(
      file,
      [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      10
    );

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const timestamp = Date.now();
    const sanitizedFileName = validatedFileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `spouse_affidavit_${session.user.id}_${timestamp}_${sanitizedFileName}`;
    const folder = `spouse-affidavits/${session.user.id}`;

    const uploadResult = await uploadFile(file, fileName, folder);

    if (!uploadResult.success || !uploadResult.filePath) {
      return NextResponse.json(
        { error: uploadResult.error || "Upload failed" },
        { status: 500 }
      );
    }

    const document = await prisma.document.create({
      data: {
        userId: session.user.id,
        fileName: file.name,
        filePath: uploadResult.filePath,
        type: "spouse_financial_affidavit",
        mimeType: file.type,
        status: "ready",
        content: JSON.stringify({
          originalFileName: validatedFileName,
          fileSize: file.size,
          fileUrl: uploadResult.fileUrl || "",
        }),
      },
    });

    const metadata = document.content ? JSON.parse(document.content) : {};
    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        fileName: document.fileName,
        fileUrl: metadata.fileUrl || "",
        uploadedAt: document.generatedAt,
      },
    });
  } catch (error) {
    console.error("Spouse affidavit upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    );
  }
}
