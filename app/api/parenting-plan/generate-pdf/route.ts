import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/session"
import { generateParentingPlanPDF } from "@/lib/document-generation/parenting-plan-pdf"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's parenting plan
    const planRecord = await prisma.parentingPlan.findUnique({
      where: { userId: user.id },
    })

    if (!planRecord) {
      return NextResponse.json(
        { error: "No parenting plan found. Please create a parenting plan first." },
        { status: 404 }
      )
    }

    // Get user info
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true },
    })

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Coerce nullable fields to match ParentingPlanData shape
    const plan = {
      educationAuthority: planRecord.educationAuthority ?? undefined,
      healthcareAuthority: planRecord.healthcareAuthority ?? undefined,
      religiousAuthority: planRecord.religiousAuthority ?? undefined,
      extracurricularAuthority: planRecord.extracurricularAuthority ?? undefined,
      communicationMethod: planRecord.communicationMethod ?? undefined,
      communicationFrequency: planRecord.communicationFrequency ?? undefined,
      communicationNotes: planRecord.communicationNotes ?? undefined,
      weeklySchedule: planRecord.weeklySchedule ?? undefined,
      holidays: Array.isArray(planRecord.holidays) ? planRecord.holidays : undefined,
      summerVacation: planRecord.summerVacation ?? undefined,
      schoolBreaks: Array.isArray(planRecord.schoolBreaks) ? planRecord.schoolBreaks : undefined,
      specialOccasions: planRecord.specialOccasions ?? undefined,
    }

    // Generate PDF
    const pdfBytes = await generateParentingPlanPDF(plan, {
      name: userData.name,
      email: userData.email,
    })

    // Create or update document record
    const fileName = `parenting-plan-${Date.now()}.pdf`

    const existingDoc = await prisma.document.findFirst({
      where: {
        userId: user.id,
        type: "parenting_plan",
      },
    })

    if (existingDoc) {
      await prisma.document.update({
        where: { id: existingDoc.id },
        data: {
          fileName,
          status: "ready",
          updatedAt: new Date(),
        },
      })
    } else {
      await prisma.document.create({
        data: {
          userId: user.id,
          type: "parenting_plan",
          fileName,
          status: "ready",
        },
      })
    }

    // Return PDF as response
    const pdfBuffer = Buffer.from(pdfBytes)
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error("Error generating parenting plan PDF:", error)
    return NextResponse.json(
      { error: "Failed to generate PDF", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
