/**
 * Centralized live-tracking gate.
 *
 * The Vercel Preview environment shares the same code as production but must
 * not pollute live Google Ads / GA4 / Meta audiences. This helper is the
 * single source of truth for whether third-party tracking should fire.
 *
 * Rule: tracking is enabled only when BOTH conditions hold:
 *   1. NEXT_PUBLIC_ENABLE_TRACKING === "true" (operator opt-in at build/runtime)
 *   2. window.location.host is the production hostname
 *      (freshstart-il.com or www.freshstart-il.com — extensible via
 *       NEXT_PUBLIC_TRACKING_ALLOWED_HOSTS, comma-separated).
 *
 * Everything else — Vercel Preview, localhost, dev, staging hostnames —
 * MUST treat live tracking as disabled. The helper is SSR-safe: when there
 * is no `window`, it returns `false`.
 */

const DEFAULT_PROD_HOSTS = new Set<string>([
  "freshstart-il.com",
  "www.freshstart-il.com",
])

function getAllowedHosts(): Set<string> {
  const extra = process.env.NEXT_PUBLIC_TRACKING_ALLOWED_HOSTS
  if (!extra) return DEFAULT_PROD_HOSTS
  const set = new Set(DEFAULT_PROD_HOSTS)
  for (const raw of extra.split(",")) {
    const host = raw.trim().toLowerCase()
    if (host) set.add(host)
  }
  return set
}

/**
 * Internal pure check. Test seam: pass `hostOverride` directly so jest
 * does not have to mutate jsdom's non-configurable `window.location`.
 */
export function isLiveTrackingEnabledFor(host: string | null): boolean {
  if (process.env.NEXT_PUBLIC_ENABLE_TRACKING !== "true") return false
  if (host === null || host === "") return false
  return getAllowedHosts().has(host.toLowerCase())
}

/**
 * Whether the runtime should fire live third-party tracking right now.
 *
 * - Returns `false` during SSR (no `window`).
 * - Returns `false` when `NEXT_PUBLIC_ENABLE_TRACKING` !== "true".
 * - Returns `false` when the current host is not on the production allow-list.
 * - Returns `true` only when both checks pass.
 */
export function isLiveTrackingEnabled(): boolean {
  if (typeof window === "undefined") return false
  return isLiveTrackingEnabledFor(window.location?.host || null)
}

/**
 * Diagnostic helper: returns the reason tracking is disabled (or `null` if
 * it is enabled). Intended for dev/preview console logs; never gates real
 * behavior on its own.
 */
export function trackingGateReason(): string | null {
  if (process.env.NEXT_PUBLIC_ENABLE_TRACKING !== "true") {
    return "NEXT_PUBLIC_ENABLE_TRACKING is not set to 'true'"
  }
  if (typeof window === "undefined") {
    return "no window (SSR or non-browser context)"
  }
  const host = window.location?.host?.toLowerCase() || ""
  const allowed = getAllowedHosts()
  if (!allowed.has(host)) {
    return `host '${host}' is not on the production allow-list`
  }
  return null
}
