"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { normalizeCheckoutPlan } from "@/app/v2/_components/checkout-intent"

/**
 * Client form for /auth/signup. Form logic is unchanged from the
 * pre-v2 version — including the signup-first checkout resume flow:
 * plan, source, redirect, and `subscribe=true` are preserved through
 * the post-registration push to /auth/signin so the checkout intent
 * survives the email-verification round-trip.
 */
export function SignUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Check if user came from pricing/subscribe flow
  const redirectUrl = searchParams.get("redirect") || "/dashboard"
  const subscribePlan = normalizeCheckoutPlan(searchParams.get("plan"))
  const subscribeSource = searchParams.get("source") || "signup"
  const isSubscribeFlow =
    searchParams.get("subscribe") === "true" ||
    redirectUrl === "/pricing" ||
    (typeof window !== "undefined" &&
      sessionStorage.getItem("subscribe_plan"))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data.error || data.details || "Registration failed"
        setError(typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg))
        return
      }

      // If coming from subscribe flow, redirect to signin with callback to pricing
      // Otherwise, redirect to signin with normal callback.
      if (isSubscribeFlow) {
        const params = new URLSearchParams({
          callbackUrl: "/pricing",
          registered: "true",
          subscribe: "true",
          plan: subscribePlan,
          source: subscribeSource,
        })
        router.push(`/auth/signin?${params.toString()}`)
      } else {
        router.push(`/auth/signin?callbackUrl=${redirectUrl}&registered=true`)
      }
    } catch (err) {
      console.error("Registration error:", err)
      if (err instanceof Error && err.message.includes("fetch")) {
        setError("Unable to connect to server. Please make sure the server is running.")
      } else {
        setError(err instanceof Error ? err.message : "An error occurred. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="fs-auth-form" onSubmit={handleSubmit} noValidate>
      {error && (
        <div className="fs-auth-error" role="alert">
          {error}
        </div>
      )}

      <div className="fs-auth-field">
        <label htmlFor="name" className="fs-auth-label">
          Name <span className="fs-auth-label-aux">(optional)</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="fs-auth-input"
          placeholder="Your name"
        />
      </div>

      <div className="fs-auth-field">
        <label htmlFor="email" className="fs-auth-label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="fs-auth-input"
          placeholder="you@email.com"
        />
      </div>

      <div className="fs-auth-field">
        <label htmlFor="password" className="fs-auth-label">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="fs-auth-input"
          placeholder="At least 8 characters"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="fs-btn fs-btn-primary fs-btn-md fs-auth-submit"
      >
        {loading ? "Creating account…" : "Create account"}
      </button>

      <p className="fs-auth-alt">
        Already have an account?{" "}
        <Link href="/auth/signin">Sign in</Link>
      </p>
    </form>
  )
}
