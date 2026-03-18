"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { analytics } from "@/lib/analytics/events"

/**
 * Tracks conversion events when user returns from Stripe checkout
 * 
 * This component should be placed on the success page (dashboard with ?success=true)
 * It tracks:
 * - Google Analytics purchase event
 * - Google Ads conversion
 * - Meta Pixel purchase event
 */
export function CheckoutSuccessTracker() {
  const searchParams = useSearchParams()
  const success = searchParams?.get("success")
  const sessionId = searchParams?.get("session_id")

  useEffect(() => {
    // Only track if success parameter is present
    if (success !== "true") return

    // Get subscription details from session storage or make API call
    // For now, we'll use default values - in production you might want to fetch from API
    const plan = "annual" // Default plan
    const planPrice = 299 // Annual price in USD

    // Track conversion
    analytics.subscriptionComplete(plan, planPrice, sessionId || undefined)

    // Log for debugging
    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics] Checkout success tracked:", {
        plan,
        price: planPrice,
        sessionId,
      })
    }
  }, [success, sessionId])

  return null // This component doesn't render anything
}
