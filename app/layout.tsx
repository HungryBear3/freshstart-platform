import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { ErrorBoundary } from "@/components/error-boundary"
import { FAVICON_DATA_URL } from "@/lib/favicon-base64"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://www.freshstart-il.com"

export const metadata: Metadata = {
  title: {
    default: "FreshStart IL - Divorce Guidance Platform",
    template: "%s | FreshStart IL",
  },
  description: "Guide people in Illinois through their divorce process with questionnaires, document generation, and court-ready forms.",
  keywords: ["Illinois divorce", "divorce forms", "divorce process", "pro se divorce", "Cook County divorce"],
  authors: [{ name: "FreshStart IL" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "FreshStart IL",
    title: "FreshStart IL - Divorce Guidance Platform",
    description: "Guide people in Illinois through their divorce process with questionnaires, document generation, and court-ready forms.",
  },
  twitter: {
    card: "summary_large_image",
    title: "FreshStart IL - Divorce Guidance Platform",
    description: "Guide people in Illinois through their divorce process.",
  },
  alternates: {
    types: { "application/rss+xml": `${baseUrl}/rss.xml` },
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <ErrorBoundary>{children}</ErrorBoundary>
        </Providers>
      </body>
    </html>
  )
}
