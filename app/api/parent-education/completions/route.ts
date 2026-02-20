import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/session"
import { z } from "zod"

// GET - Get user's education completions
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const completions = await prisma.parentEducationCompletion.findMany({
      where: { userId: user.id },
      include: {
        provider: true,
      },
      orderBy: { completedAt: "desc" },
    })

    return NextResponse.json({ completions })
  } catch (error) {
    console.error("Error fetching completions:", error)
    return NextResponse.json(
      { error: "Failed to fetch completions" },
      { status: 500 }
    )
  }
}

// POST - Record education completion
const completionSchema = z.object({
  providerId: z.string(),
  completedAt: z.string(), // ISO date string
  certificatePath: z.string().optional(),
  certificateUrl: z.string().optional(),
  notes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validated = completionSchema.parse(body)

    const completion = await prisma.parentEducationCompletion.create({
      data: {
        userId: user.id,
        providerId: validated.providerId,
        completedAt: new Date(validated.completedAt),
        certificatePath: validated.certificatePath,
        certificateUrl: validated.certificateUrl,
        notes: validated.notes,
      },
      include: {
        provider: true,
      },
    })

    return NextResponse.json(completion, { status: 201 })
  } catch (error) {
    console.error("Error creating completion:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to record completion" },
      { status: 500 }
    )
  }
}
