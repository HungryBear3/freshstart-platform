"use client"

import Script from "next/script"

interface MetaPixelProps {
  pixelId: string
}

/**
 * Meta (Facebook) Pixel component
 * 
 * Usage: Add to app/layout.tsx or wrap in AnalyticsProvider
 * 
 * Environment variable: NEXT_PUBLIC_META_PIXEL_ID
 */
export function MetaPixel({ pixelId }: MetaPixelProps) {
  if (!pixelId) {
    return null
  }

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}

/**
 * Track Meta Pixel event
 * 
 * Standard events:
 * - 'Lead' - User signs up
 * - 'StartTrial' - User starts trial subscription
 * - 'Purchase' - User completes purchase
 * - 'CompleteRegistration' - User completes onboarding
 * - 'ViewContent' - User views content
 * - 'Search' - User searches
 * - 'AddToCart' - User adds to cart (subscription selection)
 * - 'InitiateCheckout' - User starts checkout
 * 
 * @param eventName - Meta standard event name
 * @param params - Optional event parameters
 */
export function trackMetaEvent(
  eventName: string,
  params?: Record<string, any>
): void {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', eventName, params)
  }
}

/**
 * Track custom Meta Pixel event
 * 
 * @param eventName - Custom event name
 * @param params - Optional event parameters
 */
export function trackMetaCustomEvent(
  eventName: string,
  params?: Record<string, any>
): void {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('trackCustom', eventName, params)
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    fbq: (...args: any[]) => void
    _fbq: any
  }
}
