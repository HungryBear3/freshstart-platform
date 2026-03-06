import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/session"
import { z } from "zod"

// GET - Retrieve all children for user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const children = await prisma.child.findMany({
      where: { userId: user.id },
      include: {
        addressHistory: {
          orderBy: { startDate: "desc" },
        },
        schoolHistory: {
          orderBy: { startDate: "desc" },
        },
        doctorHistory: {
          orderBy: { startDate: "desc" },
        },
      },
      orderBy: { dateOfBirth: "asc" },
    })

    return NextResponse.json({ children })
  } catch (error) {
    console.error("Error fetching children:", error)
    return NextResponse.json(
      { error: "Failed to fetch children" },
      { status: 500 }
    )
  }
}

// POST - Create a new child
const createChildSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string(), // ISO date string
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  ssn: z.string().optional(),
  currentAddress: z.string().optional(),
  currentSchool: z.string().optional(),
  currentGrade: z.string().optional(),
  currentDoctor: z.string().optional(),
  currentHealthInsurance: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validated = createChildSchema.parse(body)

    const child = await prisma.child.create({
      data: {
        userId: user.id,
        firstName: validated.firstName,
        lastName: validated.lastName,
        dateOfBirth: new Date(validated.dateOfBirth),
        gender: validated.gender,
        ssn: validated.ssn,
        currentAddress: validated.currentAddress,
        currentSchool: validated.currentSchool,
        currentGrade: validated.currentGrade,
        currentDoctor: validated.currentDoctor,
        currentHealthInsurance: validated.currentHealthInsurance,
      },
      include: {
        addressHistory: true,
        schoolHistory: true,
        doctorHistory: true,
      },
    })

    // Create initial history entries if current info is provided
    if (validated.currentAddress) {
      await prisma.childAddressHistory.create({
        data: {
          childId: child.id,
          address: validated.currentAddress,
          startDate: new Date(),
          isCurrent: true,
        },
      })
    }

    if (validated.currentSchool) {
      await prisma.childSchoolHistory.create({
        data: {
          childId: child.id,
          schoolName: validated.currentSchool,
          grade: validated.currentGrade,
          startDate: new Date(),
          isCurrent: true,
        },
      })
    }

    if (validated.currentDoctor) {
      await prisma.childDoctorHistory.create({
        data: {
          childId: child.id,
          providerName: validated.currentDoctor,
          startDate: new Date(),
          isCurrent: true,
        },
      })
    }

    return NextResponse.json(child)
  } catch (error) {
    console.error("Error creating child:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to create child" },
      { status: 500 }
    )
  }
}
