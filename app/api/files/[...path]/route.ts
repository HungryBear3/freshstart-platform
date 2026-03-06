import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { getCurrentUser } from "@/lib/auth/session"

// In serverless environments (Vercel), use /tmp for local storage
const isVercel = !!process.env.VERCEL
const LOCAL_STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || (isVercel ? "/tmp/uploads" : "./uploads")

/** Allowed path prefixes: folder must be {prefix}/{userId}/... */
const ALLOWED_PREFIXES = ["prenups", "spouse-affidavits"] as const

/**
 * API route to serve uploaded files (for local storage)
 * In production with S3, files would be served directly from S3
 * Requires authentication and verifies path ownership (path must be {prefix}/{userId}/...)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { path } = await params
    const filePath = path.join("/")
    const fullPath = join(LOCAL_STORAGE_PATH, filePath)

    // Security: Prevent directory traversal
    if (filePath.includes("..") || filePath.startsWith("/")) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 })
    }

    // Security: Verify path ownership - must be {prefix}/{userId}/...
    const pathParts = filePath.split("/")
    const isValidPath =
      pathParts.length >= 3 &&
      ALLOWED_PREFIXES.includes(pathParts[0] as (typeof ALLOWED_PREFIXES)[number]) &&
      pathParts[1] === user.id

    if (!isValidPath) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
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
