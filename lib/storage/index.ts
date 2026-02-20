/**
 * File Storage Utility
 * 
 * This module provides a storage abstraction that supports:
 * - Local file storage (for development/MVP)
 * - AWS S3 (for production)
 * 
 * Usage:
 *   import { uploadFile, deleteFile, getFileUrl } from '@/lib/storage'
 */

import { writeFile, mkdir, unlink, readFile } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

// Storage configuration
const STORAGE_TYPE = process.env.STORAGE_TYPE || "local" // "local" | "s3"
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET
const AWS_REGION = process.env.AWS_REGION || "us-east-1"

// In serverless environments (Vercel), use /tmp for local storage
// /tmp is the only writable directory in Vercel's serverless functions
const isVercel = !!process.env.VERCEL
const LOCAL_STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || (isVercel ? "/tmp/uploads" : "./uploads")

// Lazy directory creation - don't create at module load time in serverless
let localStorageInitialized = false
async function ensureLocalStorageDir(): Promise<void> {
  if (localStorageInitialized || STORAGE_TYPE !== "local") return
  try {
    if (!existsSync(LOCAL_STORAGE_PATH)) {
      await mkdir(LOCAL_STORAGE_PATH, { recursive: true })
    }
    localStorageInitialized = true
  } catch (error) {
    console.error("Failed to create local storage directory:", error)
  }
}

export interface UploadResult {
  success: boolean
  filePath?: string
  fileUrl?: string
  error?: string
}

/**
 * Upload a file to storage
 */
export async function uploadFile(
  file: File | Buffer,
  fileName: string,
  folder?: string
): Promise<UploadResult> {
  try {
    if (STORAGE_TYPE === "local") {
      return await uploadToLocal(file, fileName, folder)
    } else if (STORAGE_TYPE === "s3") {
      return await uploadToS3(file, fileName, folder)
    } else {
      return {
        success: false,
        error: `Unknown storage type: ${STORAGE_TYPE}`,
      }
    }
  } catch (error) {
    console.error("File upload error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    }
  }
}

/**
 * Delete a file from storage
 */
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    if (STORAGE_TYPE === "local") {
      return await deleteFromLocal(filePath)
    } else if (STORAGE_TYPE === "s3") {
      return await deleteFromS3(filePath)
    }
    return false
  } catch (error) {
    console.error("File deletion error:", error)
    return false
  }
}

/**
 * Get a URL to access a file
 */
export async function getFileUrl(filePath: string): Promise<string | undefined> {
  try {
    if (STORAGE_TYPE === "local") {
      // For local storage, return a relative path or full URL
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
      return `${baseUrl}/api/files/${filePath}`
    } else if (STORAGE_TYPE === "s3") {
      const url = await getS3FileUrl(filePath)
      return url === null ? undefined : url
    }
    return undefined
  } catch (error) {
    console.error("Get file URL error:", error)
    return undefined
  }
}

// Local storage implementations
async function uploadToLocal(
  file: File | Buffer,
  fileName: string,
  folder?: string
): Promise<UploadResult> {
  // Ensure base storage directory exists
  await ensureLocalStorageDir()
  
  const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file
  const filePath = folder ? join(LOCAL_STORAGE_PATH, folder, fileName) : join(LOCAL_STORAGE_PATH, fileName)
  
  // Ensure subdirectory exists
  const dir = folder ? join(LOCAL_STORAGE_PATH, folder) : LOCAL_STORAGE_PATH
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }

  await writeFile(filePath, buffer)
  
  const relativePath = folder ? `${folder}/${fileName}` : fileName
  const fileUrl = await getFileUrl(relativePath)
  return {
    success: true,
    filePath: relativePath,
    fileUrl: fileUrl ?? undefined,
  }
}

async function deleteFromLocal(filePath: string): Promise<boolean> {
  try {
    const fullPath = join(LOCAL_STORAGE_PATH, filePath)
    if (existsSync(fullPath)) {
      await unlink(fullPath)
      return true
    }
    return false
  } catch (error) {
    console.error("Local file deletion error:", error)
    return false
  }
}

