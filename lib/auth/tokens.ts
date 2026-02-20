import crypto from "crypto"

// Lazy load Prisma to avoid initialization errors
async function getPrisma() {
  const { prisma } = await import("@/lib/db")
  return prisma
}

// Generate a secure random token
export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

// Create a password reset token
export async function createPasswordResetToken(email: string) {
  const prisma = await getPrisma()
  // Delete any existing reset tokens for this email
  await prisma.verificationToken.deleteMany({
    where: {
      identifier: `password-reset:${email}`,
    },
  })

  const token = generateToken()
  const expires = new Date(Date.now() + 3600000) // 1 hour from now

  await prisma.verificationToken.create({
    data: {
      identifier: `password-reset:${email}`,
      token,
      expires,
    },
  })

  return token
}

// Verify a password reset token
export async function verifyPasswordResetToken(token: string) {
  const prisma = await getPrisma()
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  })

  if (!verificationToken) {
    return { valid: false, email: null }
  }

  if (verificationToken.expires < new Date()) {
    // Token expired, delete it
    await prisma.verificationToken.delete({
      where: { token },
    })
    return { valid: false, email: null }
  }

  if (!verificationToken.identifier.startsWith("password-reset:")) {
    return { valid: false, email: null }
  }

  const email = verificationToken.identifier.replace("password-reset:", "")

  return { valid: true, email }
}

// Create an email verification token
export async function createEmailVerificationToken(email: string) {
  const prisma = await getPrisma()
  // Delete any existing verification tokens for this email
  await prisma.verificationToken.deleteMany({
    where: {
      identifier: `email-verify:${email}`,
    },
  })

  const token = generateToken()
  const expires = new Date(Date.now() + 86400000) // 24 hours from now

  await prisma.verificationToken.create({
    data: {
      identifier: `email-verify:${email}`,
      token,
      expires,
    },
  })

  return token
}

// Verify an email verification token
export async function verifyEmailToken(token: string) {
  const prisma = await getPrisma()
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  })

  if (!verificationToken) {
    return { valid: false, email: null }
  }

  if (verificationToken.expires < new Date()) {
    // Token expired, delete it
    await prisma.verificationToken.delete({
      where: { token },
    })
    return { valid: false, email: null }
  }

  if (!verificationToken.identifier.startsWith("email-verify:")) {
    return { valid: false, email: null }
  }

  const email = verificationToken.identifier.replace("email-verify:", "")

  return { valid: true, email }
}

// Delete a token after use
export async function deleteToken(token: string) {
  const prisma = await getPrisma()
  await prisma.verificationToken.deleteMany({
    where: { token },
  })
}
