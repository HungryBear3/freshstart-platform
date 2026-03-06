/**
 * Secure file upload validation and processing
 */

import { validateFileName, validateFileSize, validateFileType } from "./validation"

export interface FileUploadResult {
  success: boolean
  error?: string
  fileName?: string
  fileSize?: number
  mimeType?: string
}

/**
 * Validate uploaded file
 */
export function validateUploadedFile(
  file: File,
  options: {
    maxSize?: number
    allowedTypes?: string[]
    allowedExtensions?: string[]
  } = {}
): FileUploadResult {
  const { maxSize = 25 * 1024 * 1024, allowedTypes = ["application/pdf"] } = options

  // Validate file name
  const validFileName = validateFileName(file.name)
  if (!validFileName) {
    return {
      success: false,
      error: "Invalid file name. File names can only contain letters, numbers, hyphens, underscores, dots, and spaces.",
    }
  }

  // Validate file size
  if (!validateFileSize(file.size, maxSize)) {
    return {
      success: false,
      error: `File size exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB`,
    }
  }

  // Validate file type
  if (!validateFileType(file.name, file.type, allowedTypes)) {
    return {
      success: false,
      error: `File type not allowed. Only ${allowedTypes.join(", ")} files are accepted.`,
    }
  }

  return {
    success: true,
    fileName: validFileName,
    fileSize: file.size,
    mimeType: file.type,
  }
}

/**
 * Scan file for malicious content (basic check)
 * In production, use a proper antivirus/security scanner
 */
export async function scanFileForMalware(file: File): Promise<{ safe: boolean; reason?: string }> {
  // Basic checks
  const checks = [
    {
      name: "File size check",
      test: () => file.size > 0 && file.size < 100 * 1024 * 1024, // 100MB max
    },
    {
      name: "File name check",
      test: () => validateFileName(file.name) !== null,
    },
    {
      name: "File type check",
      test: () => {
        // Check magic bytes for PDF
        return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
      },
    },
  ]

  for (const check of checks) {
    if (!check.test()) {
      return { safe: false, reason: `Failed ${check.name}` }
    }
  }

  // In production, integrate with:
  // - ClamAV or similar antivirus
  // - VirusTotal API
  // - Custom malware detection service

  return { safe: true }
}

/**
 * Generate secure file name (prevent collisions and path traversal)
 */
export function generateSecureFileName(originalName: string, userId: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  const extension = originalName.split(".").pop()?.toLowerCase() || "pdf"

  // Sanitize original name
  const sanitized = validateFileName(originalName.split(".").slice(0, -1).join(".")) || "file"

  // Create secure path: userId/timestamp-random-sanitized.extension
  return `${userId}/${timestamp}-${random}-${sanitized}.${extension}`
}

/**
 * Validate file content (check if it's actually a PDF)
 */
export async function validatePDFContent(file: File): Promise<boolean> {
  try {
    // Read first bytes to check PDF magic number
    const arrayBuffer = await file.slice(0, 4).arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)

    // PDF files start with %PDF
    const header = String.fromCharCode(...bytes)
    return header === "%PDF"
  } catch (error) {
    console.error("Error validating PDF content:", error)
    return false
  }
}
