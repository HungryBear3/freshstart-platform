"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface SubscribeButtonProps {
  plan?: "one_time"
  className?: string
  size?: "default" | "sm" | "lg" | "icon"
  children?: React.ReactNode
}

export function SubscribeButton({
  plan = "one_time",
  className,
  size = "lg",
  children,
}: SubscribeButtonProps) {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState("")

  const handleSubscribe = async () => {
    setLoading(true)

    try {
      // Create checkout session
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create checkout session")
      }

      const { sessionId, url } = await response.json()

      if (!url) {
        throw new Error("No checkout URL received from server")
      }

      // Redirect directly to Stripe Checkout URL
      // This is the new recommended approach (Stripe.js no longer supports redirectToCheckout)
      window.location.href = url
    } catch (error) {
      console.error("Checkout error:", error)
      setCheckoutError(
        error instanceof Error ? error.message : "Something went wrong. Please try again."
      )
      setLoading(false)
    }
  }

  // If not logged in, show button that redirects to signup
  if (status === "unauthenticated" || !session) {
    const handleClick = () => {
      // Store the plan in sessionStorage so we can use it after signup
      if (typeof window !== "undefined") {
        sessionStorage.setItem("subscribe_plan", plan)
        sessionStorage.setItem("subscribe_redirect", "/pricing")
      }
    }
    
    return (
      <Link
        href={`/auth/signup?redirect=%2Fpricing&subscribe=true&plan=${plan}&source=legacy_subscribe_button`}
        onClick={handleClick}
      >
        <Button size={size} className={className} disabled={loading}>
          {children || "Continue to Checkout"}
        </Button>
      </Link>
    )
  }

  return (
    <div className="w-full">
      <Button
        size={size}
        className={className}
        onClick={handleSubscribe}
        disabled={loading || !session}
        data-subscribe-button="true"
      >
        {loading ? "Redirecting to Stripe…" : children || "Continue to Checkout"}
      </Button>
      {checkoutError && (
        <p className="text-sm text-red-600 mt-2 text-center">{checkoutError}</p>
      )}
    </div>
  )
}
