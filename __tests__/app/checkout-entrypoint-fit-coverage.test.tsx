/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://www.freshstart-il.com/pricing"}
 *
 * Coverage proof: every client module that POSTs to the one-time checkout
 * route routes a fit-check block to `/fit-check` instead of surfacing it as a
 * generic error. The list is derived from the source tree, not maintained by
 * hand, so a new entrypoint cannot silently skip the gate.
 *
 * The same scan also pins every such module to the `@/lib/navigation` seam:
 * a raw `window.location.href = …` would still work in a browser but would be
 * unassertable here, so the destination could regress unnoticed.
 */
import * as React from "react"
import { readFileSync, readdirSync, statSync } from "fs"
import { join } from "path"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom"

let sessionStatus = "authenticated"

jest.mock("next-auth/react", () => ({
  useSession: () => ({
    status: sessionStatus,
    data: sessionStatus === "authenticated" ? { user: { email: "user@example.com" } } : null,
  }),
}))
jest.mock("@/lib/navigation", () => ({ navigateTo: jest.fn() }))

import { navigateTo } from "@/lib/navigation"
import { SubscribeButton } from "@/components/stripe/subscribe-button"

const navigated = navigateTo as jest.Mock

const ROOT = join(__dirname, "..", "..")
const SEARCH_DIRS = ["app", "components", "lib"]

function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next") continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full)
  }
  return out
}

function clientCheckoutCallers(): string[] {
  return SEARCH_DIRS.flatMap((dir) => walk(join(ROOT, dir)))
    .filter((file) => {
      const source = readFileSync(file, "utf8")
      return source.includes("fetch(\"/api/stripe/create-checkout-session\"")
    })
    .map((file) => file.slice(ROOT.length + 1))
}

describe("one-time checkout entrypoint fit-check coverage", () => {
  beforeEach(() => {
    sessionStatus = "authenticated"
    window.sessionStorage.clear()
    navigated.mockClear()
    jest.spyOn(console, "error").mockImplementation(() => {})
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("finds exactly the two known client entrypoints, and each handles the fit-check block", () => {
    const callers = clientCheckoutCallers().sort()
    expect(callers).toEqual([
      "app/v2/_components/PricingCheckoutResume.tsx",
      "components/stripe/subscribe-button.tsx",
    ])
    for (const caller of callers) {
      const source = readFileSync(join(ROOT, caller), "utf8")
      expect(source).toMatch(/isFitCheckBlock/)
      expect(source).toMatch(/buildFitCheckUrl/)
      // Navigates through the seam, never by assigning to the unforgeable
      // `window.location`, so the destination stays observable in tests.
      expect(source).toMatch(/from "@\/lib\/navigation"/)
      expect(source).toMatch(/navigateTo\(/)
      expect(source).not.toMatch(/window\.location\.href\s*=/)
    }
  })

  it("sends the legacy subscribe button to the fit check instead of showing an error", async () => {
    const user = userEvent.setup()
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 409,
      json: async () => ({
        error: "Complete the FreshStart fit check before checkout.",
        code: "fit_check_required",
      }),
    }) as Response) as unknown as typeof fetch

    render(<SubscribeButton />)
    await user.click(screen.getByRole("button", { name: /continue to checkout/i }))

    await waitFor(() =>
      expect(navigated).toHaveBeenCalledWith(
        "/fit-check?plan=one_time&source=legacy_subscribe_button",
      ),
    )
    expect(navigated).toHaveBeenCalledTimes(1)
    expect(screen.queryByText(/Complete the FreshStart fit check/i)).toBeNull()
  })

  it("still surfaces an unrelated checkout refusal on the legacy subscribe button", async () => {
    const user = userEvent.setup()
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 409,
      json: async () => ({ error: "This checkout is already paid" }),
    }) as Response) as unknown as typeof fetch

    render(<SubscribeButton />)
    await user.click(screen.getByRole("button", { name: /continue to checkout/i }))

    await waitFor(() => expect(screen.getByText(/already paid/i)).toBeInTheDocument())
    expect(navigated).not.toHaveBeenCalled()
  })
})
