/** @jest-environment node */
const mockGetCurrentUser = jest.fn();
const mockSubscriptionFindUnique = jest.fn();

jest.mock("@/lib/auth/session", () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}));
jest.mock("@/lib/db", () => ({
  prisma: { subscription: { findUnique: (...args: unknown[]) => mockSubscriptionFindUnique(...args) } },
}));

import { NextRequest } from "next/server";
import { GET as readStatus, POST as writeSync } from "@/app/api/stripe/sync/route";
import { GET as legacyGet, POST as legacyPost } from "@/app/api/stripe/sync-subscription/route";

const request = () => new NextRequest("http://localhost/api/stripe/sync", { method: "POST" });

describe("legacy Stripe sync routes", () => {
  beforeEach(() => {
    mockGetCurrentUser.mockResolvedValue({ id: "user_1", email: "u@example.com" });
    mockSubscriptionFindUnique.mockResolvedValue(null);
  });
  afterEach(() => jest.clearAllMocks());

  it("retains only the authenticated read-only local status lookup", async () => {
    const response = await readStatus(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ subscription: null });
    expect(mockSubscriptionFindUnique).toHaveBeenCalledWith({ where: { userId: "user_1" } });
  });

  it("reports an ended active subscription as inactive", async () => {
    mockSubscriptionFindUnique.mockResolvedValue({
      id: "sub_ended", status: "active", plan: "one_time",
      currentPeriodEnd: new Date(Date.now() - 1), currentPeriodStart: new Date(Date.now() - 60_000),
      trialEnd: null, trialStart: null, cancelAtPeriodEnd: false,
    });
    const response = await readStatus(request());
    expect(response.status).toBe(200);
    expect((await response.json()).subscription.isActive).toBe(false);
  });

  it.each([writeSync, legacyGet, legacyPost])("fails closed for every legacy writer", async (handler) => {
    const response = await handler(request());
    expect(response.status).toBe(410);
    expect(mockSubscriptionFindUnique).not.toHaveBeenCalled();
  });

  it("does not disclose disabled routes to unauthenticated callers", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    expect((await writeSync(request())).status).toBe(401);
    expect((await legacyPost(request())).status).toBe(401);
  });
});
