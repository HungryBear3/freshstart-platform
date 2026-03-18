import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { error: "Sign in to accept the invitation" },
        { status: 401 }
      )
    }

    let token = request.nextUrl.searchParams.get("token")
    if (!token) {
      try {
        const body = await request.json()
        token = body.token ?? null
      } catch {
        // no body
      }
    }
    if (!token) {
      return NextResponse.json(
        { error: "Missing invitation token" },
        { status: 400 }
      )
    }

    const invitation = await prisma.caseInvitation.findUnique({
      where: { token },
      include: { caseInfo: true },
    })

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      )
    }

    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: "This invitation has already been used" },
        { status: 400 }
      )
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.caseInvitation.update({
        where: { id: invitation.id },
        data: { status: "expired" },
      })
      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 400 }
      )
    }

    if (invitation.inviteeEmail.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json(
        { error: "This invitation was sent to a different email address" },
        { status: 403 }
      )
    }

    if (invitation.inviterId === user.id) {
      return NextResponse.json(
        { error: "You cannot accept your own invitation" },
        { status: 400 }
      )
    }

    await prisma.$transaction([
      prisma.caseCollaborator.upsert({
        where: {
          caseInfoId_userId: {
            caseInfoId: invitation.caseInfoId,
            userId: user.id,
          },
        },
        create: {
          caseInfoId: invitation.caseInfoId,
          userId: user.id,
          role: "viewer",
        },
        update: {},
      }),
      prisma.caseInvitation.update({
        where: { id: invitation.id },
        data: { status: "accepted" },
      }),
    ])

    return NextResponse.json({
      success: true,
      message: "Invitation accepted. You can now view the shared case.",
      caseId: invitation.caseInfoId,
    })
  } catch (error) {
    console.error("Error accepting invitation:", error)
    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 }
    )
  }
}
