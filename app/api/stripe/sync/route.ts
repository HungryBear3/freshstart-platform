import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import { stripe } from "@/lib/stripe/config"
import Stripe from "stripe"

export const runtime = "nodejs"

/**
 * GET /api/stripe/sync
 * Returns the current user's subscription from the database
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { prisma } = await import("@/lib/db")

    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    })

    if (!subscription) {
      return NextResponse.json({ subscription: null })
    }

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan: subscription.plan || "annual",
        isActive: subscription.status === "active" || subscription.status === "trialing",
        trialEnd: subscription.trialEnd,
        trialStart: subscription.trialStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        currentPeriodStart: subscription.currentPeriodStart,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
    })
  } catch (error: any) {
    console.error("[Sync GET] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch subscription" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/stripe/sync
 * Syncs a subscription from Stripe to the database
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const subscriptionId = body.subscriptionId || body.sub_id

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "subscriptionId is required" },
        { status: 400 }
      )
    }

    // Handle session IDs
    let actualSubscriptionId = subscriptionId
    if (subscriptionId.startsWith("si_")) {
      const session = await stripe.checkout.sessions.retrieve(subscriptionId)
      actualSubscriptionId = typeof session.subscription === "string" 
        ? session.subscription 
        : session.subscription?.id || ""
      
      if (!actualSubscriptionId) {
        return NextResponse.json(
          { error: "Checkout session does not have a subscription" },
          { status: 404 }
        )
      }
    }

    // Get subscription from Stripe
    const subscriptionResponse = await stripe.subscriptions.retrieve(actualSubscriptionId)
    const subscription = subscriptionResponse as any as Stripe.Subscription
    const sub = subscription as any

    // Get customer ID
    const customerId = typeof subscription.customer === "string" 
      ? subscription.customer 
      : subscription.customer.id

    // Safely parse dates
    const parseTimestamp = (ts: any): Date | null => {
      if (!ts) return null
      const date = new Date(typeof ts === 'number' ? ts * 1000 : ts)
      return isNaN(date.getTime()) ? null : date
    }

    // Get dates - try subscription level first, then from items
    const item = subscription.items?.data?.[0] as any
    const currentPeriodStart = parseTimestamp(sub.current_period_start || item?.current_period_start)
    const currentPeriodEnd = parseTimestamp(sub.current_period_end || item?.current_period_end)
    const trialStart = parseTimestamp(sub.trial_start)
    const trialEnd = parseTimestamp(sub.trial_end)

    console.log("[Sync] Parsed dates:", {
      currentPeriodStart,
      currentPeriodEnd, 
      trialStart,
      trialEnd,
      rawCurrentPeriodStart: sub.current_period_start,
      rawTrialEnd: sub.trial_end
    })

    // Import Prisma
    const { prisma } = await import("@/lib/db")

    // Upsert subscription
    const dbSubscription = await prisma.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0]?.price.id,
        status: subscription.status,
        plan: "annual",
        currentPeriodStart,
        currentPeriodEnd,
        trialStart,
        trialEnd,
      },
      update: {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0]?.price.id,
        status: subscription.status,
        currentPeriodStart,
        currentPeriodEnd,
        trialStart,
        trialEnd,
        cancelAtPeriodEnd: sub.cancel_at_period_end || false,
      },
    })

    return NextResponse.json({
      success: true,
      subscription: {
        id: dbSubscription.id,
        status: dbSubscription.status,
        isActive: dbSubscription.status === "active" || dbSubscription.status === "trialing",
        trialEnd: dbSubscription.trialEnd,
        currentPeriodEnd: dbSubscription.currentPeriodEnd,
      },
    })
  } catch (error: any) {
    console.error("[Sync] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to sync subscription" },
      { status: 500 }
    )
  }
}
