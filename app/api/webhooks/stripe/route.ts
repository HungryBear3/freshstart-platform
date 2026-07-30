import { createHash, randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { prisma } from "@/lib/db"
import { stripe } from "@/lib/stripe/config"
import { errorTracker } from "@/lib/monitoring/error-tracking"

const CLAIM_LEASE_MS = 5 * 60 * 1000
const CONVERTIBLE_LEGACY = ["canceled", "incomplete", "incomplete_expired"]
const BLOCKING_LEGACY = new Set(["active", "trialing", "past_due"])

async function acquireEventClaim(stripeEventId: string) {
  const token = randomUUID()
  const leaseExpiresAt = new Date(Date.now() + CLAIM_LEASE_MS)
  const existing = await prisma.stripeEvent.findUnique({ where: { stripeEventId } })
  if (existing?.status === "COMPLETED") return { state: "completed" as const }
  if (existing?.status === "PROCESSING" && existing.leaseExpiresAt && existing.leaseExpiresAt > new Date()) {
    return { state: "busy" as const }
  }

  if (!existing) {
    try {
      await prisma.stripeEvent.create({
        data: { stripeEventId, status: "PROCESSING", claimToken: token, leaseExpiresAt },
      })
      return { state: "acquired" as const, token }
    } catch (cause: any) {
      if (cause?.code !== "P2002") throw cause
      return acquireEventClaim(stripeEventId)
    }
  }

  const claimed = await prisma.stripeEvent.updateMany({
    where: { id: existing.id, status: existing.status, claimToken: existing.claimToken },
    data: { status: "PROCESSING", claimToken: token, leaseExpiresAt, lastError: null },
  })
  return claimed.count === 1 ? { state: "acquired" as const, token } : { state: "busy" as const }
}

async function renewEventClaim(stripeEventId: string, token: string) {
  const renewed = await prisma.stripeEvent.updateMany({
    where: {
      stripeEventId,
      status: "PROCESSING",
      claimToken: token,
      leaseExpiresAt: { gt: new Date() },
    },
    data: { leaseExpiresAt: new Date(Date.now() + CLAIM_LEASE_MS) },
  })
  if (renewed.count !== 1) throw new Error("Stripe event claim ownership was lost")
}

async function finishEvent(stripeEventId: string, token: string) {
  const finished = await prisma.stripeEvent.updateMany({
    where: {
      stripeEventId,
      status: "PROCESSING",
      claimToken: token,
      leaseExpiresAt: { gt: new Date() },
    },
    data: { status: "COMPLETED", processedAt: new Date(), claimToken: null, leaseExpiresAt: null, lastError: null },
  })
  if (finished.count !== 1) throw new Error("Stripe event completion lost its claim")
}

async function failEvent(stripeEventId: string, token: string, cause: unknown) {
  await prisma.stripeEvent.updateMany({
    where: { stripeEventId, status: "PROCESSING", claimToken: token },
    data: {
      status: "FAILED", claimToken: null, leaseExpiresAt: null,
      lastError: cause instanceof Error ? cause.message.slice(0, 1000) : "Unknown webhook failure",
    },
  })
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")
  let event: Stripe.Event
  try {
    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) throw new Error("Missing webhook configuration")
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (cause) {
    console.error("[Webhook] Signature verification failed:", cause)
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 })
  }

  const claim = await acquireEventClaim(event.id)
  if (claim.state === "completed") return NextResponse.json({ received: true, duplicate: true })
  if (claim.state === "busy") {
    return NextResponse.json({ error: "Webhook event is already processing" }, { status: 409 })
  }
  const token = claim.token

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, event.id, token)
        break
      case "checkout.session.expired":
        await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session, event.id, token)
        break
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await renewEventClaim(event.id, token)
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription, event.created)
        break
      case "customer.subscription.deleted":
        await renewEventClaim(event.id, token)
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, event.created)
        break
      case "invoice.payment_succeeded":
        await renewEventClaim(event.id, token)
        await handleInvoice(event.data.object as Stripe.Invoice, true)
        break
      case "invoice.payment_failed":
        await renewEventClaim(event.id, token)
        await handleInvoice(event.data.object as Stripe.Invoice, false)
        break
      case "charge.refunded":
        await handleChargeReversal(event.data.object as Stripe.Charge, "REFUNDED", event.id, token)
        break
      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute
        const charge = typeof dispute.charge === "string" ? await stripe.charges.retrieve(dispute.charge) : dispute.charge
        await handleChargeReversal(charge, "DISPUTED", event.id, token)
        break
      }
    }
    await finishEvent(event.id, token)
    return NextResponse.json({ received: true })
  } catch (cause) {
    console.error("[Webhook] Handler failed:", cause)
    await failEvent(event.id, token, cause)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, eventId: string, token: string) {
  // Structurally unrelated or not-yet-settled events are permanent non-actions, not retryable failures.
  if (session.payment_status !== "paid" || session.status !== "complete") return
  if (session.mode !== "payment") {
    await recordUnboundSettledSession(session, eventId, token)
    return
  }

  const obligationId = session.metadata?.obligationId
  if (!obligationId) {
    await recordUnboundSettledSession(session, eventId, token)
    return
  }
  const obligation = await prisma.checkoutObligation.findUnique({ where: { id: obligationId } })
  if (!obligation) {
    await recordUnboundSettledSession(session, eventId, token)
    return
  }

  const lines = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10 })
  const line = lines.data[0]
  const price = line?.price
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id
  const actualAmount = session.amount_total
  const actualCurrency = session.currency?.toLowerCase() ?? null
  const contractMismatch = [
    obligation.plan !== "one_time" && "plan",
    obligation.stripeSessionId !== session.id && "session",
    obligation.stripeCustomerId !== customerId && "customer",
    obligation.stripePriceId !== price?.id && "price",
    obligation.expectedAmountCents !== actualAmount && "amount",
    obligation.expectedCurrency !== actualCurrency && "currency",
    obligation.quantity !== line?.quantity && "quantity",
    price?.unit_amount !== obligation.expectedAmountCents && "unit amount",
    price?.currency?.toLowerCase() !== obligation.expectedCurrency && "line currency",
    price?.type !== "one_time" && "line price type",
    line?.amount_total !== obligation.expectedAmountCents && "line total",
    !paymentIntentId && "payment intent",
  ].filter(Boolean).join(", ")

  if (obligation.status === "PAID" && !contractMismatch) return
  if (obligation.status === "REVIEW_REQUIRED" && !contractMismatch) return
  const mismatch = [
    obligation.status !== "OPEN" && "obligation status",
    contractMismatch,
  ].filter(Boolean).join(", ")

  if (mismatch) {
    await renewEventClaim(eventId, token)
    await prisma.payment.upsert({
      where: { stripeCheckoutSessionId: session.id },
      create: {
        userId: obligation.userId,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: paymentIntentId ?? null,
        stripePriceId: price?.id ?? null,
        amount: (actualAmount ?? 0) / 100,
        currency: actualCurrency ?? "unknown",
        status: "review_required",
        description: `Settled checkout contract mismatch: ${mismatch}`,
      },
      update: {},
    })
    const exactReview = await prisma.checkoutObligation.updateMany({
      where: { id: obligation.id, stripeSessionId: session.id, status: "OPEN" },
      data: {
        status: "REVIEW_REQUIRED", settledAmountCents: actualAmount,
        settledCurrency: actualCurrency, settledAt: new Date(),
        stripePaymentIntentId: paymentIntentId ?? null, failureReason: `Settled contract mismatch: ${mismatch}`,
      },
    })
    const unboundReview = await prisma.checkoutObligation.updateMany({
      where: { id: obligation.id, stripeSessionId: null, status: "PENDING" },
      data: {
        status: "REVIEW_REQUIRED",
        stripeSessionId: session.id,
        settledAmountCents: actualAmount,
        settledCurrency: actualCurrency,
        settledAt: new Date(),
        stripePaymentIntentId: paymentIntentId ?? null,
        failureReason: `Settled checkout was not locally session-bound: ${mismatch}`,
      },
    })
    if (exactReview.count + unboundReview.count === 0) {
      const latest = await prisma.checkoutObligation.findFirst({
        where: { userId: obligation.userId, plan: obligation.plan },
        orderBy: [{ cycle: "desc" }, { createdAt: "desc" }],
        select: { cycle: true },
      })
      const contractKey = createHash("sha256").update(`settled-mismatch:${session.id}`).digest("hex")
      await prisma.checkoutObligation.upsert({
        where: { contractKey },
        update: {},
        create: {
          contractKey,
          userId: obligation.userId,
          plan: obligation.plan,
          cycle: (latest?.cycle ?? obligation.cycle) + 1,
          status: "REVIEW_REQUIRED",
          stripeCustomerId: customerId ?? obligation.stripeCustomerId,
          stripeSessionId: session.id,
          stripePaymentIntentId: paymentIntentId ?? null,
          stripePriceId: price?.id ?? obligation.stripePriceId,
          expectedAmountCents: actualAmount ?? obligation.expectedAmountCents,
          expectedCurrency: actualCurrency ?? obligation.expectedCurrency,
          quantity: line?.quantity ?? obligation.quantity,
          settledAmountCents: actualAmount,
          settledCurrency: actualCurrency,
          settledAt: new Date(),
          failureReason: `Settled payment could not transition its original obligation: ${mismatch}`,
        },
      })
    }
    errorTracker.captureError(new Error("Paid Checkout Session requires manual review"), {
      eventId,
      sessionId: session.id,
      obligationId: obligation.id,
      userId: obligation.userId,
      mismatch,
      exactReviewCount: exactReview.count,
      unboundReviewCount: unboundReview.count,
    })
    return
  }

  await renewEventClaim(eventId, token)
  await prisma.$transaction(async (tx) => {
    const existing = await tx.subscription.findUnique({ where: { userId: obligation.userId } })
    if (existing?.plan !== "one_time" && existing && BLOCKING_LEGACY.has(existing.status)) {
      throw new Error("Active historical subscription blocks one-time conversion")
    }

    const priorReversal = await tx.paymentReversal.findUnique({
      where: { stripePaymentIntentId: paymentIntentId! },
    })
    if (priorReversal) {
      const blocked = await tx.checkoutObligation.updateMany({
        where: { id: obligation.id, status: "OPEN", stripeSessionId: session.id },
        data: {
          status: priorReversal.status,
          settledAmountCents: actualAmount,
          settledCurrency: actualCurrency,
          settledAt: new Date(),
          stripePaymentIntentId: paymentIntentId!,
          failureReason: "Payment reversal arrived before checkout settlement; access was not granted",
        },
      })
      if (blocked.count !== 1) throw new Error("Pre-settlement reversal CAS failed")
      await tx.payment.upsert({
        where: { stripeCheckoutSessionId: session.id },
        create: {
          userId: obligation.userId,
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId: paymentIntentId!,
          stripePriceId: obligation.stripePriceId,
          amount: obligation.expectedAmountCents / 100,
          currency: obligation.expectedCurrency,
          status: priorReversal.status === "REFUNDED" ? "refunded" : priorReversal.status === "DISPUTED" ? "disputed" : "review_required",
          description: "FreshStart IL reversed payment; access not granted",
        },
        update: {},
      })
      return
    }

    const paid = await tx.checkoutObligation.updateMany({
      where: {
        id: obligation.id, status: "OPEN", stripeSessionId: session.id,
        stripeCustomerId: customerId!, stripePriceId: price!.id,
        expectedAmountCents: actualAmount!, expectedCurrency: actualCurrency!, quantity: line!.quantity!,
      },
      data: {
        status: "PAID", settledAmountCents: actualAmount, settledCurrency: actualCurrency,
        settledAt: new Date(), stripePaymentIntentId: paymentIntentId ?? null, failureReason: null,
      },
    })
    if (paid.count !== 1) throw new Error("One-time obligation settlement CAS failed")

    const now = new Date()
    const accessEnds = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000) // grant 60 days of access
    const accessData = {
      stripeCustomerId: customerId!, stripeSubscriptionId: null, stripePriceId: obligation.stripePriceId,
      status: "active", plan: "one_time", currentPeriodStart: now, currentPeriodEnd: accessEnds,
      cancelAtPeriodEnd: false, trialStart: null, trialEnd: null, grantingObligationId: obligation.id,
    }
    if (!existing) {
      await tx.subscription.create({ data: { userId: obligation.userId, ...accessData } })
    } else if (existing.plan === "one_time") {
      const changed = await tx.subscription.updateMany({ where: { id: existing.id, plan: "one_time" }, data: accessData })
      if (changed.count !== 1) throw new Error("One-time access update CAS failed")
    } else {
      const changed = await tx.subscription.updateMany({
        where: { id: existing.id, plan: { not: "one_time" }, status: { in: CONVERTIBLE_LEGACY } },
        data: accessData,
      })
      if (changed.count !== 1) throw new Error("Legacy subscription conversion CAS failed")
    }

    await tx.payment.upsert({
      where: { stripeCheckoutSessionId: session.id },
      create: {
        userId: obligation.userId, stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: paymentIntentId ?? null, stripePriceId: obligation.stripePriceId,
        amount: obligation.expectedAmountCents / 100, currency: obligation.expectedCurrency,
        status: "succeeded", description: "FreshStart IL 60-day service access",
      },
      update: {},
    })
  }, { isolationLevel: "Serializable" })
}

