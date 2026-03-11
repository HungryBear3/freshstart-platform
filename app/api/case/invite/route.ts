import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { z } from "zod"
import crypto from "crypto"

const inviteSchema = z.object({
  inviteeEmail: z.string().email(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { inviteeEmail } = inviteSchema.parse(body)

    if (inviteeEmail.toLowerCase() === user.email?.toLowerCase()) {
      return NextResponse.json(
        { error: "You cannot invite yourself" },
        { status: 400 }
      )
    }

    const caseInfo = await prisma.caseInfo.findUnique({
      where: { userId: user.id },
    })

    if (!caseInfo) {
      return NextResponse.json(
        { error: "Create case information first before inviting" },
        { status: 400 }
      )
    }

    const existingInvite = await prisma.caseInvitation.findFirst({
      where: {
        caseInfoId: caseInfo.id,
        inviteeEmail: inviteeEmail.toLowerCase(),
        status: "pending",
        expiresAt: { gt: new Date() },
      },
    })

    if (existingInvite) {
      return NextResponse.json(
        { error: "An invitation has already been sent to this email" },
        { status: 400 }
      )
    }

    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const invitation = await prisma.caseInvitation.create({
      data: {
        caseInfoId: caseInfo.id,
        inviterId: user.id,
        inviteeEmail: inviteeEmail.toLowerCase(),
        token,
        expiresAt,
      },
    })

    const acceptUrl = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://www.freshstart-il.com"}/dashboard/case/invite/accept?token=${token}`

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        inviteeEmail: invitation.inviteeEmail,
        expiresAt: invitation.expiresAt,
        status: invitation.status,
      },
      acceptUrl,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid email", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Error creating invitation:", error)
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    )
  }
}
