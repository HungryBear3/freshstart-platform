/**
 * @jest-environment jsdom
 */
import { readFileSync } from "fs"
import { join } from "path"
import {
  BrowserPageViewTracker,
  sanitizeClientEventParams,
  toSafePagePath,
  toSafePageLocation,
  toSafePageReferrer,
} from "@/lib/analytics/ga4-client"

describe("GA4 browser page view tracking", () => {
  it("tracks exactly one initial page view when readiness follows the provider", () => {
    const tracker = new BrowserPageViewTracker()

    expect(tracker.update({
      pathname: "/pricing",
      title: "Pricing",
      locationHref: "https://www.freshstart-il.com/pricing?step=1#hero",
      referrer: "https://checkout.stripe.com/pay/cs_test_123",
      ready: false,
    })).toBeNull()

    expect(tracker.update({
      pathname: "/pricing",
      title: "Pricing",
      locationHref: "https://www.freshstart-il.com/pricing?step=1#hero",
      referrer: "https://checkout.stripe.com/pay/cs_test_123",
      ready: true,
    })).toEqual({
      page_location: "https://www.freshstart-il.com/pricing",
      page_path: "/pricing",
      page_referrer: "",
      page_title: "FreshStart IL",
    })

    expect(tracker.update({
      pathname: "/pricing",
      title: "Pricing",
      locationHref: "https://www.freshstart-il.com/pricing?step=2",
      referrer: "https://checkout.stripe.com/pay/cs_test_123",
      ready: true,
    })).toBeNull()
  })

  it("tracks exactly one initial page view when readiness already exists before the provider updates", () => {
    const tracker = new BrowserPageViewTracker()

    expect(tracker.update({
      pathname: "/",
      title: "Home",
      locationHref: "https://www.freshstart-il.com/?preview=0",
      referrer: "",
      ready: true,
    })).toEqual({
      page_location: "https://www.freshstart-il.com/",
      page_path: "/",
      page_referrer: "",
      page_title: "FreshStart IL",
    })

    expect(tracker.update({
      pathname: "/",
      title: "Home",
      locationHref: "https://www.freshstart-il.com/?changed=1",
      referrer: "",
      ready: true,
    })).toBeNull()
  })

  it("tracks only pathname transitions, not query-only navigation", () => {
    const tracker = new BrowserPageViewTracker()

    expect(tracker.update({
      pathname: "/pricing",
      title: "Pricing",
      locationHref: "https://www.freshstart-il.com/pricing?plan=one_time",
      referrer: "https://www.google.com/search?q=freshstart",
      ready: true,
    })).not.toBeNull()

    expect(tracker.update({
      pathname: "/pricing",
      title: "Pricing",
      locationHref: "https://www.freshstart-il.com/pricing?plan=annual",
      referrer: "https://www.google.com/search?q=freshstart",
      ready: true,
    })).toBeNull()

    expect(tracker.update({
      pathname: "/blog/Jane-Doe-312-555-0100",
      title: "Blog",
      locationHref: "https://www.freshstart-il.com/blog/Jane-Doe-312-555-0100?session_id=cs_123",
      referrer: "https://www.freshstart-il.com/pricing?plan=annual",
      ready: true,
    })).toEqual({
      page_location: "https://www.freshstart-il.com/blog/[slug]",
      page_path: "/blog/[slug]",
      page_referrer: "https://www.freshstart-il.com/pricing",
      page_title: "FreshStart IL",
    })
  })
})

describe("GA4 browser sanitization", () => {
  it("strips query and hash from page location", () => {
    expect(toSafePageLocation("https://www.freshstart-il.com/pricing?x=1#hero")).toBe(
      "https://www.freshstart-il.com/pricing",
    )
  })

  it.each([
    ["stripe referrer", "https://checkout.stripe.com/pay/cs_test_123"],
    ["missing referrer", ""],
    ["invalid referrer", "%%%"],
  ])("keeps %s explicit as an empty string", (_label, referrer) => {
    expect(toSafePageReferrer(referrer)).toBe("")
  })

  it("sanitizes valid referrers to origin and pathname only", () => {
    expect(toSafePageReferrer("https://www.google.com/search?q=freshstart#top")).toBe(
      "https://www.google.com",
    )
  })

  it.each([
    ["questionnaire PII", "/questionnaires/Jane-Doe-312-555-0100", "/questionnaires/[type]"],
    ["blog ID", "/blog/user-123456789", "/blog/[slug]"],
    ["legal slug", "/legal-info/token-secret-capability", "/legal-info/[slug]"],
    ["marketing code", "/go/private-referral-code", "/go/[code]"],
  ])("normalizes %s without preserving a dynamic segment", (_label, path, expected) => {
    expect(toSafePagePath(path)).toBe(expected)
    expect(toSafePageLocation(`https://www.freshstart-il.com${path}`)).toBe(
      `https://www.freshstart-il.com${expected}`,
    )
  })

  it.each([
    "/dashboard/Jane-Doe",
    "/admin/secret-token",
    "/auth/reset-password/capability-token",
    "/documents/customer-123",
    "/preview",
    "/Jane-Doe-312-555-0100",
    "/unknown/capability-token",
  ])("suppresses private or unknown pathname %s", (path) => {
    expect(toSafePagePath(path)).toBeNull()
    expect(toSafePageLocation(`https://www.freshstart-il.com${path}`)).toBe("")
  })

  it("removes unsafe same-site referrer paths entirely", () => {
    expect(toSafePageReferrer("https://www.freshstart-il.com/dashboard/Jane-Doe-312-555-0100"))
      .toBe("https://www.freshstart-il.com")
  })

  it("rejects nested objects, arrays, and blocked URL-like values", () => {
    expect(sanitizeClientEventParams("page_view", {
      nested: { email: "user@example.com" },
      list: ["one_time"],
      page_title: "Pricing",
      coupon_url: "https://evil.test",
    })).toBeNull()
  })

  it.each([
    ["name", { search_term: "Jane Doe" }],
    ["phone", { error_message: "Call 312-555-0100" }],
    ["ssn", { message: "123-45-6789" }],
    ["address", { detail: "123 Main Street" }],
    ["token", { error_context: "sk_live_sensitive" }],
    ["file", { file_name: "divorce-jane-doe.pdf" }],
  ])("fails closed for free-form %s values", (_label, params) => {
    expect(sanitizeClientEventParams("error", params)).toBeNull()
  })

  it("allows only known categorical scalars and fixed checkout items", () => {
    expect(sanitizeClientEventParams("begin_checkout", {
      currency: "USD",
      value: 149,
      items: [{ item_name: "one_time", price: 149, quantity: 1 }],
    })).toEqual({
      currency: "USD",
      value: 149,
      items: [{ item_name: "one_time", price: 149, quantity: 1 }],
    })
    expect(sanitizeClientEventParams("login", { method: "email" })).toEqual({ method: "email" })
  })
})

