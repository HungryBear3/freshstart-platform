import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request)
  if (error) return error

  const [total, subscribers] = await Promise.all([
    prisma.checklistSubscriber.count(),
    prisma.checklistSubscriber.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, email: true, source: true, createdAt: true },
    }),
  ])

  return NextResponse.json({ total, subscribers })
}
