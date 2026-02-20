import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { createEmailVerificationToken } from "@/lib/auth/tokens"
import { sendVerificationEmail } from "@/lib/email"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"

const resendSchema = z.object({
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
    const { email } = resendSchema.parse(body)

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      // Don't reveal if user exists
      return NextResponse.json({
        message: "If an account with that email exists and is unverified, we've sent a verification email.",
      })
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json({
        message: "Email is already verified.",
      })
    }

    // Create and send verification token
    const token = await createEmailVerificationToken(user.email)
    await sendVerificationEmail(user.email, token)

    return NextResponse.json({
      message: "Verification email sent. Please check your inbox.",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid input data" },
        { status: 400 }
      )
    }

    console.error("Resend verification error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
