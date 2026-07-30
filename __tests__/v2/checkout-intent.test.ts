/**
 * @jest-environment jsdom
 */
import {
  buildSignupFirstCheckoutUrl,
  getPendingCheckoutIntent,
  isCheckoutPlan,
  markCheckoutResumeFromSearch,
} from "@/app/v2/_components/checkout-intent";
import { resolveCheckoutSuccess } from "@/components/analytics/checkout-success";

describe("one-time public checkout intent", () => {
  beforeEach(() => window.sessionStorage.clear());

  it("does not accept annual as a new checkout plan", () => {
    expect(isCheckoutPlan("annual")).toBe(false);
    expect(isCheckoutPlan("one_time")).toBe(true);
  });

  it("normalizes a stale annual signup URL to one_time", () => {
    const url = buildSignupFirstCheckoutUrl({
      plan: "annual" as never,
      source: "stale_link",
    });
    expect(url).toContain("plan=one_time");
    expect(url).not.toContain("plan=annual");
  });

  it("normalizes stale annual session state before checkout resumes", () => {
    markCheckoutResumeFromSearch("annual", "stale_session");
    expect(getPendingCheckoutIntent()).toEqual({
      plan: "one_time",
      source: "stale_session",
    });
  });

  it("uses the returned plan and accurate one-time/add-on values for checkout analytics", () => {
    expect(resolveCheckoutSuccess("one_time", "annual")).toEqual({ plan: "one_time", price: 149 });
    expect(resolveCheckoutSuccess("parenting_plan", null)).toEqual({ plan: "parenting_plan", price: 29 });
    expect(resolveCheckoutSuccess("refile_assistance", null)).toEqual({ plan: "refile_assistance", price: 49 });
    expect(resolveCheckoutSuccess(null, "annual")).toEqual({ plan: "one_time", price: 149 });
  });
});
