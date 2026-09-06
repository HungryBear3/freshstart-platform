/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://www.freshstart-il.com/questionnaires/financial_affidavit"}
 *
 * Runtime proof for the guided-intake funnel. This drives the real
 * questionnaire page against a mocked API and asserts what reaches `gtag`:
 * exact counts, no duplicates on re-navigation, no event on hydration, on a
 * resumed draft, or on a failed submit — and no answer content anywhere.
 *
 * DOM note: `questionnaire-form.tsx` wraps each question in a `<div>` carrying
 * the same `id` as the field it contains, so a `<Label htmlFor>` resolves to
 * the wrapper rather than the control and `getByLabelText` cannot find a form
 * element. That duplicate id is inherited product markup and is deliberately
 * NOT changed by this analytics lane; the `field()` helper below selects the
 * control directly instead.
 */
import * as React from "react"
import { render, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const mockPush = jest.fn()

jest.mock("next/navigation", () => ({
  useParams: () => ({ type: "financial_affidavit" }),
  useRouter: () => ({ push: mockPush, replace: jest.fn(), refresh: jest.fn(), prefetch: jest.fn(), back: jest.fn() }),
  usePathname: () => "/questionnaires/financial_affidavit",
  useSearchParams: () => new URLSearchParams(),
}))

import QuestionnairePage from "@/app/questionnaires/[type]/page"

const STRUCTURE = {
  id: "financial_affidavit",
  name: "Financial Affidavit",
  type: "financial_affidavit",
  sections: [
    {
      id: "income",
      title: "Income",
      questions: [
        { id: "employer-name", fieldName: "employerName", type: "text", label: "Employer name", required: true },
      ],
    },
    {
      id: "expenses",
      title: "Expenses",
      questions: [
        { id: "monthly-rent", fieldName: "monthlyRent", type: "text", label: "Monthly rent", required: true },
      ],
    },
  ],
}

/** Answer content that must never leave the browser through analytics. */
const ANSWER_EMPLOYER = "Jane Doe Consulting LLC"
const ANSWER_RENT = "2450 Cook County"

type FetchPlan = {
  savedResponses?: Record<string, unknown> | null
  savedSection?: number
  submitOk?: boolean
}

function installFetch(plan: FetchPlan = {}) {
  const submitOk = plan.submitOk !== false
  const fetchMock = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if (url === "/api/questionnaires/financial_affidavit") {
      return { ok: true, json: async () => ({ questionnaire: { structure: STRUCTURE } }) } as Response
    }
    if (url.startsWith("/api/questionnaires/responses?formType=")) {
      return {
        ok: true,
        json: async () => ({
          responses: plan.savedResponses
            ? [{
                id: "resp_abc",
                formType: "financial_affidavit",
                responses: plan.savedResponses,
                currentSection: plan.savedSection ?? 0,
              }]
            : [],
        }),
      } as Response
    }
    if (url.startsWith("/api/questionnaires/responses")) {
      const body = init?.body ? JSON.parse(String(init.body)) : {}
      if (body.status === "completed" && !submitOk) {
        return { ok: false, json: async () => ({ error: "nope" }) } as Response
      }
      return { ok: true, json: async () => ({ response: { id: "resp_abc" } }) } as Response
    }
    throw new Error(`unexpected fetch: ${url}`)
  })
  global.fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}

/** Select the real control for a question id, past the duplicate wrapper id. */
function field(container: HTMLElement, questionId: string): HTMLInputElement {
  const element = container.querySelector<HTMLInputElement>(`input#${questionId}`)
  if (!element) throw new Error(`no rendered input for question "${questionId}"`)
  return element
}

function button(container: HTMLElement, label: RegExp): HTMLButtonElement {
  const match = Array.from(container.querySelectorAll("button")).find((node) =>
    label.test(node.textContent || ""),
  )
  if (!match) throw new Error(`no button matching ${label}`)
  return match as HTMLButtonElement
}

async function waitForField(container: HTMLElement, questionId: string) {
  await waitFor(() => expect(container.querySelector(`input#${questionId}`)).not.toBeNull())
}

function gtagEvents(name?: string) {
  const calls = (window.gtag as jest.Mock).mock.calls.filter((call) => call[0] === "event")
  return name ? calls.filter((call) => call[1] === name) : calls
}

