import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { transformFinancialResponses } from "@/lib/document-generation/transform-financial"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch the financial affidavit questionnaire response
    const questionnaireResponse = await prisma.questionnaireResponse.findFirst({
      where: {
        userId: user.id,
        formType: "financial_affidavit",
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    if (!questionnaireResponse) {
      return NextResponse.json(
        { error: "No financial affidavit data found" },
        { status: 404 }
      )
    }

    // Parse the responses
    const responses = questionnaireResponse.responses as Record<string, any>

    // Transform to financial data structure
    const financialData = transformFinancialResponses(responses, user.id)

    // Calculate totals
    const monthlyIncome = financialData.income.reduce((sum, item) => {
      // Convert to monthly if needed
      let monthlyAmount = item.amount
      if (item.frequency === "yearly") {
        monthlyAmount = item.amount / 12
      } else if (item.frequency === "weekly") {
        monthlyAmount = item.amount * 4.33
      } else if (item.frequency === "biweekly") {
        monthlyAmount = item.amount * 2.17
      }
      return sum + monthlyAmount
    }, 0)

    const monthlyExpenses = financialData.expenses.reduce((sum, item) => {
      let monthlyAmount = item.amount
      if (item.frequency === "yearly") {
        monthlyAmount = item.amount / 12
      } else if (item.frequency === "weekly") {
        monthlyAmount = item.amount * 4.33
      } else if (item.frequency === "biweekly") {
        monthlyAmount = item.amount * 2.17
      }
      return sum + monthlyAmount
    }, 0)

    const totalAssets = financialData.assets.reduce((sum, item) => sum + item.value, 0)
    const totalDebts = financialData.debts.reduce((sum, item) => sum + item.balance, 0)
    const netWorth = totalAssets - totalDebts
    const monthlyCashFlow = monthlyIncome - monthlyExpenses

    // Determine questionnaire status
    let questionnaireStatus: "not_started" | "in_progress" | "completed" = "in_progress"
    if (questionnaireResponse.status === "completed") {
      questionnaireStatus = "completed"
    } else if (questionnaireResponse.status === "draft") {
      questionnaireStatus = "in_progress"
    }

    return NextResponse.json({
      formType: financialData.formType,
      income: financialData.income,
      expenses: financialData.expenses,
      assets: financialData.assets,
      debts: financialData.debts,
      totals: {
        monthlyIncome: Math.round(monthlyIncome * 100) / 100,
        monthlyExpenses: Math.round(monthlyExpenses * 100) / 100,
        totalAssets: Math.round(totalAssets * 100) / 100,
        totalDebts: Math.round(totalDebts * 100) / 100,
        netWorth: Math.round(netWorth * 100) / 100,
        monthlyCashFlow: Math.round(monthlyCashFlow * 100) / 100,
      },
      questionnaireStatus,
      lastUpdated: questionnaireResponse.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error("[Financial Summary] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch financial summary" },
      { status: 500 }
    )
  }
}
