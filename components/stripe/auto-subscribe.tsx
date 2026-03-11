"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { SubscribeButton } from "./subscribe-button"

/**
 * Component that automatically triggers checkout when user returns to pricing page
 * after signing up/logging in from the subscribe flow
 */
export function AutoSubscribe() {
  const { data: session, status } = useSession()

  useEffect(() => {
    // Only trigger if user is authenticated and we have the auto_subscribe flag
    if (status === "authenticated" && session) {
      const shouldAutoSubscribe = typeof window !== "undefined" && 
        sessionStorage.getItem("auto_subscribe") === "true"
      
      if (shouldAutoSubscribe) {
        // Clear the flag
        sessionStorage.removeItem("auto_subscribe")
        sessionStorage.removeItem("subscribe_plan")
        sessionStorage.removeItem("subscribe_redirect")
        
        // Small delay to ensure page is fully loaded
        setTimeout(() => {
          // Find the subscribe button and click it
          const subscribeButton = document.querySelector('[data-subscribe-button]') as HTMLButtonElement
          if (subscribeButton) {
            subscribeButton.click()
          }
        }, 500)
      }
    }
  }, [status, session])

  return null
}
