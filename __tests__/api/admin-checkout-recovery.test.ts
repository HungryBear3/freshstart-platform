/** @jest-environment node */
const mockRequireAdmin = jest.fn();
const mockObligationFindMany = jest.fn();
const mockObligationFindUnique = jest.fn();
const mockObligationUpdateMany = jest.fn();
const mockSubscriptionFindUnique = jest.fn();
const mockSubscriptionCreate = jest.fn();
const mockSubscriptionUpdateMany = jest.fn();
const mockPaymentUpsert = jest.fn();
const mockReversalFindUnique = jest.fn();
const mockAuditCreate = jest.fn();
const mockTransaction = jest.fn();
const mockRetrieveSession = jest.fn();
const mockListLineItems = jest.fn();
const mockRetrieveSubscription = jest.fn();
const mockListInvoices = jest.fn();
const mockListInvoicePayments = jest.fn();
const mockListCharges = jest.fn();

jest.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: (...args: unknown[]) => mockRequireAdmin(...args),
}));

jest.mock("@/lib/db", () => ({ prisma: {
  checkoutObligation: {
    findMany: (...args: unknown[]) => mockObligationFindMany(...args),
    findUnique: (...args: unknown[]) => mockObligationFindUnique(...args),
    updateMany: (...args: unknown[]) => mockObligationUpdateMany(...args),
  },
  subscription: {
    findUnique: (...args: unknown[]) => mockSubscriptionFindUnique(...args),
    create: (...args: unknown[]) => mockSubscriptionCreate(...args),
    updateMany: (...args: unknown[]) => mockSubscriptionUpdateMany(...args),
  },
  payment: { upsert: (...args: unknown[]) => mockPaymentUpsert(...args) },
  paymentReversal: { findUnique: (...args: unknown[]) => mockReversalFindUnique(...args) },
  checkoutRecoveryAudit: { create: (...args: unknown[]) => mockAuditCreate(...args) },
  $transaction: (...args: unknown[]) => mockTransaction(...args),
} }));

jest.mock("@/lib/stripe/config", () => ({ stripe: {
  checkout: { sessions: {
    retrieve: (...args: unknown[]) => mockRetrieveSession(...args),
    listLineItems: (...args: unknown[]) => mockListLineItems(...args),
  } },
  subscriptions: { retrieve: (...args: unknown[]) => mockRetrieveSubscription(...args) },
  invoices: { list: (...args: unknown[]) => mockListInvoices(...args) },
  invoicePayments: { list: (...args: unknown[]) => mockListInvoicePayments(...args) },
  charges: { list: (...args: unknown[]) => mockListCharges(...args) },
} }));

import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/admin/checkout-recovery/route";

const obligation = {
  id: "obl_review", userId: "user_1", plan: "one_time", status: "REVIEW_REQUIRED",
  stripeSessionId: "cs_legacy", stripeCustomerId: "cus_1", stripePaymentIntentId: "pi_1",
  stripePriceId: "price_legacy", expectedAmountCents: 14900, expectedCurrency: "usd", quantity: 1,
  settledAmountCents: 14900, settledCurrency: "usd", settledAt: new Date(),
};
const session = {
  id: "cs_legacy", mode: "payment", status: "complete", payment_status: "paid",
  customer: "cus_1", payment_intent: "pi_1", subscription: null,
  amount_total: 14900, currency: "usd", metadata: { userId: "user_1" },
};
const lineItems = { data: [{ quantity: 1, amount_total: 14900, price: {
  id: "price_legacy", unit_amount: 14900, currency: "usd", type: "one_time",
} }] };

function post(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/admin/checkout-recovery", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
  });
}
const approval = {
  obligationId: "obl_review", action: "APPROVE", reason: "Verified pre-cutover payment",
  expectedUserId: "user_1", expectedAmountCents: 14900, expectedNetAmountCents: 14900,
  expectedCurrency: "usd", expectedPriceId: "price_legacy",
};