async function recordUnboundSettledSession(session: Stripe.Checkout.Session, eventId: string, token: string) {
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id
  if (!customerId) throw new Error("Settled Checkout Session has no Stripe customer binding")
  const sessionBinding = await prisma.checkoutObligation.findUnique({ where: { stripeSessionId: session.id } })
  if (sessionBinding?.stripeCustomerId !== undefined && sessionBinding.stripeCustomerId !== customerId) {
    throw new Error("Settled Checkout Session customer conflicts with its durable obligation")
  }
  const customerBinding = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
    select: { userId: true },
  })
  if (sessionBinding && customerBinding?.userId && customerBinding.userId !== sessionBinding.userId) {
    throw new Error("Settled Checkout Session obligation conflicts with local customer ownership")
  }
  const userId = sessionBinding?.userId ?? customerBinding?.userId
  if (!userId) throw new Error("Settled Checkout Session customer is not bound to a local user")
  if (session.metadata?.userId && session.metadata.userId !== userId) {
    throw new Error("Settled Checkout Session metadata user conflicts with durable customer ownership")
  }
  errorTracker.captureError(new Error("Settled Checkout Session has no durable obligation binding"), {
    sessionId: session.id,
    userId: userId ?? "unknown",
    mode: session.mode,
  })
  if (!userId) throw new Error("Settled Checkout Session cannot be bound to a local user")
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!user) throw new Error("Settled Checkout Session references an unknown local user")
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id
  const lines = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10 })
  const line = lines.data[0]
  const priceId = line?.price?.id
  const currency = session.currency?.toLowerCase() ?? "unknown"
  await renewEventClaim(eventId, token)
  await prisma.$transaction(async (tx) => {
    await tx.payment.upsert({
      where: { stripeCheckoutSessionId: session.id },
      create: {
        userId,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: paymentIntentId ?? null,
        stripePriceId: priceId ?? null,
        amount: (session.amount_total ?? 0) / 100,
        currency,
        status: "review_required",
        description: "Settled pre-cutover checkout requires manual access review",
      },
      update: {},
    })
    if (!priceId || session.amount_total == null || !line?.quantity) {
      throw new Error("Settled Checkout Session lacks evidence required for an actionable recovery obligation")
    }
    const existingBinding = await tx.checkoutObligation.findUnique({ where: { stripeSessionId: session.id } })
    if (existingBinding) {
      if (
        existingBinding.userId !== userId
        || existingBinding.stripeCustomerId !== customerId
        || existingBinding.stripePriceId !== priceId
        || existingBinding.expectedAmountCents !== session.amount_total
        || existingBinding.expectedCurrency.toLowerCase() !== currency
        || existingBinding.quantity !== line.quantity
      ) {
        throw new Error("Existing Checkout Session obligation conflicts with settled provider evidence")
      }
      if (["OPEN", "PENDING"].includes(existingBinding.status)) {
        const promoted = await tx.checkoutObligation.updateMany({
          where: { id: existingBinding.id, status: { in: ["OPEN", "PENDING"] }, stripeSessionId: session.id, userId },
          data: {
            status: "REVIEW_REQUIRED",
            stripePaymentIntentId: paymentIntentId ?? null,
            settledAmountCents: session.amount_total,
            settledCurrency: currency,
            settledAt: new Date(),
            failureReason: "Settled pre-cutover payment requires manual access reconciliation",
          },
        })
        if (promoted.count !== 1) throw new Error("Concurrent obligation transition requires provider retry")
      }
      return
    }
    const recoveryPlan = session.mode === "subscription" ? `legacy_${session.metadata?.plan ?? "subscription"}` : "one_time"
    const latest = await tx.checkoutObligation.findFirst({
      where: { userId, plan: recoveryPlan, stripePriceId: priceId },
      orderBy: [{ cycle: "desc" }, { createdAt: "desc" }],
      select: { cycle: true },
    })
    const contractKey = createHash("sha256").update(`precutover:${session.id}`).digest("hex")
    await tx.checkoutObligation.upsert({
      where: { contractKey },
      update: {},
      create: {
        contractKey,
        userId,
        plan: recoveryPlan,
        cycle: (latest?.cycle ?? 0) + 1,
        status: "REVIEW_REQUIRED",
        stripeCustomerId: customerId,
        stripeSessionId: session.id,
        stripePaymentIntentId: paymentIntentId ?? null,
        stripePriceId: priceId,
        expectedAmountCents: session.amount_total,
        expectedCurrency: currency,
        quantity: line.quantity,
        settledAmountCents: session.amount_total,
        settledCurrency: currency,
        settledAt: new Date(),
        failureReason: `${session.mode === "subscription" ? "Legacy subscription" : "Pre-cutover one-time"} payment requires manual access reconciliation`,
      },
    })
  })
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session, eventId: string, token: string) {
  const obligationId = session.metadata?.obligationId
  if (!obligationId) return
  await renewEventClaim(eventId, token)
  await prisma.checkoutObligation.updateMany({
    where: { id: obligationId, stripeSessionId: session.id, status: "OPEN" },
    data: { stripeSessionId: null, status: "PENDING", attempt: { increment: 1 } },
  })
}

