import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { verifyPasswordResetToken, deleteToken } from "@/lib/auth/tokens"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 requests per 15 minutes per IP
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

    const body = await request.json()
    const { token, password } = resetPasswordSchema.parse(body)

    // Verify token
    const { valid, email } = await verifyPasswordResetToken(token)

    if (!valid || !email) {
      return NextResponse.json(
        { error: "Invalid or expired reset token." },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    // Delete used token
    await deleteToken(token)

    return NextResponse.json({
      message: "Password reset successfully. You can now sign in with your new password.",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid input data" },
        { status: 400 }
      )
    }

    console.error("Reset password error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
