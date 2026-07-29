// /v2 alias — renders the same view as the root `/`. Kept in place so any
// existing /v2 links keep working.
import type { Metadata } from "next";
import { HomeView } from "./_components/HomeView";

export const metadata: Metadata = {
  title: "FreshStart IL — Illinois divorce form preparation from $149",
  description:
    "FreshStart IL prepares Illinois uncontested-divorce form drafts and filing guidance. $149 one-time, no subscription; you review and file.",
  alternates: { canonical: "/" },
};

export default function V2Homepage() {
  return <HomeView />;
}
