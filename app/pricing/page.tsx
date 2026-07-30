// Root pricing route now renders the v2 redesign. The legacy pricing page
// content (which used the legacy MainLayout + footer that mounts
// VisitorCounter) is replaced. No Stripe SubscribeButton / AutoSubscribe
// are imported on this path; in-card CTAs route through /api/_stub/*
// handlers per v2 preview rules.
import type { Metadata } from "next";
import { PricingView } from "../v2/_components/PricingView";
import { DEFAULT_OG_IMAGE, DEFAULT_TWITTER_IMAGE } from "@/lib/seo-metadata";

export const metadata: Metadata = {
  title: "Pricing — $149 one-time Illinois divorce form preparation",
  description:
    "FreshStart IL document-preparation assistance for straightforward Illinois uncontested divorce: $149 one-time for 60 days of service access, no subscription, with a published 30-day refund policy.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing | FreshStart IL",
    description: "Illinois uncontested-divorce form preparation for $149 one-time with 60 days of service access and no subscription.",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function PricingPage() {
  return <PricingView />;
}