function assertNoAnswerContent() {
  const serialized = JSON.stringify((window.gtag as jest.Mock).mock.calls)
  for (const fragment of [
    "Jane", "Doe", "Consulting", "2450", "Cook County",
    "resp_abc", "employerName", "monthlyRent", "employer-name", "monthly-rent",
    "Financial Affidavit", "Income", "Expenses",
  ]) {
    expect(serialized).not.toContain(fragment)
  }
  expect(serialized).not.toMatch(/https?:\/\//)
  expect(serialized).not.toMatch(/[?#@]/)
}

describe("guided-intake funnel instrumentation", () => {
  const originalEnabled = process.env.NEXT_PUBLIC_ENABLE_TRACKING

  beforeEach(() => {
    process.env.NEXT_PUBLIC_ENABLE_TRACKING = "true"
    window.gtag = jest.fn()
    ;(window as unknown as { fbq: unknown }).fbq = jest.fn()
    window.scrollTo = jest.fn()
    jest.spyOn(window, "alert").mockImplementation(() => {})
    jest.spyOn(console, "error").mockImplementation(() => {})
    mockPush.mockClear()
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_ENABLE_TRACKING = originalEnabled
    jest.restoreAllMocks()
  })

  it("emits no event while the intake is merely loading and hydrating", async () => {
    installFetch()
    const { container } = render(<QuestionnairePage />)
    await waitForField(container, "employer-name")

    expect(gtagEvents()).toHaveLength(0)
  })

  it("emits exactly one start on the first real answer, never on later edits", async () => {
    installFetch()
    const user = userEvent.setup()
    const { container } = render(<QuestionnairePage />)
    await waitForField(container, "employer-name")

    await user.type(field(container, "employer-name"), ANSWER_EMPLOYER)

    await waitFor(() => expect(gtagEvents("questionnaire_start")).toHaveLength(1))
    expect(gtagEvents("questionnaire_start")[0][2]).toEqual({ questionnaire_type: "financial_affidavit" })
    expect(gtagEvents()).toHaveLength(1)
    assertNoAnswerContent()
  })

  it("emits one section_complete per cleared section and none on re-navigation", async () => {
    installFetch()
    const user = userEvent.setup()
    const { container } = render(<QuestionnairePage />)
    await waitForField(container, "employer-name")

    await user.type(field(container, "employer-name"), ANSWER_EMPLOYER)
    await user.click(button(container, /^Next/))

    await waitFor(() => expect(gtagEvents("questionnaire_section_complete")).toHaveLength(1))
    expect(gtagEvents("questionnaire_section_complete")[0][2]).toEqual({
      questionnaire_type: "financial_affidavit",
      section_index: 0,
      total_sections: 2,
      progress_percent: 50,
    })

    // Walk back and forward across ground already counted.
    await user.click(button(container, /Previous/))
    await user.click(button(container, /^Next/))
    await user.click(button(container, /Previous/))

    expect(gtagEvents("questionnaire_section_complete")).toHaveLength(1)
    assertNoAnswerContent()
  })

  it("does not report an incomplete section as progress", async () => {
    installFetch()
    const user = userEvent.setup()
    const { container } = render(<QuestionnairePage />)
    await waitForField(container, "employer-name")

    // Leave the required question empty and navigate forward.
    await user.click(button(container, /^Next/))

    await waitForField(container, "monthly-rent")
    expect(gtagEvents("questionnaire_section_complete")).toHaveLength(0)
  })

  it("emits exactly one completion, only after the server accepts the submission", async () => {
    installFetch()
    const user = userEvent.setup()
    const { container } = render(<QuestionnairePage />)
    await waitForField(container, "employer-name")

    await user.type(field(container, "employer-name"), ANSWER_EMPLOYER)
    await user.click(button(container, /^Next/))
    await waitForField(container, "monthly-rent")
    await user.type(field(container, "monthly-rent"), ANSWER_RENT)
    await user.click(button(container, /Submit Questionnaire/))

    await waitFor(() => expect(gtagEvents("questionnaire_complete")).toHaveLength(1))
    expect(gtagEvents("questionnaire_complete")[0][2]).toEqual({ questionnaire_type: "financial_affidavit" })
    expect(mockPush).toHaveBeenCalledWith("/documents")
    assertNoAnswerContent()
  })

  it("emits no completion when the submission fails", async () => {
    installFetch({ submitOk: false })
    const user = userEvent.setup()
    const { container } = render(<QuestionnairePage />)
    await waitForField(container, "employer-name")

    await user.type(field(container, "employer-name"), ANSWER_EMPLOYER)
    await user.click(button(container, /^Next/))
    await waitForField(container, "monthly-rent")
    await user.type(field(container, "monthly-rent"), ANSWER_RENT)
    await user.click(button(container, /Submit Questionnaire/))

    await waitFor(() => expect(window.alert).toHaveBeenCalled())
    expect(gtagEvents("questionnaire_complete")).toHaveLength(0)
    expect(mockPush).not.toHaveBeenCalled()
  })

  it("treats a resumed draft as cached state, not as a start or replayed progress", async () => {
    installFetch({ savedResponses: { "employer-name": ANSWER_EMPLOYER }, savedSection: 1 })
    const user = userEvent.setup()
    const { container } = render(<QuestionnairePage />)
    await waitForField(container, "employer-name")
    await waitFor(() => expect(field(container, "employer-name").value).toBe(ANSWER_EMPLOYER))

    // Editing a resumed draft is not a start.
    await user.type(field(container, "employer-name"), " Inc")
    expect(gtagEvents("questionnaire_start")).toHaveLength(0)

    // Section 0 was already behind the saved resume point: replay, not progress.
    await user.click(button(container, /^Next/))
    await waitForField(container, "monthly-rent")
    expect(gtagEvents("questionnaire_section_complete")).toHaveLength(0)

    // Section 1 is genuinely new ground.
    await user.type(field(container, "monthly-rent"), ANSWER_RENT)
    await user.click(button(container, /Previous/))

    await waitFor(() => expect(gtagEvents("questionnaire_section_complete")).toHaveLength(1))
    expect(gtagEvents("questionnaire_section_complete")[0][2]).toEqual({
      questionnaire_type: "financial_affidavit",
      section_index: 1,
      total_sections: 2,
      progress_percent: 100,
    })
    assertNoAnswerContent()
  })
})
