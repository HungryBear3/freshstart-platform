import { NextRequest, NextResponse } from "next/server"
import { calculateChildSupport, calculateNetIncome } from "@/lib/financial/calculators/child-support"
import { z } from "zod"

const childSupportInputSchema = z.object({
  parent1NetIncome: z.number().min(0),
  parent2NetIncome: z.number().min(0),
  numberOfChildren: z.number().int().min(1),
  parentingTimeParent1: z.number().min(0).max(100),
  parentingTimeParent2: z.number().min(0).max(100),
  healthInsuranceCost: z.number().min(0).optional(),
  childcareCost: z.number().min(0).optional(),
  educationalExpenses: z.number().min(0).optional(),
  extraordinaryMedicalExpenses: z.number().min(0).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const input = childSupportInputSchema.parse(body)

    // Validate parenting time adds up to 100%
    const totalParentingTime = input.parentingTimeParent1 + input.parentingTimeParent2
    if (Math.abs(totalParentingTime - 100) > 1) {
      return NextResponse.json(
        { error: "Parenting time percentages must add up to 100%" },
        { status: 400 }
      )
    }

    const calculation = calculateChildSupport(input)

    return NextResponse.json(calculation)
  } catch (error) {
    console.error("Error calculating child support:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to calculate child support" },
      { status: 500 }
    )
  }
}
