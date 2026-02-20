import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/session"
import { z } from "zod"

// PUT - Update a deadline
const updateDeadlineSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(), // ISO date string
  completed: z.boolean().optional(),
  reminderSent: z.boolean().optional(),
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
    const validated = updateDeadlineSchema.parse(body)

    // Verify deadline belongs to user
    const deadline = await prisma.deadline.findUnique({
      where: { id },
      include: {
        caseInfo: true,
      },
    })

    if (!deadline || deadline.caseInfo.userId !== user.id) {
      return NextResponse.json({ error: "Deadline not found" }, { status: 404 })
    }

    const updated = await prisma.deadline.update({
      where: { id },
      data: {
        ...validated,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : undefined,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating deadline:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update deadline" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a deadline
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
    // Verify deadline belongs to user
    const deadline = await prisma.deadline.findUnique({
      where: { id },
      include: {
        caseInfo: true,
      },
    })

    if (!deadline || deadline.caseInfo.userId !== user.id) {
      return NextResponse.json({ error: "Deadline not found" }, { status: 404 })
    }

    await prisma.deadline.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting deadline:", error)
    return NextResponse.json(
      { error: "Failed to delete deadline" },
      { status: 500 }
    )
  }
}
