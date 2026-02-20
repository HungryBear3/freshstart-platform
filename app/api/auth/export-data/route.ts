import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db"

/**
 * Export all user data for privacy compliance (GDPR, CCPA, Illinois privacy laws)
 * Returns a JSON file with all user data
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Fetch all user data
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        accounts: true,
        sessions: true,
        questionnaires: true,
        documents: true,
        caseInfo: {
          include: {
            milestones: true,
            deadlines: true,
          },
        },
        financialData: true,
      },
    })

    if (!userData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Remove sensitive data (password hashes, tokens)
    const exportData = {
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        emailVerified: userData.emailVerified,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      },
      accounts: userData.accounts.map((acc) => ({
        provider: acc.provider,
        type: acc.type,
      })),
      questionnaires: userData.questionnaires,
      documents: userData.documents.map(
        (
          doc: {
            type: string
            fileName: string
            status: string
            generatedAt: Date | null
            updatedAt: Date | null
          }
        ) => ({
        type: doc.type,
        fileName: doc.fileName,
        status: doc.status,
        generatedAt: doc.generatedAt,
        updatedAt: doc.updatedAt,
        })
      ),
      caseInfo: userData.caseInfo
        ? {
            caseNumber: userData.caseInfo.caseNumber,
            courtName: userData.caseInfo.courtName,
            county: userData.caseInfo.county,
            judgeName: userData.caseInfo.judgeName,
            filingDate: userData.caseInfo.filingDate,
            status: userData.caseInfo.status,
            milestones: userData.caseInfo.milestones,
            deadlines: userData.caseInfo.deadlines,
            createdAt: userData.caseInfo.createdAt,
            updatedAt: userData.caseInfo.updatedAt,
          }
        : null,
      financialData: userData.financialData,
      exportDate: new Date().toISOString(),
      exportVersion: "1.0",
    }

    // Return as downloadable JSON file
    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })

    return new NextResponse(blob, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="newstart-il-data-export-${Date.now()}.json"`,
      },
    })
  } catch (error) {
    console.error("Data export error:", error)
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    )
  }
}