// S3 storage implementations (placeholder - requires AWS SDK)
async function uploadToS3(
  file: File | Buffer,
  fileName: string,
  folder?: string
): Promise<UploadResult> {
  // TODO: Implement S3 upload when AWS SDK is configured
  // For now, return error if S3 is selected but not configured
  if (!AWS_S3_BUCKET) {
    return {
      success: false,
      error: "S3 bucket not configured. Set AWS_S3_BUCKET environment variable.",
    }
  }

  // Placeholder for S3 implementation
  // const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3")
  // const s3Client = new S3Client({ region: AWS_REGION })
  // const key = folder ? `${folder}/${fileName}` : fileName
  // ... S3 upload logic

  return {
    success: false,
    error: "S3 upload not yet implemented. Use local storage for MVP.",
  }
}

async function deleteFromS3(filePath: string): Promise<boolean> {
  // TODO: Implement S3 deletion
  return false
}

async function getS3FileUrl(filePath: string): Promise<string | null> {
  // TODO: Generate S3 presigned URL or public URL
  return null
}

/**
 * File type magic numbers (file signatures) for validation
 * These are the first bytes of files that identify their true type
 */
const FILE_SIGNATURES: Record<string, number[][]> = {
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]], // %PDF
  "image/jpeg": [[0xFF, 0xD8, 0xFF]],
  "image/png": [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]], // PNG
  "application/msword": [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]], // .doc (OLE2)
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    [0x50, 0x4B, 0x03, 0x04], // .docx (ZIP signature, first 4 bytes)
  ],
}

/**
 * Allowed file extensions mapped to MIME types
 */
const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  "application/pdf": ["pdf"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "application/msword": ["doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
}

/**
 * Validate file extension matches MIME type
 */
function validateFileExtension(fileName: string, mimeType: string): boolean {
  const extension = fileName.split(".").pop()?.toLowerCase()
  if (!extension) return false

  const allowedExts = ALLOWED_EXTENSIONS[mimeType]
  if (!allowedExts) return false

  return allowedExts.includes(extension)
}

/**
 * Validate file magic number (file signature) to ensure file type matches MIME type
 * This prevents MIME type spoofing attacks
 */
async function validateFileSignature(
  file: File,
  mimeType: string
): Promise<boolean> {
  const signatures = FILE_SIGNATURES[mimeType]
  if (!signatures || signatures.length === 0) {
    // If we don't have a signature for this type, allow it (for flexibility)
    return true
  }

  try {
    // Read first bytes of file
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer.slice(0, 16)) // Read first 16 bytes

    // Check if any signature matches
    for (const signature of signatures) {
      let matches = true
      for (let i = 0; i < signature.length; i++) {
        if (bytes[i] !== signature[i]) {
          matches = false
          break
        }
      }
      if (matches) {
        return true
      }
    }

    return false
  } catch (error) {
    console.error("Error validating file signature:", error)
    return false
  }
}

/**
 * Validate file type and size (server-side with enhanced security)
 * Includes extension validation and magic number checks
 */
export async function validateFile(
  file: File,
  allowedTypes: string[] = ["application/pdf", "image/jpeg", "image/png"],
  maxSizeMB: number = 10
): Promise<{ valid: boolean; error?: string }> {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(", ")}`,
    }
  }

  // Validate file extension matches MIME type
  if (!validateFileExtension(file.name, file.type)) {
    return {
      valid: false,
      error: `File extension does not match file type. Expected one of: ${ALLOWED_EXTENSIONS[file.type]?.join(", ")}`,
    }
  }

  // Validate file signature (magic number) to prevent MIME type spoofing
  const signatureValid = await validateFileSignature(file, file.type)
  if (!signatureValid) {
    return {
      valid: false,
      error: "File type validation failed. File content does not match declared type.",
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

  // Check for empty files
  if (file.size === 0) {
    return {
      valid: false,
      error: "File is empty",
    }
  }

  return { valid: true }
}
