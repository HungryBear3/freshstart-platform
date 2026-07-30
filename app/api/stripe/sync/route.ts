import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"

export const runtime = "nodejs"

/** Read-only status lookup. Stripe lifecycle writes are webhook-owned. */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { prisma } = await import("@/lib/db")
    const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } })
    if (!subscription) return NextResponse.json({ subscription: null })
    const statusIsActive = subscription.status === "active" || subscription.status === "trialing"
    const periodHasNotEnded = !subscription.currentPeriodEnd || subscription.currentPeriodEnd.getTime() > Date.now()

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan: subscription.plan || "annual",
        isActive: statusIsActive && periodHasNotEnded,
        trialEnd: subscription.trialEnd,
        trialStart: subscription.trialStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        currentPeriodStart: subscription.currentPeriodStart,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
    })
  } catch (error: any) {
    console.error("[Sync GET] Error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch subscription" }, { status: 500 })
  }
}

/** Disabled: caller-supplied subscription IDs cannot safely grant access. */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json(
    { error: "Manual subscription sync is disabled; Stripe webhooks own access changes" },
    { status: 410 },
  )
}
