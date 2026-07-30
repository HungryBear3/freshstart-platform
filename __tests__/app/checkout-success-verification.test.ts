import { readFileSync } from "fs";
import { join } from "path";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("verified checkout success analytics", () => {
  it("requires a server-verified paid obligation instead of trusting query flags", () => {
    const dashboard = read("app/dashboard/page.tsx");
    const tracker = read("components/analytics/checkout-success-tracker.tsx");
    const route = read("app/api/stripe/create-checkout-session/route.ts");

    const conversionRoute = read("app/api/stripe/checkout-conversion/route.ts");

    expect(route).toContain("session_id={CHECKOUT_SESSION_ID}");
    expect(dashboard).toMatch(/checkoutObligation\.findFirst/);
    expect(dashboard).toMatch(/checkoutReturn\?\.status === "PAID"/);
    expect(dashboard).toMatch(/stripeSessionId:\s*sessionId/);
    expect(dashboard).toMatch(/<CheckoutSuccessTracker sessionId=/);
    expect(dashboard).toContain("Please do not pay again");
    expect(tracker).toContain("sessionId: string | null");
    expect(tracker).toContain("router.refresh()");
    expect(tracker).toContain("/api/stripe/checkout-conversion");
    expect(tracker).toContain("window.history.replaceState");
    expect(conversionRoute).toMatch(/conversionTrackedAt:\s*null/);
    expect(conversionRoute).toMatch(/conversionLeaseExpiresAt/);
    expect(conversionRoute).toMatch(/action === "delivered"/);
    expect(tracker).toContain('action: "claim"');
    expect(tracker).toContain('action: "delivered"');
    expect(tracker).toMatch(/if \(!cancelled && delivery\.delivered\) clearSession\(\)/);
    expect(tracker).not.toContain(".finally(");
    expect(conversionRoute).toMatch(/userId:\s*user\.id/);
    expect(tracker).not.toMatch(/success\s*!==\s*["']true["']/);
  });
});