describe("GA4 readiness handoff", () => {
  afterEach(() => {
    jest.resetModules()
  })

  it("notifies an already-mounted listener when gtag becomes ready later", () => {
    const ga4 = require("@/lib/analytics/ga4-client") as typeof import("@/lib/analytics/ga4-client")
    const listener = jest.fn()

    const unsubscribe = ga4.subscribeToGtagReady(listener)
    expect(ga4.hasGtagReady()).toBe(false)

    ga4.markGtagReady()

    expect(ga4.hasGtagReady()).toBe(true)
    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
  })

  it("supports provider mount after gtag was already marked ready", () => {
    const ga4 = require("@/lib/analytics/ga4-client") as typeof import("@/lib/analytics/ga4-client")

    ga4.markGtagReady()

    expect(ga4.hasGtagReady()).toBe(true)
    const lateListener = jest.fn()
    const unsubscribe = ga4.subscribeToGtagReady(lateListener)
    expect(ga4.hasGtagReady()).toBe(true)
    expect(lateListener).not.toHaveBeenCalled()
    unsubscribe()
  })

  it("cleans up listeners deterministically", () => {
    const ga4 = require("@/lib/analytics/ga4-client") as typeof import("@/lib/analytics/ga4-client")
    const listener = jest.fn()

    const unsubscribe = ga4.subscribeToGtagReady(listener)
    unsubscribe()
    ga4.markGtagReady()

    expect(listener).not.toHaveBeenCalled()
  })

  it("signals readiness from the inline gtag initializer instead of a sibling effect", () => {
    const source = readFileSync(
      join(process.cwd(), "components/analytics/google-analytics.tsx"),
      "utf8",
    )

    expect(source).toMatch(/window\.dispatchEvent\(new CustomEvent\((?:\$\{JSON\.stringify\(GTAG_READY_EVENT_NAME\)\}|["']ga4:gtag-ready["'])\)\)/)
    expect(source).toContain("window.gtag = gtag;")
    expect(source).toContain("page_location: pageLocation")
    expect(source).toContain("page_referrer: pageReferrer")
    expect(source).toContain("send_page_view: false")
    expect(source.match(/send_page_view: false/g)).toHaveLength(2)
    expect(source.match(/page_location: pageLocation/g)).toHaveLength(2)
    expect(source.match(/page_referrer: pageReferrer/g)).toHaveLength(2)
    expect(source).not.toContain("window.location.href")
    expect(source).not.toContain("page_path: window.location.pathname")
    expect(source).toContain("SAFE_ANALYTICS_STATIC_PATHS")
    expect(source).toContain("SAFE_ANALYTICS_DYNAMIC_ROUTES")
    expect(source).toContain("if (pagePath)")
    expect(source).not.toContain("checkout.stripe.com/pay")
    expect(source).not.toContain("function GtagReadySignal")
    expect(source).not.toContain("markGtagReady()")
  })

  it("keeps GoogleAnalytics hooks above the no-id early return", () => {
    const source = readFileSync(
      join(process.cwd(), "components/analytics/google-analytics.tsx"),
      "utf8",
    )

    expect(source.indexOf("useEffect(() =>")).toBeGreaterThan(-1)
    expect(source.indexOf("useEffect(() =>")).toBeLessThan(source.indexOf("if (!hasAnyId)"))
  })

  it("keeps searchParams out of the page-view effect dependency list", () => {
    const source = readFileSync(
      join(process.cwd(), "components/analytics/analytics-provider.tsx"),
      "utf8",
    )

    expect(source).toContain("}, [trackingEnabled, searchParams])")
    expect(source).toContain("}, [pathname, trackingEnabled, gtagReady])")
  })

  it("routes v2 events through the same fail-closed sanitizer", () => {
    const source = readFileSync(
      join(process.cwd(), "app/v2/_components/analytics.ts"),
      "utf8",
    )
    expect(source).toContain("trackGA4Event(eventName, params)")
    expect(source).not.toMatch(/gtag\(["']event["']/)
  })
})