describe("admin checkout recovery", () => {
  beforeEach(() => {
    mockRequireAdmin.mockResolvedValue({ user: { id: "admin_1", email: "admin@example.com", role: "admin" }, error: null });
    mockObligationFindMany.mockResolvedValue([obligation]);
    mockObligationFindUnique.mockResolvedValue(obligation);
    mockObligationUpdateMany.mockResolvedValue({ count: 1 });
    mockSubscriptionFindUnique.mockResolvedValue(null);
    mockSubscriptionCreate.mockResolvedValue({ id: "sub_1" });
    mockSubscriptionUpdateMany.mockResolvedValue({ count: 1 });
    mockPaymentUpsert.mockResolvedValue({ id: "pay_1" });
    mockReversalFindUnique.mockResolvedValue(null);
    mockAuditCreate.mockResolvedValue({ id: "audit_1" });
    mockRetrieveSession.mockResolvedValue(session);
    mockListLineItems.mockResolvedValue(lineItems);
    mockRetrieveSubscription.mockResolvedValue({ id: "sub_legacy", status: "canceled", customer: "cus_1" });
    mockListInvoices.mockResolvedValue({ data: [{
      id: "in_initial", status: "paid", billing_reason: "subscription_create",
      amount_paid: 14900, currency: "usd",
    }] });
    mockListInvoicePayments.mockResolvedValue({ data: [{
      id: "inpay_initial", status: "paid",
      payment: { type: "payment_intent", payment_intent: "pi_subscription_initial" },
    }] });
    mockListCharges.mockResolvedValue({ data: [{
      id: "ch_initial", paid: true, amount: 14900, currency: "usd",
      refunded: false, disputed: false, amount_refunded: 0,
    }] });
    mockTransaction.mockImplementation(async (fn: any) => fn(require("@/lib/db").prisma));
  });
  afterEach(() => jest.clearAllMocks());

  it("requires an authenticated admin for queue reads and resolutions", async () => {
    mockRequireAdmin.mockResolvedValue({ user: null, error: new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }) });
    expect((await GET(new NextRequest("http://localhost/api/admin/checkout-recovery"))).status).toBe(403);
    expect((await POST(post(approval))).status).toBe(403);
    expect(mockRetrieveSession).not.toHaveBeenCalled();
  });

  it("lists actionable REVIEW_REQUIRED obligations for operators", async () => {
    const response = await GET(new NextRequest("http://localhost/api/admin/checkout-recovery"));
    expect(response.status).toBe(200);
    expect(mockObligationFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: "REVIEW_REQUIRED" },
    }));
  });

  it("verifies exact paid Stripe evidence and atomically grants bounded access with an audit record", async () => {
    const response = await POST(post(approval));
    expect(response.status).toBe(200);
    expect(mockRetrieveSession).toHaveBeenCalledWith("cs_legacy");
    expect(mockListLineItems).toHaveBeenCalledWith("cs_legacy", { limit: 10 });
    expect(mockListCharges).toHaveBeenCalledWith({ payment_intent: "pi_1", limit: 10 });
    expect(mockObligationUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: "obl_review", status: "REVIEW_REQUIRED" }),
      data: expect.objectContaining({ status: "PAID", failureReason: null }),
    }));
    expect(mockSubscriptionCreate).toHaveBeenCalledWith({ data: expect.objectContaining({
      userId: "user_1", plan: "one_time", status: "active", grantingObligationId: "obl_review",
      currentPeriodStart: expect.any(Date), currentPeriodEnd: expect.any(Date),
    }) });
    const grant = mockSubscriptionCreate.mock.calls[0][0].data;
    expect(grant.currentPeriodEnd.getTime() - grant.currentPeriodStart.getTime()).toBe(60 * 24 * 60 * 60 * 1000);
    expect(mockAuditCreate).toHaveBeenCalledWith({ data: expect.objectContaining({
      checkoutObligationId: "obl_review", adminUserId: "admin_1", subjectUserId: "user_1",
      action: "APPROVE", reason: "Verified pre-cutover payment", stripeSessionId: "cs_legacy",
      stripeAmountCents: 14900, stripeCurrency: "usd", stripePriceId: "price_legacy",
    }) });
    expect(mockTransaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
  });

  it("resolves exact customer-bound recovery evidence when legacy session metadata has no userId", async () => {
    mockRetrieveSession.mockResolvedValue({ ...session, metadata: {} });
    const response = await POST(post(approval));
    expect(response.status).toBe(200);
    expect(mockObligationUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: "obl_review", userId: "user_1", stripeSessionId: "cs_legacy" }),
    }));
  });

  it("fails closed before mutation when operator or Stripe evidence mismatches", async () => {
    const response = await POST(post({ ...approval, expectedAmountCents: 14899 }));
    expect(response.status).toBe(409);
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockSubscriptionCreate).not.toHaveBeenCalled();
    expect(mockAuditCreate).not.toHaveBeenCalled();
  });

  it("can explicitly reject a verified paid review without granting access", async () => {
    const response = await POST(post({ ...approval, action: "REJECT", reason: "Duplicate purchase already fulfilled" }));
    expect(response.status).toBe(200);
    expect(mockObligationUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: "obl_review", status: "REVIEW_REQUIRED" }),
      data: expect.objectContaining({ status: "REJECTED" }),
    }));
    expect(mockSubscriptionCreate).not.toHaveBeenCalled();
    expect(mockPaymentUpsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ status: "succeeded" }),
      update: expect.objectContaining({ status: "succeeded" }),
    }));
    expect(mockAuditCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ action: "REJECT" }) });
  });

  it("refuses approval when an exact PaymentIntent reversal already exists", async () => {
    mockReversalFindUnique.mockResolvedValue({ id: "rev_1", status: "REFUNDED" });
    const response = await POST(post(approval));
    expect(response.status).toBe(409);
    expect(mockSubscriptionCreate).not.toHaveBeenCalled();
    expect(mockObligationUpdateMany).not.toHaveBeenCalled();
  });

  it("refuses payment-mode approval when the live charge is partially refunded", async () => {
    mockListCharges.mockResolvedValue({ data: [{
      id: "ch_payment", paid: true, amount: 14900, currency: "usd",
      refunded: false, disputed: false, amount_refunded: 2500,
    }] });
    const response = await POST(post({ ...approval, expectedNetAmountCents: 12400 }));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual(expect.objectContaining({
      mismatches: expect.arrayContaining(["original charge reversed"]),
    }));
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("refuses subscription-mode recovery while the retired recurring subscription remains billable", async () => {
    mockObligationFindUnique.mockResolvedValue({ ...obligation, stripePaymentIntentId: null });
    mockRetrieveSession.mockResolvedValue({
      ...session, mode: "subscription", payment_intent: null, subscription: "sub_legacy",
    });
    mockRetrieveSubscription.mockResolvedValue({ id: "sub_legacy", status: "active", customer: "cus_1" });
    const response = await POST(post(approval));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual(expect.objectContaining({
      mismatches: expect.arrayContaining(["legacy subscription remains billable"]),
    }));
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("permits exact subscription-mode recovery only after the legacy subscription is canceled", async () => {
    mockObligationFindUnique.mockResolvedValue({ ...obligation, stripePaymentIntentId: null });
    mockRetrieveSession.mockResolvedValue({
      ...session, mode: "subscription", payment_intent: null, subscription: "sub_legacy",
    });
    const response = await POST(post(approval));
    expect(response.status).toBe(200);
    expect(mockRetrieveSubscription).toHaveBeenCalledWith("sub_legacy");
    expect(mockListInvoices).toHaveBeenCalledWith({ subscription: "sub_legacy", limit: 10 });
    expect(mockListInvoicePayments).toHaveBeenCalledWith({ invoice: "in_initial", status: "paid", limit: 10 });
    expect(mockListCharges).toHaveBeenCalledWith({ payment_intent: "pi_subscription_initial", limit: 10 });
    expect(mockReversalFindUnique).toHaveBeenCalledWith({ where: { stripePaymentIntentId: "pi_subscription_initial" } });
    expect(mockSubscriptionCreate).toHaveBeenCalledWith({ data: expect.objectContaining({
      plan: "one_time", stripeSubscriptionId: null, grantingObligationId: "obl_review",
    }) });
  });

  it("refuses subscription-mode approval when the original charge was refunded or disputed", async () => {
    mockObligationFindUnique.mockResolvedValue({ ...obligation, stripePaymentIntentId: null });
    mockRetrieveSession.mockResolvedValue({
      ...session, mode: "subscription", payment_intent: null, subscription: "sub_legacy",
    });
    mockListCharges.mockResolvedValue({ data: [{
      id: "ch_initial", paid: true, amount: 14900, currency: "usd",
      refunded: true, disputed: false, amount_refunded: 14900,
    }] });
    const response = await POST(post(approval));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual(expect.objectContaining({
      mismatches: expect.arrayContaining(["original charge reversed"]),
    }));
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("revokes the exact existing grant when a partial-refund review is rejected", async () => {
    mockReversalFindUnique.mockResolvedValue({ id: "rev_partial", status: "REVIEW_REQUIRED" });
    mockListCharges.mockResolvedValue({ data: [{
      id: "ch_partial", paid: true, amount: 14900, currency: "usd",
      refunded: false, disputed: false, amount_refunded: 2500,
    }] });
    const response = await POST(post({
      ...approval,
      action: "REJECT",
      reason: "Partial refund access rejected",
      expectedNetAmountCents: 12400,
    }));
    expect(response.status).toBe(200);
    expect(mockSubscriptionUpdateMany).toHaveBeenCalledWith({
      where: { userId: "user_1", plan: "one_time", grantingObligationId: "obl_review" },
      data: { status: "canceled", currentPeriodEnd: expect.any(Date) },
    });
    expect(mockPaymentUpsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ status: "partially_refunded" }),
      update: expect.objectContaining({ status: "partially_refunded" }),
    }));
  });
});
