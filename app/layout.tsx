import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { ErrorBoundary } from "@/components/error-boundary"
import { DEFAULT_OG_IMAGE, DEFAULT_TWITTER_IMAGE } from "@/lib/seo-metadata"
import { SITE_URL } from "@/lib/site-url"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const siteUrl = SITE_URL
const homepageTitle = "FreshStart IL — Illinois divorce form preparation from $149"
const organizationAndWebsiteJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "FreshStart IL",
    url: siteUrl,
    logo: `${siteUrl}/icon.svg`,
    description:
      "FreshStart IL guides Illinois residents through uncontested divorce form preparation and filing steps.",
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "FreshStart IL",
    url: siteUrl,
  },
]

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: homepageTitle,
    template: "%s | FreshStart IL",
  },
  description: "FreshStart IL prepares supported Illinois uncontested-divorce form drafts and filing guidance for $149 one-time. You review and file.",
  keywords: ["Illinois divorce", "divorce forms", "divorce process", "pro se divorce", "Cook County divorce"],
  authors: [{ name: "FreshStart IL" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "FreshStart IL",
    title: homepageTitle,
    description: "FreshStart IL prepares supported Illinois uncontested-divorce form drafts and filing guidance for $149 one-time. You review and file.",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: homepageTitle,
    description: "Supported Illinois uncontested-divorce form drafts and filing guidance for $149 one-time.",
    images: [DEFAULT_TWITTER_IMAGE],
  },
  // No `canonical` at the layout level on purpose. Next metadata cascades to
  // every route that does not declare its own, so a root-layout canonical made
  // ~40 unrelated routes (/questionnaires, /questionnaires/[type], /documents,
  // /dashboard/**, the remaining /legal-info/* stubs) emit the homepage as
  // their canonical — the "canonicalized to homepage" defect Search Console
  // reported on 2026-07-28. The homepage owns its own canonical in
  // app/page.tsx; every other route declares one (or deliberately omits it
  // while noindexed).
  alternates: {
    types: { "application/rss+xml": "/rss.xml" },
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {organizationAndWebsiteJsonLd.map((jsonLd) => (
          <script
            key={jsonLd["@type"]}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        ))}
        <Providers>
          <ErrorBoundary>{children}</ErrorBoundary>
        </Providers>
      </body>
    </html>
  )
}
