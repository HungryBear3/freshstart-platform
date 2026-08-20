const SAFE_BOOLEAN_KEYS = new Set(["is_official_form", "has_prenup"])
const SAFE_NUMBER_KEYS = new Set([
  "value", "section_index", "total_sections", "progress_percent", "last_section",
  "document_count", "trial_days", "predicted_ltv", "results_count", "file_size", "concern_count",
])
const SAFE_TOKEN_KEYS = new Set([
  "method", "utm_source", "utm_medium", "utm_campaign", "utm_content", "currency",
  "questionnaire_type", "questionnaire_name", "document_type", "plan_name", "cancel_reason",
  "form_id", "form_name", "section", "page_slug", "calculator_type", "prenup_status",
  "content_name",
])
const SAFE_TOKEN_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/i

const SAFE_PAGE_HOSTS = new Set(["freshstart-il.com", "www.freshstart-il.com"])
export const SAFE_ANALYTICS_STATIC_PATHS = [
  "/", "/about", "/blog", "/calculators", "/checklist", "/child-custody", "/contact",
  "/disclaimer", "/faq", "/grounds-for-divorce", "/legal", "/legal-info", "/pricing",
  "/privacy", "/property-division", "/start", "/support-calculations", "/terms", "/v2",
  "/v2/pricing",
] as const
export const SAFE_ANALYTICS_DYNAMIC_ROUTES = [
  { prefix: "/blog/", template: "/blog/[slug]" },
  { prefix: "/legal-info/", template: "/legal-info/[slug]" },
  { prefix: "/questionnaires/", template: "/questionnaires/[type]" },
  { prefix: "/go/", template: "/go/[code]" },
] as const
const SAFE_STATIC_PAGE_PATHS = new Set<string>(SAFE_ANALYTICS_STATIC_PATHS)
export const GTAG_READY_EVENT_NAME = "ga4:gtag-ready"
const GTAG_READY_WINDOW_FLAG = "__freshstartGa4Ready"

