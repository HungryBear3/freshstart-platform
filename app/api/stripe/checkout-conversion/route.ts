import { randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db"

const CLAIM_LEASE_MS = 5 * 60 * 1000

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

  let sessionId: string
  let action: "claim" | "delivered"
  let claimToken: string | null
  try {
    const body = await request.json()
    sessionId = typeof body?.sessionId === "string" ? body.sessionId.trim() : ""
    action = body?.action === "delivered" ? "delivered" : "claim"
    claimToken = typeof body?.claimToken === "string" ? body.claimToken : null
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
  if (!sessionId.startsWith("cs_") || sessionId.length > 255) {
    return NextResponse.json({ error: "Invalid Checkout Session" }, { status: 400 })
  }

  const exactPaidContract = {
    userId: user.id,
    stripeSessionId: sessionId,
    status: "PAID",
    plan: "one_time",
    expectedAmountCents: 14900,
    expectedCurrency: "usd",
    settledAmountCents: 14900,
    settledCurrency: "usd",
  } as const

  if (action === "delivered") {
    if (!claimToken) return NextResponse.json({ error: "Claim token required" }, { status: 400 })
    const delivered = await prisma.checkoutObligation.updateMany({
      where: {
        ...exactPaidContract,
        conversionTrackedAt: null,
        conversionClaimToken: claimToken,
        conversionLeaseExpiresAt: { gt: new Date() },
      },
      data: {
        conversionTrackedAt: new Date(),
        conversionClaimToken: null,
        conversionLeaseExpiresAt: null,
      },
    })
    return NextResponse.json({ delivered: delivered.count === 1 })
  }

  const token = randomUUID()
  const now = new Date()
  const claimed = await prisma.checkoutObligation.updateMany({
    where: {
      ...exactPaidContract,
      conversionTrackedAt: null,
      OR: [
        { conversionClaimToken: null },
        { conversionLeaseExpiresAt: null },
        { conversionLeaseExpiresAt: { lte: now } },
      ],
    },
    data: {
      conversionClaimToken: token,
      conversionLeaseExpiresAt: new Date(now.getTime() + CLAIM_LEASE_MS),
    },
  })

  const state = claimed.count === 1 ? null : await prisma.checkoutObligation.findFirst({
    where: exactPaidContract,
    select: { conversionTrackedAt: true, conversionLeaseExpiresAt: true },
  })

  return NextResponse.json({
    shouldTrack: claimed.count === 1,
    claimToken: claimed.count === 1 ? token : null,
    complete: Boolean(state?.conversionTrackedAt),
    retryAfterMs: state?.conversionLeaseExpiresAt
      ? Math.max(1000, state.conversionLeaseExpiresAt.getTime() - Date.now() + 250)
      : 5000,
    plan: "one_time",
    price: 149,
  })
}

export const runtime = "nodejs"
