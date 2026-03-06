"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface SubscribeButtonProps {
  plan?: "annual" | "monthly"
  className?: string
  size?: "default" | "sm" | "lg" | "icon"
  children?: React.ReactNode
}

export function SubscribeButton({
  plan = "annual",
  className,
  size = "lg",
  children,
}: SubscribeButtonProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    // If not logged in, redirect to signup with return URL
    if (status === "unauthenticated" || !session) {
      // Store the plan in sessionStorage so we can use it after signup
      if (typeof window !== "undefined") {
        sessionStorage.setItem("subscribe_plan", plan)
        sessionStorage.setItem("subscribe_redirect", "/pricing")
      }
      router.push(`/auth/signup?redirect=/pricing`)
      return
    }

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
      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
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
      <Link href={`/auth/signup?redirect=/pricing`} onClick={handleClick}>
        <Button size={size} className={className} disabled={loading}>
          {children || "Start Free Trial"}
        </Button>
      </Link>
    )
  }

  return (
    <Button
      size={size}
      className={className}
      onClick={handleSubscribe}
      disabled={loading || !session}
      data-subscribe-button="true"
    >
      {loading ? "Loading..." : children || "Start Free Trial"}
    </Button>
  )
}
