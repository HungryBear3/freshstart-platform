/**
 * Security middleware for API routes
 */

import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "./validation"

/**
 * Rate limiting middleware
 */
export function rateLimitMiddleware(
  maxRequests: number = 10,
  windowMs: number = 60000
): (request: NextRequest) => NextResponse | null {
  return (request: NextRequest) => {
    // Get identifier (IP address or user ID)
    const identifier =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown"

    if (!checkRateLimit(identifier, maxRequests, windowMs)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    return null
  }
}

/**
 * CORS headers middleware
 */
export function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  }
}

/**
 * Security headers middleware
 */
export function securityHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  }

  // Add CSP header in production
  if (process.env.NODE_ENV === "production") {
    headers["Content-Security-Policy"] =
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
  }

  // Add HSTS header in production
  if (process.env.NODE_ENV === "production" && process.env.NEXTAUTH_URL?.startsWith("https://")) {
    headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
  }

  return headers
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  const headers = securityHeaders()
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}
