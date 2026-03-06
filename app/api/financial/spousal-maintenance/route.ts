import { NextRequest, NextResponse } from "next/server"
import { calculateSpousalMaintenance } from "@/lib/financial/calculators/spousal-maintenance"
import { z } from "zod"

const spousalMaintenanceInputSchema = z.object({
  payerGrossIncome: z.number().min(0),
  payeeGrossIncome: z.number().min(0),
  durationOfMarriage: z.number().min(0),
  combinedGrossIncome: z.number().min(0),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const input = spousalMaintenanceInputSchema.parse(body)

    // Validate combined income matches sum
    const calculatedCombined = input.payerGrossIncome + input.payeeGrossIncome
    if (Math.abs(calculatedCombined - input.combinedGrossIncome) > 0.01) {
      return NextResponse.json(
        { error: "Combined gross income must equal sum of payer and payee income" },
        { status: 400 }
      )
    }

    const calculation = calculateSpousalMaintenance(input)

    return NextResponse.json(calculation)
  } catch (error) {
    console.error("Error calculating spousal maintenance:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to calculate spousal maintenance" },
      { status: 500 }
    )
  }
}