async function handleChargeReversal(
  charge: Stripe.Charge,
  status: "REFUNDED" | "DISPUTED",
  eventId: string,
  token: string,
) {
  const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id
  if (!paymentIntentId) return
  const isPartialRefund = status === "REFUNDED"
    && (!charge.refunded || charge.amount_refunded < charge.amount)
  await renewEventClaim(eventId, token)
  await prisma.$transaction(async (tx) => {
    const obligation = await tx.checkoutObligation.findUnique({ where: { stripePaymentIntentId: paymentIntentId } })
    if (!obligation) {
      const durableStatus = isPartialRefund ? "REVIEW_REQUIRED" : status
      const existing = await tx.paymentReversal.findUnique({ where: { stripePaymentIntentId: paymentIntentId } })
      if (!existing) {
        await tx.paymentReversal.create({
          data: {
            stripePaymentIntentId: paymentIntentId,
            stripeEventId: eventId,
            status: durableStatus,
            amountCents: charge.amount,
            amountReversedCents: charge.amount_refunded,
          },
        })
      } else if (existing.status === "REVIEW_REQUIRED" && durableStatus !== "REVIEW_REQUIRED") {
        await tx.paymentReversal.updateMany({
          where: { id: existing.id, status: "REVIEW_REQUIRED" },
          data: {
            stripeEventId: eventId,
            status: durableStatus,
            amountCents: charge.amount,
            amountReversedCents: charge.amount_refunded,
          },
        })
      }
      if (!isPartialRefund) {
        const customerId = typeof charge.customer === "string" ? charge.customer : charge.customer?.id
        if (customerId) {
          await tx.subscription.updateMany({
            where: {
              plan: "one_time",
              stripeSubscriptionId: paymentIntentId,
              stripeCustomerId: customerId,
              grantingObligationId: null,
            },
            data: { status: "canceled", currentPeriodEnd: new Date() },
          })
        }
      }
      errorTracker.captureError(new Error("Payment reversal arrived before checkout settlement"), {
        eventId, paymentIntentId, status: durableStatus,
      })
      return
    }
    if (isPartialRefund) {
      const flagged = await tx.checkoutObligation.updateMany({
        where: { id: obligation.id, stripePaymentIntentId: paymentIntentId, status: "PAID" },
        data: { status: "REVIEW_REQUIRED", failureReason: "Stripe charge partially refunded; manual access review required" },
      })
      if (flagged.count === 1) {
        await tx.payment.updateMany({
          where: { stripePaymentIntentId: paymentIntentId },
          data: { status: "review_required" },
        })
      }
      errorTracker.captureError(new Error("Partial refund requires manual access review"), {
        eventId, obligationId: obligation.id, paymentIntentId,
        amount: charge.amount, amountRefunded: charge.amount_refunded,
      })
      return
    }
    const reversed = await tx.checkoutObligation.updateMany({
      where: { id: obligation.id, stripePaymentIntentId: paymentIntentId, status: { in: ["PAID", "REVIEW_REQUIRED"] } },
      data: { status, failureReason: status === "REFUNDED" ? "Stripe charge refunded" : "Stripe dispute opened" },
    })
    if (reversed.count === 0) return
    const now = new Date()
    await tx.subscription.updateMany({
      where: {
        userId: obligation.userId,
        plan: "one_time",
        stripeCustomerId: obligation.stripeCustomerId,
        grantingObligationId: obligation.id,
      },
      data: { status: "canceled", currentPeriodEnd: now },
    })
    await tx.payment.updateMany({
      where: { stripePaymentIntentId: paymentIntentId },
      data: { status: status === "REFUNDED" ? "refunded" : "disputed" },
    })
  }, { isolationLevel: "Serializable" })
}

