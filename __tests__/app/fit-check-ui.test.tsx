/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://www.freshstart-il.com/fit-check?plan=one_time&source=pricing_tier_essential"}
 *
 * The fit-check UI collects bounded answers only, states the mechanical
 * (non-legal-advice) purpose up front, and never decides the outcome itself —
 * the server response is the only thing it renders.
 *
 * It also owns two rules about the pending checkout intent: a fit result alone
 * arms nothing (only the user's Continue click does), and a blocked result
 * retires whatever intent the user arrived with.
 *
 * Navigation is asserted through `@/lib/navigation`, the single seam the
 * component uses, because `window.location` is unforgeable in JSDOM.
 */
import * as React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom"

jest.mock("@/lib/navigation", () => ({ navigateTo: jest.fn() }))

import { navigateTo } from "@/lib/navigation"
import { FitCheckForm } from "@/app/fit-check/fit-check-form"
import { FIT_CHECK_QUESTIONS } from "@/lib/fit-check/policy"
import { CHECKOUT_INTENT_STORAGE_KEYS } from "@/app/v2/_components/checkout-intent"

const navigated = navigateTo as jest.Mock

function mockFitCheckResponse(payload: Record<string, unknown>, ok = true, status?: number) {
  global.fetch = jest.fn(async () => ({
    ok,
    status: status ?? (ok ? 200 : 409),
    json: async () => payload,
  })) as unknown as typeof fetch
}

/**
 * An intent as the pricing resume would have left it before bouncing the user
 * here: every key a pending intent can occupy is populated, including the two
 * legacy names, so a partial clear is visible as a failure.
 */
function armEveryIntentKey() {
  window.sessionStorage.setItem("fs_checkout_plan", "one_time")
  window.sessionStorage.setItem("fs_checkout_source", "pricing_tier_essential")
  window.sessionStorage.setItem("fs_auto_checkout", "true")
  window.sessionStorage.setItem("subscribe_plan", "one_time")
  window.sessionStorage.setItem("auto_subscribe", "true")
  for (const key of CHECKOUT_INTENT_STORAGE_KEYS) {
    expect(window.sessionStorage.getItem(key)).not.toBeNull()
  }
}

async function answerEverything(user: ReturnType<typeof userEvent.setup>, value: string) {
  for (const question of FIT_CHECK_QUESTIONS) {
    await user.click(screen.getByTestId(`fit-check-${question.id}-${value}`))
  }
}

describe("fit-check form", () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    navigated.mockClear()
    jest.spyOn(console, "error").mockImplementation(() => {})
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("states the mechanical purpose and the not-legal-advice boundary before any question", () => {
    render(<FitCheckForm />)
    const intro = screen.getByTestId("fit-check-intro").textContent ?? ""
    expect(intro).toMatch(/whether the current FreshStart workflow/i)
    expect(intro).toMatch(/not legal advice/i)
  })

  it("renders every policy question with an explicit not-sure choice and no free-text input", () => {
    const { container } = render(<FitCheckForm />)
    for (const question of FIT_CHECK_QUESTIONS) {
      expect(screen.getByTestId(`fit-check-${question.id}-yes`)).toBeInTheDocument()
      expect(screen.getByTestId(`fit-check-${question.id}-no`)).toBeInTheDocument()
      expect(screen.getByTestId(`fit-check-${question.id}-not_sure`)).toBeInTheDocument()
    }
    expect(container.querySelector("textarea")).toBeNull()
    expect(container.querySelector('input[type="text"]')).toBeNull()
    expect(container.querySelector('input[type="email"]')).toBeNull()
    for (const input of Array.from(container.querySelectorAll("input"))) {
      expect(input.getAttribute("type")).toBe("radio")
    }
  })

  it("cannot be submitted until every question is answered", async () => {
    const user = userEvent.setup()
    mockFitCheckResponse({ result: "fit" })
    render(<FitCheckForm />)

    const submit = screen.getByRole("button", { name: /check fit/i })
    expect(submit).toBeDisabled()

    await answerEverything(user, "yes")
    expect(submit).toBeEnabled()
  })

  it("sends only the bounded answer set to the server", async () => {
    const user = userEvent.setup()
    mockFitCheckResponse({ result: "fit", policyVersion: "2026-09-21.1" })
    render(<FitCheckForm />)

    await answerEverything(user, "yes")
    await user.click(screen.getByRole("button", { name: /check fit/i }))

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0]
    expect(url).toBe("/api/fit-check")
    expect(init.method).toBe("POST")
    const body = JSON.parse(init.body)
    expect(Object.keys(body)).toEqual(["answers"])
    expect(Object.keys(body.answers).sort()).toEqual(
      FIT_CHECK_QUESTIONS.map((question) => question.id).sort(),
    )
    for (const value of Object.values(body.answers)) {
      expect(["yes", "no", "not_sure"]).toContain(value)
    }
    expect(body.answers).not.toHaveProperty("result")
  })

  it("renders only the server's outcome, never a locally computed one", async () => {
    const user = userEvent.setup()
    // All-yes answers would classify as `fit` locally; the server says otherwise.
    mockFitCheckResponse({ result: "review_required" })
    render(<FitCheckForm />)

    await answerEverything(user, "yes")
    await user.click(screen.getByRole("button", { name: /check fit/i }))

    const outcome = await screen.findByTestId("fit-check-outcome")
    expect(outcome.getAttribute("data-result")).toBe("review_required")
    expect(outcome.textContent).toMatch(/Illinois attorney/i)
    expect(screen.queryByTestId("fit-check-continue")).toBeNull()
  })

  it("offers checkout on a fit outcome but arms nothing until the user asks", async () => {
    const user = userEvent.setup()
    mockFitCheckResponse({ result: "fit" })
    render(<FitCheckForm />)

    await answerEverything(user, "yes")
    await user.click(screen.getByRole("button", { name: /check fit/i }))

    const outcome = await screen.findByTestId("fit-check-outcome")
    expect(outcome.getAttribute("data-result")).toBe("fit")
    expect(screen.getByTestId("fit-check-continue")).toHaveAttribute("href", "/pricing")

    // A fit result permits checkout; it does not request it. Learning that the
    // workflow fits must not, by itself, queue a payment.
    for (const key of CHECKOUT_INTENT_STORAGE_KEYS) {
      expect(window.sessionStorage.getItem(key)).toBeNull()
    }
    expect(navigated).not.toHaveBeenCalled()
  })

  it("arms the intent with the arrival plan and source only on the Continue click", async () => {
    const user = userEvent.setup()
    mockFitCheckResponse({ result: "fit" })
    render(<FitCheckForm />)

    await answerEverything(user, "yes")
    await user.click(screen.getByRole("button", { name: /check fit/i }))
    await user.click(await screen.findByTestId("fit-check-continue"))

    expect(window.sessionStorage.getItem("fs_checkout_plan")).toBe("one_time")
    expect(window.sessionStorage.getItem("fs_checkout_source")).toBe("pricing_tier_essential")
    expect(window.sessionStorage.getItem("fs_auto_checkout")).toBe("true")
    expect(navigated).toHaveBeenCalledWith("/pricing")
    expect(navigated).toHaveBeenCalledTimes(1)
  })

  it("explains an out-of-scope outcome without any legal conclusion", async () => {
    const user = userEvent.setup()
    mockFitCheckResponse({ result: "out_of_scope" })
    render(<FitCheckForm />)

    await answerEverything(user, "no")
    await user.click(screen.getByRole("button", { name: /check fit/i }))

    const outcome = await screen.findByTestId("fit-check-outcome")
    expect(outcome.getAttribute("data-result")).toBe("out_of_scope")
    expect(outcome.textContent).toMatch(/does not support/i)
    expect(outcome.textContent).not.toMatch(/eligible|ineligible|you do not qualify|not entitled/i)
    expect(screen.queryByTestId("fit-check-continue")).toBeNull()
  })

  it.each(["out_of_scope", "review_required"])(
    "clears every key of a pre-existing armed intent on a %s outcome",
    async (result) => {
      const user = userEvent.setup()
      armEveryIntentKey()
      mockFitCheckResponse({ result })
      render(<FitCheckForm />)

      // Any answers reach the server; only the server's result matters here.
      await answerEverything(user, "no")
      await user.click(screen.getByRole("button", { name: /check fit/i }))

      const outcome = await screen.findByTestId("fit-check-outcome")
      expect(outcome.getAttribute("data-result")).toBe(result)

      // The whole intent is retired, not just the auto-checkout flag: a
      // leftover key would let the pricing page resume into the same refusal
      // and bounce the user back here indefinitely.
      for (const key of CHECKOUT_INTENT_STORAGE_KEYS) {
        expect(window.sessionStorage.getItem(key)).toBeNull()
      }

      // And nothing resumes on its own: no navigation, no checkout offer.
      expect(navigated).not.toHaveBeenCalled()
      expect(screen.queryByTestId("fit-check-continue")).toBeNull()
    },
  )

  it("leaves an armed intent alone on a fit outcome so the user can still continue", async () => {
    const user = userEvent.setup()
    armEveryIntentKey()
    mockFitCheckResponse({ result: "fit" })
    render(<FitCheckForm />)

    await answerEverything(user, "yes")
    await user.click(screen.getByRole("button", { name: /check fit/i }))

    await screen.findByTestId("fit-check-outcome")
    expect(window.sessionStorage.getItem("fs_auto_checkout")).toBe("true")
    expect(navigated).not.toHaveBeenCalled()
  })

  it("offers a way back in when the session has expired, instead of a dead end", async () => {
    const user = userEvent.setup()
    mockFitCheckResponse({ error: "Unauthorized" }, false, 401)
    render(<FitCheckForm />)

    await answerEverything(user, "yes")
    await user.click(screen.getByRole("button", { name: /check fit/i }))

    const panel = await screen.findByTestId("fit-check-signed-out")
    expect(panel.textContent).toMatch(/signed in/i)
    // The sign-in round trip returns to this same questionnaire, carrying the
    // plan and source the user arrived with.
    const link = screen.getByTestId("fit-check-signin")
    const target = new URL(link.getAttribute("href") ?? "", "https://www.freshstart-il.com")
    expect(target.pathname).toBe("/auth/signin")
    const callbackUrl = target.searchParams.get("callbackUrl") ?? ""
    expect(callbackUrl).toContain("/fit-check")
    expect(callbackUrl).toContain("plan=one_time")
    expect(callbackUrl).toContain("source=pricing_tier_essential")

    // A 401 is not an outcome and not a checkout offer.
    expect(screen.queryByTestId("fit-check-outcome")).toBeNull()
    expect(screen.queryByTestId("fit-check-continue")).toBeNull()
  })

  it("shows a recoverable error and offers no checkout when the server refuses", async () => {
    const user = userEvent.setup()
    mockFitCheckResponse({ error: "Too many requests. Please try again later." }, false)
    render(<FitCheckForm />)

    await answerEverything(user, "yes")
    await user.click(screen.getByRole("button", { name: /check fit/i }))

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toMatch(/could not complete|try again/i),
    )
    expect(screen.queryByTestId("fit-check-continue")).toBeNull()
  })
})
