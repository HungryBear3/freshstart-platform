"use client"

import Script from "next/script"
import { useEffect } from "react"
import {
  GTAG_READY_EVENT_NAME,
  SAFE_ANALYTICS_DYNAMIC_ROUTES,
  SAFE_ANALYTICS_STATIC_PATHS,
  hasGtagReady,
} from "@/lib/analytics/ga4-client"

interface GoogleAnalyticsProps {
  measurementId?: string
  googleAdsId?: string
  onReady?: () => void
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
export function GoogleAnalytics({ measurementId, googleAdsId, onReady }: GoogleAnalyticsProps) {
  const hasAnyId = Boolean(measurementId || googleAdsId)

  useEffect(() => {
    if (hasAnyId && hasGtagReady()) {
      onReady?.()
    }
  }, [hasAnyId, onReady])

  // Need at least one ID to load the tag
  if (!hasAnyId) {
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
          window.gtag = gtag;
          var safeStaticPaths = new Set(${JSON.stringify(SAFE_ANALYTICS_STATIC_PATHS)});
          var safeDynamicRoutes = ${JSON.stringify(SAFE_ANALYTICS_DYNAMIC_ROUTES)};
          function safePagePath(pathname) {
            if (!pathname || pathname.charAt(0) !== '/' || /[?#]/.test(pathname)) return '';
            var normalized = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
            if (safeStaticPaths.has(normalized)) return normalized;
            for (var i = 0; i < safeDynamicRoutes.length; i += 1) {
              var route = safeDynamicRoutes[i];
              if (normalized.indexOf(route.prefix) !== 0) continue;
              var segment = normalized.slice(route.prefix.length);
              if (segment && segment.indexOf('/') === -1) return route.template;
            }
            return '';
          }
          var pagePath = safePagePath(window.location.pathname);
          var pageLocation = pagePath ? window.location.origin + pagePath : '';
          var pageReferrer = '';
          try {
            if (document.referrer) {
              var referrerUrl = new URL(document.referrer);
              if (referrerUrl.host.toLowerCase() !== 'checkout.stripe.com') {
                var referrerHost = referrerUrl.host.toLowerCase();
                var sameSite = referrerHost === 'freshstart-il.com' || referrerHost === 'www.freshstart-il.com';
                var referrerPath = sameSite ? safePagePath(referrerUrl.pathname) : '';
                pageReferrer = referrerUrl.origin + (referrerPath || '');
              }
            }
          } catch (_error) {}
          gtag('js', new Date());
          if (pagePath) {
            ${measurementId ? `gtag('config', '${measurementId}', {
              page_location: pageLocation,
              page_path: pagePath,
              page_referrer: pageReferrer,
              send_page_view: false
            });` : ''}
            ${googleAdsId ? `gtag('config', '${googleAdsId}', {
              page_location: pageLocation,
              page_path: pagePath,
              page_referrer: pageReferrer,
              send_page_view: false
            });` : ''}
          }
          window.__freshstartGa4Ready = true;
          window.dispatchEvent(new CustomEvent(${JSON.stringify(GTAG_READY_EVENT_NAME)}));
        `}
      </Script>
    </>
  )
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    __freshstartGa4Ready?: boolean
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}
