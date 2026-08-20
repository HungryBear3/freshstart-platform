import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

  let sessionId: string
  try {
    const body = await request.json()
    sessionId = typeof body?.sessionId === "string" ? body.sessionId.trim() : ""
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

  const state = await prisma.checkoutObligation.findFirst({
    where: exactPaidContract,
    select: { conversionTrackedAt: true, conversionLeaseExpiresAt: true },
  })

  return NextResponse.json({
    shouldTrack: false,
    claimToken: null,
    complete: Boolean(state),
    retryAfterMs: state?.conversionLeaseExpiresAt
      ? Math.max(1000, state.conversionLeaseExpiresAt.getTime() - Date.now() + 250)
      : 5000,
    plan: "one_time",
    price: 149,
  })
}

export const runtime = "nodejs"
