import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { awardBadge } from "@/lib/badges/award-badge"

export async function POST() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { hasCompletedOnboarding: true },
  })

  const { earned } = await awardBadge(user.id, "onboarding")

  return NextResponse.json({ success: true, badgeEarned: earned ? "onboarding" : null })
}
