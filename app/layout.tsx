import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { ErrorBoundary } from "@/components/error-boundary"
import { FAVICON_DATA_URL } from "@/lib/favicon-base64"
import { DEFAULT_OG_IMAGE, DEFAULT_TWITTER_IMAGE } from "@/lib/seo-metadata"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://freshstart-il.com"
const homepageTitle = "FreshStart-IL — Your Illinois divorce, filed right, from $149"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: homepageTitle,
    template: "%s | FreshStart IL",
  },
  description: "Illinois residents: Simplify your divorce with easy-to-use questionnaires, automatic forms, and deadline tracking. Start your fresh start today.",
  keywords: ["Illinois divorce", "divorce forms", "divorce process", "pro se divorce", "Cook County divorce"],
  authors: [{ name: "FreshStart IL" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "FreshStart IL",
    title: homepageTitle,
    description: "Illinois residents: Simplify your divorce with easy-to-use questionnaires, automatic forms, and deadline tracking. Start your fresh start today.",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: homepageTitle,
    description: "Simplify your Illinois divorce process with FreshStart's helpful tools and guidance.",
    images: [DEFAULT_TWITTER_IMAGE],
  },
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": "/rss.xml" },
  },
  robots: { index: true, follow: true },
  icons: {
    icon: { url: FAVICON_DATA_URL, type: "image/png", sizes: "32x32" },
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
        <Providers>
          <ErrorBoundary>{children}</ErrorBoundary>
        </Providers>
      </body>
    </html>
  )
}
