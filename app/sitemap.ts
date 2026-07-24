import type { MetadataRoute } from "next"
import { getAllPosts } from "@/lib/blog"
import { SITE_URL } from "@/lib/site-url"

// Search engines should see one stable production host even when this route is
// rendered during a preview build.
function url(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`
}

/**
 * Public marketing + legal-information sitemap.
 *
 * Excluded by design:
 *   - `/v2`, `/v2/pricing` — internal review aliases, NOT public surface.
 *   - `/legal-info/*` — every public legal-info entry now permanent-301s
 *     to `/legal` (see next.config.ts LEGAL_INFO_REDIRECTS); listing them
 *     in the sitemap would tell crawlers we have indexable content there
 *     when we don't.
 *   - `/auth/*` — sign-in / sign-up surfaces, not marketing.
 *   - `/dashboard/**`, `/api/**`, `/admin/**` — gated / internal; also
 *     covered by robots.txt disallow rules.
 *   - `/documents`, `/questionnaires/*` — auth-required.
 *   - `/preview`, `/test-no-providers`, `/test-root` — dev-only routes.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: url("/"), lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: url("/pricing"), lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: url("/checklist"), lastModified: now, changeFrequency: "monthly", priority: 0.95 },
    { url: url("/calculators"), lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: url("/legal"), lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: url("/faq"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: url("/about"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: url("/grounds-for-divorce"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: url("/child-custody"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: url("/property-division"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: url("/support-calculations"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: url("/contact"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: url("/blog"), lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: url("/start"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: url("/privacy"), lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: url("/terms"), lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: url("/disclaimer"), lastModified: now, changeFrequency: "yearly", priority: 0.4 },
  ]

  let blogPages: MetadataRoute.Sitemap = []
  try {
    const blogPosts = getAllPosts()
    blogPages = blogPosts.map((post) => ({
      url: url(`/blog/${post.slug}`),
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.65,
    }))
  } catch {
    // /blog markdown source missing at build time — skip post entries
    // rather than failing the whole sitemap.
  }

  return [...staticPages, ...blogPages]
}
