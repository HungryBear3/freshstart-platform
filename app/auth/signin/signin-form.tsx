"use client"

import { signIn, useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { markCheckoutResumeFromSearch } from "@/app/v2/_components/checkout-intent"

export function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionResult = useSession()
  const session = sessionResult?.data
  const status = sessionResult?.status ?? 'loading'
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in - but only once to prevent loops
  useEffect(() => {
    if (status === "authenticated" && session) {
      const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
      const currentPath = window.location.pathname
      
      // Only redirect if:
      // 1. We're not already on the target page
      // 2. We're on the signin page (not in a redirect loop)
      // 3. We haven't redirected recently (prevent rapid redirects)
      if (currentPath !== callbackUrl && currentPath.startsWith("/auth/signin")) {
        // Check if we've already attempted a redirect in this session
        const redirectKey = `redirect_attempt_${callbackUrl}`
        const hasRedirected = sessionStorage.getItem(redirectKey)
        
        if (!hasRedirected) {
          console.log("User already authenticated, redirecting to:", callbackUrl)
          sessionStorage.setItem(redirectKey, "true")
          
          // Use window.location for immediate redirect - session is already established
          // Add a small delay to ensure cookie is set
          setTimeout(() => {
            window.location.href = callbackUrl
          }, 100)
        } else {
          console.log("Redirect already attempted, preventing loop")
          // Clear the flag after a delay to allow future redirects
          setTimeout(() => {
            sessionStorage.removeItem(redirectKey)
          }, 5000)
        }
      }
    }
  }, [status, session, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      console.log("Sign in result:", JSON.stringify(result, null, 2)) // Debug log

      // Check for errors first
      if (result?.error) {
        let errorMsg = result.error
        if (typeof errorMsg !== 'string') {
          errorMsg = JSON.stringify(errorMsg)
        }
        errorMsg = errorMsg.replace(/[\[\]{}"]/g, '').trim()
        setError(errorMsg || "Sign in failed. Please check your credentials.")
        setLoading(false)
        return
      }

      // Check if sign in was successful
      // NextAuth v5 returns { ok: true } on success, or { error: string } on failure
      // Also check for undefined/null result which might indicate success
      const isSuccess = result && (result.ok === true || (!result.error && result.ok !== false))
      
      if (isSuccess) {
        // Success - get callback URL and redirect
        let callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
        
        // If this is a subscribe flow, set flag to auto-trigger checkout
        const isSubscribeFlow = searchParams.get("subscribe") === "true" || 
          (typeof window !== "undefined" && sessionStorage.getItem("subscribe_plan"))
        
        if (isSubscribeFlow && callbackUrl === "/pricing") {
          markCheckoutResumeFromSearch(searchParams.get("plan"), searchParams.get("source"));
        }
        
        console.log("Login successful, redirecting to:", callbackUrl)
        
        // Wait a brief moment for session cookie to be set, then redirect
        // Use window.location.href for full page reload to ensure session is available
        setTimeout(() => {
          window.location.href = callbackUrl
        }, 300)
        
        // Don't set loading to false since we're redirecting
        return
      } else {
        // Unexpected result structure
        console.error("Unexpected sign in result:", result)
        setError("Sign in failed. Please check your credentials and try again.")
        setLoading(false)
      }
    } catch (err) {
      console.error("Sign in error:", err)
      const errorMsg = err instanceof Error ? err.message : "An error occurred. Please try again."
      setError(errorMsg.replace(/[\[\]{}"]/g, '').trim() || "An error occurred. Please try again.")
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
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="fs-auth-input"
          placeholder="Your password"
        />
      </div>

      <div className="fs-auth-row-aux">
        <Link href="/auth/forgot-password" className="fs-auth-link">
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="fs-btn fs-btn-primary fs-btn-md fs-auth-submit"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>

      <p className="fs-auth-alt">
        Don&apos;t have an account?{" "}
        <Link href="/auth/signup">Create one</Link>
      </p>
    </form>
  )
}
