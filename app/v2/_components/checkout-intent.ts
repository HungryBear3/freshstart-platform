export type CheckoutPlan = "one_time" | "parenting_plan" | "refile_assistance";

export interface CheckoutIntent {
  plan: CheckoutPlan;
  source: string;
}

const PLAN_KEY = "fs_checkout_plan";
const SOURCE_KEY = "fs_checkout_source";
const AUTO_KEY = "fs_auto_checkout";

/**
 * Every sessionStorage key a pending checkout intent can occupy, including the
 * two legacy `subscribe_*`/`auto_*` names `getPendingCheckoutIntent` still
 * reads. Exported so callers — and tests — enumerate the set from here rather
 * than restating it and drifting.
 */
export const CHECKOUT_INTENT_STORAGE_KEYS = [
  PLAN_KEY,
  SOURCE_KEY,
  AUTO_KEY,
  "subscribe_plan",
  "auto_subscribe",
] as const;

export function planForTier(_tier: string): CheckoutPlan {
  return "one_time";
}

export function isCheckoutPlan(plan?: string | null): plan is CheckoutPlan {
  return plan === "one_time" || plan === "parenting_plan" || plan === "refile_assistance";
}

export function normalizeCheckoutPlan(plan?: string | null): CheckoutPlan {
  return isCheckoutPlan(plan) ? plan : "one_time";
}

/**
 * The two refusal codes the checkout route uses to say "the fit check has to
 * happen first". Anything else from checkout is a genuine failure and must
 * still be surfaced as one.
 */
const FIT_CHECK_REQUIRED_CODE = "fit_check_required";
const FIT_CHECK_BLOCKED_CODE = "fit_check_blocked";
const FIT_CHECK_BLOCK_CODES = [FIT_CHECK_REQUIRED_CODE, FIT_CHECK_BLOCKED_CODE];

export function isFitCheckBlock(code?: string | null): boolean {
  return typeof code === "string" && FIT_CHECK_BLOCK_CODES.includes(code);
}

/**
 * True only when checkout should not automatically retry after the user has a
 * current non-fit assessment. A later, deliberately submitted assessment can
 * supersede it; `fit_check_required` instead sends the current attempt directly
 * through the questionnaire.
 */
export function isFitCheckHardBlock(code?: string | null): boolean {
  return code === FIT_CHECK_BLOCKED_CODE;
}

export function buildFitCheckUrl(intent: CheckoutIntent): string {
  const params = new URLSearchParams({
    plan: normalizeCheckoutPlan(intent.plan),
    source: intent.source,
  });
  return `/fit-check?${params.toString()}`;
}

/**
 * Where a signed-out visitor is sent to recover the fit check: sign in, then
 * come straight back to the same questionnaire with the plan and source the
 * user arrived with still attached.
 */
export function buildFitCheckSignInUrl(intent: CheckoutIntent): string {
  const params = new URLSearchParams({ callbackUrl: buildFitCheckUrl(intent) });
  return `/auth/signin?${params.toString()}`;
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

/**
 * Arms a pending checkout intent.
 *
 * Only a deliberate user action may call this. Producing a fit result is not
 * such an action: a `fit` outcome merely permits checkout, it does not request
 * it, so nothing is armed until the user asks to continue.
 */
export function armPendingCheckoutIntent(intent: CheckoutIntent) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(PLAN_KEY, normalizeCheckoutPlan(intent.plan));
  window.sessionStorage.setItem(SOURCE_KEY, intent.source);
  window.sessionStorage.setItem(AUTO_KEY, "true");
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
  for (const key of CHECKOUT_INTENT_STORAGE_KEYS) {
    window.sessionStorage.removeItem(key);
  }
}
