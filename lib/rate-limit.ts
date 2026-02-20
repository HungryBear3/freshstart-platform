// Simple in-memory rate limiter
// For production, consider using Redis or a dedicated service

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 5 * 60 * 1000)

export function rateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const key = identifier

  if (!store[key] || store[key].resetTime < now) {
    // Create new window
    store[key] = {
      count: 1,
      resetTime: now + windowMs,
    }
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: store[key].resetTime,
    }
  }

  store[key].count++

  if (store[key].count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: store[key].resetTime,
    }
  }

  return {
    allowed: true,
    remaining: maxRequests - store[key].count,
    resetTime: store[key].resetTime,
  }
}

// Get client identifier from request
export function getClientIdentifier(request: Request): string {
  // Try to get IP from headers (works with most proxies)
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0].trim() : null
  const realIp = request.headers.get("x-real-ip")

  return ip || realIp || "unknown"
}
