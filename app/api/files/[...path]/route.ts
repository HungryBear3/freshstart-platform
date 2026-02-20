import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

// In serverless environments (Vercel), use /tmp for local storage
const isVercel = !!process.env.VERCEL
const LOCAL_STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || (isVercel ? "/tmp/uploads" : "./uploads")

/**
 * API route to serve uploaded files (for local storage)
 * In production with S3, files would be served directly from S3
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params
    const filePath = path.join("/")
    const fullPath = join(LOCAL_STORAGE_PATH, filePath)

    // Security: Prevent directory traversal
    if (filePath.includes("..") || filePath.startsWith("/")) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 })
    }

    if (!existsSync(fullPath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const fileBuffer = await readFile(fullPath)
    
    // Determine content type from file extension
    const ext = filePath.split(".").pop()?.toLowerCase()
    const contentType = getContentType(ext || "")

    // Check if download is requested via query param
    const { searchParams } = new URL(request.url)
    const isDownload = searchParams.get("download") === "true"
    const fileName = filePath.split("/").pop() || "document"

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        // Use "attachment" for download, "inline" for preview
        "Content-Disposition": `${isDownload ? "attachment" : "inline"}; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error("File serving error:", error)
    return NextResponse.json(
      { error: "Failed to serve file" },
      { status: 500 }
    )
  }
}

function getContentType(ext: string): string {
  const types: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    txt: "text/plain",
    csv: "text/csv",
  }
  return types[ext] || "application/octet-stream"
}
