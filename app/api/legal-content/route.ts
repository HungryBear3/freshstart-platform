import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { z } from "zod"

const getContentSchema = z.object({
  category: z.string().optional(),
  published: z.boolean().optional(),
  search: z.string().optional(),
})

// GET - Get legal content
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get("category")
    const published = searchParams.get("published")
    const search = searchParams.get("search")

    const where: any = {}

    if (category) {
      where.category = category
    }

    if (published !== null) {
      where.published = published === "true"
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { tags: { has: search } },
      ]
    }

    const content = await prisma.legalContent.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ content })
  } catch (error) {
    console.error("Get legal content error:", error)
    return NextResponse.json(
      { error: "Failed to fetch legal content" },
      { status: 500 }
    )
  }
}

// POST - Create legal content (for admin/content management)
const createContentSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.string().min(1),
  category: z.string(),
  tags: z.array(z.string()).optional(),
  published: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    const body = await request.json()
    const data = createContentSchema.parse(body)

    const content = await prisma.legalContent.create({
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content,
        category: data.category,
        tags: data.tags || [],
        published: data.published || false,
      },
    })

    return NextResponse.json({ content }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid input data" },
        { status: 400 }
      )
    }

    console.error("Create legal content error:", error)
    return NextResponse.json(
      { error: "Failed to create legal content" },
      { status: 500 }
    )
  }
}
