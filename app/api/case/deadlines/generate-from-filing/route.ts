/**
 * POST - Generate standard Illinois divorce deadlines from filing date
 * Uses getStandardDeadlines from deadline-calculator
 */
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/session"
import { getStandardDeadlines } from "@/lib/case/deadline-calculator"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const caseInfo = await prisma.caseInfo.findUnique({
      where: { userId: user.id },
      include: { deadlines: true },
    })

    if (!caseInfo) {
      return NextResponse.json(
        { error: "Create case info and set filing date first" },
        { status: 400 }
      )
    }

    const filingDate = caseInfo.filingDate
    if (!filingDate) {
      return NextResponse.json(
        { error: "Set your filing date in Case Information first" },
        { status: 400 }
      )
    }

    const standard = getStandardDeadlines(new Date(filingDate))
    const existingTitles = new Set(caseInfo.deadlines.map((d) => d.title))
    const created: string[] = []

    for (const { rule, dueDate } of standard) {
      if (existingTitles.has(rule.name)) continue

      await prisma.deadline.create({
        data: {
          caseInfoId: caseInfo.id,
          title: rule.name,
          description: rule.description,
          dueDate,
        },
      })
      created.push(rule.name)
      existingTitles.add(rule.name)
    }

    return NextResponse.json({
      success: true,
      created,
      message: created.length
        ? `Added ${created.length} standard Illinois deadline${created.length !== 1 ? "s" : ""}`
        : "All standard deadlines already exist",
    })
  } catch (error) {
    console.error("Error generating deadlines:", error)
    return NextResponse.json(
      { error: "Failed to generate deadlines" },
      { status: 500 }
    )
  }
}
