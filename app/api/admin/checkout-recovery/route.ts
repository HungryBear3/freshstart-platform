import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { prisma } from "@/lib/db"
import { stripe } from "@/lib/stripe/config"

const ACCESS_MS = 60 * 24 * 60 * 60 * 1000
const CONVERTIBLE_LEGACY = ["canceled", "incomplete", "incomplete_expired"]

class RecoveryConflict extends Error {}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function objectId(value: unknown): string | null {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && "id" in value && typeof value.id === "string") return value.id
  return null
}

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request)
  if (error) return error

  const obligationId = request.nextUrl.searchParams.get("obligationId")
  if (obligationId) {
    const obligation = await prisma.checkoutObligation.findUnique({
      where: { id: obligationId },
      include: { recoveryAudits: { orderBy: { createdAt: "desc" } } },
    })
    return obligation
      ? NextResponse.json({ obligation })
      : NextResponse.json({ error: "Recovery obligation not found" }, { status: 404 })
  }

  const obligations = await prisma.checkoutObligation.findMany({
    where: { status: "REVIEW_REQUIRED" },
    orderBy: { createdAt: "asc" },
    include: { recoveryAudits: { orderBy: { createdAt: "desc" } } },
  })
  return NextResponse.json({ obligations })
}

export async function POST(request: NextRequest) {
  const { user: admin, error } = await requireAdmin(request)
  if (error) return error

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const obligationId = text(body.obligationId)
  const action = text(body.action).toUpperCase()
  const reason = text(body.reason)
  const expectedUserId = text(body.expectedUserId)
  const expectedCurrency = text(body.expectedCurrency).toLowerCase()
  const expectedPriceId = text(body.expectedPriceId)
  const expectedAmountCents = typeof body.expectedAmountCents === "number" ? body.expectedAmountCents : Number.NaN
  if (!obligationId || !["APPROVE", "REJECT"].includes(action) || reason.length < 8
    || !expectedUserId || !expectedCurrency || !expectedPriceId
    || !Number.isInteger(expectedAmountCents) || expectedAmountCents <= 0) {
    return NextResponse.json({ error: "Exact recovery evidence, action, and a reason of at least 8 characters are required" }, { status: 400 })
  }

  const obligation = await prisma.checkoutObligation.findUnique({ where: { id: obligationId } })
  if (!obligation || obligation.status !== "REVIEW_REQUIRED" || !obligation.stripeSessionId) {
    return NextResponse.json({ error: "Review obligation is not actionable" }, { status: 409 })
  }

  const session = await stripe.checkout.sessions.retrieve(obligation.stripeSessionId)
  const lines = await stripe.checkout.sessions.listLineItems(obligation.stripeSessionId, { limit: 10 })
  const line = lines.data[0]
  const price = line?.price
  const customerId = objectId(session.customer)
  const paymentIntentId = objectId(session.payment_intent)
  const subscriptionId = objectId(session.subscription)
  const legacySubscription = session.mode === "subscription" && subscriptionId
    ? await stripe.subscriptions.retrieve(subscriptionId)
    : null
  const legacyInvoices = session.mode === "subscription" && subscriptionId
    ? await stripe.invoices.list({ subscription: subscriptionId, limit: 10 })
    : null
  const sourceInvoice = legacyInvoices?.data.find((candidate) => {
    const invoice = candidate as any
    return invoice.status === "paid"
      && invoice.billing_reason === "subscription_create"
      && invoice.amount_paid === expectedAmountCents
      && invoice.currency?.toLowerCase() === expectedCurrency
  }) as any
  const sourceInvoicePayments = session.mode === "subscription" && sourceInvoice?.id
    ? await stripe.invoicePayments.list({ invoice: sourceInvoice.id, status: "paid", limit: 10 })
    : null
  const sourceInvoicePayment = sourceInvoicePayments?.data.find((candidate) =>
    candidate.status === "paid" && candidate.payment.type === "payment_intent")
  const sourcePaymentIntentId = paymentIntentId ?? objectId(sourceInvoicePayment?.payment.payment_intent)
  const sourceCharges = session.mode === "subscription" && sourcePaymentIntentId
    ? await stripe.charges.list({ payment_intent: sourcePaymentIntentId, limit: 10 })
    : null
  const sourceCharge = sourceCharges?.data.find((candidate) => {
    const charge = candidate as any
    return charge.paid === true
      && charge.amount === expectedAmountCents
      && charge.currency?.toLowerCase() === expectedCurrency
  }) as any
  const stripeCurrency = session.currency?.toLowerCase() ?? null
  const metadataUserId = session.metadata?.userId ?? null

  const mismatches = [
    session.id !== obligation.stripeSessionId && "session",
    session.status !== "complete" && "session status",
    session.payment_status !== "paid" && "payment status",
    session.mode !== "payment" && session.mode !== "subscription" && "mode",
    session.mode === "subscription" && !subscriptionId && "subscription identity",
    session.mode === "subscription" && legacySubscription?.status !== "canceled" && "legacy subscription remains billable",
    session.mode === "subscription" && objectId(legacySubscription?.customer) !== customerId && "legacy subscription customer",
    session.mode === "subscription" && !sourceInvoice && "original paid subscription invoice",
    session.mode === "subscription" && !sourceInvoicePayment && "original paid subscription invoice payment",
    session.mode === "subscription" && !sourcePaymentIntentId && "original subscription payment intent",
    session.mode === "subscription" && !sourceCharge && "original paid subscription charge",
    session.mode === "subscription" && (sourceCharge?.refunded || sourceCharge?.disputed || sourceCharge?.amount_refunded > 0) && "original subscription charge reversed",
    obligation.userId !== expectedUserId && "operator user",
    metadataUserId !== null && metadataUserId !== obligation.userId && "metadata user",
    obligation.expectedAmountCents !== expectedAmountCents && "operator amount",
    obligation.expectedCurrency !== expectedCurrency && "operator currency",
    obligation.stripePriceId !== expectedPriceId && "operator price",
    obligation.settledAmountCents !== expectedAmountCents && "settled amount",
    obligation.settledCurrency?.toLowerCase() !== expectedCurrency && "settled currency",
    session.amount_total !== expectedAmountCents && "Stripe amount",
    stripeCurrency !== expectedCurrency && "Stripe currency",
    customerId !== obligation.stripeCustomerId && "Stripe customer",
    price?.id !== expectedPriceId && "Stripe price",
    price?.unit_amount !== expectedAmountCents && "Stripe unit amount",
    price?.currency?.toLowerCase() !== expectedCurrency && "Stripe line currency",
    line?.amount_total !== expectedAmountCents && "Stripe line amount",
    line?.quantity !== obligation.quantity && "Stripe quantity",
    obligation.stripePaymentIntentId && sourcePaymentIntentId !== obligation.stripePaymentIntentId && "payment intent",
  ].filter(Boolean)
  if (mismatches.length) {
    return NextResponse.json({ error: "Recovery evidence mismatch", mismatches }, { status: 409 })
  }

  if (action === "APPROVE") {
    if (!sourcePaymentIntentId) {
      return NextResponse.json({ error: "Exact source PaymentIntent is required to approve access" }, { status: 409 })
    }
    const reversal = await prisma.paymentReversal.findUnique({ where: { stripePaymentIntentId: sourcePaymentIntentId } })
    if (reversal) return NextResponse.json({ error: "Reversed payment cannot grant access", reversalStatus: reversal.status }, { status: 409 })
  }

  const providerVerifiedAt = new Date()
  const isPartialRefundReview = obligation.failureReason?.includes("partially refunded") === true
  const accessStarts = obligation.settledAt ?? providerVerifiedAt
  const accessEnds = new Date(accessStarts.getTime() + ACCESS_MS)
  if (action === "APPROVE" && accessEnds.getTime() <= providerVerifiedAt.getTime()) {
    return NextResponse.json({ error: "The bounded legacy access period has already ended; reject or investigate instead" }, { status: 409 })
  }

  try {
    await prisma.$transaction(async (tx) => {
      const closed = await tx.checkoutObligation.updateMany({
        where: {
          id: obligation.id,
          status: "REVIEW_REQUIRED",
          stripeSessionId: session.id,
          userId: expectedUserId,
          stripePriceId: expectedPriceId,
          expectedAmountCents,
          expectedCurrency,
          settledAmountCents: expectedAmountCents,
          settledCurrency: expectedCurrency,
        },
        data: {
          status: action === "APPROVE" ? "PAID" : "REJECTED",
          stripePaymentIntentId: sourcePaymentIntentId,
          failureReason: action === "APPROVE" ? null : `Rejected by admin: ${reason}`,
        },
      })
      if (closed.count !== 1) throw new RecoveryConflict("Review obligation changed before resolution")

      if (action === "APPROVE") {
        const existing = await tx.subscription.findUnique({ where: { userId: obligation.userId } })
        const accessData = {
          stripeCustomerId: customerId!,
          stripeSubscriptionId: null,
          stripePriceId: expectedPriceId,
          status: "active",
          plan: "one_time",
          currentPeriodStart: accessStarts,
          currentPeriodEnd: accessEnds,
          cancelAtPeriodEnd: false,
          trialStart: null,
          trialEnd: null,
          grantingObligationId: obligation.id,
        }
        if (!existing) {
          await tx.subscription.create({ data: { userId: obligation.userId, ...accessData } })
        } else if (existing.plan === "one_time" && !existing.grantingObligationId
          && existing.stripeCustomerId === customerId
          && [sourcePaymentIntentId, session.id].filter(Boolean).includes(existing.stripeSubscriptionId)) {
          const adopted = await tx.subscription.updateMany({
            where: {
              id: existing.id,
              plan: "one_time",
              grantingObligationId: null,
              stripeCustomerId: customerId!,
              stripeSubscriptionId: existing.stripeSubscriptionId,
            },
            data: accessData,
          })
          if (adopted.count !== 1) throw new RecoveryConflict("Exact legacy access grant changed before adoption")
        } else if (existing.plan !== "one_time" && CONVERTIBLE_LEGACY.includes(existing.status)) {
          const converted = await tx.subscription.updateMany({
            where: { id: existing.id, plan: { not: "one_time" }, status: { in: CONVERTIBLE_LEGACY } },
            data: accessData,
          })
          if (converted.count !== 1) throw new RecoveryConflict("Legacy subscription changed before conversion")
        } else {
          throw new RecoveryConflict("Existing access is not the exact reviewed legacy grant")
        }
      } else if (isPartialRefundReview) {
        await tx.subscription.updateMany({
          where: {
            userId: obligation.userId,
            plan: "one_time",
            grantingObligationId: obligation.id,
          },
          data: { status: "canceled", currentPeriodEnd: providerVerifiedAt },
        })
      }

      const recoveredPaymentStatus = isPartialRefundReview ? "partially_refunded" : "succeeded"
      await tx.payment.upsert({
        where: { stripeCheckoutSessionId: session.id },
        create: {
          userId: obligation.userId,
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId: sourcePaymentIntentId,
          stripePriceId: expectedPriceId,
          amount: expectedAmountCents / 100,
          currency: expectedCurrency,
          status: recoveredPaymentStatus,
          description: `Paid legacy Checkout; access recovery ${action.toLowerCase()}: ${reason}`,
        },
        update: {
          status: recoveredPaymentStatus,
          description: `Paid legacy Checkout; access recovery ${action.toLowerCase()}: ${reason}`,
        },
      })

      await tx.checkoutRecoveryAudit.create({
        data: {
          checkoutObligationId: obligation.id,
          stripeSessionId: session.id,
          adminUserId: admin!.id,
          subjectUserId: obligation.userId,
          action,
          reason,
          stripeMode: session.mode!,
          stripePaymentStatus: session.payment_status,
          stripeCustomerId: customerId,
          stripePaymentIntentId: sourcePaymentIntentId,
          stripeSubscriptionId: subscriptionId,
          stripePriceId: expectedPriceId,
          stripeAmountCents: expectedAmountCents,
          stripeCurrency: expectedCurrency,
          stripeQuantity: line!.quantity!,
          providerVerifiedAt,
        },
      })
    }, { isolationLevel: "Serializable" })
  } catch (cause) {
    if (cause instanceof RecoveryConflict) {
      return NextResponse.json({ error: cause.message }, { status: 409 })
    }
    throw cause
  }

  return NextResponse.json({ obligationId: obligation.id, resolution: action, accessEnds: action === "APPROVE" ? accessEnds : null })
}

export const runtime = "nodejs"
