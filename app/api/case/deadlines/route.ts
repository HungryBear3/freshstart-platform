import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/session"
import { z } from "zod"

// GET - Get all deadlines for user's case
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const caseInfo = await prisma.caseInfo.findUnique({
      where: { userId: user.id },
    })

    if (!caseInfo) {
      return NextResponse.json({ deadlines: [] })
    }

    const deadlines = await prisma.deadline.findMany({
      where: { caseInfoId: caseInfo.id },
      orderBy: { dueDate: "asc" },
    })

    return NextResponse.json({ deadlines })
  } catch (error) {
    console.error("Error fetching deadlines:", error)
    return NextResponse.json(
      { error: "Failed to fetch deadlines" },
      { status: 500 }
    )
  }
}

// POST - Create a new deadline
const deadlineSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string(), // ISO date string
  completed: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validated = deadlineSchema.parse(body)

    // Get or create case info
    let caseInfo = await prisma.caseInfo.findUnique({
      where: { userId: user.id },
    })

    if (!caseInfo) {
      caseInfo = await prisma.caseInfo.create({
        data: { userId: user.id },
      })
    }

    const deadline = await prisma.deadline.create({
      data: {
        caseInfoId: caseInfo.id,
        title: validated.title,
        description: validated.description,
        dueDate: new Date(validated.dueDate),
        completed: validated.completed || false,
      },
    })

    return NextResponse.json(deadline)
  } catch (error) {
    console.error("Error creating deadline:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to create deadline" },
      { status: 500 }
    )
  }
}
