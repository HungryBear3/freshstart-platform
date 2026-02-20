import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/session"
import { z } from "zod"

// GET - Retrieve user's parenting plan
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const plan = await prisma.parentingPlan.findUnique({
      where: { userId: user.id },
    })

    return NextResponse.json(plan)
  } catch (error) {
    console.error("Error fetching parenting plan:", error)
    return NextResponse.json(
      { error: "Failed to fetch parenting plan" },
      { status: 500 }
    )
  }
}

// POST - Create or update parenting plan
const parentingPlanSchema = z.object({
  educationAuthority: z.enum(["parent1", "parent2", "joint"]).optional(),
  healthcareAuthority: z.enum(["parent1", "parent2", "joint"]).optional(),
  religiousAuthority: z.enum(["parent1", "parent2", "joint"]).optional(),
  extracurricularAuthority: z.enum(["parent1", "parent2", "joint"]).optional(),
  communicationMethod: z.enum(["email", "text", "phone", "app", "in_person"]).optional(),
  communicationFrequency: z.enum(["daily", "weekly", "as_needed"]).optional(),
  communicationNotes: z.string().optional(),
  weeklySchedule: z.any().optional(),
  holidays: z.any().optional(),
  summerVacation: z.any().optional(),
  schoolBreaks: z.any().optional(),
  specialOccasions: z.any().optional(),
  status: z.enum(["draft", "completed", "filed"]).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validated = parentingPlanSchema.parse(body)

    // Check if plan exists
    const existing = await prisma.parentingPlan.findUnique({
      where: { userId: user.id },
    })

    if (existing) {
      // Update existing plan
      const updated = await prisma.parentingPlan.update({
        where: { id: existing.id },
        data: validated,
      })

      return NextResponse.json(updated)
    } else {
      // Create new plan
      const created = await prisma.parentingPlan.create({
        data: {
          userId: user.id,
          ...validated,
        },
      })

      return NextResponse.json(created)
    }
  } catch (error) {
    console.error("Error saving parenting plan:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to save parenting plan" },
      { status: 500 }
    )
  }
}
