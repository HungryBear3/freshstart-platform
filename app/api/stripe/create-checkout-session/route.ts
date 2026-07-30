import { createHash } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { stripe } from "@/lib/stripe/config"

const ONE_TIME_AMOUNT_CENTS = 14_900
const ONE_TIME_CURRENCY = "usd"
const BLOCKING_LEGACY_STATUSES = new Set(["active", "trialing", "past_due"])
const TERMINAL_OBLIGATION_STATUSES = new Set(["PAID", "REFUNDED", "DISPUTED", "REJECTED"])

function contractKey(userId: string, priceId: string, cycle: number) {
  return createHash("sha256")
    .update(`freshstart:one_time:v2:${userId}:${priceId}:${ONE_TIME_AMOUNT_CENTS}:${ONE_TIME_CURRENCY}:1:${cycle}`)
    .digest("hex")
}

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function hasCurrentOneTimeAccess(subscription: Awaited<ReturnType<typeof prisma.subscription.findUnique>>) {
  if (!subscription || subscription.plan !== "one_time") return false
  if (!BLOCKING_LEGACY_STATUSES.has(subscription.status)) return false
  return Boolean(subscription.currentPeriodEnd && subscription.currentPeriodEnd.getTime() > Date.now())
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user?.email) return error("Unauthorized", 401)

  let body: Record<string, unknown>
  try {
    const parsed = await request.json()
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return error("Invalid JSON body", 400)
    }
    body = parsed as Record<string, unknown>
  } catch {
    return error("Invalid JSON body", 400)
  }

  const requestedPlan = Object.prototype.hasOwnProperty.call(body, "plan") ? body.plan : "one_time"
  if (requestedPlan === "parenting_plan" || requestedPlan === "refile_assistance") {
    return error("Add-on checkout is unavailable until fulfillment is supported", 409)
  }
  if (requestedPlan !== "one_time") return error("Unsupported checkout plan", 400)

  const priceId = process.env.ONE_TIME_PRICE_ID
  if (!process.env.STRIPE_SECRET_KEY || !priceId) return error("Checkout is not configured", 500)

  try {
    const price = await stripe.prices.retrieve(priceId)
    if (
      !price.active ||
      price.type !== "one_time" ||
      price.unit_amount !== ONE_TIME_AMOUNT_CENTS ||
      price.currency.toLowerCase() !== ONE_TIME_CURRENCY
    ) {
      throw new Error("Configured Price must be an active fixed $149.00 USD one-time Price")
    }

    const prepared = await prisma.$transaction(async (tx) => {
      const legacy = await tx.subscription.findUnique({ where: { userId: user.id } })
      if (legacy && legacy.plan !== "one_time" && BLOCKING_LEGACY_STATUSES.has(legacy.status)) {
        return { ok: false as const, message: "An existing subscription must be resolved before one-time checkout" }
      }
      if (hasCurrentOneTimeAccess(legacy)) {
        return { ok: false as const, message: "Your current 60-day access period is still active" }
      }
      const unresolvedReview = await tx.checkoutObligation.findFirst({
        where: { userId: user.id, status: "REVIEW_REQUIRED" },
        orderBy: { createdAt: "desc" },
      })
      if (unresolvedReview) {
        return { ok: false as const, message: "Your payment is under manual review. Support has been notified; contact support@freshstart-il.com if you need help." }
      }

      const latest = await tx.checkoutObligation.findFirst({
        where: { userId: user.id, plan: "one_time", stripePriceId: price.id },
        orderBy: { cycle: "desc" },
      })
      const cycle = latest && TERMINAL_OBLIGATION_STATUSES.has(latest.status) ? latest.cycle + 1 : (latest?.cycle ?? 1)
      const key = latest && !TERMINAL_OBLIGATION_STATUSES.has(latest.status)
        ? latest.contractKey
        : contractKey(user.id, price.id, cycle)
      const obligation = await tx.checkoutObligation.upsert({
        where: { contractKey: key },
        create: {
          contractKey: key,
          userId: user.id,
          plan: "one_time",
          cycle,
          stripeCustomerId: null,
          stripePriceId: price.id,
          expectedAmountCents: ONE_TIME_AMOUNT_CENTS,
          expectedCurrency: ONE_TIME_CURRENCY,
          quantity: 1,
          attempt: 1,
          status: "PENDING",
        },
        update: {},
      })
      return { ok: true as const, legacy, cycle, obligation }
    }, { isolationLevel: "Serializable" })
    if (!prepared.ok) return error(prepared.message, 409)
    const { legacy, cycle } = prepared
    let obligation = prepared.obligation

    const exactCoreContract =
      obligation.userId === user.id &&
      obligation.plan === "one_time" &&
      obligation.cycle === cycle &&
      obligation.stripePriceId === price.id &&
      obligation.expectedAmountCents === ONE_TIME_AMOUNT_CENTS &&
      obligation.expectedCurrency === ONE_TIME_CURRENCY &&
      obligation.quantity === 1
    if (!exactCoreContract) throw new Error("Existing checkout obligation conflicts with this request")
    if (obligation.status === "PAID") return error("This checkout is already paid", 409)
    if (obligation.status === "REVIEW_REQUIRED") {
      return error("Your payment is under manual review. Support has been notified; contact support@freshstart-il.com if you need help.", 409)
    }

    let customerId = obligation.stripeCustomerId
    if (!customerId && legacy?.stripeCustomerId) {
      const candidate = await stripe.customers.retrieve(legacy.stripeCustomerId)
      if (!("deleted" in candidate && candidate.deleted) && candidate.id === legacy.stripeCustomerId) {
        const rebound = await prisma.checkoutObligation.updateMany({
          where: { id: obligation.id, stripeCustomerId: null, status: "PENDING" },
          data: { stripeCustomerId: candidate.id },
        })
        if (rebound.count === 1) {
          customerId = candidate.id
          obligation = { ...obligation, stripeCustomerId: candidate.id }
        }
      }
    }

    if (customerId) {
      const existingCustomer = await stripe.customers.retrieve(customerId)
      if (("deleted" in existingCustomer && existingCustomer.deleted) || existingCustomer.id !== customerId) {
        throw new Error("Bound Stripe Customer is unavailable")
      }
    } else {
      const customer = await stripe.customers.create(
        { email: user.email, metadata: { userId: user.id, obligationId: obligation.id } },
        { idempotencyKey: `${obligation.contractKey}:customer` },
      )
      const boundCustomer = await prisma.checkoutObligation.updateMany({
        where: { id: obligation.id, stripeCustomerId: null, status: "PENDING" },
        data: { stripeCustomerId: customer.id },
      })
      if (boundCustomer.count !== 1) {
        const winner = await prisma.checkoutObligation.findUnique({ where: { id: obligation.id } })
        if (winner?.stripeCustomerId !== customer.id) throw new Error("Failed to bind the exact Stripe Customer")
        obligation = winner
      } else {
        obligation = { ...obligation, stripeCustomerId: customer.id }
      }
      customerId = obligation.stripeCustomerId
    }
    if (!customerId) throw new Error("Checkout obligation has no bound Stripe Customer")

    if (obligation.stripeSessionId) {
      const existing = await stripe.checkout.sessions.retrieve(obligation.stripeSessionId)
      const existingCustomerId = typeof existing.customer === "string" ? existing.customer : existing.customer?.id
      if (existing.id !== obligation.stripeSessionId || existingCustomerId !== customerId) {
        throw new Error("Bound Checkout Session conflicts with the obligation")
      }
      if (existing.status === "open" && existing.url) {
        return NextResponse.json({ sessionId: existing.id, url: existing.url, reused: true })
      }
      if (existing.status !== "expired") {
        return error("Payment confirmation is still processing. Refresh your dashboard shortly.", 409)
      }

      const released = await prisma.checkoutObligation.updateMany({
        where: { id: obligation.id, stripeSessionId: existing.id, status: "OPEN", attempt: obligation.attempt },
        data: { stripeSessionId: null, status: "PENDING", attempt: { increment: 1 } },
      })
      if (released.count !== 1) throw new Error("Expired Checkout Session recovery lost its compare-and-swap")
      const recovered = await prisma.checkoutObligation.findUnique({ where: { id: obligation.id } })
      if (!recovered || recovered.status !== "PENDING" || recovered.stripeSessionId) {
        throw new Error("Expired Checkout Session recovery produced an invalid obligation")
      }
      obligation = recovered
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "")
    const session = await stripe.checkout.sessions.create(
      {
        customer: customerId,
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [{ price: price.id, quantity: 1 }],
        success_url: `${appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/pricing?canceled=true`,
        metadata: { obligationId: obligation.id },
      },
      { idempotencyKey: `${obligation.contractKey}:${obligation.attempt}` },
    )
    if (!session.url) throw new Error("Stripe returned a Checkout Session without a URL")

    const bound = await prisma.checkoutObligation.updateMany({
      where: { id: obligation.id, stripeCustomerId: customerId, stripeSessionId: null, status: "PENDING", attempt: obligation.attempt },
      data: { stripeSessionId: session.id, status: "OPEN" },
    })
    if (bound.count !== 1) {
      const winner = await prisma.checkoutObligation.findUnique({ where: { id: obligation.id } })
      if (winner?.stripeSessionId === session.id && winner.status === "OPEN") {
        return NextResponse.json({ sessionId: session.id, url: session.url, reused: true })
      }
      throw new Error("Failed to bind the exact Checkout Session")
    }

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (cause) {
    console.error("[Checkout] Failed closed:", cause)
    return error("Unable to create a verified checkout", 500)
  }
}
