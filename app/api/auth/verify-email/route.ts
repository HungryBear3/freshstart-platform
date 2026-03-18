import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyEmailToken, deleteToken } from "@/lib/auth/tokens"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required." },
        { status: 400 }
      )
    }

    // Verify token
    const { valid, email } = await verifyEmailToken(token)

    if (!valid || !email) {
      return NextResponse.json(
        { error: "Invalid or expired verification token." },
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

    // Check if already verified
    if (user.emailVerified) {
      await deleteToken(token)
      return NextResponse.json({
        message: "Email already verified.",
        verified: true,
      })
    }

    // Mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    })

    // Delete used token
    await deleteToken(token)

    return NextResponse.json({
      message: "Email verified successfully.",
      verified: true,
    })
  } catch (error) {
    console.error("Verify email error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
