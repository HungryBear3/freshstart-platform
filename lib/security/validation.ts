/**
 * Input validation and sanitization utilities
 * Implements security best practices for handling user input
 */

import { z } from "zod"

/**
 * Sanitize string input - remove potentially dangerous characters
 */
export function sanitizeString(input: string): string {
  if (typeof input !== "string") {
    return ""
  }

  // Remove null bytes
  let sanitized = input.replace(/\0/g, "")

  // Remove script tags and event handlers
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")

  // Trim whitespace
  sanitized = sanitized.trim()

  return sanitized
}

/**
 * Sanitize HTML content (for rich text fields)
 */
export function sanitizeHTML(input: string): string {
  if (typeof input !== "string") {
    return ""
  }

  // Basic HTML sanitization - remove script tags and dangerous attributes
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
  sanitized = sanitized.replace(/javascript:/gi, "")

  return sanitized
}

/**
 * Validate and sanitize email address
 */
export function validateEmail(email: string): string | null {
  if (!email || typeof email !== "string") {
    return null
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const sanitized = sanitizeString(email.toLowerCase().trim())

  if (!emailRegex.test(sanitized)) {
    return null
  }

  // Additional length check
  if (sanitized.length > 254) {
    return null
  }

  return sanitized
}

/**
 * Validate phone number (US format)
 */
export function validatePhone(phone: string): string | null {
  if (!phone || typeof phone !== "string") {
    return null
  }

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "")

  // US phone numbers should be 10 digits
  if (digits.length === 10) {
    return digits
  }

  // Allow 11 digits if starts with 1
  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.substring(1)
  }

  return null
}

/**
 * Validate SSN format (XXX-XX-XXXX)
 */
export function validateSSN(ssn: string): string | null {
  if (!ssn || typeof ssn !== "string") {
    return null
  }

  // Remove all non-digit characters
  const digits = ssn.replace(/\D/g, "")

  // SSN should be 9 digits
  if (digits.length === 9) {
    // Format as XXX-XX-XXXX
    return `${digits.substring(0, 3)}-${digits.substring(3, 5)}-${digits.substring(5, 9)}`
  }

  return null
}

/**
 * Validate date string
 */
export function validateDate(dateString: string): Date | null {
  if (!dateString || typeof dateString !== "string") {
    return null
  }

  const date = new Date(dateString)

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return null
  }

  // Check if date is not too far in the future (reasonable limit)
  const maxDate = new Date()
  maxDate.setFullYear(maxDate.getFullYear() + 100)

  if (date > maxDate) {
    return null
  }

  return date
}

/**
 * Validate monetary amount
 */
export function validateAmount(amount: string | number): number | null {
  let num: number

  if (typeof amount === "string") {
    // Remove currency symbols and commas
    const cleaned = amount.replace(/[$,]/g, "")
    num = parseFloat(cleaned)
  } else {
    num = amount
  }

  if (isNaN(num) || !isFinite(num)) {
    return null
  }

  // Round to 2 decimal places
  return Math.round(num * 100) / 100
}

/**
 * Validate file name (prevent path traversal)
 */
export function validateFileName(fileName: string): string | null {
  if (!fileName || typeof fileName !== "string") {
    return null
  }

  // Remove path traversal attempts
  const sanitized = fileName.replace(/\.\./g, "").replace(/\//g, "").replace(/\\/g, "")

  // Remove null bytes
  const cleaned = sanitized.replace(/\0/g, "")

  // Check length
  if (cleaned.length === 0 || cleaned.length > 255) {
    return null
  }

  // Only allow alphanumeric, hyphens, underscores, dots, and spaces
  if (!/^[a-zA-Z0-9._\-\s]+$/.test(cleaned)) {
    return null
  }

  return cleaned
}

/**
 * Validate file size (in bytes)
 */
export function validateFileSize(size: number, maxSize: number = 25 * 1024 * 1024): boolean {
  if (typeof size !== "number" || !isFinite(size)) {
    return false
  }

  if (size < 0) {
    return false
  }

  if (size > maxSize) {
    return false
  }

  return true
}

/**
 * Validate file type (MIME type or extension)
 */
export function validateFileType(
  fileName: string,
  mimeType: string | null,
  allowedTypes: string[] = ["application/pdf"]
): boolean {
  if (!fileName || typeof fileName !== "string") {
    return false
  }

  // Check extension
  const extension = fileName.split(".").pop()?.toLowerCase()

  const allowedExtensions = allowedTypes.map((type) => {
    if (type === "application/pdf") return "pdf"
    if (type.startsWith("image/")) return type.split("/")[1]
    return type
  })

  if (extension && allowedExtensions.includes(extension)) {
    return true
  }

  // Check MIME type if provided
  if (mimeType && allowedTypes.includes(mimeType)) {
    return true
  }

  return false
}

/**
 * Rate limiting helper - simple in-memory store (use Redis in production)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    })
    return true
  }

  if (record.count >= maxRequests) {
    return false
  }

  record.count++
  return true
}

/**
 * Clean up old rate limit records
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000)
}

/**
 * Zod schemas for common validations
 */
export const emailSchema = z.string().email().max(254).transform((val) => val.toLowerCase().trim())

export const phoneSchema = z
  .string()
  .regex(/^[\d\s\-\(\)]+$/)
  .transform((val) => val.replace(/\D/g, ""))
  .refine((val) => val.length === 10 || (val.length === 11 && val.startsWith("1")), {
    message: "Invalid phone number format",
  })

export const ssnSchema = z
  .string()
  .regex(/^[\d\-]+$/)
  .transform((val) => val.replace(/\D/g, ""))
  .refine((val) => val.length === 9, {
    message: "SSN must be 9 digits",
  })

export const dateSchema = z.string().or(z.date()).transform((val) => {
  if (typeof val === "string") {
    const date = new Date(val)
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date")
    }
    return date
  }
  return val
})

export const amountSchema = z
  .union([z.string(), z.number()])
  .transform((val) => {
    if (typeof val === "string") {
      const num = parseFloat(val.replace(/[$,]/g, ""))
      if (isNaN(num) || !isFinite(num)) {
        throw new Error("Invalid amount")
      }
      return Math.round(num * 100) / 100
    }
    return val
  })
