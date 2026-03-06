import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/session"
import { z } from "zod"

// GET - Get all milestones for user's case
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
      return NextResponse.json({ milestones: [] })
    }

    const milestones = await prisma.milestone.findMany({
      where: { caseInfoId: caseInfo.id },
      orderBy: { date: "asc" },
    })

    return NextResponse.json({ milestones })
  } catch (error) {
    console.error("Error fetching milestones:", error)
    return NextResponse.json(
      { error: "Failed to fetch milestones" },
      { status: 500 }
    )
  }
}

// POST - Create a new milestone
const milestoneSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  date: z.string(), // ISO date string
  completed: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validated = milestoneSchema.parse(body)

    // Get or create case info
    let caseInfo = await prisma.caseInfo.findUnique({
      where: { userId: user.id },
    })

    if (!caseInfo) {
      caseInfo = await prisma.caseInfo.create({
        data: { userId: user.id },
      })
    }

    const milestone = await prisma.milestone.create({
      data: {
        caseInfoId: caseInfo.id,
        title: validated.title,
        description: validated.description,
        date: new Date(validated.date),
        completed: validated.completed || false,
      },
    })

    return NextResponse.json(milestone)
  } catch (error) {
    console.error("Error creating milestone:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to create milestone" },
      { status: 500 }
    )
  }
}
