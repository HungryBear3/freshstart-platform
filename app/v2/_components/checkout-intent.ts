export type CheckoutPlan = "annual" | "one_time" | "parenting_plan" | "refile_assistance";

export interface CheckoutIntent {
  plan: CheckoutPlan;
  source: string;
}

const PLAN_KEY = "fs_checkout_plan";
const SOURCE_KEY = "fs_checkout_source";
const AUTO_KEY = "fs_auto_checkout";

export function planForTier(tier: string): CheckoutPlan {
  return "one_time";
}

export function buildSignupFirstCheckoutUrl(intent: CheckoutIntent): string {
  const params = new URLSearchParams({
    redirect: "/pricing",
    subscribe: "true",
    plan: intent.plan,
    source: intent.source,
  });
  return `/auth/signup?${params.toString()}`;
}

export function beginSignupFirstCheckout(intent: CheckoutIntent) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(PLAN_KEY, intent.plan);
  window.sessionStorage.setItem(SOURCE_KEY, intent.source);
  window.sessionStorage.setItem("subscribe_plan", intent.plan);
  window.location.href = buildSignupFirstCheckoutUrl(intent);
}

export function isCheckoutPlan(plan?: string | null): plan is CheckoutPlan {
  return plan === "annual" || plan === "one_time" || plan === "parenting_plan" || plan === "refile_assistance";
}

export function markCheckoutResumeFromSearch(plan?: string | null, source?: string | null) {
  if (typeof window === "undefined") return;
  const safePlan: CheckoutPlan = isCheckoutPlan(plan) ? plan : "one_time";
  window.sessionStorage.setItem(PLAN_KEY, safePlan);
  window.sessionStorage.setItem(SOURCE_KEY, source || "auth_resume");
  window.sessionStorage.setItem(AUTO_KEY, "true");
  window.sessionStorage.setItem("auto_subscribe", "true");
}

export function getPendingCheckoutIntent(): CheckoutIntent | null {
  if (typeof window === "undefined") return null;
  const autoCheckout = window.sessionStorage.getItem(AUTO_KEY) === "true" ||
    window.sessionStorage.getItem("auto_subscribe") === "true";
  if (!autoCheckout) return null;

  const storedPlan = window.sessionStorage.getItem(PLAN_KEY) ||
    window.sessionStorage.getItem("subscribe_plan");
  const plan: CheckoutPlan = isCheckoutPlan(storedPlan) ? storedPlan : "one_time";
  return {
    plan,
    source: window.sessionStorage.getItem(SOURCE_KEY) || "pricing_resume",
  };
}

export function clearPendingCheckoutIntent() {
  if (typeof window === "undefined") return;
  for (const key of [PLAN_KEY, SOURCE_KEY, AUTO_KEY, "subscribe_plan", "auto_subscribe"]) {
    window.sessionStorage.removeItem(key);
  }
}
