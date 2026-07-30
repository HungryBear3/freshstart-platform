/** @jest-environment node */
const mockGetCurrentUser = jest.fn();
const mockUpdateMany = jest.fn();
const mockFindFirst = jest.fn();

jest.mock("@/lib/auth/session", () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}));
jest.mock("@/lib/db", () => ({
  prisma: { checkoutObligation: {
    updateMany: (...args: unknown[]) => mockUpdateMany(...args),
    findFirst: (...args: unknown[]) => mockFindFirst(...args),
  } },
}));

import { NextRequest } from "next/server";
import { POST } from "@/app/api/stripe/checkout-conversion/route";

function request(sessionId: unknown, extra: Record<string, unknown> = {}) {
  return new NextRequest("http://localhost/api/stripe/checkout-conversion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, ...extra }),
  });
}

describe("POST /api/stripe/checkout-conversion", () => {
  beforeEach(() => {
    mockGetCurrentUser.mockResolvedValue({ id: "user_1" });
    mockUpdateMany.mockResolvedValue({ count: 1 });
    mockFindFirst.mockResolvedValue(null);
  });
  afterEach(() => jest.clearAllMocks());

  it("claims conversion exactly once against the authenticated paid contract", async () => {
    const first = await POST(request("cs_paid"));
    expect(first.status).toBe(200);
    const claim = await first.json();
    expect(claim).toEqual(expect.objectContaining({
      shouldTrack: true, complete: false, plan: "one_time", price: 149,
      claimToken: expect.any(String),
    }));
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        userId: "user_1",
        stripeSessionId: "cs_paid",
        status: "PAID",
        plan: "one_time",
        expectedAmountCents: 14900,
        expectedCurrency: "usd",
        settledAmountCents: 14900,
        settledCurrency: "usd",
        conversionTrackedAt: null,
      }),
      data: {
        conversionClaimToken: expect.any(String),
        conversionLeaseExpiresAt: expect.any(Date),
      },
    });

    mockUpdateMany.mockResolvedValue({ count: 0 });
    mockFindFirst.mockResolvedValue({ conversionTrackedAt: new Date(), conversionLeaseExpiresAt: null });
    const replay = await POST(request("cs_paid"));
    expect(await replay.json()).toEqual(expect.objectContaining({ shouldTrack: false, complete: true }));
  });

  it("marks conversion complete only after the matching live lease is acknowledged", async () => {
    const response = await POST(request("cs_paid", { action: "delivered", claimToken: "lease_1" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ delivered: true });
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        userId: "user_1", stripeSessionId: "cs_paid", conversionTrackedAt: null,
        conversionClaimToken: "lease_1", conversionLeaseExpiresAt: { gt: expect.any(Date) },
      }),
      data: { conversionTrackedAt: expect.any(Date), conversionClaimToken: null, conversionLeaseExpiresAt: null },
    });
  });

  it("rejects unauthenticated and malformed claims before mutation", async () => {
    mockGetCurrentUser.mockResolvedValueOnce(null);
    expect((await POST(request("cs_paid"))).status).toBe(401);
    expect((await POST(request("not-a-session"))).status).toBe(400);
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });
});
