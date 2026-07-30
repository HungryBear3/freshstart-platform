/**
 * @jest-environment node
 */
const mockGetCurrentUser = jest.fn();
const mockCreateCustomer = jest.fn();
const mockRetrieveCustomer = jest.fn();
const mockCreateCheckoutSession = jest.fn();
const mockRetrieveCheckoutSession = jest.fn();
const mockRetrievePrice = jest.fn();
const mockSubscriptionFindUnique = jest.fn();
const mockObligationUpsert = jest.fn();
const mockObligationFindFirst = jest.fn();
const mockObligationUpdateMany = jest.fn();
const mockObligationFindUnique = jest.fn();
const mockTransaction = jest.fn();

jest.mock("@/lib/auth/session", () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}));
jest.mock("@/lib/stripe/config", () => ({
  stripe: {
    customers: {
      create: (...args: unknown[]) => mockCreateCustomer(...args),
      retrieve: (...args: unknown[]) => mockRetrieveCustomer(...args),
    },
    prices: { retrieve: (...args: unknown[]) => mockRetrievePrice(...args) },
    checkout: { sessions: {
      create: (...args: unknown[]) => mockCreateCheckoutSession(...args),
      retrieve: (...args: unknown[]) => mockRetrieveCheckoutSession(...args),
    } },
  },
}));
jest.mock("@/lib/db", () => ({
  prisma: {
    subscription: { findUnique: (...args: unknown[]) => mockSubscriptionFindUnique(...args) },
    checkoutObligation: {
      findFirst: (...args: unknown[]) => mockObligationFindFirst(...args),
      upsert: (...args: unknown[]) => mockObligationUpsert(...args),
      updateMany: (...args: unknown[]) => mockObligationUpdateMany(...args),
      findUnique: (...args: unknown[]) => mockObligationFindUnique(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

import { NextRequest } from "next/server";
import { POST } from "@/app/api/stripe/create-checkout-session/route";

function request(body: unknown) {
  return new NextRequest("http://localhost:3000/api/stripe/create-checkout-session", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
}
function malformedRequest() {
  return new NextRequest("http://localhost:3000/api/stripe/create-checkout-session", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: "{not-json",
  });
}

const obligation = {
  id: "obl_1", contractKey: "contract_1", userId: "user_1", plan: "one_time",
  cycle: 1,
  stripeCustomerId: null, stripeSessionId: null, stripePriceId: "price_one_time",
  expectedAmountCents: 14900, expectedCurrency: "usd", quantity: 1, attempt: 1,
  status: "PENDING",
};

describe("POST /api/stripe/create-checkout-session", () => {
  const oldEnv = process.env;
  beforeEach(() => {
    process.env = { ...oldEnv, STRIPE_SECRET_KEY: "sk_test_local", ONE_TIME_PRICE_ID: "price_one_time", NEXT_PUBLIC_APP_URL: "https://www.freshstart-il.com" };
    mockGetCurrentUser.mockResolvedValue({ id: "user_1", email: "user@example.com" });
    mockCreateCustomer.mockResolvedValue({ id: "cus_1" });
    mockRetrieveCustomer.mockResolvedValue({ id: "cus_1", deleted: false });
    mockSubscriptionFindUnique.mockResolvedValue(null);
    mockRetrievePrice.mockResolvedValue({ id: "price_one_time", active: true, type: "one_time", unit_amount: 14900, currency: "usd" });
    mockObligationFindFirst.mockResolvedValue(null);
    mockObligationUpsert.mockResolvedValue(obligation);
    mockObligationUpdateMany.mockResolvedValue({ count: 1 });
    mockObligationFindUnique.mockResolvedValue({ ...obligation, stripeCustomerId: "cus_1", stripeSessionId: "cs_1", status: "OPEN" });
    mockCreateCheckoutSession.mockResolvedValue({ id: "cs_1", url: "https://checkout.test/session", status: "open" });
    mockRetrieveCheckoutSession.mockResolvedValue({ id: "cs_1", url: "https://checkout.test/session", status: "open" });
    mockTransaction.mockImplementation(async (fn: any) => fn(require("@/lib/db").prisma));
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
  });
  afterEach(() => { process.env = oldEnv; jest.restoreAllMocks(); jest.clearAllMocks(); });

  it("rejects malformed JSON instead of defaulting a plan", async () => {
    const response = await POST(malformedRequest());
    expect(response.status).toBe(400);
    expect(mockRetrievePrice).not.toHaveBeenCalled();
  });

  it.each(["annual", null, "", false, 0])("rejects explicit invalid plan %p before provider work", async (plan) => {
    const response = await POST(request({ plan }));
    expect(response.status).toBe(400);
    expect(mockRetrievePrice).not.toHaveBeenCalled();
    expect(mockCreateCheckoutSession).not.toHaveBeenCalled();
  });

  it.each(["parenting_plan", "refile_assistance"])("disables add-on checkout for %s", async (plan) => {
    const response = await POST(request({ plan }));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "Add-on checkout is unavailable until fulfillment is supported" });
    expect(mockCreateCheckoutSession).not.toHaveBeenCalled();
  });

  it("validates the configured Price contract before persisting or creating a session", async () => {
    mockRetrievePrice.mockResolvedValue({ id: "price_one_time", active: false, type: "recurring", unit_amount: 14900, currency: "usd" });
    const response = await POST(request({ plan: "one_time" }));
    expect(response.status).toBe(500);
    expect(mockObligationUpsert).not.toHaveBeenCalled();
    expect(mockCreateCheckoutSession).not.toHaveBeenCalled();
  });

  it("persists an exact obligation before provider session creation and uses deterministic idempotency", async () => {
    const order: string[] = [];
    mockObligationUpsert.mockImplementation(async () => { order.push("obligation"); return obligation; });
    mockCreateCustomer.mockImplementation(async () => { order.push("customer"); return { id: "cus_1" }; });
    mockCreateCheckoutSession.mockImplementation(async () => { order.push("session"); return { id: "cs_1", url: "https://checkout.test/session", status: "open" }; });
    const response = await POST(request({ plan: "one_time", source: "pricing" }));
    expect(response.status).toBe(200);
    expect(order).toEqual(["obligation", "customer", "session"]);
    expect(mockObligationUpsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ stripeCustomerId: null, stripePriceId: "price_one_time", expectedAmountCents: 14900, expectedCurrency: "usd", quantity: 1 }),
    }));
    expect(mockCreateCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "payment", line_items: [{ price: "price_one_time", quantity: 1 }],
        success_url: expect.stringContaining("session_id={CHECKOUT_SESSION_ID}"),
        metadata: { obligationId: "obl_1" },
      }),
      { idempotencyKey: "contract_1:1" },
    );
  });

  it("retrieves and reuses an already-bound open session on retry", async () => {
    const open = { ...obligation, stripeCustomerId: "cus_1", stripeSessionId: "cs_existing", status: "OPEN" };
    mockObligationFindFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(open);
    mockObligationUpsert.mockResolvedValue(open);
    mockRetrieveCheckoutSession.mockResolvedValue({ id: "cs_existing", status: "open", url: "https://checkout.test/existing", customer: "cus_1" });
    const response = await POST(request({ plan: "one_time" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ sessionId: "cs_existing", url: "https://checkout.test/existing", reused: true });
    expect(mockCreateCheckoutSession).not.toHaveBeenCalled();
  });

  it("fails closed when binding loses and no exact winner exists", async () => {
    mockObligationUpdateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });
    mockObligationFindUnique.mockResolvedValue({ ...obligation, stripeCustomerId: "cus_1", stripeSessionId: "cs_other", status: "OPEN" });
    const response = await POST(request({ plan: "one_time" }));
    expect(response.status).toBe(500);
  });

  it.each(["active", "trialing", "past_due"])("rejects historical annual status %s", async (status) => {
    mockSubscriptionFindUnique.mockResolvedValue({ plan: "annual", status, stripeSubscriptionId: "sub_old", stripeCustomerId: "cus_old" });
    const response = await POST(request({ plan: "one_time" }));
    expect(response.status).toBe(409);
    expect(mockCreateCheckoutSession).not.toHaveBeenCalled();
  });

  it("rejects repurchase while an existing one-time access period is active", async () => {
    mockSubscriptionFindUnique.mockResolvedValue({
      plan: "one_time", status: "active", currentPeriodEnd: new Date(Date.now() + 60_000), stripeCustomerId: "cus_1",
    });
    const response = await POST(request({ plan: "one_time" }));
    expect(response.status).toBe(409);
    expect(mockRetrievePrice).toHaveBeenCalled();
    expect(mockTransaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
  });

  it("creates a new purchase cycle after prior 60-day access expired", async () => {
    mockSubscriptionFindUnique.mockResolvedValue({
      plan: "one_time", status: "active", currentPeriodEnd: new Date(Date.now() - 60_000), stripeCustomerId: "cus_1",
    });
    mockObligationFindFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ ...obligation, status: "PAID", stripeCustomerId: "cus_1" });
    mockObligationUpsert.mockResolvedValue({ ...obligation, id: "obl_2", contractKey: "contract_2", cycle: 2 });
    const response = await POST(request({ plan: "one_time" }));
    expect(response.status).toBe(200);
    expect(mockObligationUpsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ cycle: 2, status: "PENDING" }),
    }));
    expect(mockCreateCheckoutSession).toHaveBeenCalledWith(expect.any(Object), { idempotencyKey: "contract_2:1" });
  });

  it("starts a new purchase cycle after an admin-rejected recovery", async () => {
    mockObligationFindFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({
      ...obligation, status: "REJECTED", stripeCustomerId: "cus_1",
    });
    mockObligationUpsert.mockResolvedValue({ ...obligation, id: "obl_2", contractKey: "contract_2", cycle: 2 });
    const response = await POST(request({ plan: "one_time" }));
    expect(response.status).toBe(200);
    expect(mockObligationUpsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ cycle: 2, status: "PENDING" }),
    }));
  });

  it("atomically replaces an expired bound session with the next deterministic attempt", async () => {
    const open = { ...obligation, stripeCustomerId: "cus_1", stripeSessionId: "cs_expired", status: "OPEN" };
    mockObligationFindFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(open);
    mockObligationUpsert.mockResolvedValue(open);
    mockRetrieveCheckoutSession.mockResolvedValue({ id: "cs_expired", status: "expired", url: null, customer: "cus_1" });
    mockObligationFindUnique.mockResolvedValue({ ...obligation, stripeCustomerId: "cus_1", attempt: 2 });
    const response = await POST(request({ plan: "one_time" }));
    expect(response.status).toBe(200);
    expect(mockObligationUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ stripeSessionId: "cs_expired", status: "OPEN", attempt: 1 }),
      data: { stripeSessionId: null, status: "PENDING", attempt: { increment: 1 } },
    }));
    expect(mockCreateCheckoutSession).toHaveBeenCalledWith(expect.any(Object), { idempotencyKey: "contract_1:2" });
  });

  it("reuses a safe legacy Stripe customer instead of minting a duplicate", async () => {
    mockSubscriptionFindUnique.mockResolvedValue({ plan: "annual", status: "canceled", stripeCustomerId: "cus_legacy" });
    mockRetrieveCustomer.mockResolvedValue({ id: "cus_legacy", deleted: false });
    const response = await POST(request({ plan: "one_time" }));
    expect(response.status).toBe(200);
    expect(mockCreateCustomer).not.toHaveBeenCalled();
    expect(mockCreateCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({ customer: "cus_legacy" }), expect.any(Object));
  });
});
