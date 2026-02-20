/**
 * API route for uploading prenuptial/postnuptial agreement documents
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { uploadFile, validateFile } from "@/lib/storage";
import { prisma } from "@/lib/db";
import { sanitizeString, validateFileName } from "@/lib/security/validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    let documentType = (formData.get("documentType") as string) || "prenup";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Sanitize documentType
    documentType = sanitizeString(documentType);

    // Validate and sanitize filename
    const validatedFileName = validateFileName(file.name);
    if (!validatedFileName) {
      return NextResponse.json(
        { error: "Invalid file name. File name contains invalid characters or is too long." },
        { status: 400 }
      );
    }

    // Validate file (server-side with enhanced security checks)
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

    // Generate unique filename (using validated filename)
    const timestamp = Date.now();
    const sanitizedFileName = validatedFileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `prenup_${session.user.id}_${timestamp}_${sanitizedFileName}`;
    const folder = `prenups/${session.user.id}`;

    // Upload file
    const uploadResult = await uploadFile(file, fileName, folder);

    if (!uploadResult.success || !uploadResult.filePath) {
      return NextResponse.json(
        { error: uploadResult.error || "Upload failed" },
        { status: 500 }
      );
    }

    // Store document metadata in database
    const document = await prisma.document.create({
      data: {
        userId: session.user.id,
        fileName: file.name,
        filePath: uploadResult.filePath,
        type: "prenup",
        mimeType: file.type,
        status: "ready",
        // Store additional metadata in content field as JSON
        content: JSON.stringify({
          originalFileName: validatedFileName, // Use validated filename
          fileSize: file.size,
          fileUrl: uploadResult.fileUrl || "",
          prenupType: documentType,
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
        documentType: document.type,
        uploadedAt: document.generatedAt,
      },
    });
  } catch (error) {
    console.error("Prenup upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    );
  }
}
