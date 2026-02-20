import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { createPasswordResetToken } from "@/lib/auth/tokens"
import { sendPasswordResetEmail } from "@/lib/email"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 3 requests per 15 minutes per IP
    const clientId = getClientIdentifier(request)
    const limit = rateLimit(clientId, 3, 15 * 60 * 1000)

    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Always return success to prevent email enumeration
    // But only send email if user exists
    if (user) {
      const token = await createPasswordResetToken(user.email)
      await sendPasswordResetEmail(user.email, token)
    }

    return NextResponse.json({
      message:
        "If an account with that email exists, we've sent a password reset link.",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid input data" },
        { status: 400 }
      )
    }

    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
