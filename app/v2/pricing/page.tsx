// /v2/pricing alias — renders the same view as the root `/pricing`.
import type { Metadata } from "next";
import { PricingView } from "../_components/PricingView";

export const metadata: Metadata = {
  title: "Pricing — $149 one-time Illinois divorce form preparation",
  description:
    "FreshStart IL document-preparation assistance for straightforward Illinois uncontested divorce: $149 one-time, no subscription, with a published 30-day refund policy.",
  alternates: { canonical: "/pricing" },
};

export default function V2PricingPage() {
  return <PricingView />;
}
