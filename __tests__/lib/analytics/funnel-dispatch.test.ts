/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://www.freshstart-il.com/questionnaires/petition?responseId=resp_abc#s2"}
 *
 * Serialized-payload proof for the funnel events. Everything asserted here is
 * what actually reaches `gtag` / `fbq`, after the client sanitizer — so a
 * regression that widens a parameter shows up as a literal payload diff.
 */
import { analytics, trackGA4Event } from "@/lib/analytics/events"

/**
 * Values that appear somewhere in the intake journey and must never reach an
 * analytics transport: identity, contact details, free-form legal facts, and
 * every kind of opaque record identifier.
 */
const FORBIDDEN_FRAGMENTS = [
  "jane",
  "doe",
  "@example.com",
  "555-",
  "Cook County",
  "123 Main",
  "resp_abc",
  "cs_test",
  "cus_",
  "pi_",
  "doc_",
  "responseId",
  "irreconcilable",
  "Petition for Dissolution",
]

function serializedCalls(): string {
  return JSON.stringify([
    (window.gtag as jest.Mock).mock.calls,
    (window.fbq as unknown as jest.Mock).mock.calls,
  ])
}

function assertNoPii(): void {
  const serialized = serializedCalls()
  for (const fragment of FORBIDDEN_FRAGMENTS) {
    expect(serialized).not.toContain(fragment)
  }
  // No URL, query string, hash, or email shape may survive to the boundary.
  expect(serialized).not.toMatch(/https?:\/\//)
  expect(serialized).not.toMatch(/[?#]/)
  expect(serialized).not.toMatch(/@/)
}

function gtagEventParams(index = 0): Record<string, unknown> {
  const call = (window.gtag as jest.Mock).mock.calls[index]
  expect(call[0]).toBe("event")
  return call[2] as Record<string, unknown>
}

describe("funnel event dispatch", () => {
  const originalEnabled = process.env.NEXT_PUBLIC_ENABLE_TRACKING

  beforeEach(() => {
    process.env.NEXT_PUBLIC_ENABLE_TRACKING = "true"
    window.gtag = jest.fn()
    ;(window as unknown as { fbq: unknown }).fbq = jest.fn()
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_ENABLE_TRACKING = originalEnabled
    jest.restoreAllMocks()
  })

  it("sends questionnaire_start exactly once with a bounded type only", () => {
    analytics.questionnaireStart("petition")

    expect(window.gtag).toHaveBeenCalledTimes(1)
    expect((window.gtag as jest.Mock).mock.calls[0]).toEqual([
      "event",
      "questionnaire_start",
      { questionnaire_type: "petition" },
    ])
    // Questionnaire milestones are a first-party/GA4 signal only — see
    // __tests__/lib/analytics/meta-sensitive-events.test.ts.
    expect((window.fbq as unknown as jest.Mock).mock.calls).toEqual([])
    assertNoPii()
  })

  it("sends questionnaire_section_complete with coarse counts and honest progress", () => {
    analytics.questionnaireSectionComplete("financial_affidavit", 0, 4)
    analytics.questionnaireSectionComplete("financial_affidavit", 3, 4)

    expect(window.gtag).toHaveBeenCalledTimes(2)
    expect(gtagEventParams(0)).toEqual({
      questionnaire_type: "financial_affidavit",
      section_index: 0,
      total_sections: 4,
      progress_percent: 25,
    })
    expect(gtagEventParams(1)).toEqual({
      questionnaire_type: "financial_affidavit",
      section_index: 3,
      total_sections: 4,
      progress_percent: 100,
    })
    assertNoPii()
  })

  it("sends questionnaire_complete with a bounded type only", () => {
    analytics.questionnaireComplete("marital_settlement")

    expect((window.gtag as jest.Mock).mock.calls).toEqual([
      ["event", "questionnaire_complete", { questionnaire_type: "marital_settlement" }],
    ])
    expect((window.fbq as unknown as jest.Mock).mock.calls).toEqual([])
    assertNoPii()
  })

  it("sends the $149 begin_checkout handoff with the exact one-time contract", () => {
    analytics.subscriptionStart("one_time", 149)

    expect((window.gtag as jest.Mock).mock.calls).toEqual([
      [
        "event",
        "begin_checkout",
        {
          currency: "USD",
          value: 149,
          items: [{ item_name: "one_time", price: 149, quantity: 1 }],
        },
      ],
    ])
    assertNoPii()
  })

  it("carries no free-form questionnaire display name even if one is supplied", () => {
    // The helper signature is bounded; a stray second argument must not widen
    // the payload, because a display title would fail the sanitizer and drop
    // the whole event.
    ;(analytics.questionnaireStart as (...args: unknown[]) => void)(
      "petition",
      "Petition for Dissolution of Marriage",
    )

    expect(window.gtag).toHaveBeenCalledTimes(1)
    expect(gtagEventParams()).toEqual({ questionnaire_type: "petition" })
    assertNoPii()
  })

  it("never throws or blocks the caller when the transport misbehaves", () => {
    ;(window.gtag as jest.Mock).mockImplementation(() => {
      throw new Error("gtag blew up")
    })
    jest.spyOn(console, "error").mockImplementation(() => {})

    expect(() => analytics.questionnaireStart("petition")).not.toThrow()
    expect(() => analytics.subscriptionStart("one_time", 149)).not.toThrow()
    expect(() => trackGA4Event("questionnaire_complete", { questionnaire_type: "petition" })).not.toThrow()
  })

  it("dispatches nothing at all while the production tracking gate is closed", () => {
    process.env.NEXT_PUBLIC_ENABLE_TRACKING = "false"

    analytics.questionnaireStart("petition")
    analytics.questionnaireSectionComplete("petition", 1, 4)
    analytics.questionnaireComplete("petition")
    analytics.subscriptionStart("one_time", 149)

    expect(window.gtag).not.toHaveBeenCalled()
    expect(window.fbq).not.toHaveBeenCalled()
  })
})
