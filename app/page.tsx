// Root homepage now renders the v2 redesign. The legacy in-flight homepage
// components remain on disk untouched under components/home/* and are
// simply not mounted here. VisitorCounter is NOT imported on this path —
// the v2 design intentionally omits the visitor counter (replaced by the
// "all 102 counties" footer trust line).
import type { Metadata } from "next";
import { HomeView } from "./v2/_components/HomeView";

export const metadata: Metadata = {
  title: "FreshStart IL — Your Illinois divorce, filed right, from $149",
  description:
    "Illinois divorce form drafts and step-by-step filing guidance available in all 102 counties. Plans start at $149.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <HomeView />;
}
