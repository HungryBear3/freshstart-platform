"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export interface VerifiedCheckoutSuccess {
  plan: "one_time"
  price: 149
  sessionId: string
}

/**
 * Polls briefly for webhook settlement, then clears the transient Checkout
 * Session query parameter after the server-verified paid state is visible.
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
    const clearSession = () => window.history.replaceState({}, "", "/dashboard")
    clearSession()
  }, [verified])

  return null
}
