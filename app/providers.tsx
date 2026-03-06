"use client"

import { SessionProvider } from "next-auth/react"
import { ErrorBoundary } from "@/components/error-boundary"
import { Suspense } from "react"
import { AnalyticsProviderWithSuspense } from "@/components/analytics/analytics-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  // Wrap SessionProvider in ErrorBoundary and Suspense to prevent it from breaking the entire app
  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading...</div>}>
        <SessionProvider
          refetchInterval={0}
          refetchOnWindowFocus={false}
          // Suppress session fetch errors to prevent UI breakage
          // The session will be checked server-side anyway
        >
          <AnalyticsProviderWithSuspense>
            {children}
          </AnalyticsProviderWithSuspense>
        </SessionProvider>
      </Suspense>
    </ErrorBoundary>
  )
}
