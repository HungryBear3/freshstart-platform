/** @jest-environment node */
const mockConstructEvent = jest.fn();
const mockListLineItems = jest.fn();
const mockStripeEventFindUnique = jest.fn();
const mockStripeEventCreate = jest.fn();
const mockStripeEventUpdateMany = jest.fn();
const mockObligationFindUnique = jest.fn();
const mockObligationFindFirst = jest.fn();
const mockObligationUpsert = jest.fn();
const mockObligationUpdateMany = jest.fn();
const mockSubscriptionFindUnique = jest.fn();
const mockSubscriptionFindFirst = jest.fn();
const mockSubscriptionCreate = jest.fn();
const mockSubscriptionUpdateMany = jest.fn();
const mockPaymentUpsert = jest.fn();
const mockPaymentUpdateMany = jest.fn();
const mockUserFindUnique = jest.fn();
const mockRetrieveCharge = jest.fn();
const mockCaptureError = jest.fn();
const mockTransaction = jest.fn();
const mockReversalFindUnique = jest.fn();
const mockReversalCreate = jest.fn();
const mockReversalUpdateMany = jest.fn();

jest.mock("@/lib/db", () => ({ prisma: {
  stripeEvent: {
    findUnique: (...args: unknown[]) => mockStripeEventFindUnique(...args),
    create: (...args: unknown[]) => mockStripeEventCreate(...args),
    updateMany: (...args: unknown[]) => mockStripeEventUpdateMany(...args),
  },
  checkoutObligation: {
    findUnique: (...args: unknown[]) => mockObligationFindUnique(...args),
    findFirst: (...args: unknown[]) => mockObligationFindFirst(...args),
    upsert: (...args: unknown[]) => mockObligationUpsert(...args),
    updateMany: (...args: unknown[]) => mockObligationUpdateMany(...args),
  },
  user: { findUnique: (...args: unknown[]) => mockUserFindUnique(...args) },
  subscription: {
    findUnique: (...args: unknown[]) => mockSubscriptionFindUnique(...args),
    findFirst: (...args: unknown[]) => mockSubscriptionFindFirst(...args),
    create: (...args: unknown[]) => mockSubscriptionCreate(...args),
    updateMany: (...args: unknown[]) => mockSubscriptionUpdateMany(...args),
  },
  payment: {
    upsert: (...args: unknown[]) => mockPaymentUpsert(...args),
    updateMany: (...args: unknown[]) => mockPaymentUpdateMany(...args),
  },
  paymentReversal: {
    findUnique: (...args: unknown[]) => mockReversalFindUnique(...args),
    create: (...args: unknown[]) => mockReversalCreate(...args),
    updateMany: (...args: unknown[]) => mockReversalUpdateMany(...args),
  },
  $transaction: (...args: unknown[]) => mockTransaction(...args),
} }));
jest.mock("@/lib/stripe/config", () => ({ stripe: {
  webhooks: { constructEvent: (...args: unknown[]) => mockConstructEvent(...args) },
  checkout: { sessions: { listLineItems: (...args: unknown[]) => mockListLineItems(...args) } },
  charges: { retrieve: (...args: unknown[]) => mockRetrieveCharge(...args) },
  billingPortal: { sessions: { create: jest.fn() } },
} }));
jest.mock("@/lib/monitoring/error-tracking", () => ({
  errorTracker: { captureError: (...args: unknown[]) => mockCaptureError(...args) },
}));

import { NextRequest } from "next/server";
import { POST } from "@/app/api/webhooks/stripe/route";

function req() {
  return new NextRequest("http://localhost/api/webhooks/stripe", { method: "POST", headers: { "stripe-signature": "sig_local" }, body: "signed" });
}
const obligation = {
  id: "obl_1", userId: "user_1", plan: "one_time", cycle: 1, status: "OPEN",
  stripeSessionId: "cs_1", stripeCustomerId: "cus_1", stripePriceId: "price_one_time",
  expectedAmountCents: 14900, expectedCurrency: "usd", quantity: 1,
};
function checkoutEvent(overrides: Record<string, unknown> = {}) {
  return { id: "evt_checkout", type: "checkout.session.completed", created: 1000, data: { object: {
    id: "cs_1", mode: "payment", status: "complete", payment_status: "paid",
    customer: "cus_1", payment_intent: "pi_1", amount_total: 14900, currency: "usd",
    metadata: { obligationId: "obl_1" }, ...overrides,
  } } };
}
function annualEvent(type = "customer.subscription.updated", created = 2000) {
  return { id: `evt_${created}`, type, created, data: { object: {
    id: "sub_annual", customer: "cus_annual", status: type.endsWith("deleted") ? "canceled" : "active",
    cancel_at_period_end: false, current_period_start: 1900, current_period_end: 2900,
  } } };
}

