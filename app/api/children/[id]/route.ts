import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/session"
import { z } from "zod"

// GET - Get a specific child
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const child = await prisma.child.findUnique({
      where: { id },
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
    })

    if (!child || child.userId !== user.id) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 })
    }

    return NextResponse.json(child)
  } catch (error) {
    console.error("Error fetching child:", error)
    return NextResponse.json(
      { error: "Failed to fetch child" },
      { status: 500 }
    )
  }
}

// PUT - Update a child
const updateChildSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  ssn: z.string().optional(),
  currentAddress: z.string().optional(),
  currentSchool: z.string().optional(),
  currentGrade: z.string().optional(),
  currentDoctor: z.string().optional(),
  currentHealthInsurance: z.string().optional(),
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
    const child = await prisma.child.findUnique({
      where: { id },
    })

    if (!child || child.userId !== user.id) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 })
    }

    const body = await request.json()
    const validated = updateChildSchema.parse(body)

    const data: any = { ...validated }
    if (validated.dateOfBirth) {
      data.dateOfBirth = new Date(validated.dateOfBirth)
    }

    // Check if address, school, or doctor changed to create history entries
    if (validated.currentAddress && validated.currentAddress !== child.currentAddress) {
      // Mark old address as not current
      await prisma.childAddressHistory.updateMany({
        where: { childId: child.id, isCurrent: true },
        data: { isCurrent: false, endDate: new Date() },
      })
      // Create new address history entry
      await prisma.childAddressHistory.create({
        data: {
          childId: child.id,
          address: validated.currentAddress,
          startDate: new Date(),
          isCurrent: true,
        },
      })
    }

    if (validated.currentSchool && validated.currentSchool !== child.currentSchool) {
      await prisma.childSchoolHistory.updateMany({
        where: { childId: child.id, isCurrent: true },
        data: { isCurrent: false, endDate: new Date() },
      })
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

    if (validated.currentDoctor && validated.currentDoctor !== child.currentDoctor) {
      await prisma.childDoctorHistory.updateMany({
        where: { childId: child.id, isCurrent: true },
        data: { isCurrent: false, endDate: new Date() },
      })
      await prisma.childDoctorHistory.create({
        data: {
          childId: child.id,
          providerName: validated.currentDoctor,
          startDate: new Date(),
          isCurrent: true,
        },
      })
    }

    const updated = await prisma.child.update({
      where: { id },
      data,
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
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating child:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update child" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a child
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
    const child = await prisma.child.findUnique({
      where: { id },
    })

    if (!child || child.userId !== user.id) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 })
    }

    await prisma.child.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting child:", error)
    return NextResponse.json(
      { error: "Failed to delete child" },
      { status: 500 }
    )
  }
}
