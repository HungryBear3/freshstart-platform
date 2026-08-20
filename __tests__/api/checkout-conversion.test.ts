/** @jest-environment node */
const mockGetCurrentUser = jest.fn();
const mockFindFirst = jest.fn();

jest.mock("@/lib/auth/session", () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}));
jest.mock("@/lib/db", () => ({
  prisma: { checkoutObligation: {
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
    mockFindFirst.mockResolvedValue(null);
  });
  afterEach(() => jest.clearAllMocks());

  it("reports the authenticated exact paid-state without mutating conversion tracking", async () => {
    const first = await POST(request("cs_paid"));
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({
      shouldTrack: false,
      claimToken: null,
      complete: false,
      retryAfterMs: 5000,
      plan: "one_time",
      price: 149,
    });
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({
        userId: "user_1",
        stripeSessionId: "cs_paid",
        status: "PAID",
        plan: "one_time",
        expectedAmountCents: 14900,
        expectedCurrency: "usd",
        settledAmountCents: 14900,
        settledCurrency: "usd",
      }),
      select: { conversionTrackedAt: true, conversionLeaseExpiresAt: true },
    });

    mockFindFirst.mockResolvedValue({ conversionTrackedAt: new Date(), conversionLeaseExpiresAt: null });
    const replay = await POST(request("cs_paid"));
    expect(await replay.json()).toEqual(expect.objectContaining({ shouldTrack: false, complete: true }));
  });

  it("rejects unauthenticated and malformed claims before mutation", async () => {
    mockGetCurrentUser.mockResolvedValueOnce(null);
    expect((await POST(request("cs_paid"))).status).toBe(401);
    expect((await POST(request("not-a-session"))).status).toBe(400);
    expect(mockFindFirst).not.toHaveBeenCalled();
  });
});
