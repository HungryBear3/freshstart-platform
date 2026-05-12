/**
 * @jest-environment jsdom
 *
 * Production-only tracking gate. Verifies that live tracking is OFF by
 * default and only flips ON when the operator opts in AND the runtime is
 * the production hostname. Vercel Preview, localhost, and dev must always
 * read as OFF — that's the bug this gate was added to prevent.
 *
 * The pure variant `isLiveTrackingEnabledFor(host)` is used to side-step
 * jsdom's non-configurable `window.location.host`. The wrapper
 * `isLiveTrackingEnabled()` is covered by a separate SSR-context check
 * and by the downstream helper tests (which can spy on gtag/fbq directly).
 */
import {
  isLiveTrackingEnabled,
  isLiveTrackingEnabledFor,
  trackingGateReason,
} from "@/lib/analytics/tracking-gate"

describe("isLiveTrackingEnabledFor (pure)", () => {
  const originalEnv = process.env.NEXT_PUBLIC_ENABLE_TRACKING
  const originalAllowed = process.env.NEXT_PUBLIC_TRACKING_ALLOWED_HOSTS

  afterEach(() => {
    process.env.NEXT_PUBLIC_ENABLE_TRACKING = originalEnv
    process.env.NEXT_PUBLIC_TRACKING_ALLOWED_HOSTS = originalAllowed
  })

  it("is OFF by default (no env, localhost)", () => {
    delete process.env.NEXT_PUBLIC_ENABLE_TRACKING
    expect(isLiveTrackingEnabledFor("localhost:3000")).toBe(false)
  })

  it("is OFF on Vercel preview host even when env opt-in is set", () => {
    process.env.NEXT_PUBLIC_ENABLE_TRACKING = "true"
    expect(
      isLiveTrackingEnabledFor(
        "freshstart-platform-abc123-alexy-kapluns-projects.vercel.app",
      ),
    ).toBe(false)
  })

  it("is OFF on production host when env opt-in is missing", () => {
    delete process.env.NEXT_PUBLIC_ENABLE_TRACKING
    expect(isLiveTrackingEnabledFor("www.freshstart-il.com")).toBe(false)
  })

  it("is ON only when BOTH env opt-in AND production host match", () => {
    process.env.NEXT_PUBLIC_ENABLE_TRACKING = "true"
    expect(isLiveTrackingEnabledFor("freshstart-il.com")).toBe(true)
    expect(isLiveTrackingEnabledFor("www.freshstart-il.com")).toBe(true)
  })

  it("respects NEXT_PUBLIC_TRACKING_ALLOWED_HOSTS extension list", () => {
    process.env.NEXT_PUBLIC_ENABLE_TRACKING = "true"
    process.env.NEXT_PUBLIC_TRACKING_ALLOWED_HOSTS = "staging.freshstart-il.com"
    expect(isLiveTrackingEnabledFor("staging.freshstart-il.com")).toBe(true)
  })

  it("is host case-insensitive", () => {
    process.env.NEXT_PUBLIC_ENABLE_TRACKING = "true"
    expect(isLiveTrackingEnabledFor("WWW.FRESHSTART-IL.COM")).toBe(true)
  })

  it("treats null/empty host as not enabled (SSR-safe)", () => {
    process.env.NEXT_PUBLIC_ENABLE_TRACKING = "true"
    expect(isLiveTrackingEnabledFor(null)).toBe(false)
    expect(isLiveTrackingEnabledFor("")).toBe(false)
  })
})

describe("isLiveTrackingEnabled (wrapper, jsdom default host)", () => {
  // jsdom's default host is `localhost`. Without setting up jsdom's URL
  // option we can't change it portably, but we can still assert that the
  // wrapper reads as OFF in the default jest jsdom environment — which is
  // the property we actually care about.
  const originalEnv = process.env.NEXT_PUBLIC_ENABLE_TRACKING
  afterEach(() => {
    process.env.NEXT_PUBLIC_ENABLE_TRACKING = originalEnv
  })

  it("is OFF in jsdom even with env opt-in (host is 'localhost')", () => {
    process.env.NEXT_PUBLIC_ENABLE_TRACKING = "true"
    expect(isLiveTrackingEnabled()).toBe(false)
  })

  it("is OFF without env opt-in", () => {
    delete process.env.NEXT_PUBLIC_ENABLE_TRACKING
    expect(isLiveTrackingEnabled()).toBe(false)
  })

  it("trackingGateReason describes which check failed", () => {
    delete process.env.NEXT_PUBLIC_ENABLE_TRACKING
    expect(trackingGateReason()).toMatch(/NEXT_PUBLIC_ENABLE_TRACKING/)
  })
})

describe("downstream helpers do not fire when the gate is closed", () => {
  let originalGtag: unknown
  let originalFbq: unknown

  beforeEach(() => {
    originalGtag = (window as unknown as { gtag?: unknown }).gtag
    originalFbq = (window as unknown as { fbq?: unknown }).fbq
    delete process.env.NEXT_PUBLIC_ENABLE_TRACKING
  })

  afterEach(() => {
    ;(window as unknown as { gtag?: unknown }).gtag = originalGtag
    ;(window as unknown as { fbq?: unknown }).fbq = originalFbq
  })

  it("trackGA4Event is a no-op when the gate is closed", async () => {
    const gtagSpy = jest.fn()
    ;(window as unknown as { gtag?: unknown }).gtag = gtagSpy
    const { trackGA4Event } = await import("@/lib/analytics/events")
    trackGA4Event("test_event", { x: 1 })
    expect(gtagSpy).not.toHaveBeenCalled()
  })

  it("trackMetaEvent is a no-op when the gate is closed", async () => {
    const fbqSpy = jest.fn()
    ;(window as unknown as { fbq?: unknown }).fbq = fbqSpy
    const { trackMetaEvent } = await import("@/components/analytics/meta-pixel")
    trackMetaEvent("Lead", { foo: "bar" })
    expect(fbqSpy).not.toHaveBeenCalled()
  })

  it("trackGoogleAdsConversion is a no-op when the gate is closed", async () => {
    const gtagSpy = jest.fn()
    ;(window as unknown as { gtag?: unknown }).gtag = gtagSpy
    const { trackGoogleAdsConversion } = await import(
      "@/components/analytics/google-analytics"
    )
    trackGoogleAdsConversion("AW-123", "abc", 49)
    expect(gtagSpy).not.toHaveBeenCalled()
  })
})

describe("AnalyticsProvider does not render GA/Meta scripts off-prod", () => {
  it("declares the gate check in source (defense-in-depth for SSR snapshot)", () => {
    const fs = require("node:fs") as typeof import("node:fs")
    const path = require("node:path") as typeof import("node:path")
    const src = fs.readFileSync(
      path.resolve(
        __dirname,
        "..",
        "..",
        "..",
        "components/analytics/analytics-provider.tsx",
      ),
      "utf8",
    )
    expect(src).toMatch(/isLiveTrackingEnabled/)
    expect(src).toMatch(/trackingEnabled\s*&&/)
  })
})
