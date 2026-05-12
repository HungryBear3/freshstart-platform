// /v2 alias — renders the same view as the root `/`. Kept in place so any
// existing /v2 links keep working.
import type { Metadata } from "next";
import { HomeView } from "./_components/HomeView";

export const metadata: Metadata = {
  title: "FreshStart-IL — Your Illinois divorce, filed right, from $149",
  description:
    "Illinois divorce form drafts and step-by-step filing guidance available in all 102 counties. 7-day free trial, 30-day money-back guarantee.",
  alternates: { canonical: "/" },
};

export default function V2Homepage() {
  return <HomeView />;
}
