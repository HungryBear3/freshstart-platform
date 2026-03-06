import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const { user, error } = await requireAdmin(request)
  if (error) return error

  const userId = user!.id

  // Ensure case info exists
  const caseInfo = await prisma.caseInfo.upsert({
    where: { userId },
    update: {
      caseNumber: "2026-D-12345",
      courtName: "Cook County Circuit Court",
      county: "Cook",
      judgeName: "Hon. A. Sample",
      status: "not_filed",
      filingDate: null,
    },
    create: {
      userId,
      caseNumber: "2026-D-12345",
      courtName: "Cook County Circuit Court",
      county: "Cook",
      judgeName: "Hon. A. Sample",
      status: "not_filed",
    },
    include: {
      milestones: true,
      deadlines: true,
    },
  })

  // Seed milestones if none
  if (caseInfo.milestones.length === 0) {
    await prisma.milestone.createMany({
      data: [
        {
          caseInfoId: caseInfo.id,
          title: "Draft Petition",
          description: "Complete petition draft",
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        {
          caseInfoId: caseInfo.id,
          title: "File Petition",
          description: "File at clerk's office",
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      ],
    })
  }

  // Seed deadlines if none
  if (caseInfo.deadlines.length === 0) {
    await prisma.deadline.createMany({
      data: [
        {
          caseInfoId: caseInfo.id,
          title: "Service Deadline",
          description: "Serve respondent after filing",
          dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        },
        {
          caseInfoId: caseInfo.id,
          title: "Response Deadline",
          description: "Expect answer/appearance",
          dueDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
        },
      ],
    })
  }

  const refreshed = await prisma.caseInfo.findUnique({
    where: { userId },
    include: {
      milestones: { orderBy: { date: "asc" } },
      deadlines: { orderBy: { dueDate: "asc" } },
    },
  })

  return NextResponse.json({
    message: "Seeded case info for current user",
    caseInfo: refreshed,
  })
}
