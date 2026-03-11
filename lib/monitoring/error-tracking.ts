/**
 * Error tracking and monitoring utilities
 * Supports Sentry integration
 */

interface ErrorContext {
  userId?: string
  email?: string
  path?: string
  method?: string
  [key: string]: any
}

class ErrorTracker {
  private initialized = false

  /**
   * Initialize error tracking (Sentry, etc.)
   */
  init() {
    if (this.initialized) {
      return
    }

    // Initialize Sentry if DSN is provided
    if (process.env.SENTRY_DSN) {
      try {
        // Dynamic import to avoid issues if Sentry is not installed
        import("@sentry/nextjs").then((Sentry) => {
          Sentry.init({
            dsn: process.env.SENTRY_DSN,
            environment: process.env.NODE_ENV || "development",
            tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
            beforeSend(event: unknown, hint: unknown) {
              // Don't send errors in development
              if (process.env.NODE_ENV === "development") {
                console.error("Error (not sent to Sentry):", event, hint)
                return null
              }
              return event
            },
          })
          this.initialized = true
        })
      } catch (error) {
        console.warn("Sentry not available, using console logging")
      }
    } else {
      console.log("Error tracking not configured (SENTRY_DSN not set)")
    }
  }

  /**
   * Capture an error
   */
  captureError(error: Error, context?: ErrorContext) {
    if (process.env.SENTRY_DSN) {
      try {
        import("@sentry/nextjs").then((Sentry) => {
          Sentry.captureException(error, {
            contexts: {
              custom: context || {},
            },
          })
        })
      } catch {
        // Fallback to console
        console.error("Error:", error, "Context:", context)
      }
    } else {
      console.error("Error:", error, "Context:", context)
    }
  }

  /**
   * Capture a message
   */
  captureMessage(message: string, level: "info" | "warning" | "error" = "info", context?: ErrorContext) {
    if (process.env.SENTRY_DSN) {
      try {
        import("@sentry/nextjs").then((Sentry) => {
          Sentry.captureMessage(message, {
            level: level as any,
            contexts: {
              custom: context || {},
            },
          })
        })
      } catch {
        console.log(`[${level.toUpperCase()}]`, message, context)
      }
    } else {
      console.log(`[${level.toUpperCase()}]`, message, context)
    }
  }

  /**
   * Set user context
   */
  setUser(user: { id: string; email?: string; name?: string }) {
    if (process.env.SENTRY_DSN) {
      try {
        import("@sentry/nextjs").then((Sentry) => {
          Sentry.setUser({
            id: user.id,
            email: user.email,
            username: user.name,
          })
        })
      } catch {
        // Ignore
      }
    }
  }

  /**
   * Clear user context
   */
  clearUser() {
    if (process.env.SENTRY_DSN) {
      try {
        import("@sentry/nextjs").then((Sentry) => {
          Sentry.setUser(null)
        })
      } catch {
        // Ignore
      }
    }
  }
}

export const errorTracker = new ErrorTracker()

// Initialize on import (client-side only)
if (typeof window !== "undefined") {
  errorTracker.init()
}

/**
 * Error boundary helper for React
 */
export function logErrorToService(error: Error, errorInfo?: React.ErrorInfo) {
  errorTracker.captureError(error, {
    componentStack: errorInfo?.componentStack,
  })
}
