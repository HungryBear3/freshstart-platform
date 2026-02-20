/**
 * Data encryption utilities
 * Note: For production, use proper encryption libraries and key management
 */

import crypto from "crypto"

const ENCRYPTION_ALGORITHM = "aes-256-gcm"
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 16 // 128 bits
const SALT_LENGTH = 64
const TAG_LENGTH = 16

/**
 * Get encryption key from environment variable
 * In production, use a proper key management service (AWS KMS, HashiCorp Vault, etc.)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY

  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set")
  }

  // If key is hex string, convert to buffer
  if (key.length === KEY_LENGTH * 2) {
    return Buffer.from(key, "hex")
  }

  // Otherwise, derive key from string using PBKDF2
  return crypto.pbkdf2Sync(key, "salt", 100000, KEY_LENGTH, "sha256")
}

/**
 * Encrypt sensitive data
 */
export function encryptData(plaintext: string): string {
  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv)

    let encrypted = cipher.update(plaintext, "utf8", "hex")
    encrypted += cipher.final("hex")

    const tag = cipher.getAuthTag()

    // Return: iv:tag:encrypted
    return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`
  } catch (error) {
    console.error("Encryption error:", error)
    throw new Error("Failed to encrypt data")
  }
}

/**
 * Decrypt sensitive data
 */
export function decryptData(encryptedData: string): string {
  try {
    const key = getEncryptionKey()
    const parts = encryptedData.split(":")

    if (parts.length !== 3) {
      throw new Error("Invalid encrypted data format")
    }

    const iv = Buffer.from(parts[0], "hex")
    const tag = Buffer.from(parts[1], "hex")
    const encrypted = parts[2]

    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    let decrypted = decipher.update(encrypted, "hex", "utf8")
    decrypted += decipher.final("utf8")

    return decrypted
  } catch (error) {
    console.error("Decryption error:", error)
    throw new Error("Failed to decrypt data")
  }
}

/**
 * Hash sensitive data (one-way, for passwords, etc.)
 */
export async function hashData(data: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const actualSalt = salt || crypto.randomBytes(SALT_LENGTH).toString("hex")

  return new Promise((resolve, reject) => {
    crypto.pbkdf2(data, actualSalt, 100000, 64, "sha512", (err, derivedKey) => {
      if (err) {
        reject(err)
      } else {
        resolve({
          hash: derivedKey.toString("hex"),
          salt: actualSalt,
        })
      }
    })
  })
}

/**
 * Verify hashed data
 */
export async function verifyHash(data: string, hash: string, salt: string): Promise<boolean> {
  try {
    const result = await hashData(data, salt)
    return result.hash === hash
  } catch (error) {
    console.error("Hash verification error:", error)
    return false
  }
}

/**
 * Mask sensitive data for logging (e.g., SSN, credit card)
 */
export function maskSensitiveData(data: string, type: "ssn" | "email" | "phone" | "generic" = "generic"): string {
  if (!data || data.length === 0) {
    return ""
  }

  switch (type) {
    case "ssn":
      // Show only last 4 digits: XXX-XX-1234
      if (data.length >= 4) {
        const last4 = data.slice(-4)
        return `XXX-XX-${last4}`
      }
      return "XXX-XX-XXXX"

    case "email":
      // Show first letter and domain: j***@example.com
      const [local, domain] = data.split("@")
      if (local && domain) {
        return `${local[0]}***@${domain}`
      }
      return "***@***"

    case "phone":
      // Show only last 4 digits: (XXX) XXX-1234
      if (data.length >= 4) {
        const last4 = data.slice(-4)
        return `(XXX) XXX-${last4}`
      }
      return "(XXX) XXX-XXXX"

    default:
      // Generic masking: show first and last character
      if (data.length <= 2) {
        return "**"
      }
      return `${data[0]}${"*".repeat(data.length - 2)}${data[data.length - 1]}`
  }
}
