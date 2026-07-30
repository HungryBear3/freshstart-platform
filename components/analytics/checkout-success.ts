import { normalizeCheckoutPlan, type CheckoutPlan } from "@/app/v2/_components/checkout-intent";

const CHECKOUT_VALUE_BY_PLAN: Record<CheckoutPlan, number> = {
  one_time: 149,
  parenting_plan: 29,
  refile_assistance: 49,
};

export function resolveCheckoutSuccess(
  returnedPlan?: string | null,
  storedPlan?: string | null,
): { plan: CheckoutPlan; price: number } {
  const plan = normalizeCheckoutPlan(returnedPlan || storedPlan);
  return { plan, price: CHECKOUT_VALUE_BY_PLAN[plan] };
}
