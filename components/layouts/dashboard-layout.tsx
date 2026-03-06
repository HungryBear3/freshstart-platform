"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Header } from "@/components/navigation/header"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Only redirect if we're truly unauthenticated and not just loading
    // Add a delay to prevent race conditions with session establishment
    if (status === "unauthenticated") {
      const timer = setTimeout(() => {
        // Double-check status before redirecting
        if (status === "unauthenticated") {
          router.push("/auth/signin")
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Don't return null if session is missing - let the page handle it
  // The middleware and page-level checks will handle authentication
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">{children}</main>
    </div>
  )
}
