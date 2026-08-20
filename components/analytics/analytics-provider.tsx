"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { GoogleAnalytics } from "./google-analytics"
import { MetaPixel } from "./meta-pixel"
import { captureUTMParams } from "@/lib/analytics/utm-tracking"
import { trackGA4Event } from "@/lib/analytics/events"
import { isLiveTrackingEnabled, trackingGateReason } from "@/lib/analytics/tracking-gate"
import { BrowserPageViewTracker, hasGtagReady, subscribeToGtagReady, toSafePagePath } from "@/lib/analytics/ga4-client"

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
  const [gtagReady, setGtagReady] = useState(false)
  const pageViewTrackerRef = useRef(new BrowserPageViewTracker())

  useEffect(() => {
    const enabled = isLiveTrackingEnabled() && Boolean(toSafePagePath(pathname))
    setTrackingEnabled(enabled)
    if (!enabled && process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.info(
        "[Analytics] Live tracking disabled —",
        trackingGateReason() ?? "unknown reason",
      )
    }
  }, [pathname])

  useEffect(() => {
    if (!trackingEnabled) {
      setGtagReady(false)
      return
    }
    setGtagReady(hasGtagReady())
    return subscribeToGtagReady(() => setGtagReady(true))
  }, [trackingEnabled])

  // Capture UTM parameters on initial load (gated — keeps Preview clean of
  // first-touch attribution data alongside disabled pixels).
  useEffect(() => {
    if (!trackingEnabled) return
    captureUTMParams()
  }, [trackingEnabled, searchParams])

  // Track page views on route change (gated — no live event fires off prod).
  useEffect(() => {
    if (!trackingEnabled || !gtagReady || !pathname) return
    const pageView = pageViewTrackerRef.current.update({
      pathname,
      title: typeof document !== "undefined" ? document.title : "",
      locationHref: typeof window !== "undefined" ? window.location.href : "",
      referrer: typeof document !== "undefined" ? document.referrer : "",
      ready: true,
    })
    if (!pageView) return
    trackGA4Event("page_view", pageView)
    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics] Page view:", pathname)
    }
  }, [pathname, trackingEnabled, gtagReady])

  return (
    <>
      {/* Google Analytics 4 and Google Ads — only mounted on the production
          host when explicitly enabled. */}
      {trackingEnabled && (gaMeasurementId || googleAdsId) && (
        <GoogleAnalytics
          measurementId={gaMeasurementId}
          googleAdsId={googleAdsId}
          onReady={() => setGtagReady(true)}
        />
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