describe("Stripe webhook hardening", () => {
  beforeEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_local";
    process.env.ONE_TIME_PRICE_ID = "price_one_time";
    mockConstructEvent.mockReturnValue(checkoutEvent());
    mockStripeEventFindUnique.mockResolvedValue(null);
    mockStripeEventCreate.mockResolvedValue({ id: "local_evt", status: "PROCESSING" });
    mockStripeEventUpdateMany.mockResolvedValue({ count: 1 });
    mockObligationFindUnique.mockResolvedValue(obligation);
    mockObligationFindFirst.mockResolvedValue(null);
    mockObligationUpsert.mockResolvedValue({ id: "obl_legacy_review" });
    mockObligationUpdateMany.mockResolvedValue({ count: 1 });
    mockSubscriptionFindUnique.mockResolvedValue(null);
    mockSubscriptionFindFirst.mockResolvedValue(null);
    mockSubscriptionCreate.mockResolvedValue({ id: "sub_local" });
    mockSubscriptionUpdateMany.mockResolvedValue({ count: 1 });
    mockPaymentUpsert.mockResolvedValue({ id: "pay_1" });
    mockPaymentUpdateMany.mockResolvedValue({ count: 1 });
    mockReversalFindUnique.mockResolvedValue(null);
    mockReversalCreate.mockResolvedValue({ id: "rev_1" });
    mockReversalUpdateMany.mockResolvedValue({ count: 1 });
    mockUserFindUnique.mockResolvedValue({ id: "user_1" });
    mockRetrieveCharge.mockResolvedValue({ id: "ch_1", payment_intent: "pi_1" });
    mockListLineItems.mockResolvedValue({ data: [{ quantity: 1, amount_total: 14900, currency: "usd", price: { id: "price_one_time", unit_amount: 14900, currency: "usd", type: "one_time" } }] });
    mockTransaction.mockImplementation(async (fn: any) => fn(require("@/lib/db").prisma));
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => { jest.restoreAllMocks(); jest.clearAllMocks(); });

  it("grants 60-day access only after exact paid session/customer/price/amount/currency/quantity validation", async () => {
    const response = await POST(req());
    expect(response.status).toBe(200);
    expect(mockListLineItems).toHaveBeenCalledWith("cs_1", { limit: 10 });
    expect(mockObligationUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: "obl_1", stripeSessionId: "cs_1", status: "OPEN" }),
      data: expect.objectContaining({ status: "PAID", settledAmountCents: 14900, settledCurrency: "usd", stripePaymentIntentId: "pi_1" }),
    }));
    expect(mockSubscriptionCreate).toHaveBeenCalledWith({ data: expect.objectContaining({
      userId: "user_1", plan: "one_time", status: "active", stripeSubscriptionId: null,
      currentPeriodEnd: expect.any(Date), grantingObligationId: "obl_1",
    }) });
    const end = mockSubscriptionCreate.mock.calls[0][0].data.currentPeriodEnd as Date;
    const start = mockSubscriptionCreate.mock.calls[0][0].data.currentPeriodStart as Date;
    expect(end.getTime() - start.getTime()).toBe(60 * 24 * 60 * 60 * 1000);
    expect(mockTransaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
  });

  it.each([
    ["unsettled", { payment_status: "unpaid" }],
    ["wrong amount", { amount_total: 14899 }],
    ["wrong currency", { currency: "eur" }],
    ["wrong customer", { customer: "cus_other" }],
    ["wrong session", { id: "cs_other" }],
  ])("does not grant access for %s checkout", async (_label, override) => {
    mockConstructEvent.mockReturnValue(checkoutEvent(override));
    const response = await POST(req());
    expect(mockSubscriptionCreate).not.toHaveBeenCalled();
    if ("payment_status" in override && override.payment_status === "unpaid") {
      expect(response.status).toBe(200);
      expect(mockPaymentUpsert).not.toHaveBeenCalled();
    } else {
      expect(response.status).toBe(200);
      expect(mockPaymentUpsert).toHaveBeenCalledWith(expect.objectContaining({
        where: { stripeCheckoutSessionId: expect.any(String) },
        create: expect.objectContaining({ status: "review_required" }),
      }));
      expect(mockObligationUpdateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "REVIEW_REQUIRED" }) }));
      expect(mockCaptureError).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ mismatch: expect.any(String) }));
    }
  });

  it("binds the paid Checkout Session when an unbound pending obligation enters review", async () => {
    mockObligationFindUnique.mockResolvedValue({
      ...obligation, status: "PENDING", stripeSessionId: null,
    });
    const response = await POST(req());
    expect(response.status).toBe(200);
    expect(mockObligationUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "obl_1", stripeSessionId: null, status: "PENDING" },
      data: expect.objectContaining({ status: "REVIEW_REQUIRED", stripeSessionId: "cs_1" }),
    }));
  });

  it("creates an actionable review obligation when both mismatch transitions lose their CAS", async () => {
    mockConstructEvent.mockReturnValue(checkoutEvent({ id: "cs_other" }));
    mockObligationUpdateMany.mockResolvedValue({ count: 0 });
    mockObligationFindFirst.mockResolvedValue({ cycle: 4 });
    expect((await POST(req())).status).toBe(200);
    expect(mockObligationUpsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({
        userId: "user_1", cycle: 5, status: "REVIEW_REQUIRED", stripeSessionId: "cs_other",
      }),
    }));
  });

  it("derives an unbound settled session user from its Stripe customer binding", async () => {
    mockConstructEvent.mockReturnValue(checkoutEvent({ metadata: {} }));
    mockSubscriptionFindFirst.mockResolvedValue({ userId: "user_1" });
    mockObligationFindUnique.mockResolvedValue(null);
    expect((await POST(req())).status).toBe(200);
    expect(mockSubscriptionFindFirst).toHaveBeenCalledWith({ where: { stripeCustomerId: "cus_1" }, select: { userId: true } });
    expect(mockObligationUpsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ userId: "user_1", status: "REVIEW_REQUIRED", stripeSessionId: "cs_1" }),
    }));
  });

  it("promotes an exact existing pending session binding into the operator review queue", async () => {
    mockConstructEvent.mockReturnValue(checkoutEvent({ metadata: {} }));
    mockSubscriptionFindFirst.mockResolvedValue(null);
    mockObligationFindUnique.mockResolvedValue({ ...obligation, status: "PENDING", stripeSessionId: "cs_1" });
    expect((await POST(req())).status).toBe(200);
    expect(mockObligationUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: "obl_1", status: { in: ["OPEN", "PENDING"] } }),
      data: expect.objectContaining({ status: "REVIEW_REQUIRED", settledAmountCents: 14900 }),
    }));
  });

  it("returns non-2xx for a settled unbound session with no local user binding", async () => {
    mockConstructEvent.mockReturnValue(checkoutEvent({ metadata: {} }));
    mockObligationFindUnique.mockResolvedValue(null);
    expect((await POST(req())).status).toBe(500);
    expect(mockStripeEventUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "FAILED", claimToken: null }),
    }));
  });

  it("returns non-2xx when metadata user conflicts with the exact Stripe customer binding", async () => {
    mockConstructEvent.mockReturnValue(checkoutEvent({ metadata: { userId: "user_other" } }));
    mockSubscriptionFindFirst.mockResolvedValue({ userId: "user_1" });
    expect((await POST(req())).status).toBe(500);
    expect(mockPaymentUpsert).not.toHaveBeenCalled();
  });

  it("returns non-2xx when an unbound settlement lacks evidence for a recovery obligation", async () => {
    mockConstructEvent.mockReturnValue(checkoutEvent({ metadata: {}, amount_total: null }));
    mockSubscriptionFindFirst.mockResolvedValue({ userId: "user_1" });
    mockObligationFindUnique.mockResolvedValue(null);
    expect((await POST(req())).status).toBe(500);
    expect(mockObligationUpsert).not.toHaveBeenCalled();
  });

  it("returns non-2xx while another unexpired claim owns the event", async () => {
    mockStripeEventFindUnique.mockResolvedValue({
      id: "local_evt", status: "PROCESSING", claimToken: "other", leaseExpiresAt: new Date(Date.now() + 60_000),
    });
    const response = await POST(req());
    expect(response.status).toBe(409);
    expect(mockObligationFindUnique).not.toHaveBeenCalled();
  });

  it("releases a failed claim for retry and can process the same event later", async () => {
    mockListLineItems.mockRejectedValueOnce(new Error("temporary read failure"));
    const first = await POST(req());
    expect(first.status).toBe(500);
    expect(mockStripeEventUpdateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "FAILED", claimToken: null }) }));

    mockStripeEventFindUnique.mockResolvedValue({ id: "local_evt", status: "FAILED", claimToken: null, leaseExpiresAt: null });
    const second = await POST(req());
    expect(second.status).toBe(200);
    expect(mockSubscriptionCreate).toHaveBeenCalledTimes(1);
  });

  it("acknowledges an already-completed replay without mutating payment or access", async () => {
    mockStripeEventFindUnique.mockResolvedValue({ id: "local_evt", status: "COMPLETED", processedAt: new Date() });
    const response = await POST(req());
    expect(response.status).toBe(200);
    expect(mockObligationFindUnique).not.toHaveBeenCalled();
    expect(mockSubscriptionCreate).not.toHaveBeenCalled();
  });

  it("finishes a retry idempotently when settlement committed before prior event completion", async () => {
    mockStripeEventFindUnique.mockResolvedValue({ id: "local_evt", status: "FAILED", claimToken: null, leaseExpiresAt: null });
    mockObligationFindUnique.mockResolvedValue({ ...obligation, status: "PAID" });
    const response = await POST(req());
    expect(response.status).toBe(200);
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockSubscriptionCreate).not.toHaveBeenCalled();
    expect(mockStripeEventUpdateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "COMPLETED" }) }));
  });

  it("clears historical annual binding only for safely convertible legacy rows", async () => {
    mockSubscriptionFindUnique.mockResolvedValue({ id: "legacy", userId: "user_1", plan: "annual", status: "canceled", stripeSubscriptionId: "sub_old", stripeCustomerId: "cus_1" });
    await POST(req());
    expect(mockSubscriptionUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "legacy", plan: { not: "one_time" }, status: { in: ["canceled", "incomplete", "incomplete_expired"] } },
      data: expect.objectContaining({ plan: "one_time", stripeSubscriptionId: null }),
    }));
  });

  it("rejects paid conversion over active historical annual access", async () => {
    mockSubscriptionFindUnique.mockResolvedValue({ id: "legacy", userId: "user_1", plan: "annual", status: "active", stripeSubscriptionId: "sub_old" });
    const response = await POST(req());
    expect(response.status).toBe(500);
    expect(mockPaymentUpsert).not.toHaveBeenCalled();
  });

  it("fences annual lifecycle updates by plan, exact binding, customer, and monotonic event time", async () => {
    mockConstructEvent.mockReturnValue(annualEvent("customer.subscription.updated", 2000));
    const response = await POST(req());
    expect(response.status).toBe(200);
    expect(mockSubscriptionUpdateMany).toHaveBeenCalledWith(expect.objectContaining({ where: {
      plan: { not: "one_time" }, stripeSubscriptionId: "sub_annual", stripeCustomerId: "cus_annual",
      status: { not: "canceled" },
      OR: [{ providerEventCreatedAt: null }, { providerEventCreatedAt: { lt: expect.any(Date) } }],
    } }));
  });

  it("retries a paid legacy subscription session with no binding and acknowledges unpaid checkout events", async () => {
    mockConstructEvent.mockReturnValue(checkoutEvent({ mode: "subscription", metadata: {} }));
    mockObligationFindUnique.mockResolvedValue(null);
    expect((await POST(req())).status).toBe(500);
    jest.clearAllMocks();
    mockStripeEventFindUnique.mockResolvedValue(null);
    mockStripeEventCreate.mockResolvedValue({ id: "local_evt", status: "PROCESSING" });
    mockStripeEventUpdateMany.mockResolvedValue({ count: 1 });
    mockConstructEvent.mockReturnValue(checkoutEvent({ payment_status: "unpaid" }));
    expect((await POST(req())).status).toBe(200);
    expect(mockListLineItems).not.toHaveBeenCalled();
  });

  it("persists an actionable review obligation for an exact pre-cutover one-time contract", async () => {
    mockObligationFindUnique.mockResolvedValue(null);
    mockSubscriptionFindFirst.mockResolvedValue({ userId: "user_1" });
    mockConstructEvent.mockReturnValue(checkoutEvent({ metadata: { userId: "user_1", plan: "one_time" } }));
    const response = await POST(req());
    expect(response.status).toBe(200);
    expect(mockPaymentUpsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ userId: "user_1", status: "review_required" }),
    }));
    expect(mockObligationUpsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({
        userId: "user_1", status: "REVIEW_REQUIRED", stripeSessionId: "cs_1",
        expectedAmountCents: 14900, expectedCurrency: "usd",
      }),
    }));
    expect(mockCaptureError).toHaveBeenCalled();
  });

  it("persists actionable recovery evidence for a pre-cutover subscription-mode settlement", async () => {
    mockObligationFindUnique.mockResolvedValue(null);
    mockSubscriptionFindFirst.mockResolvedValue({ userId: "user_1" });
    mockConstructEvent.mockReturnValue(checkoutEvent({
      mode: "subscription",
      payment_intent: null,
      metadata: { userId: "user_1", plan: "annual" },
    }));
    expect((await POST(req())).status).toBe(200);
    expect(mockPaymentUpsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ userId: "user_1", status: "review_required" }),
    }));
    expect(mockObligationUpsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ plan: "legacy_annual", status: "REVIEW_REQUIRED", stripeSessionId: "cs_1" }),
    }));
  });

  it("releases an expired session for a deterministic retry", async () => {
    mockConstructEvent.mockReturnValue({ ...checkoutEvent(), type: "checkout.session.expired" });
    const response = await POST(req());
    expect(response.status).toBe(200);
    expect(mockObligationUpdateMany).toHaveBeenCalledWith({
      where: { id: "obl_1", stripeSessionId: "cs_1", status: "OPEN" },
      data: { stripeSessionId: null, status: "PENDING", attempt: { increment: 1 } },
    });
  });

  it("makes terminal annual deletion win a same-second lifecycle race", async () => {
    mockConstructEvent.mockReturnValue(annualEvent("customer.subscription.deleted", 2000));
    expect((await POST(req())).status).toBe(200);
    expect(mockSubscriptionUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ OR: [{ providerEventCreatedAt: null }, { providerEventCreatedAt: { lte: expect.any(Date) } }] }),
      data: expect.objectContaining({ status: "canceled" }),
    }));
  });

  it.each([
    ["charge.refunded", "REFUNDED", "refunded"],
    ["charge.dispute.created", "DISPUTED", "disputed"],
  ])("revokes exact one-time access for %s", async (type, obligationStatus, paymentStatus) => {
    mockObligationFindUnique.mockResolvedValue({ ...obligation, status: "PAID", stripePaymentIntentId: "pi_1" });
    mockConstructEvent.mockReturnValue({
      id: `evt_${type}`, type, created: 3000,
      data: { object: type === "charge.refunded"
        ? { id: "ch_1", payment_intent: "pi_1", amount: 14900, amount_refunded: 14900, refunded: true }
        : { id: "dp_1", charge: "ch_1" } },
    });
    const response = await POST(req());
    expect(response.status).toBe(200);
    expect(mockObligationUpdateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: obligationStatus }) }));
    expect(mockSubscriptionUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        userId: "user_1", plan: "one_time", stripeCustomerId: "cus_1", grantingObligationId: "obl_1",
      }),
      data: expect.objectContaining({ status: "canceled" }),
    }));
    expect(mockPaymentUpdateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { status: paymentStatus } }));
  });

  it("sends a partial refund to review without revoking access", async () => {
    mockObligationFindUnique.mockResolvedValue({ ...obligation, status: "PAID", stripePaymentIntentId: "pi_1" });
    mockConstructEvent.mockReturnValue({
      id: "evt_partial", type: "charge.refunded", created: 3001,
      data: { object: {
        id: "ch_1", payment_intent: "pi_1", amount: 14900, amount_refunded: 2500, refunded: false,
      } },
    });
    expect((await POST(req())).status).toBe(200);
    expect(mockObligationUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "REVIEW_REQUIRED" }),
    }));
    expect(mockPaymentUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: { status: "review_required" },
    }));
    expect(mockSubscriptionUpdateMany).not.toHaveBeenCalled();
  });

  it("stores a reversal delivered before settlement and refuses the later access grant", async () => {
    const refund = {
      id: "evt_refund_first", type: "charge.refunded", created: 2999,
      data: { object: { id: "ch_1", payment_intent: "pi_1", amount: 14900, amount_refunded: 14900, refunded: true } },
    };
    mockConstructEvent.mockReturnValueOnce(refund).mockReturnValueOnce(checkoutEvent());
    mockObligationFindUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(obligation);
    mockReversalFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "rev_1", stripePaymentIntentId: "pi_1", status: "REFUNDED" });

    expect((await POST(req())).status).toBe(200);
    expect(mockReversalCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ stripePaymentIntentId: "pi_1", status: "REFUNDED" }),
    }));
    expect((await POST(req())).status).toBe(200);
    expect(mockObligationUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "REFUNDED", stripePaymentIntentId: "pi_1" }),
    }));
    expect(mockSubscriptionCreate).not.toHaveBeenCalled();
  });

  it.each([
    ["charge.refunded", "REFUNDED"],
    ["charge.dispute.created", "DISPUTED"],
  ])("durably correlates and revokes only an exact pre-cutover grant for %s", async (type, reversalStatus) => {
    mockObligationFindUnique.mockResolvedValue(null);
    mockConstructEvent.mockReturnValue({
      id: `evt_legacy_${type}`, type, created: 4000,
      data: { object: type === "charge.refunded"
        ? { id: "ch_legacy", customer: "cus_legacy", payment_intent: "pi_legacy", amount: 14900, amount_refunded: 14900, refunded: true }
        : { id: "dp_legacy", charge: "ch_legacy" } },
    });
    mockRetrieveCharge.mockResolvedValue({
      id: "ch_legacy", customer: "cus_legacy", payment_intent: "pi_legacy", amount: 14900, amount_refunded: 0,
    });
    mockSubscriptionUpdateMany.mockResolvedValue({ count: 1 });

    expect((await POST(req())).status).toBe(200);
    expect(mockReversalCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ stripePaymentIntentId: "pi_legacy", status: reversalStatus }),
    }));
    expect(mockSubscriptionUpdateMany).toHaveBeenCalledWith({
      where: {
        plan: "one_time",
        stripeSubscriptionId: "pi_legacy",
        stripeCustomerId: "cus_legacy",
        grantingObligationId: null,
      },
      data: expect.objectContaining({ status: "canceled", currentPeriodEnd: expect.any(Date) }),
    });
  });

  it("does not broaden legacy revocation when the exact old PaymentIntent grant is absent", async () => {
    mockObligationFindUnique.mockResolvedValue(null);
    mockConstructEvent.mockReturnValue({
      id: "evt_legacy_unrelated", type: "charge.refunded", created: 4001,
      data: { object: {
        id: "ch_old", customer: "cus_shared", payment_intent: "pi_old",
        amount: 14900, amount_refunded: 14900, refunded: true,
      } },
    });
    mockSubscriptionUpdateMany.mockResolvedValue({ count: 0 });

    expect((await POST(req())).status).toBe(200);
    expect(mockSubscriptionUpdateMany).toHaveBeenCalledTimes(1);
    expect(mockSubscriptionUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ stripeSubscriptionId: "pi_old", grantingObligationId: null }),
    }));
  });

  it("updates the same invoice from failed to succeeded without allowing later failure regression", async () => {
    const failed = {
      id: "evt_invoice_failed", type: "invoice.payment_failed", created: 5000,
      data: { object: { id: "in_1", customer: "cus_annual", subscription: "sub_annual", amount_due: 4900, amount_paid: 0, currency: "usd" } },
    };
    const succeeded = {
      id: "evt_invoice_succeeded", type: "invoice.payment_succeeded", created: 5001,
      data: { object: { id: "in_1", customer: "cus_annual", subscription: "sub_annual", amount_due: 4900, amount_paid: 4900, currency: "usd" } },
    };
    const failedLate = { ...failed, id: "evt_invoice_failed_late", created: 5002 };
    mockConstructEvent.mockReturnValueOnce(failed).mockReturnValueOnce(succeeded).mockReturnValueOnce(failedLate);
    mockSubscriptionFindFirst.mockResolvedValue({ userId: "user_1" });

    expect((await POST(req())).status).toBe(200);
    expect((await POST(req())).status).toBe(200);
    expect((await POST(req())).status).toBe(200);

    expect(mockPaymentUpsert.mock.calls[1][0]).toEqual(expect.objectContaining({
      where: { stripeInvoiceId: "in_1" },
      update: expect.objectContaining({ amount: 49, currency: "usd", status: "succeeded" }),
    }));
    expect(mockPaymentUpsert.mock.calls[2][0]).toEqual(expect.objectContaining({
      where: { stripeInvoiceId: "in_1" }, update: {},
    }));
  });
});
