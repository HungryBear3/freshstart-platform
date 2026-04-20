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

    const plan = (typeof window !== "undefined" && sessionStorage.getItem("subscribe_plan")) || "annual"
    const planPrice = plan === "one_time" ? 149 : 299
    if (typeof window !== "undefined") sessionStorage.removeItem("subscribe_plan")

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
