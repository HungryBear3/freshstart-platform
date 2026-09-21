/**
 * @jest-environment node
 *
 * `/api/fit-check` is the server-side authority for the pre-payment fit check.
 * The client may render the questions, but only this route may classify the
 * answers and only this route may write an assessment.
 */
const mockGetCurrentUser = jest.fn()
const mockAssessmentCreate = jest.fn()
const mockAssessmentFindFirst = jest.fn()
const mockRateLimit = jest.fn()

jest.mock("@/lib/auth/session", () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}))
jest.mock("@/lib/db", () => ({
  prisma: {
    fitCheckAssessment: {
      create: (...args: unknown[]) => mockAssessmentCreate(...args),
      findFirst: (...args: unknown[]) => mockAssessmentFindFirst(...args),
    },
  },
}))
jest.mock("@/lib/rate-limit", () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
  getClientIdentifier: () => "127.0.0.1",
}))

import { NextRequest } from "next/server"
import { GET, POST } from "@/app/api/fit-check/route"
import { FIT_CHECK_POLICY_VERSION, FIT_CHECK_VALIDITY_MS } from "@/lib/fit-check/policy"

const ALL_YES = {
  illinoisMatter: "yes",
  bothSpousesAgreeToDivorce: "yes",
  agreementOnAllKeyIssues: "yes",
  spouseWillSignAndParticipate: "yes",
  safetyOrEmergency: "no",
}

