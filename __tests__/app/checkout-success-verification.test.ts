import { readFileSync } from "fs";
import { join } from "path";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("verified checkout success analytics", () => {
  it("requires a server-verified paid obligation instead of trusting query flags", () => {
    const dashboard = read("app/dashboard/page.tsx");
    const tracker = read("components/analytics/checkout-success-tracker.tsx");
    const route = read("app/api/stripe/create-checkout-session/route.ts");

    expect(route).toContain("session_id={CHECKOUT_SESSION_ID}");
    expect(dashboard).toMatch(/checkoutObligation\.findFirst/);
    expect(dashboard).toMatch(/checkoutReturn\?\.status === "PAID"/);
    expect(dashboard).toMatch(/stripeSessionId:\s*sessionId/);
    expect(dashboard).toMatch(/<CheckoutSuccessTracker sessionId=/);
    expect(dashboard).toContain("Please do not pay again");
    expect(tracker).toContain("sessionId: string | null");
    expect(tracker).toContain("router.refresh()");
    expect(tracker).toContain("window.history.replaceState");
    expect(tracker).not.toContain("/api/stripe/checkout-conversion");
    expect(tracker).not.toContain('action: "claim"');
    expect(tracker).not.toContain('action: "delivered"');
    expect(tracker).not.toContain("analytics.subscriptionComplete");
    expect(read("lib/analytics/events.ts")).not.toMatch(/subscriptionComplete|trackEvent\(['"]purchase/);
    expect(tracker).not.toContain(".finally(");
    expect(tracker).not.toMatch(/success\s*!==\s*["']true["']/);
  });
});
