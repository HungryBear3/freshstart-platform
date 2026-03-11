"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <div style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: "600px", margin: "0 auto" }}>
          <h1>Something went wrong</h1>
          <p>{error.message || "An unexpected error occurred."}</p>
          <button
            onClick={() => reset()}
            style={{
              padding: "0.5rem 1rem",
              marginTop: "1rem",
              cursor: "pointer",
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
