"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("Invalid verification link.")
      return
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`)
        const data = await response.json()

        if (!response.ok) {
          setStatus("error")
          setMessage(data.error || "Verification failed.")
          return
        }

        setStatus("success")
        setMessage(data.message || "Email verified successfully!")
      } catch (err) {
        setStatus("error")
        setMessage("An error occurred. Please try again.")
      }
    }

    verifyEmail()
  }, [token])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Verify Your Email
          </h2>
        </div>

        <div className="mt-8">
          {status === "loading" && (
            <div className="text-center">
              <p className="text-gray-600">Verifying your email...</p>
            </div>
          )}

          {status === "success" && (
            <div className="rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800">{message}</p>
              <div className="mt-4 text-center">
                <Link
                  href="/auth/signin"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Continue to sign in
                </Link>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{message}</p>
              <div className="mt-4 space-y-2 text-center">
                <Link
                  href="/auth/resend-verification"
                  className="block text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Resend verification email
                </Link>
                <Link
                  href="/auth/signin"
                  className="block text-sm font-medium text-gray-600 hover:text-gray-500"
                >
                  Back to sign in
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
