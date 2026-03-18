/**
 * GET - Export financial data as CSV or PDF
 * Query: ?format=csv (default) or ?format=pdf
 */
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { transformFinancialResponses } from "@/lib/document-generation/transform-financial"
import { generateFinancialAffidavitPDF } from "@/lib/document-generation/financial-affidavit-pdf"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "csv"

    const questionnaireResponse = await prisma.questionnaireResponse.findFirst({
      where: {
        userId: user.id,
        formType: "financial_affidavit",
      },
      orderBy: { updatedAt: "desc" },
    })

    if (!questionnaireResponse) {
      return NextResponse.json(
        { error: "No financial affidavit data found. Complete the Financial Affidavit questionnaire first." },
        { status: 404 }
      )
    }

    const financialData = transformFinancialResponses(
      questionnaireResponse.responses as Record<string, unknown>,
      user.id
    )

    if (format === "pdf") {
      const pdfBytes = await generateFinancialAffidavitPDF(
        financialData,
        { name: user.name, email: user.email || "" }
      )
      const fileName = `Financial_Summary_${new Date().toISOString().slice(0, 10)}.pdf`
      return new NextResponse(Buffer.from(pdfBytes), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${fileName}"`,
        },
      })
    }

    // CSV export
    const rows: string[][] = []
    rows.push(["Category", "Type/Description", "Amount/Value", "Frequency/Ownership"])

    financialData.income.forEach((i) => {
      rows.push([
        "Income",
        `${i.type}: ${i.source || ""}`.trim(),
        String(i.amount),
        i.frequency || "",
      ])
    })
    financialData.expenses.forEach((e) => {
      rows.push([
        "Expense",
        `${e.category}: ${e.description || ""}`.trim(),
        String(e.amount),
        e.frequency || "",
      ])
    })
    financialData.assets.forEach((a) => {
      rows.push(["Asset", `${a.type}: ${a.description || ""}`.trim(), String(a.value), a.ownership || ""])
    })
    financialData.debts.forEach((d) => {
      rows.push(["Debt", `${d.type}: ${d.creditor || ""}`.trim(), String(d.balance), d.ownership || ""])
    })

    const escapeCsv = (val: string) => {
      if (val.includes(",") || val.includes('"') || val.includes("\n")) {
        return `"${val.replace(/"/g, '""')}"`
      }
      return val
    }
    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n")
    const csvWithBom = "\uFEFF" + csv

    const fileName = `Financial_Summary_${new Date().toISOString().slice(0, 10)}.csv`
    return new NextResponse(csvWithBom, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error("[Financial Export] Error:", error)
    return NextResponse.json(
      { error: "Failed to export financial data" },
      { status: 500 }
    )
  }
}
