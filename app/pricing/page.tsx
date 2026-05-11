// Root pricing route now renders the v2 redesign. The legacy pricing page
// content (which used the legacy MainLayout + footer that mounts
// VisitorCounter) is replaced. No Stripe SubscribeButton / AutoSubscribe
// are imported on this path; in-card CTAs route through /api/_stub/*
// handlers per v2 preview rules.
import type { Metadata } from "next";
import { PricingView } from "../v2/_components/PricingView";

export const metadata: Metadata = {
  title: "Pricing — FreshStart-IL · From $149 for an Illinois divorce filing",
  description:
    "Essential ($149 one-time) and Plus ($299/yr) FreshStart-IL plans for Illinois divorce filings. 7-day free trial, 30-day money-back guarantee, all 102 Illinois counties.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing | FreshStart-IL",
    description: "Affordable Illinois divorce document preparation with a 7-day free trial.",
  },
};

export default function PricingPage() {
  return <PricingView />;
}