function post(body: unknown) {
  return new NextRequest("http://localhost:3000/api/fit-check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

function get() {
  return new NextRequest("http://localhost:3000/api/fit-check", { method: "GET" })
}

describe("/api/fit-check", () => {
  beforeEach(() => {
    mockGetCurrentUser.mockResolvedValue({ id: "user_1", email: "user@example.com" })
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 9, resetTime: Date.now() + 1000 })
    mockAssessmentFindFirst.mockResolvedValue(null)
    mockAssessmentCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: "fca_1",
      createdAt: new Date("2026-09-21T00:00:00.000Z"),
      ...data,
    }))
    jest.spyOn(console, "error").mockImplementation(() => {})
  })
  afterEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  it("requires an authenticated user before reading or writing an assessment", async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    expect((await GET(get())).status).toBe(401)
    expect((await POST(post({ answers: ALL_YES }))).status).toBe(401)
    expect(mockAssessmentCreate).not.toHaveBeenCalled()
    expect(mockAssessmentFindFirst).not.toHaveBeenCalled()
  })

  it("serves the current policy and bounded questions to an authenticated user", async () => {
    const response = await GET(get())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.policyVersion).toBe(FIT_CHECK_POLICY_VERSION)
    expect(payload.assessment).toBeNull()
    expect(payload.status).toBe("fit_check_required")
    expect(Array.isArray(payload.questions)).toBe(true)
    expect(payload.questions.length).toBeGreaterThanOrEqual(5)
  })

  it("scopes the assessment read to the session user only, in a total order", async () => {
    await GET(get())
    expect(mockAssessmentFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user_1" },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),
    )
  })

  it("classifies on the server and persists a versioned, expiring assessment", async () => {
    const response = await POST(post({ answers: ALL_YES }))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual(
      expect.objectContaining({ result: "fit", policyVersion: FIT_CHECK_POLICY_VERSION }),
    )
    expect(mockAssessmentCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user_1",
        policyVersion: FIT_CHECK_POLICY_VERSION,
        result: "fit",
        answers: ALL_YES,
        reasons: [],
      }),
    })
    const { data } = mockAssessmentCreate.mock.calls[0][0]
    expect(data.expiresAt).toBeInstanceOf(Date)
    expect(data.expiresAt.getTime() - Date.now()).toBeGreaterThan(FIT_CHECK_VALIDITY_MS - 60_000)
    expect(data.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(FIT_CHECK_VALIDITY_MS)
  })

  it("ignores a client-supplied result and reclassifies the answers", async () => {
    const response = await POST(
      post({
        answers: { ...ALL_YES, bothSpousesAgreeToDivorce: "no" },
        result: "fit",
        policyVersion: "9999-01-01.1",
      }),
    )
    const payload = await response.json()

    expect(payload.result).toBe("out_of_scope")
    expect(mockAssessmentCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        result: "out_of_scope",
        policyVersion: FIT_CHECK_POLICY_VERSION,
      }),
    })
  })

  it("records an emergency or safety answer as review_required", async () => {
    const response = await POST(post({ answers: { ...ALL_YES, safetyOrEmergency: "yes" } }))
    expect((await response.json()).result).toBe("review_required")
    expect(mockAssessmentCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ result: "review_required" }),
    })
  })

  it.each([
    ["a free-text answer", { answers: { ...ALL_YES, agreementOnAllKeyIssues: "he moved out in May" } }],
    ["an unexpected extra field", { answers: { ...ALL_YES, spouseName: "Jordan" } }],
    ["a missing required answer", { answers: { illinoisMatter: "yes" } }],
    ["no answers at all", {}],
    ["an array body", []],
  ])("rejects %s without persisting anything", async (_label, body) => {
    const response = await POST(post(body))
    expect(response.status).toBe(400)
    expect((await response.json()).code).toBe("invalid_answers")
    expect(mockAssessmentCreate).not.toHaveBeenCalled()
  })

  it("rejects malformed JSON without persisting anything", async () => {
    const malformed = new NextRequest("http://localhost:3000/api/fit-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not-json",
    })
    expect((await POST(malformed)).status).toBe(400)
    expect(mockAssessmentCreate).not.toHaveBeenCalled()
  })

  it("rate limits repeated submissions per user", async () => {
    mockRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetTime: Date.now() + 1000 })
    const response = await POST(post({ answers: ALL_YES }))
    expect(response.status).toBe(429)
    expect(mockAssessmentCreate).not.toHaveBeenCalled()
    expect(mockRateLimit).toHaveBeenCalledWith(expect.stringContaining("user_1"), expect.any(Number), expect.any(Number))
  })

  it("never returns raw answers or reason codes back to the browser as prose", async () => {
    mockAssessmentFindFirst.mockResolvedValue({
      id: "fca_1",
      userId: "user_1",
      policyVersion: FIT_CHECK_POLICY_VERSION,
      result: "review_required",
      answers: { ...ALL_YES, safetyOrEmergency: "yes" },
      reasons: ["safety_support_needed"],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + FIT_CHECK_VALIDITY_MS),
    })

    const payload = await (await GET(get())).json()
    expect(payload.status).toBe("fit_check_blocked")
    expect(payload.assessment.result).toBe("review_required")
    expect(payload.assessment.answers).toBeUndefined()
  })

  it("reports a stale-policy assessment as needing a fresh fit check", async () => {
    mockAssessmentFindFirst.mockResolvedValue({
      id: "fca_old",
      userId: "user_1",
      policyVersion: "2000-01-01.1",
      result: "fit",
      answers: ALL_YES,
      reasons: [],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + FIT_CHECK_VALIDITY_MS),
    })

    const payload = await (await GET(get())).json()
    expect(payload.status).toBe("fit_check_required")
  })

  it("reports an expired assessment as needing a fresh fit check", async () => {
    mockAssessmentFindFirst.mockResolvedValue({
      id: "fca_old",
      userId: "user_1",
      policyVersion: FIT_CHECK_POLICY_VERSION,
      result: "fit",
      answers: ALL_YES,
      reasons: [],
      createdAt: new Date(Date.now() - FIT_CHECK_VALIDITY_MS - 1000),
      expiresAt: new Date(Date.now() - 1000),
    })

    const payload = await (await GET(get())).json()
    expect(payload.status).toBe("fit_check_required")
  })

  it("reports a current fit assessment as ready for checkout", async () => {
    mockAssessmentFindFirst.mockResolvedValue({
      id: "fca_ok",
      userId: "user_1",
      policyVersion: FIT_CHECK_POLICY_VERSION,
      result: "fit",
      answers: ALL_YES,
      reasons: [],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + FIT_CHECK_VALIDITY_MS),
    })

    const payload = await (await GET(get())).json()
    expect(payload.status).toBe("fit")
  })
})
