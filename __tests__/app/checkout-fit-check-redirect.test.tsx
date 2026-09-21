/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://www.freshstart-il.com/pricing"}
 *
 * Every client entrypoint that can create a one-time Checkout Session must
 * handle the server's fit-check block by sending the user to `/fit-check`
 * with the selected plan and source intact — and must not report it as a
 * generic failure, drop the pending intent, or emit a checkout handoff event.
 *
 * Navigation is asserted through `@/lib/navigation`, the single seam the
 * components use, because `window.location` is unforgeable in JSDOM: it cannot
 * be replaced or spied on, so a direct assignment would be unobservable here.
 */
import * as React from "react"
import { render, screen, waitFor } from "@testing-library/react"

let sessionStatus = "authenticated"

jest.mock("next-auth/react", () => ({
  useSession: () => ({
    status: sessionStatus,
    data: sessionStatus === "authenticated" ? { user: {} } : null,
  }),
}))
jest.mock("@/lib/navigation", () => ({ navigateTo: jest.fn() }))
jest.mock("@/lib/analytics/events", () => ({
  analytics: { subscriptionStart: jest.fn() },
}))

import { navigateTo } from "@/lib/navigation"
import { analytics } from "@/lib/analytics/events"
import { PricingCheckoutResume } from "@/app/v2/_components/PricingCheckoutResume"
import {
  CHECKOUT_INTENT_STORAGE_KEYS,
  buildFitCheckUrl,
  isFitCheckBlock,
  isFitCheckHardBlock,
} from "@/app/v2/_components/checkout-intent"

const navigated = navigateTo as jest.Mock
const beganCheckout = analytics.subscriptionStart as jest.Mock

const FIT_CHECK_URL = "/fit-check?plan=one_time&source=pricing_tier_essential"

function armPendingIntent() {
  window.sessionStorage.setItem("fs_auto_checkout", "true")
  window.sessionStorage.setItem("fs_checkout_plan", "one_time")
  window.sessionStorage.setItem("fs_checkout_source", "pricing_tier_essential")
}

/**
 * Populates every key a pending intent can occupy, including the two legacy
 * `subscribe_*`/`auto_*` names `getPendingCheckoutIntent` still reads, so a
 * partial clear shows up as a failure rather than passing on the flag alone.
 */
function armEveryIntentKey() {
  armPendingIntent()
  window.sessionStorage.setItem("subscribe_plan", "one_time")
  window.sessionStorage.setItem("auto_subscribe", "true")
  for (const key of CHECKOUT_INTENT_STORAGE_KEYS) {
    expect(window.sessionStorage.getItem(key)).not.toBeNull()
  }
}

function blockedResponse(code: string) {
  return {
    ok: false,
    status: 409,
    json: async () => ({ error: "Complete the FreshStart fit check before checkout.", code }),
  } as Response
}

