/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://www.freshstart-il.com/pricing"}
 *
 * Runtime proof for the checkout handoff. `PricingCheckoutResume` is the only
 * UI path that creates a real Stripe Checkout Session, so `begin_checkout`
 * belongs there — emitted once, only after the server hands back a session
 * URL, and never able to interfere with the redirect.
 */
import * as React from "react"
import { render, screen, waitFor } from "@testing-library/react"

let sessionStatus = "authenticated"

jest.mock("next-auth/react", () => ({
  useSession: () => ({ status: sessionStatus, data: sessionStatus === "authenticated" ? { user: {} } : null }),
}))

import { PricingCheckoutResume } from "@/app/v2/_components/PricingCheckoutResume"

const CHECKOUT_URL = "https://checkout.stripe.com/c/pay/cs_test_a1b2c3"

function armPendingIntent() {
  window.sessionStorage.setItem("fs_auto_checkout", "true")
  window.sessionStorage.setItem("fs_checkout_plan", "one_time")
  window.sessionStorage.setItem("fs_checkout_source", "pricing_tier_essential")
}

function beginCheckoutCalls() {
  return (window.gtag as jest.Mock).mock.calls.filter(
    (call) => call[0] === "event" && call[1] === "begin_checkout",
  )
}

describe("checkout handoff instrumentation", () => {
  const originalEnabled = process.env.NEXT_PUBLIC_ENABLE_TRACKING

  beforeEach(() => {
    process.env.NEXT_PUBLIC_ENABLE_TRACKING = "true"
    sessionStatus = "authenticated"
    window.sessionStorage.clear()
    window.gtag = jest.fn()
    ;(window as unknown as { fbq: unknown }).fbq = jest.fn()
    jest.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_ENABLE_TRACKING = originalEnabled
    jest.restoreAllMocks()
  })

  it("emits exactly one $149 begin_checkout after the server returns a session URL", async () => {
    armPendingIntent()
    const order: string[] = []
    global.fetch = jest.fn(async () => {
      order.push("create_checkout_session")
      return { ok: true, json: async () => ({ sessionId: "cs_test_a1b2c3", url: CHECKOUT_URL }) } as Response
    }) as unknown as typeof fetch
    ;(window.gtag as jest.Mock).mockImplementation(() => order.push("begin_checkout"))

    render(<PricingCheckoutResume />)

    await waitFor(() => expect(beginCheckoutCalls()).toHaveLength(1))
    expect(beginCheckoutCalls()[0][2]).toEqual({
      currency: "USD",
      value: 149,
      items: [{ item_name: "one_time", price: 149, quantity: 1 }],
    })
    // Authoritative ordering: never a client guess ahead of the server.
    expect(order).toEqual(["create_checkout_session", "begin_checkout"])

    // The handoff proceeded: the pending intent was consumed for the redirect.
    await waitFor(() => expect(window.sessionStorage.getItem("fs_auto_checkout")).toBeNull())

    const serialized = JSON.stringify((window.gtag as jest.Mock).mock.calls)
    expect(serialized).not.toContain("cs_test")
    expect(serialized).not.toContain("checkout.stripe.com")
    expect(serialized).not.toContain("pricing_tier_essential")
    expect(serialized).not.toMatch(/https?:\/\//)
  })

  it("emits nothing when the server refuses to create a checkout session", async () => {
    armPendingIntent()
    global.fetch = jest.fn(async () => ({
      ok: false,
      json: async () => ({ error: "Your current 60-day access period is still active" }),
    }) as Response) as unknown as typeof fetch

    render(<PricingCheckoutResume />)

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/could not start checkout/i))
    expect(beginCheckoutCalls()).toHaveLength(0)
  })

  it("emits nothing when there is no pending checkout intent", async () => {
    global.fetch = jest.fn() as unknown as typeof fetch

    render(<PricingCheckoutResume />)

    await waitFor(() => expect(global.fetch).not.toHaveBeenCalled())
    expect(beginCheckoutCalls()).toHaveLength(0)
  })

  it("still completes the handoff when the analytics transport throws", async () => {
    armPendingIntent()
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ sessionId: "cs_test_a1b2c3", url: CHECKOUT_URL }),
    }) as Response) as unknown as typeof fetch
    ;(window.gtag as jest.Mock).mockImplementation(() => {
      throw new Error("tag manager exploded")
    })

    render(<PricingCheckoutResume />)

    // The redirect path is reached regardless of the failing tag.
    await waitFor(() => expect(window.sessionStorage.getItem("fs_auto_checkout")).toBeNull())
    expect(screen.getByRole("status")).toHaveTextContent(/Redirecting to secure checkout/i)
  })

  it("dispatches nothing while the production tracking gate is closed", async () => {
    process.env.NEXT_PUBLIC_ENABLE_TRACKING = "false"
    armPendingIntent()
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ sessionId: "cs_test_a1b2c3", url: CHECKOUT_URL }),
    }) as Response) as unknown as typeof fetch

    render(<PricingCheckoutResume />)

    await waitFor(() => expect(window.sessionStorage.getItem("fs_auto_checkout")).toBeNull())
    expect(window.gtag).not.toHaveBeenCalled()
  })
})
