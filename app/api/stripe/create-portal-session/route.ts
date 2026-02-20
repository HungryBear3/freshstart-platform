import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import { stripe } from "@/lib/stripe/config"
import { prisma } from "@/lib/db"

// Get the app URL - check multiple possible env vars
function getAppUrl(): string {
  // Try various env var names that might be set
  const url = process.env.NEXT_PUBLIC_APP_URL 
    || process.env.APP_URL 
    || process.env.NEXTAUTH_URL
    || process.env.VERCEL_URL
    || "http://localhost:3000"
  
  // VERCEL_URL doesn't include protocol
  if (url.startsWith("http")) {
    return url
  }
  return `https://${url}`
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
      select: { stripeCustomerId: true },
    })

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      )
    }

    const returnUrl = `${getAppUrl()}/dashboard`
    console.log("[Portal] Return URL:", returnUrl)

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: returnUrl,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Stripe portal error:", error)
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    )
  }
}
