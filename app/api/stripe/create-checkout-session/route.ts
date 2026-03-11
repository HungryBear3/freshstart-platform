import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import { stripe } from "@/lib/stripe/config"
import { getOrCreateStripeCustomer } from "@/lib/stripe/customer"

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getCurrentUser(request)
    if (!user || !user.email) {
      console.error("[Checkout] Unauthorized - no user or email")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[Checkout] Creating session for user:", user.id, user.email)
    console.log("[Checkout] Environment check - ANNUAL_PRICE_ID:", process.env.ANNUAL_PRICE_ID ? `set (${process.env.ANNUAL_PRICE_ID.substring(0, 20)}...)` : "MISSING")
    console.log("[Checkout] All env vars:", Object.keys(process.env).filter(k => k.includes("STRIPE") || k.includes("PRICE")).join(", "))

    // Get plan from request body (default to annual)
    const body = await request.json()
    const plan = body.plan || "annual"
    const priceId = plan === "annual" 
      ? process.env.ANNUAL_PRICE_ID 
      : process.env.MONTHLY_PRICE_ID

    console.log("[Checkout] Plan:", plan, "Price ID:", priceId ? `${priceId.substring(0, 20)}...` : "NOT FOUND")

    if (!priceId) {
      console.error("[Checkout] Price ID not configured. ANNUAL_PRICE_ID:", process.env.ANNUAL_PRICE_ID ? "set" : "missing")
      console.error("[Checkout] Available env vars with 'PRICE':", Object.keys(process.env).filter(k => k.includes("PRICE")))
      return NextResponse.json(
        { error: "Price ID not configured. Please check server configuration." },
        { status: 500 }
      )
    }

    console.log("[Checkout] Using price ID:", priceId)

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("[Checkout] STRIPE_SECRET_KEY not set")
      return NextResponse.json(
        { error: "Stripe not configured. Please check server configuration." },
        { status: 500 }
      )
    }

    // Get or create Stripe customer
    const customer = await getOrCreateStripeCustomer(user.id, user.email)
    console.log("[Checkout] Customer created/retrieved:", customer.id)

    // Create checkout session
    try {
      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pricing?canceled=true`,
        metadata: {
          userId: user.id,
          plan,
        },
        subscription_data: {
          trial_period_days: 7, // 7-day free trial
          metadata: {
            userId: user.id,
            plan,
          },
        },
      })

      console.log("[Checkout] Session created successfully:", session.id)
      // Return both sessionId and url for compatibility
      // The url is what we'll use for the redirect
      return NextResponse.json({ 
        sessionId: session.id,
        url: session.url 
      })
    } catch (stripeError: any) {
      console.error("[Checkout] Stripe API error:", stripeError)
      return NextResponse.json(
        { 
          error: "Stripe error: " + (stripeError.message || "Failed to create checkout session"),
          details: stripeError.type || "unknown"
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("[Checkout] Unexpected error:", error)
    console.error("[Checkout] Error stack:", error.stack)
    return NextResponse.json(
      { 
        error: "Failed to create checkout session",
        details: error.message || "Unknown error"
      },
      { status: 500 }
    )
  }
}
