// Rate limiter: Upstash Redis in production, in-memory fallback for dev
// Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for production

import { Ratelimit, type Duration } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
}

// In-memory store for fallback when Upstash is not configured
interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const memoryStore: RateLimitStore = {}

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(memoryStore).forEach((key) => {
    if (memoryStore[key].resetTime < now) {
      delete memoryStore[key]
    }
  })
}, 5 * 60 * 1000)

function msToUpstashWindow(ms: number): Duration {
  if (ms < 60_000) return `${Math.round(ms / 1000)} s` as Duration
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)} m` as Duration
  return `${Math.round(ms / 3_600_000)} h` as Duration
}

// Cached Upstash limiters by config
const upstashLimiters = new Map<string, Ratelimit>()

function getUpstashLimiter(maxRequests: number, windowMs: number): Ratelimit {
  const key = `${maxRequests}-${windowMs}`
  let limiter = upstashLimiters.get(key)
  if (!limiter) {
    limiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(maxRequests, msToUpstashWindow(windowMs)),
    })
    upstashLimiters.set(key, limiter)
  }
  return limiter
}

function inMemoryRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  const key = identifier

  if (!memoryStore[key] || memoryStore[key].resetTime < now) {
    memoryStore[key] = {
      count: 1,
      resetTime: now + windowMs,
    }
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: memoryStore[key].resetTime,
    }
  }

  memoryStore[key].count++

  if (memoryStore[key].count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: memoryStore[key].resetTime,
    }
  }

  return {
    allowed: true,
    remaining: maxRequests - memoryStore[key].count,
    resetTime: memoryStore[key].resetTime,
  }
}

export async function rateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (url && token) {
    const limiter = getUpstashLimiter(maxRequests, windowMs)
    const result = await limiter.limit(identifier)
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetTime: result.reset * 1000, // Upstash returns unix seconds
    }
  }

  return Promise.resolve(inMemoryRateLimit(identifier, maxRequests, windowMs))
}

// Get client identifier from request
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0].trim() : null
  const realIp = request.headers.get("x-real-ip")

  return ip || realIp || "unknown"
}
