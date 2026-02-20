import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe/config"
import Stripe from "stripe"

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")!

  console.log("[Webhook] Received webhook request")

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
    console.log("[Webhook] Event verified:", event.type, event.id)
  } catch (err) {
    console.error("[Webhook] Signature verification failed:", err)
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription)
        break
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook handler error:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string
  const userId = session.metadata?.userId

  if (!userId || !subscriptionId) {
    console.error("Missing userId or subscriptionId in checkout session")
    return
  }

  // Lazy import Prisma
  const { prisma } = await import("@/lib/db")

  // Get subscription details from Stripe
  // Type assertion needed because Stripe SDK v20 types are strict
  const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId)
  // Cast to any first, then to Stripe.Subscription to access properties
  const subscription = subscriptionResponse as any as Stripe.Subscription
  const sub = subscription as any

  // Safely parse date fields, handling both timestamp numbers and Date objects
  const currentPeriodStart = sub.current_period_start 
    ? new Date(typeof sub.current_period_start === 'number' ? sub.current_period_start * 1000 : sub.current_period_start)
    : null
  const currentPeriodEnd = sub.current_period_end
    ? new Date(typeof sub.current_period_end === 'number' ? sub.current_period_end * 1000 : sub.current_period_end)
    : null
  const trialStart = sub.trial_start
    ? new Date(typeof sub.trial_start === 'number' ? sub.trial_start * 1000 : sub.trial_start)
    : null
  const trialEnd = sub.trial_end
    ? new Date(typeof sub.trial_end === 'number' ? sub.trial_end * 1000 : sub.trial_end)
    : null

  // Validate dates before using them
  if (currentPeriodStart && isNaN(currentPeriodStart.getTime())) {
    console.error("[Webhook] Invalid currentPeriodStart:", sub.current_period_start)
    throw new Error("Invalid currentPeriodStart date")
  }
  if (currentPeriodEnd && isNaN(currentPeriodEnd.getTime())) {
    console.error("[Webhook] Invalid currentPeriodEnd:", sub.current_period_end)
    throw new Error("Invalid currentPeriodEnd date")
  }

  const plan = session.metadata?.plan || "annual"
  const planPrice = plan === "annual" ? 299 : 29.99 // Annual or monthly price

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: subscription.items.data[0]?.price.id,
      status: subscription.status,
      plan: plan,
      currentPeriodStart: currentPeriodStart && !isNaN(currentPeriodStart.getTime()) ? currentPeriodStart : null,
      currentPeriodEnd: currentPeriodEnd && !isNaN(currentPeriodEnd.getTime()) ? currentPeriodEnd : null,
      trialStart: trialStart && !isNaN(trialStart.getTime()) ? trialStart : null,
      trialEnd: trialEnd && !isNaN(trialEnd.getTime()) ? trialEnd : null,
    },
    update: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: subscription.items.data[0]?.price.id,
      status: subscription.status,
      currentPeriodStart: currentPeriodStart && !isNaN(currentPeriodStart.getTime()) ? currentPeriodStart : undefined,
      currentPeriodEnd: currentPeriodEnd && !isNaN(currentPeriodEnd.getTime()) ? currentPeriodEnd : undefined,
    },
  })

  console.log("[Webhook] Subscription record upserted successfully for userId:", userId)

  // Track analytics conversion (server-side)
  // Note: Client-side tracking will also fire when user returns from Stripe checkout
  // This server-side tracking ensures we capture conversions even if user doesn't return
  try {
    const { analytics } = await import("@/lib/analytics/events")
    // Get user to check if this is their first purchase
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user) {
      // Track subscription completion with transaction ID
      // Note: In a real implementation, you'd want to send this to a server-side analytics endpoint
      // For now, we log it - client-side tracking will handle the actual event firing
      console.log("[Analytics] Subscription completed:", {
        userId,
        plan,
        price: planPrice,
        transactionId: subscriptionId,
      })
    }
  } catch (error) {
    // Don't fail webhook if analytics fails
    console.error("[Webhook] Analytics tracking error:", error)
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const { prisma } = await import("@/lib/db")
  // Type assertion needed because Stripe SDK v20 types are strict
  const sub = subscription as any
  
  // Safely parse date fields, handling both timestamp numbers and potential undefined values
  const parseDate = (value: any): Date | null => {
    if (!value) return null
    const date = new Date(typeof value === 'number' ? value * 1000 : value)
    return isNaN(date.getTime()) ? null : date
  }
  
  const currentPeriodStart = parseDate(sub.current_period_start)
  const currentPeriodEnd = parseDate(sub.current_period_end)
  const trialStart = parseDate(sub.trial_start)
  const trialEnd = parseDate(sub.trial_end)
  
  // Build update data, only including valid dates
  const updateData: any = {
    status: subscription.status,
    cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
  }
  
  // Only include date fields if they are valid
  if (currentPeriodStart) updateData.currentPeriodStart = currentPeriodStart
  if (currentPeriodEnd) updateData.currentPeriodEnd = currentPeriodEnd
  if (trialStart !== undefined) updateData.trialStart = trialStart
  if (trialEnd !== undefined) updateData.trialEnd = trialEnd
  
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: updateData,
  })
  
  console.log("[Webhook] Subscription updated for:", subscription.id, "status:", subscription.status)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { prisma } = await import("@/lib/db")
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: "canceled",
    },
  })
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // Type assertion needed because Stripe SDK v20 types are strict
  const inv = invoice as any
  const subscriptionId = inv.subscription as string
  if (!subscriptionId) return

  const { prisma } = await import("@/lib/db")
  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  })

  if (!subscription) return

  await prisma.payment.create({
    data: {
      userId: subscription.userId,
      stripeInvoiceId: invoice.id,
      amount: inv.amount_paid / 100, // Convert from cents
      currency: invoice.currency,
      status: "succeeded",
      description: invoice.description || "Subscription payment",
    },
  })
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Type assertion needed because Stripe SDK v20 types are strict
  const inv = invoice as any
  const subscriptionId = inv.subscription as string
  if (!subscriptionId) return

  const { prisma } = await import("@/lib/db")
  await prisma.payment.create({
    data: {
      userId: (await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subscriptionId },
      }))?.userId || "",
      stripeInvoiceId: invoice.id,
      amount: inv.amount_due / 100,
      currency: invoice.currency,
      status: "failed",
      description: invoice.description || "Failed subscription payment",
    },
  })
}

// Disable body parsing for webhook route
export const runtime = "nodejs"