function eventDate(created: number) {
  return new Date(created * 1000)
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription, created: number) {
  const sub = subscription as any
  const date = eventDate(created)
  await prisma.subscription.updateMany({
    where: {
      plan: { not: "one_time" }, stripeSubscriptionId: subscription.id,
      stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
      status: { not: "canceled" },
      OR: [{ providerEventCreatedAt: null }, { providerEventCreatedAt: { lt: date } }],
    },
    data: {
      status: subscription.status, cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
      currentPeriodStart: sub.current_period_start ? new Date(sub.current_period_start * 1000) : undefined,
      currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : undefined,
      trialStart: sub.trial_start ? new Date(sub.trial_start * 1000) : null,
      trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
      providerEventCreatedAt: date,
    },
  })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, created: number) {
  const date = eventDate(created)
  await prisma.subscription.updateMany({
    where: {
      plan: { not: "one_time" }, stripeSubscriptionId: subscription.id,
      stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
      OR: [{ providerEventCreatedAt: null }, { providerEventCreatedAt: { lte: date } }],
    },
    data: { status: "canceled", providerEventCreatedAt: date },
  })
}

async function handleInvoice(invoice: Stripe.Invoice, succeeded: boolean) {
  const inv = invoice as any
  const subscriptionId = typeof inv.subscription === "string" ? inv.subscription : inv.subscription?.id
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id
  if (!subscriptionId || !customerId) return
  const subscription = await prisma.subscription.findFirst({
    where: { plan: { not: "one_time" }, stripeSubscriptionId: subscriptionId, stripeCustomerId: customerId },
  })
  if (!subscription) return
  await prisma.payment.upsert({
    where: { stripeInvoiceId: invoice.id },
    create: {
      userId: subscription.userId, stripeInvoiceId: invoice.id,
      amount: (succeeded ? inv.amount_paid : inv.amount_due) / 100,
      currency: invoice.currency, status: succeeded ? "succeeded" : "failed",
      description: invoice.description || (succeeded ? "Subscription payment" : "Failed subscription payment"),
    },
    update: succeeded ? {
      amount: inv.amount_paid / 100,
      currency: invoice.currency,
      status: "succeeded",
      description: invoice.description || "Subscription payment",
    } : {},
  })
}

export const runtime = "nodejs"
