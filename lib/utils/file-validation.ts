/**
 * Client-safe file validation utilities
 * These functions work in the browser and don't require Node.js APIs
 */

/**
 * Validate file type and size (client-safe)
 */
export function validateFile(
  file: File,
  allowedTypes: string[] = ["application/pdf", "image/jpeg", "image/png"],
  maxSizeMB: number = 10
): { valid: boolean; error?: string } {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(", ")}`,
    }
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    }
  }

  return { valid: true }
}
