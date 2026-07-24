import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/site-url"

const baseUrl = SITE_URL

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/api"],
    },
    sitemap: `${baseUrl.replace(/\/$/, "")}/sitemap.xml`,
  }
}
