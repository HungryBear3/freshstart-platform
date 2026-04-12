"use client"

import { SessionProvider } from "next-auth/react"
import { ErrorBoundary } from "@/components/error-boundary"
import { Suspense } from "react"
import { AnalyticsProviderWithSuspense } from "@/components/analytics/analytics-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  // Wrap SessionProvider in ErrorBoundary and Suspense to prevent it from breaking the entire app
  return (
    <ErrorBoundary>
      <SessionProvider
        refetchInterval={0}
        refetchOnWindowFocus={false}
      >
        <Suspense fallback={<div>Loading...</div>}>
          <AnalyticsProviderWithSuspense>
            {children}
          </AnalyticsProviderWithSuspense>
        </Suspense>
      </SessionProvider>
    </ErrorBoundary>
  )
}
