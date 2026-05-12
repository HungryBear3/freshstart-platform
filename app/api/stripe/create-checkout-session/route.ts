import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import { stripe } from "@/lib/stripe/config"
import { getOrCreateStripeCustomer } from "@/lib/stripe/customer"

type CheckoutPlan = "annual" | "one_time" | "parenting_plan" | "refile_assistance"

const PRICE_ENV_BY_PLAN: Record<CheckoutPlan, string> = {
  annual: "ANNUAL_PRICE_ID",
  one_time: "ONE_TIME_PRICE_ID",
  parenting_plan: "PARENTING_PLAN_PRICE_ID",
  refile_assistance: "REFILE_PRICE_ID",
}

const ADDON_LABEL_BY_PLAN: Partial<Record<CheckoutPlan, string>> = {
  parenting_plan: "Parenting Plan Worksheet",
  refile_assistance: "Refile Assistance",
}

function isCheckoutPlan(plan: unknown): plan is CheckoutPlan {
  return plan === "annual" || plan === "one_time" || plan === "parenting_plan" || plan === "refile_assistance"
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user || !user.email) {
      console.error("[Checkout] Unauthorized - no user or email")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const requestedPlan = body.plan || "annual"
    if (!isCheckoutPlan(requestedPlan)) {
      return NextResponse.json({ error: "Unsupported checkout plan" }, { status: 400 })
    }

    const plan = requestedPlan
    const envName = PRICE_ENV_BY_PLAN[plan]
    const priceId = process.env[envName]
    const isSubscription = plan === "annual"
    const isAddon = plan === "parenting_plan" || plan === "refile_assistance"

    console.log("[Checkout] Creating session", {
      userId: user.id,
      plan,
      source: body.source || "unknown",
      priceConfigured: Boolean(priceId),
    })

    if (!priceId) {
      console.error(`[Checkout] ${envName} not configured`)
      return NextResponse.json(
        { error: "Price ID not configured. Please check server configuration." },
        { status: 500 }
      )
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("[Checkout] STRIPE_SECRET_KEY not set")
      return NextResponse.json(
        { error: "Stripe not configured. Please check server configuration." },
        { status: 500 }
      )
    }

    const customer = await getOrCreateStripeCustomer(user.id, user.email)
    console.log("[Checkout] Customer ready:", customer.id)

    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      const metadata = {
        userId: user.id,
        plan,
        source: typeof body.source === "string" ? body.source : "unknown",
        kind: isAddon ? "addon" : "plan",
        ...(isAddon ? { addon: plan, addonLabel: ADDON_LABEL_BY_PLAN[plan] || plan } : {}),
      }

      const sessionParams: any = {
        customer: customer.id,
        mode: isSubscription ? "subscription" : "payment",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${appUrl}/dashboard?success=true&plan=${encodeURIComponent(plan)}`,
        cancel_url: `${appUrl}/pricing?canceled=true&plan=${encodeURIComponent(plan)}`,
        metadata,
      }

      if (isSubscription) {
        sessionParams.subscription_data = {
          trial_period_days: 7,
          metadata,
        }
      }

      const session = await stripe.checkout.sessions.create(sessionParams)
      console.log("[Checkout] Session created successfully:", session.id)

      return NextResponse.json({
        sessionId: session.id,
        url: session.url,
      })
    } catch (stripeError: any) {
      console.error("[Checkout] Stripe API error:", stripeError)
      return NextResponse.json(
        {
          error: "Stripe error: " + (stripeError.message || "Failed to create checkout session"),
          details: stripeError.type || "unknown",
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
        details: error.message || "Unknown error",
      },
      { status: 500 }
    )
  }
}
