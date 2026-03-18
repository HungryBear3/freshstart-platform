import { prisma } from "@/lib/db"
import type { BadgeId } from "./badge-definitions"

export async function awardBadge(
  userId: string,
  badgeId: BadgeId
): Promise<{ earned: boolean }> {
  const existing = await prisma.userBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId } },
  })
  if (existing) return { earned: false }

  await prisma.userBadge.create({
    data: { userId, badgeId },
  })
  return { earned: true }
}
