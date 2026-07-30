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
import { GET } from "@/app/api/stripe/sync/route";

describe("read-only Stripe sync authorization", () => {
  beforeEach(() => {
    mockGetCurrentUser.mockResolvedValue({ id: "user_1" });
  });
  afterEach(() => jest.clearAllMocks());

  it("fails closed when an active-like row has no period end", async () => {
    mockSubscriptionFindUnique.mockResolvedValue({
      id: "sub_1", status: "active", plan: "annual", currentPeriodEnd: null,
      currentPeriodStart: null, cancelAtPeriodEnd: false, trialStart: null, trialEnd: null,
    });
    const response = await GET(new NextRequest("http://localhost/api/stripe/sync"));
    expect(response.status).toBe(200);
    expect((await response.json()).subscription.isActive).toBe(false);
  });

  it("keeps an active-like row with a future period active", async () => {
    mockSubscriptionFindUnique.mockResolvedValue({
      id: "sub_1", status: "active", plan: "one_time", currentPeriodEnd: new Date(Date.now() + 60_000),
      currentPeriodStart: new Date(), cancelAtPeriodEnd: false, trialStart: null, trialEnd: null,
    });
    const response = await GET(new NextRequest("http://localhost/api/stripe/sync"));
    expect((await response.json()).subscription.isActive).toBe(true);
  });
});
