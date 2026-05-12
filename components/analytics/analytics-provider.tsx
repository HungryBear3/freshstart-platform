"use client"

import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { GoogleAnalytics } from "./google-analytics"
import { MetaPixel } from "./meta-pixel"
import { captureUTMParams } from "@/lib/analytics/utm-tracking"
import { trackGA4Event } from "@/lib/analytics/events"
import { isLiveTrackingEnabled, trackingGateReason } from "@/lib/analytics/tracking-gate"

interface AnalyticsProviderProps {
  children: React.ReactNode
}

/**
 * Analytics Provider Component
 * 
 * Wraps the application and provides:
 * - Google Analytics 4 tracking
 * - Meta (Facebook) Pixel tracking
 * - Automatic UTM parameter capture
 * - Page view tracking for client-side navigation
 * 
 * Environment variables required:
 * - NEXT_PUBLIC_GA_MEASUREMENT_ID (optional)
 * - NEXT_PUBLIC_GOOGLE_ADS_ID (optional)
 * - NEXT_PUBLIC_META_PIXEL_ID (optional)
 * 
 * Usage in app/layout.tsx:
 * ```tsx
 * import { AnalyticsProvider } from "@/components/analytics/analytics-provider"
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <AnalyticsProvider>
 *           {children}
 *         </AnalyticsProvider>
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 */
export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID

  // Live tracking is gated to production hosts with explicit opt-in.
  // We defer the evaluation to a client-side effect because the check
  // depends on `window.location.host`. During SSR / Vercel Preview /
  // localhost / dev, `trackingEnabled` stays `false` and the script tags
  // never render. See `lib/analytics/tracking-gate.ts`.
  const [trackingEnabled, setTrackingEnabled] = useState(false)

  useEffect(() => {
    const enabled = isLiveTrackingEnabled()
    setTrackingEnabled(enabled)
    if (!enabled && process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.info(
        "[Analytics] Live tracking disabled —",
        trackingGateReason() ?? "unknown reason",
      )
    }
  }, [])

  // Capture UTM parameters on initial load (gated — keeps Preview clean of
  // first-touch attribution data alongside disabled pixels).
  useEffect(() => {
    if (!trackingEnabled) return
    captureUTMParams()
  }, [trackingEnabled])

  // Track page views on route change (gated — no live event fires off prod).
  useEffect(() => {
    if (!trackingEnabled) return
    if (pathname) {
      // Build full URL with search params
      const url = searchParams?.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname

      // Track in GA4 (the underlying helper is also gated as a defense-in-depth).
      trackGA4Event('page_view', {
        page_path: url,
        page_location: typeof window !== 'undefined' ? window.location.href : '',
        page_title: typeof document !== 'undefined' ? document.title : '',
      })

      // Log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics] Page view:', url)
      }
    }
  }, [pathname, searchParams, trackingEnabled])

  return (
    <>
      {/* Google Analytics 4 and Google Ads — only mounted on the production
          host when explicitly enabled. */}
      {trackingEnabled && (gaMeasurementId || googleAdsId) && (
        <GoogleAnalytics measurementId={gaMeasurementId} googleAdsId={googleAdsId} />
      )}

      {/* Meta (Facebook) Pixel — same gate. */}
      {trackingEnabled && metaPixelId && (
        <MetaPixel pixelId={metaPixelId} />
      )}

      {children}
    </>
  )
}

/**
 * Suspense boundary wrapper for AnalyticsProvider
 * 
 * The useSearchParams hook requires a Suspense boundary in Next.js 13+
 * This wrapper component handles that automatically
 */
import { Suspense } from "react"

export function AnalyticsProviderWithSuspense({ children }: AnalyticsProviderProps) {
  return (
    <Suspense fallback={null}>
      <AnalyticsProvider>{children}</AnalyticsProvider>
    </Suspense>
  )
}