function isSafeScalar(value: unknown): value is string | number | boolean {
  if (typeof value === "boolean") return true
  if (typeof value === "number") return Number.isFinite(value) && Math.abs(value) <= 1_000_000_000
  if (typeof value !== "string") return false
  if (value.length > 200) return false
  if (/@/.test(value)) return false
  if (/https?:\/\//i.test(value) || /www\./i.test(value)) return false
  return true
}

function safeUrl(input: string | null | undefined): URL | null {
  if (!input) return null
  try {
    const url = new URL(input)
    if (!["http:", "https:"].includes(url.protocol)) return null
    return url
  } catch {
    return null
  }
}

export function toSafePagePath(pathname: string | null | undefined): string | null {
  if (!pathname || !pathname.startsWith("/") || /[?#]/.test(pathname)) return null
  const normalized = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname
  if (SAFE_STATIC_PAGE_PATHS.has(normalized)) return normalized
  for (const route of SAFE_ANALYTICS_DYNAMIC_ROUTES) {
    if (!normalized.startsWith(route.prefix)) continue
    const segment = normalized.slice(route.prefix.length)
    if (segment && !segment.includes("/")) return route.template
  }
  return null
}

export function toSafePageLocation(locationHref: string | null | undefined): string {
  const url = safeUrl(locationHref)
  if (!url) return ""
  const safePath = toSafePagePath(url.pathname)
  return safePath ? `${url.origin}${safePath}` : ""
}

export function toSafePageReferrer(referrer: string | null | undefined): string {
  const url = safeUrl(referrer)
  if (!url) return ""
  if (url.host.toLowerCase() === "checkout.stripe.com") return ""
  if (!SAFE_PAGE_HOSTS.has(url.host.toLowerCase())) return url.origin
  const safePath = toSafePagePath(url.pathname)
  return safePath ? `${url.origin}${safePath}` : url.origin
}

export function sanitizeClientEventParams(
  eventName: string,
  params?: Record<string, unknown>,
): Record<string, unknown> | null {
  if (!params) return {}
  if (!SAFE_TOKEN_PATTERN.test(eventName)) return null

  if (eventName === "page_view") {
    const pageLocation = typeof params.page_location === "string" ? toSafePageLocation(params.page_location) : ""
    const pageReferrer = typeof params.page_referrer === "string" ? toSafePageReferrer(params.page_referrer) : ""
    const pagePath = toSafePagePath(typeof params.page_path === "string" ? params.page_path : "")
    if (!pageLocation || !pagePath) return null
    if (Object.keys(params).some((key) => !["page_location", "page_path", "page_referrer", "page_title"].includes(key))) return null
    return {
      page_location: pageLocation,
      page_path: pagePath,
      page_referrer: pageReferrer,
      page_title: "FreshStart IL",
    }
  }

  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(params)) {
    if (key === "items" && eventName === "begin_checkout") {
      if (!Array.isArray(value) || value.length !== 1) return null
      const item = value[0]
      if (!item || typeof item !== "object" || Array.isArray(item)) return null
      const candidate = item as Record<string, unknown>
      if (Object.keys(candidate).some((itemKey) => !["item_name", "price", "quantity"].includes(itemKey))) return null
      if (typeof candidate.item_name !== "string" || !SAFE_TOKEN_PATTERN.test(candidate.item_name)) return null
      if (typeof candidate.price !== "number" || !isSafeScalar(candidate.price)) return null
      if (candidate.quantity !== 1) return null
      sanitized.items = [{ item_name: candidate.item_name, price: candidate.price, quantity: 1 }]
      continue
    }
    if (SAFE_BOOLEAN_KEYS.has(key) && typeof value === "boolean") {
      sanitized[key] = value
      continue
    }
    if (SAFE_NUMBER_KEYS.has(key) && typeof value === "number" && isSafeScalar(value)) {
      sanitized[key] = value
      continue
    }
    if (SAFE_TOKEN_KEYS.has(key) && typeof value === "string" && SAFE_TOKEN_PATTERN.test(value)) {
      sanitized[key] = value
      continue
    }
    return null
  }
  return sanitized
}

type PageViewInput = {
  pathname: string | null
  title: string
  locationHref: string
  referrer: string
  ready: boolean
}

type PageViewParams = {
  page_location: string
  page_path: string
  page_referrer: string
  page_title: string
}

export class BrowserPageViewTracker {
  private lastTrackedPathname: string | null = null

  update(input: PageViewInput): PageViewParams | null {
    if (!input.ready || !input.pathname) return null
    const pagePath = toSafePagePath(input.pathname)
    if (!pagePath) return null
    if (pagePath === this.lastTrackedPathname) return null
    const page_location = toSafePageLocation(input.locationHref)
    if (!page_location) return null
    this.lastTrackedPathname = pagePath
    return {
      page_location,
      page_path: pagePath,
      page_referrer: toSafePageReferrer(input.referrer),
      page_title: "FreshStart IL",
    }
  }
}

let gtagReady = false

type WindowWithGa4Ready = Window & {
  [GTAG_READY_WINDOW_FLAG]?: boolean
}

function hasWindowReadyFlag(): boolean {
  if (typeof window === "undefined") return false
  return Boolean((window as WindowWithGa4Ready)[GTAG_READY_WINDOW_FLAG])
}

export function markGtagReady() {
  gtagReady = true
  if (typeof window !== "undefined") {
    ;(window as WindowWithGa4Ready)[GTAG_READY_WINDOW_FLAG] = true
    window.dispatchEvent(new CustomEvent(GTAG_READY_EVENT_NAME))
  }
}

export function hasGtagReady() {
  return gtagReady || hasWindowReadyFlag()
}

export function subscribeToGtagReady(listener: () => void) {
  if (typeof window === "undefined") {
    return () => {}
  }
  const onReady = () => {
    gtagReady = true
    listener()
  }
  window.addEventListener(GTAG_READY_EVENT_NAME, onReady)
  return () => window.removeEventListener(GTAG_READY_EVENT_NAME, onReady)
}

export function isCanonicalFreshStartHost(host: string | null | undefined): boolean {
  if (!host) return false
  return SAFE_PAGE_HOSTS.has(host.toLowerCase())
}
