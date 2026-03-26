import type { MetadataRoute } from "next"
import { prisma } from "@/lib/db"
import { getAllPosts } from '@/lib/blog'

const baseUrl =
  process.env.NEXTAUTH_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://www.freshstart-il.com"

function url(path: string): string {
  const base = baseUrl.replace(/\/$/, "")
  return `${base}${path.startsWith("/") ? path : `/${path}`}`
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: url("/"), lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: url("/checklist"), lastModified: new Date(), changeFrequency: "monthly", priority: 0.95 },
    { url: url("/pricing"), lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: url("/contact"), lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: url("/calculators"), lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: url("/legal-info"), lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: url("/start"), lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: url("/auth/signin"), lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: url("/auth/signup"), lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ]

  let legalPages: MetadataRoute.Sitemap = []
  try {
    const articles = await prisma.legalContent.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    })
    legalPages = articles.map((a) => ({
      url: url(`/legal-info/${a.slug}`),
      lastModified: a.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }))
  } catch {
    // DB may not be available during build
  }

  let blogPages: MetadataRoute.Sitemap = []
  try {
    const blogPosts = getAllPosts()
    blogPages = blogPosts.map(post => ({
      url: url(`/blog/${post.slug}`),
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }))
  } catch {
    // Handle getAllPosts failure silently
  }

  return [...staticPages, ...legalPages, ...blogPages]
}
