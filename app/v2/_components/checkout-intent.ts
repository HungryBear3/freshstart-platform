export type CheckoutPlan = "one_time" | "parenting_plan" | "refile_assistance";

export interface CheckoutIntent {
  plan: CheckoutPlan;
  source: string;
}

const PLAN_KEY = "fs_checkout_plan";
const SOURCE_KEY = "fs_checkout_source";
const AUTO_KEY = "fs_auto_checkout";

export function planForTier(_tier: string): CheckoutPlan {
  return "one_time";
}

export function isCheckoutPlan(plan?: string | null): plan is CheckoutPlan {
  return plan === "one_time" || plan === "parenting_plan" || plan === "refile_assistance";
}

export function normalizeCheckoutPlan(plan?: string | null): CheckoutPlan {
  return isCheckoutPlan(plan) ? plan : "one_time";
}

export function buildSignupFirstCheckoutUrl(intent: CheckoutIntent): string {
  const params = new URLSearchParams({
    redirect: "/pricing",
    subscribe: "true",
    plan: normalizeCheckoutPlan(intent.plan),
    source: intent.source,
  });
  return `/auth/signup?${params.toString()}`;
}

export function beginSignupFirstCheckout(intent: CheckoutIntent) {
  if (typeof window === "undefined") return;
  const plan = normalizeCheckoutPlan(intent.plan);
  window.sessionStorage.setItem(PLAN_KEY, plan);
  window.sessionStorage.setItem(SOURCE_KEY, intent.source);
  window.sessionStorage.setItem("subscribe_plan", plan);
  window.location.href = buildSignupFirstCheckoutUrl({ ...intent, plan });
}

export function markCheckoutResumeFromSearch(plan?: string | null, source?: string | null) {
  if (typeof window === "undefined") return;
  const safePlan = normalizeCheckoutPlan(plan);
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
  return {
    plan: normalizeCheckoutPlan(storedPlan),
    source: window.sessionStorage.getItem(SOURCE_KEY) || "pricing_resume",
  };
}

export function clearPendingCheckoutIntent() {
  if (typeof window === "undefined") return;
  for (const key of [PLAN_KEY, SOURCE_KEY, AUTO_KEY, "subscribe_plan", "auto_subscribe"]) {
    window.sessionStorage.removeItem(key);
  }
}
