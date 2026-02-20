import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import { stripe } from "@/lib/stripe/config"
import Stripe from "stripe"

export const runtime = "nodejs"

/**
 * Manual sync endpoint to sync subscription from Stripe to database
 * This is useful if the webhook didn't process correctly
 * 
 * Usage: POST /api/stripe/sync-subscription or GET /api/stripe/sync-subscription
 * Body (for POST): { subscriptionId?: string } (optional - if not provided, will find latest subscription for user)
 */
async function syncSubscription(user: any, subscriptionId?: string) {
  // Lazy import Prisma
  const { prisma } = await import("@/lib/db")

  let subscription: Stripe.Subscription

  if (subscriptionId) {
    // Handle session IDs (si_) - extract subscription from checkout session
    if (subscriptionId.startsWith("si_")) {
      console.log("[Sync Subscription] Detected session ID, retrieving checkout session:", subscriptionId)
      try {
        const session = await stripe.checkout.sessions.retrieve(subscriptionId)
        const actualSubscriptionId = typeof session.subscription === "string" 
          ? session.subscription 
          : session.subscription?.id
        
        if (!actualSubscriptionId) {
          return NextResponse.json(
            { error: "Checkout session does not have an associated subscription yet" },
            { status: 404 }
          )
        }
        
        console.log("[Sync Subscription] Found subscription ID from session:", actualSubscriptionId)
        subscriptionId = actualSubscriptionId
      } catch (error: any) {
        return NextResponse.json(
          { error: `Failed to retrieve checkout session: ${error.message}` },
          { status: 400 }
        )
      }
    }
    
    // Get specific subscription
    const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId)
    subscription = subscriptionResponse as any as Stripe.Subscription
  } else {
    // Find customer by email
    console.log("[Sync Subscription] Looking for customer with email:", user.email)
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 10, // Increase limit to see all matches
    })

    console.log("[Sync Subscription] Found customers:", customers.data.length, customers.data.map(c => ({ id: c.id, email: c.email })))

    if (customers.data.length === 0) {
      // Try to find by searching all customers (in case email doesn't match exactly)
      const allCustomers = await stripe.customers.list({
        limit: 100,
      })
      const matchingCustomer = allCustomers.data.find(c => 
        c.email?.toLowerCase() === user.email.toLowerCase()
      )
      
      if (!matchingCustomer) {
        return NextResponse.json(
          { 
            error: "No Stripe customer found for this user",
            details: `Searched for email: ${user.email}. Check that the email in your account matches the email used in Stripe checkout.`
          },
          { status: 404 }
        )
      }
      
      const customer = matchingCustomer
      console.log("[Sync Subscription] Found customer via broad search:", customer.id, customer.email)

      // Get subscriptions for this customer
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        limit: 10,
        status: "all",
      })

      console.log("[Sync Subscription] Found subscriptions:", subscriptions.data.length, subscriptions.data.map(s => ({ id: s.id, status: (s as any).status })))

      if (subscriptions.data.length === 0) {
        return NextResponse.json(
          { 
            error: "No subscription found for this customer",
            details: `Customer found (${customer.id}) but no subscriptions. Make sure you completed the checkout process in Stripe.`,
            customerId: customer.id
          },
          { status: 404 }
        )
      }

      subscription = subscriptions.data[0] as any as Stripe.Subscription
    } else {
      const customer = customers.data[0]
      console.log("[Sync Subscription] Using customer:", customer.id, customer.email)

      // Get subscriptions for this customer
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        limit: 10,
        status: "all",
      })

      console.log("[Sync Subscription] Found subscriptions:", subscriptions.data.length, subscriptions.data.map(s => ({ id: s.id, status: (s as any).status })))

      if (subscriptions.data.length === 0) {
        return NextResponse.json(
          { 
            error: "No subscription found for this customer",
            details: `Customer found (${customer.id}) but no subscriptions. Make sure you completed the checkout process in Stripe.`,
            customerId: customer.id,
            userEmail: user.email
          },
          { status: 404 }
        )
      }

      subscription = subscriptions.data[0] as any as Stripe.Subscription
    }
  }

  // Convert subscription to our format
  const sub = subscription as any

  // Get the customer ID
  const customerId = typeof subscription.customer === "string" 
    ? subscription.customer 
    : subscription.customer.id

  // Upsert subscription record
  const dbSubscription = await prisma.subscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]?.price.id,
      status: subscription.status,
      plan: "annual", // Default, can be updated based on price ID
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      trialStart: sub.trial_start ? new Date(sub.trial_start * 1000) : null,
      trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
    },
    update: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]?.price.id,
      status: subscription.status,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      trialStart: sub.trial_start ? new Date(sub.trial_start * 1000) : null,
      trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
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
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const subscriptionId = body.subscriptionId

    return syncSubscription(user, subscriptionId)
  } catch (error: any) {
    console.error("[Sync Subscription] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to sync subscription" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return syncSubscription(user)
  } catch (error: any) {
    console.error("[Sync Subscription] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to sync subscription" },
      { status: 500 }
    )
  }
}
