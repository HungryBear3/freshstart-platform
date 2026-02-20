import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { z } from "zod"

const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required to delete account"),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { password } = deleteAccountSchema.parse(body)

    // Get user with password
    const userWithPassword = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    })

    if (!userWithPassword || !userWithPassword.password) {
      return NextResponse.json(
        { error: "User not found or password not set" },
        { status: 404 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      password,
      userWithPassword.password
    )

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Password is incorrect" },
        { status: 400 }
      )
    }

    // Delete user (cascade will delete all related data)
    await prisma.user.delete({
      where: { id: user.id },
    })

    return NextResponse.json({
      message: "Account deleted successfully",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid input data" },
        { status: 400 }
      )
    }

    console.error("Delete account error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
