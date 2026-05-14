// /v2/pricing alias — renders the same view as the root `/pricing`.
import type { Metadata } from "next";
import { PricingView } from "../_components/PricingView";

export const metadata: Metadata = {
  title: "Pricing — From $149 for an Illinois divorce filing",
  description:
    "Essential ($149 one-time) and Plus ($299/yr) FreshStart-IL plans for Illinois divorce filings. 7-day free trial, 30-day money-back guarantee, available in all 102 Illinois counties.",
  alternates: { canonical: "/pricing" },
};

export default function V2PricingPage() {
  return <PricingView />;
}
