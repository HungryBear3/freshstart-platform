"use client"

import Script from "next/script"

interface GoogleAnalyticsProps {
  measurementId?: string
  googleAdsId?: string
}

/**
 * Google Analytics 4 and Google Ads component
 * 
 * Usage: Add to app/layout.tsx or wrap in AnalyticsProvider
 * 
 * Environment variables:
 * - NEXT_PUBLIC_GA_MEASUREMENT_ID (optional)
 * - NEXT_PUBLIC_GOOGLE_ADS_ID (optional)
 */
export function GoogleAnalytics({ measurementId, googleAdsId }: GoogleAnalyticsProps) {
  // Need at least one ID to load the tag
  if (!measurementId && !googleAdsId) {
    return null
  }

  // Use GA4 ID as primary for script source (Google best practice)
  // Google Ads ID should NOT be used as script source - only configured via gtag('config')
  // If only Google Ads ID is present (no GA4), we still need to load gtag.js with it
  const primaryId = measurementId || googleAdsId


  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${primaryId}`}
        strategy="afterInteractive"
      />
      <Script 
        id="gtag-init" 
        strategy="afterInteractive"
      >
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          ${measurementId ? `gtag('config', '${measurementId}', {
            page_path: window.location.pathname,
            send_page_view: true
          });` : ''}
          ${googleAdsId ? `gtag('config', '${googleAdsId}');` : ''}
        `}
      </Script>
    </>
  )
}

/**
 * Track Google Ads conversion
 * 
 * Call this when a conversion event occurs (e.g., subscription purchase)
 * 
 * @param conversionId - Google Ads conversion ID (e.g., AW-123456789)
 * @param conversionLabel - Conversion label from Google Ads
 * @param value - Optional conversion value in USD
 */
export function trackGoogleAdsConversion(
  conversionId: string,
  conversionLabel: string,
  value?: number
): void {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'conversion', {
      send_to: `${conversionId}/${conversionLabel}`,
      value: value,
      currency: 'USD',
    })
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}
