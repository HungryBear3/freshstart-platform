import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/site-url"

const baseUrl = SITE_URL

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FreshStart IL - Divorce Guidance Platform",
    short_name: "FreshStart IL",
    description:
      "Illinois uncontested-divorce form preparation and filing guidance. We prepare supported form drafts; you review and file them.",
    start_url: baseUrl,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  }
}
