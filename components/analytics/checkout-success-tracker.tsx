"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { analytics } from "@/lib/analytics/events"

export interface VerifiedCheckoutSuccess {
  plan: "one_time"
  price: 149
  sessionId: string
}

/**
 * Polls briefly for webhook settlement, then claims conversion tracking through
 * a user-bound server CAS so tabs/reloads cannot emit duplicate purchases.
 */
export function CheckoutSuccessTracker({
  sessionId,
  verified,
}: {
  sessionId: string | null
  verified: VerifiedCheckoutSuccess | null
}) {
  const router = useRouter()

  useEffect(() => {
    if (!sessionId || verified) return
    let attempts = 0
    const timer = window.setInterval(() => {
      attempts += 1
      router.refresh()
      if (attempts >= 12) window.clearInterval(timer)
    }, 1500)
    return () => window.clearInterval(timer)
  }, [router, sessionId, verified])

  useEffect(() => {
    if (!verified) return
    let cancelled = false

    let retryTimer: number | undefined
    const clearSession = () => window.history.replaceState({}, "", "/dashboard")
    const attempt = async () => {
      try {
        const claimResponse = await fetch("/api/stripe/checkout-conversion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: verified.sessionId, action: "claim" }),
        })
        if (!claimResponse.ok) throw new Error("Conversion claim failed")
        const claim = await claimResponse.json() as {
          shouldTrack: boolean
          claimToken: string | null
          complete: boolean
          retryAfterMs: number
        }
        if (cancelled) return
        if (claim.complete) {
          clearSession()
          return
        }
        if (!claim.shouldTrack || !claim.claimToken) {
          retryTimer = window.setTimeout(attempt, claim.retryAfterMs)
          return
        }

        analytics.subscriptionComplete(verified.plan, verified.price, verified.sessionId)
        const deliveredResponse = await fetch("/api/stripe/checkout-conversion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: verified.sessionId,
            action: "delivered",
            claimToken: claim.claimToken,
          }),
        })
        if (!deliveredResponse.ok) throw new Error("Conversion delivery acknowledgment failed")
        const delivery = await deliveredResponse.json() as { delivered: boolean }
        if (!cancelled && delivery.delivered) clearSession()
      } catch (error) {
        console.error("Checkout conversion tracking failed", error)
        if (!cancelled) retryTimer = window.setTimeout(attempt, 5000)
      }
    }
    void attempt()

    return () => {
      cancelled = true
      if (retryTimer) window.clearTimeout(retryTimer)
    }
  }, [verified])

  return null
}
