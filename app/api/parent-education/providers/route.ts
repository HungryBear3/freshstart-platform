import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { z } from "zod"

// GET - Search parent education providers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const county = searchParams.get("county")
    const format = searchParams.get("format")
    const maxCost = searchParams.get("maxCost")

    const where: any = {
      isActive: true,
    }

    if (county) {
      where.county = { contains: county, mode: "insensitive" }
    }

    if (format) {
      where.format = format
    }

    if (maxCost) {
      where.cost = { lte: parseFloat(maxCost) }
    }

    const providers = await prisma.parentEducationProvider.findMany({
      where,
      orderBy: [
        { county: "asc" },
        { cost: "asc" },
      ],
    })

    return NextResponse.json({ providers })
  } catch (error) {
    console.error("Error fetching providers:", error)
    return NextResponse.json(
      { error: "Failed to fetch providers" },
      { status: 500 }
    )
  }
}

// POST - Create a new provider (admin only)
const createProviderSchema = z.object({
  name: z.string().min(1),
  county: z.string().min(1),
  format: z.enum(["online", "in-person", "hybrid"]),
  cost: z.number().optional(),
  website: z.string().url().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    const body = await request.json()
    const validated = createProviderSchema.parse(body)

    const provider = await prisma.parentEducationProvider.create({
      data: validated,
    })

    return NextResponse.json(provider, { status: 201 })
  } catch (error) {
    console.error("Error creating provider:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to create provider" },
      { status: 500 }
    )
  }
}
