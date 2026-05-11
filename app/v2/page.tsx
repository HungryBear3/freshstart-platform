// /v2 alias — renders the same view as the root `/`. Kept in place so any
// existing /v2 links keep working.
import type { Metadata } from "next";
import { HomeView } from "./_components/HomeView";

export const metadata: Metadata = {
  title: "FreshStart-IL — Your Illinois divorce, filed right, from $149",
  description:
    "Court-ready Illinois divorce forms and step-by-step filing guidance for all 102 counties — without $15,000 attorney fees. 7-day free trial, 30-day money-back guarantee.",
  alternates: { canonical: "/" },
};

export default function V2Homepage() {
  return <HomeView />;
}
