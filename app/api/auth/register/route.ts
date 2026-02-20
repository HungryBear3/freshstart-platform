import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { validateEmail, sanitizeString } from "@/lib/security/validation"

// Lazy import Prisma from shared client
async function getPrisma() {
  try {
    const { prisma } = await import("@/lib/db")
    return prisma
  } catch (error: any) {
    console.error("=== Prisma Import Error ===")
    console.error("Error message:", error?.message)
    console.error("Error code:", error?.code)
    console.error("Error stack:", error?.stack)
    console.error("Full error object:", error)
    console.error("===========================")
    
    const errorMsg = error?.message || String(error)
    const errorCode = error?.code || ""
    
    if (
      errorMsg.includes("Cannot find module") || 
      errorMsg.includes(".prisma/client") || 
      errorMsg.includes("@prisma/client") ||
      errorCode === "MODULE_NOT_FOUND"
    ) {
      throw new Error(`Prisma client not found. Error: ${errorMsg}. Run: npm run db:generate`)
    }
    
    throw new Error(`Database client not available: ${errorMsg} (code: ${errorCode})`)
  }
}

async function getBcrypt() {
  const bcrypt = await import("bcryptjs")
  return bcrypt.default
}

async function getRateLimit() {
  const { rateLimit, getClientIdentifier } = await import("@/lib/rate-limit")
  return { rateLimit, getClientIdentifier }
}

async function getEmailUtils() {
  const { createEmailVerificationToken } = await import("@/lib/auth/tokens")
  const { sendVerificationEmail } = await import("@/lib/email")
  return { createEmailVerificationToken, sendVerificationEmail }
}

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
})

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  // Ensure we always return JSON, even if there's an initialization error
  try {
    // Lazy load dependencies
    const { rateLimit, getClientIdentifier } = await getRateLimit()
    const bcrypt = await getBcrypt()
    
    // Rate limiting: 5 registrations per 15 minutes per IP
    const clientId = getClientIdentifier(request)
    const limit = rateLimit(clientId, 5, 15 * 60 * 1000)

    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
        },
        { status: 429 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      )
    }

    const { email, password, name } = registerSchema.parse(body)

    // Get Prisma client (lazy import)
    let prisma
    try {
      prisma = await getPrisma()
    } catch (prismaError: any) {
      console.error("Prisma initialization error:", prismaError)
      return NextResponse.json(
        { 
          error: "Database connection failed. Please check your database configuration.",
          ...(process.env.NODE_ENV === "development" && {
            details: prismaError?.message || String(prismaError)
          })
        },
        { status: 500 }
      )
    }

    // Check if user already exists (normalize email to lowercase)
    // Validate and sanitize email
    const validatedEmail = validateEmail(email)
    if (!validatedEmail) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      )
    }
    const normalizedEmail = validatedEmail
    
    // Sanitize name if provided
    const sanitizedName = name ? sanitizeString(name) : null
    let existingUser
    try {
      existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      })
    } catch (dbError) {
      console.error("Database error checking existing user:", dbError)
      return NextResponse.json(
        { error: "Database connection error. Please try again later." },
        { status: 500 }
      )
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    let user
    try {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          name: sanitizedName || null,
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        }
      })
    } catch (dbError: any) {
      console.error("Database error creating user:", dbError)
      // Check for unique constraint violation
      if (dbError?.code === 'P2002') {
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: "Failed to create user. Please try again." },
        { status: 500 }
      )
    }

    // Create and send verification email
    try {
      const { createEmailVerificationToken, sendVerificationEmail } = await getEmailUtils()
      const token = await createEmailVerificationToken(user.email)
      await sendVerificationEmail(user.email, token)
    } catch (emailError) {
      // Log error but don't fail registration
      console.error("Failed to send verification email:", emailError)
    }

    return NextResponse.json(
      { 
        message: "User created successfully. Please check your email to verify your account.",
        user 
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError && error.issues && error.issues.length > 0) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data" },
        { status: 400 }
      )
    }

    console.error("Registration error:", error)
    
    // Check for Prisma/database errors
    if (error instanceof Error) {
      if (error.message.includes("P2002") || error.message.includes("Unique constraint")) {
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 400 }
        )
      }
      if (error.message.includes("Prisma") || error.message.includes("database")) {
        return NextResponse.json(
          { error: "Database connection error. Please try again later." },
          { status: 500 }
        )
      }
    }
    
    // Always return JSON with detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error("Registration error details:", {
      message: errorMessage,
      stack: errorStack,
      error
    })
    
    return NextResponse.json(
      { 
        error: "Something went wrong. Please try again.",
        // Include details in development for debugging
        ...(process.env.NODE_ENV === "development" && {
          details: errorMessage,
          hint: "Check server terminal for full error details"
        })
      },
      { status: 500 }
    )
  }
}
