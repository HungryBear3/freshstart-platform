import type { MetadataRoute } from "next"

const baseUrl =
  process.env.NEXTAUTH_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://www.freshstart-il.com"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FreshStart IL - Divorce Guidance Platform",
    short_name: "FreshStart IL",
    description:
      "Guide people in Illinois through their divorce process with questionnaires, document generation, and court-ready forms.",
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
