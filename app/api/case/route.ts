import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/session"
import { z } from "zod"

// GET - Retrieve user's case information
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const caseInfo = await prisma.caseInfo.findUnique({
      where: { userId: user.id },
      include: {
        milestones: {
          orderBy: { date: "asc" },
        },
        deadlines: {
          orderBy: { dueDate: "asc" },
        },
      },
    })

    return NextResponse.json(caseInfo || null)
  } catch (error) {
    console.error("Error fetching case info:", error)
    return NextResponse.json(
      { error: "Failed to fetch case information" },
      { status: 500 }
    )
  }
}

// POST - Create or update case information
const caseInfoSchema = z.object({
  caseNumber: z.string().optional(),
  courtName: z.string().optional(),
  county: z.string().optional(),
  judgeName: z.string().optional(),
  filingDate: z.string().optional(), // ISO date string
  status: z.enum(["not_filed", "filed", "in_progress", "completed", "dismissed"]).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validated = caseInfoSchema.parse(body)

    // Check if case info exists
    const existing = await prisma.caseInfo.findUnique({
      where: { userId: user.id },
    })

    const data: any = {
      ...validated,
      filingDate: validated.filingDate ? new Date(validated.filingDate) : undefined,
    }

    if (existing) {
      // Update existing case info
      const updated = await prisma.caseInfo.update({
        where: { id: existing.id },
        data,
        include: {
          milestones: {
            orderBy: { date: "asc" },
          },
          deadlines: {
            orderBy: { dueDate: "asc" },
          },
        },
      })

      return NextResponse.json(updated)
    } else {
      // Create new case info
      const created = await prisma.caseInfo.create({
        data: {
          userId: user.id,
          ...data,
        },
        include: {
          milestones: {
            orderBy: { date: "asc" },
          },
          deadlines: {
            orderBy: { dueDate: "asc" },
          },
        },
      })

      return NextResponse.json(created)
    }
  } catch (error) {
    console.error("Error saving case info:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to save case information" },
      { status: 500 }
    )
  }
}
