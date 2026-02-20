/**
 * DEV ONLY: Create a test subscription for the current user
 * This endpoint should only be available in development
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    )
  }

  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Check if user already has a subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId },
    })

    if (existingSubscription) {
      // Update existing subscription to active trial
      const updated = await prisma.subscription.update({
        where: { userId },
        data: {
          status: "trialing",
          plan: "annual",
          stripeSubscriptionId: `test_sub_${Date.now()}`,
          stripeCustomerId: `test_cus_${Date.now()}`,
          stripePriceId: "price_test_annual",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          trialStart: new Date(),
          trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          cancelAtPeriodEnd: false,
        },
      })

      return NextResponse.json({
        message: "Test subscription updated",
        subscription: updated,
      })
    }

    // Create new test subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        status: "trialing",
        plan: "annual",
        stripeSubscriptionId: `test_sub_${Date.now()}`,
        stripeCustomerId: `test_cus_${Date.now()}`,
        stripePriceId: "price_test_annual",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        trialStart: new Date(),
        trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        cancelAtPeriodEnd: false,
      },
    })

    return NextResponse.json({
      message: "Test subscription created",
      subscription,
    })
  } catch (error) {
    console.error("Error creating test subscription:", error)
    return NextResponse.json(
      { error: "Failed to create test subscription" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    )
  }

  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete subscription
    await prisma.subscription.deleteMany({
      where: { userId: session.user.id },
    })

    return NextResponse.json({
      message: "Test subscription deleted",
    })
  } catch (error) {
    console.error("Error deleting test subscription:", error)
    return NextResponse.json(
      { error: "Failed to delete test subscription" },
      { status: 500 }
    )
  }
}
