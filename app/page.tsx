// Root homepage now renders the v2 redesign. The legacy in-flight homepage
// components remain on disk untouched under components/home/* and are
// simply not mounted here. VisitorCounter is NOT imported on this path —
// the v2 design intentionally omits the visitor counter.
import type { Metadata } from "next";
import { HomeView } from "./v2/_components/HomeView";

export const metadata: Metadata = {
  title: "FreshStart IL — Illinois divorce form preparation from $149",
  description:
    "FreshStart IL prepares Illinois uncontested-divorce form drafts and filing guidance. $149 one-time for 60 days of service access, no subscription; you review and file.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <HomeView />;
}