describe("fit-check routing for checkout entrypoints", () => {
  beforeEach(() => {
    sessionStatus = "authenticated"
    window.sessionStorage.clear()
    navigated.mockClear()
    beganCheckout.mockClear()
    jest.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("builds a fit-check URL that preserves the selected plan and source", () => {
    expect(buildFitCheckUrl({ plan: "one_time", source: "pricing_tier_essential" })).toBe(
      FIT_CHECK_URL,
    )
    expect(buildFitCheckUrl({ plan: "annual" as never, source: "stale_link" })).toContain(
      "plan=one_time",
    )
  })

  it("recognises both blocked codes and nothing else", () => {
    expect(isFitCheckBlock("fit_check_required")).toBe(true)
    expect(isFitCheckBlock("fit_check_blocked")).toBe(true)
    expect(isFitCheckBlock("some_other_error")).toBe(false)
    expect(isFitCheckBlock(undefined)).toBe(false)
    expect(isFitCheckBlock(null)).toBe(false)
  })

  it.each(["fit_check_required", "fit_check_blocked"])(
    "redirects the pricing resume to the fit check on %s",
    async (code) => {
      armPendingIntent()
      global.fetch = jest.fn(async () => blockedResponse(code)) as unknown as typeof fetch

      render(<PricingCheckoutResume />)

      await waitFor(() => expect(navigated).toHaveBeenCalledWith(FIT_CHECK_URL))
      expect(navigated).toHaveBeenCalledTimes(1)
      expect(beganCheckout).not.toHaveBeenCalled()
    },
  )

  it("keeps the pending intent armed across a fit_check_required detour", async () => {
    armPendingIntent()
    global.fetch = jest.fn(async () => blockedResponse("fit_check_required")) as unknown as typeof fetch

    render(<PricingCheckoutResume />)

    await waitFor(() => expect(navigated).toHaveBeenCalledWith(FIT_CHECK_URL))
    expect(window.sessionStorage.getItem("fs_auto_checkout")).toBe("true")
    expect(window.sessionStorage.getItem("fs_checkout_plan")).toBe("one_time")
    expect(window.sessionStorage.getItem("fs_checkout_source")).toBe("pricing_tier_essential")
  })

  it("retires every intent key on fit_check_blocked so pricing cannot bounce the user back", async () => {
    armEveryIntentKey()
    global.fetch = jest.fn(async () => blockedResponse("fit_check_blocked")) as unknown as typeof fetch

    render(<PricingCheckoutResume />)

    // The user still sees why they were turned away…
    await waitFor(() => expect(navigated).toHaveBeenCalledWith(FIT_CHECK_URL))
    // …but nothing is left to resume, so returning to /pricing is not a loop.
    for (const key of CHECKOUT_INTENT_STORAGE_KEYS) {
      expect(window.sessionStorage.getItem(key)).toBeNull()
    }
    expect(beganCheckout).not.toHaveBeenCalled()
  })

  it("does not resume checkout at all once a blocked detour has retired the intent", async () => {
    armEveryIntentKey()
    const fetchMock = jest.fn(async () => blockedResponse("fit_check_blocked"))
    global.fetch = fetchMock as unknown as typeof fetch

    const first = render(<PricingCheckoutResume />)
    await waitFor(() => expect(navigated).toHaveBeenCalledWith(FIT_CHECK_URL))
    first.unmount()

    // A second visit to /pricing, exactly as a back-navigation would produce.
    navigated.mockClear()
    const callsAfterFirstVisit = fetchMock.mock.calls.length
    render(<PricingCheckoutResume />)
    await Promise.resolve()

    // Nothing to resume: no checkout request, no status line, no second
    // bounce to the fit check.
    expect(fetchMock.mock.calls.length).toBe(callsAfterFirstVisit)
    expect(screen.queryByRole("status")).toBeNull()
    expect(navigated).not.toHaveBeenCalled()
    expect(beganCheckout).not.toHaveBeenCalled()
  })

  it("classifies the two block codes by whether answering again can clear them", () => {
    expect(isFitCheckHardBlock("fit_check_blocked")).toBe(true)
    expect(isFitCheckHardBlock("fit_check_required")).toBe(false)
    expect(isFitCheckHardBlock(undefined)).toBe(false)
    expect(isFitCheckHardBlock(null)).toBe(false)
  })

  it("does not present a fit-check block as a checkout failure", async () => {
    armPendingIntent()
    global.fetch = jest.fn(async () => blockedResponse("fit_check_required")) as unknown as typeof fetch

    render(<PricingCheckoutResume />)

    await waitFor(() => expect(navigated).toHaveBeenCalledWith(FIT_CHECK_URL))
    expect(screen.getByRole("status").textContent).not.toMatch(/could not start checkout/i)
  })

  it("still reports an unrelated checkout refusal as a failure and clears the intent", async () => {
    armPendingIntent()
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 409,
      json: async () => ({ error: "Your current 60-day access period is still active" }),
    }) as Response) as unknown as typeof fetch

    render(<PricingCheckoutResume />)

    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toMatch(/could not start checkout/i),
    )
    expect(navigated).not.toHaveBeenCalled()
    expect(beganCheckout).not.toHaveBeenCalled()
    expect(window.sessionStorage.getItem("fs_auto_checkout")).toBeNull()
  })
})
