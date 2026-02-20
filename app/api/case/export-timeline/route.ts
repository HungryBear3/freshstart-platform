import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/session"
import { format } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get case info with all related data
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

    // Get documents
    const documents = await prisma.document.findMany({
      where: { userId: user.id },
      orderBy: { generatedAt: "desc" },
    })

    // Build timeline data
    const timelineData = {
      caseInfo: caseInfo
        ? {
            caseNumber: caseInfo.caseNumber,
            courtName: caseInfo.courtName,
            county: caseInfo.county,
            judgeName: caseInfo.judgeName,
            filingDate: caseInfo.filingDate,
            status: caseInfo.status,
          }
        : null,
      milestones: caseInfo?.milestones.map(
        (m: { title: string; description: string | null; date: Date | string; completed: boolean }) => ({
        title: m.title,
        description: m.description,
        date: format(new Date(m.date), "yyyy-MM-dd"),
        completed: m.completed,
        })
      ) || [],
      deadlines: caseInfo?.deadlines.map(
        (d: { title: string; description: string | null; dueDate: Date | string; completed: boolean }) => ({
        title: d.title,
        description: d.description,
        dueDate: format(new Date(d.dueDate), "yyyy-MM-dd"),
        completed: d.completed,
        })
      ) || [],
      documents: documents.map(
        (doc: { type: string; fileName: string; status: string; generatedAt: Date | string }) => ({
        type: doc.type,
        fileName: doc.fileName,
        status: doc.status,
        generatedAt: format(new Date(doc.generatedAt), "yyyy-MM-dd"),
        })
      ),
      exportDate: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
    }

    // Return as JSON (can be extended to PDF or other formats)
    return NextResponse.json(timelineData, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="case-timeline-${Date.now()}.json"`,
      },
    })
  } catch (error) {
    console.error("Error exporting timeline:", error)
    return NextResponse.json(
      { error: "Failed to export timeline" },
      { status: 500 }
    )
  }
}
