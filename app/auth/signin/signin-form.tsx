"use client"

import { signIn, useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

export function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
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
          // Set flag to auto-trigger checkout on pricing page
          if (typeof window !== "undefined") {
            sessionStorage.setItem("auto_subscribe", "true")
          }
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Sign in to FreshStart IL
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <Link
              href="/auth/signup"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              create a new account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
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
                className="relative block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                href="/auth/forgot-password"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
