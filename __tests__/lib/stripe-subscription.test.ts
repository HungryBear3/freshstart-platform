/** @jest-environment node */
const mockSubscriptionFindUnique = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    subscription: {
      findUnique: (...args: unknown[]) => mockSubscriptionFindUnique(...args),
    },
  },
}));

import { getUserSubscription, hasActiveSubscription } from "@/lib/stripe/subscription";

describe("subscription authorization", () => {
  afterEach(() => jest.clearAllMocks());

  it("treats an active row whose access period ended as inactive", async () => {
    mockSubscriptionFindUnique.mockResolvedValue({
      id: "sub_1",
      status: "active",
      plan: "one_time",
      currentPeriodEnd: new Date(Date.now() - 1),
      cancelAtPeriodEnd: false,
      trialEnd: null,
    });

    expect((await getUserSubscription("user_1"))?.isActive).toBe(false);
    expect(await hasActiveSubscription("user_1")).toBe(false);
  });

  it("keeps an active row with a future access boundary active", async () => {
    mockSubscriptionFindUnique.mockResolvedValue({
      id: "sub_1",
      status: "active",
      plan: "one_time",
      currentPeriodEnd: new Date(Date.now() + 60_000),
      cancelAtPeriodEnd: false,
      trialEnd: null,
    });

    expect(await hasActiveSubscription("user_1")).toBe(true);
  });
});
