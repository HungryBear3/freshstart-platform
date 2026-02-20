import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/session"
import { z } from "zod"

// GET - Retrieve user's financial data
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
      return NextResponse.json({
        formType: "short",
        income: [],
        expenses: [],
        assets: [],
        debts: [],
      })
    }

    return NextResponse.json(financialData)
  } catch (error) {
    console.error("Error fetching financial data:", error)
    return NextResponse.json(
      { error: "Failed to fetch financial data" },
      { status: 500 }
    )
  }
}

// POST - Create or update financial data
const financialDataSchema = z.object({
  formType: z.enum(["short", "long"]).optional(),
  income: z.array(
    z.object({
      type: z.string(),
      source: z.string(),
      amount: z.number(),
      frequency: z.string(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      isCurrent: z.boolean().optional(),
      notes: z.string().optional(),
    })
  ).optional(),
  expenses: z.array(
    z.object({
      category: z.string(),
      description: z.string(),
      amount: z.number(),
      frequency: z.string(),
      notes: z.string().optional(),
    })
  ).optional(),
  assets: z.array(
    z.object({
      type: z.string(),
      description: z.string(),
      value: z.number(),
      ownership: z.string(),
      notes: z.string().optional(),
    })
  ).optional(),
  debts: z.array(
    z.object({
      type: z.string(),
      creditor: z.string(),
      description: z.string().optional(),
      balance: z.number(),
      monthlyPayment: z.number().optional(),
      ownership: z.string(),
      notes: z.string().optional(),
    })
  ).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validated = financialDataSchema.parse(body)

    // Check if financial data exists
    const existing = await prisma.financialData.findUnique({
      where: { userId: user.id },
    })

    if (existing) {
      // Update existing financial data
      // Delete existing related records
      await prisma.incomeSource.deleteMany({
        where: { financialDataId: existing.id },
      })
      await prisma.expense.deleteMany({
        where: { financialDataId: existing.id },
      })
      await prisma.asset.deleteMany({
        where: { financialDataId: existing.id },
      })
      await prisma.debt.deleteMany({
        where: { financialDataId: existing.id },
      })

      // Update main record
      const updated = await prisma.financialData.update({
        where: { id: existing.id },
        data: {
          formType: validated.formType || existing.formType,
          income: {
            create: validated.income?.map((inc) => ({
              type: inc.type,
              source: inc.source,
              amount: inc.amount,
              frequency: inc.frequency,
              startDate: inc.startDate ? new Date(inc.startDate) : null,
              endDate: inc.endDate ? new Date(inc.endDate) : null,
              isCurrent: inc.isCurrent ?? true,
              notes: inc.notes,
            })) || [],
          },
          expenses: {
            create: validated.expenses?.map((exp) => ({
              category: exp.category,
              description: exp.description,
              amount: exp.amount,
              frequency: exp.frequency,
              notes: exp.notes,
            })) || [],
          },
          assets: {
            create: validated.assets?.map((asset) => ({
              type: asset.type,
              description: asset.description,
              value: asset.value,
              ownership: asset.ownership,
              notes: asset.notes,
            })) || [],
          },
          debts: {
            create: validated.debts?.map((debt) => ({
              type: debt.type,
              creditor: debt.creditor,
              description: debt.description,
              balance: debt.balance,
              monthlyPayment: debt.monthlyPayment,
              ownership: debt.ownership,
              notes: debt.notes,
            })) || [],
          },
        },
        include: {
          income: true,
          expenses: true,
          assets: true,
          debts: true,
        },
      })

      return NextResponse.json(updated)
    } else {
      // Create new financial data
      const created = await prisma.financialData.create({
        data: {
          userId: user.id,
          formType: validated.formType || "short",
          income: {
            create: validated.income?.map((inc) => ({
              type: inc.type,
              source: inc.source,
              amount: inc.amount,
              frequency: inc.frequency,
              startDate: inc.startDate ? new Date(inc.startDate) : null,
              endDate: inc.endDate ? new Date(inc.endDate) : null,
              isCurrent: inc.isCurrent ?? true,
              notes: inc.notes,
            })) || [],
          },
          expenses: {
            create: validated.expenses?.map((exp) => ({
              category: exp.category,
              description: exp.description,
              amount: exp.amount,
              frequency: exp.frequency,
              notes: exp.notes,
            })) || [],
          },
          assets: {
            create: validated.assets?.map((asset) => ({
              type: asset.type,
              description: asset.description,
              value: asset.value,
              ownership: asset.ownership,
              notes: asset.notes,
            })) || [],
          },
          debts: {
            create: validated.debts?.map((debt) => ({
              type: debt.type,
              creditor: debt.creditor,
              description: debt.description,
              balance: debt.balance,
              monthlyPayment: debt.monthlyPayment,
              ownership: debt.ownership,
              notes: debt.notes,
            })) || [],
          },
        },
        include: {
          income: true,
          expenses: true,
          assets: true,
          debts: true,
        },
      })

      return NextResponse.json(created)
    }
  } catch (error) {
    console.error("Error saving financial data:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to save financial data" },
      { status: 500 }
    )
  }
}
