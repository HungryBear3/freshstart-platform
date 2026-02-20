import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/session"
import { generateFinancialAffidavitPDF } from "@/lib/document-generation/financial-affidavit-pdf"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's financial data
    const financialData = await prisma.financialData.findUnique({
      where: { userId: user.id },
      include: {
        income: true,
        expenses: true,
        assets: true,
        debts: true,
      },
    })

    if (!financialData) {
      return NextResponse.json(
        { error: "No financial data found. Please complete your Financial Affidavit first." },
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

    // Convert Prisma data to FinancialData type
    const financialDataForPDF = {
      id: financialData.id,
      userId: financialData.userId,
      formType: financialData.formType as "short" | "long",
      income: financialData.income.map((inc) => ({
        id: inc.id,
        type: inc.type as any,
        source: inc.source || "",
        amount: Number(inc.amount),
        frequency: inc.frequency as any,
        startDate: inc.startDate ?? undefined,
        endDate: inc.endDate ?? undefined,
        isCurrent: inc.isCurrent,
        notes: inc.notes ?? undefined,
      })),
      expenses: financialData.expenses.map((exp) => ({
        id: exp.id,
        category: exp.category as any,
        description: exp.description || "",
        amount: Number(exp.amount),
        frequency: exp.frequency as any,
        notes: exp.notes ?? undefined,
      })),
      assets: financialData.assets.map((asset) => ({
        id: asset.id,
        type: asset.type as any,
        description: asset.description || "",
        value: Number(asset.value),
        ownership: asset.ownership ? (asset.ownership as any) : ("individual" as any),
        notes: asset.notes ?? undefined,
      })),
      debts: financialData.debts.map((debt) => ({
        id: debt.id,
        type: debt.type as any,
        creditor: debt.creditor || "",
        description: debt.description ?? undefined,
        balance: Number(debt.balance),
        monthlyPayment: debt.monthlyPayment ? Number(debt.monthlyPayment) : undefined,
        ownership: debt.ownership ? (debt.ownership as any) : ("individual" as any),
        notes: debt.notes ?? undefined,
      })),
    }

    // Generate PDF
    const pdfBytes = await generateFinancialAffidavitPDF(financialDataForPDF, {
      name: userData.name,
      email: userData.email,
    })

    // Create or update document record
    const fileName = `financial-affidavit-${financialData.formType}-${Date.now()}.pdf`
    
    // Check if document exists
    const existingDoc = await prisma.document.findFirst({
      where: {
        userId: user.id,
        type: "financial_affidavit",
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
          type: "financial_affidavit",
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
    console.error("Error generating PDF:", error)
    return NextResponse.json(
      { error: "Failed to generate PDF", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
