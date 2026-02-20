import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/session"
import { z } from "zod"

// PUT - Update a milestone
const updateMilestoneSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  date: z.string().optional(), // ISO date string
  completed: z.boolean().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validated = updateMilestoneSchema.parse(body)

    // Verify milestone belongs to user
    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: {
        caseInfo: true,
      },
    })

    if (!milestone || milestone.caseInfo.userId !== user.id) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 })
    }

    const updated = await prisma.milestone.update({
      where: { id },
      data: {
        ...validated,
        date: validated.date ? new Date(validated.date) : undefined,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating milestone:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update milestone" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a milestone
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    // Verify milestone belongs to user
    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: {
        caseInfo: true,
      },
    })

    if (!milestone || milestone.caseInfo.userId !== user.id) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 })
    }

    await prisma.milestone.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting milestone:", error)
    return NextResponse.json(
      { error: "Failed to delete milestone" },
      { status: 500 }
    )
  }
}
