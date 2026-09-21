/**
 * @jest-environment node
 *
 * The checkout route is the payment boundary. It must independently load the
 * persisted fit assessment and refuse to do ANY provider work — no price
 * lookup, no customer, no session, and no obligation row — unless the session
 * user owns a current, policy-current, unexpired `fit` assessment.
 *
 * Client state and query parameters are never authority here.
 */
const mockGetCurrentUser = jest.fn()
const mockCreateCustomer = jest.fn()
const mockRetrieveCustomer = jest.fn()
const mockCreateCheckoutSession = jest.fn()
const mockRetrieveCheckoutSession = jest.fn()
const mockRetrievePrice = jest.fn()
const mockSubscriptionFindUnique = jest.fn()
const mockObligationUpsert = jest.fn()
const mockObligationFindFirst = jest.fn()
const mockObligationUpdateMany = jest.fn()
const mockObligationFindUnique = jest.fn()
const mockAssessmentFindFirst = jest.fn()
const mockTransaction = jest.fn()

jest.mock("@/lib/auth/session", () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}))
jest.mock("@/lib/stripe/config", () => ({
  stripe: {
    customers: {
      create: (...args: unknown[]) => mockCreateCustomer(...args),
      retrieve: (...args: unknown[]) => mockRetrieveCustomer(...args),
    },
    prices: { retrieve: (...args: unknown[]) => mockRetrievePrice(...args) },
    checkout: {
      sessions: {
        create: (...args: unknown[]) => mockCreateCheckoutSession(...args),
        retrieve: (...args: unknown[]) => mockRetrieveCheckoutSession(...args),
      },
    },
  },
}))
jest.mock("@/lib/db", () => ({
  prisma: {
    subscription: { findUnique: (...args: unknown[]) => mockSubscriptionFindUnique(...args) },
    checkoutObligation: {
      findFirst: (...args: unknown[]) => mockObligationFindFirst(...args),
      upsert: (...args: unknown[]) => mockObligationUpsert(...args),
      updateMany: (...args: unknown[]) => mockObligationUpdateMany(...args),
      findUnique: (...args: unknown[]) => mockObligationFindUnique(...args),
    },
    fitCheckAssessment: { findFirst: (...args: unknown[]) => mockAssessmentFindFirst(...args) },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}))

import { NextRequest } from "next/server"
import { POST } from "@/app/api/stripe/create-checkout-session/route"
import { FIT_CHECK_POLICY_VERSION, FIT_CHECK_VALIDITY_MS } from "@/lib/fit-check/policy"

const ALL_YES = {
  illinoisMatter: "yes",
  bothSpousesAgreeToDivorce: "yes",
  agreementOnAllKeyIssues: "yes",
  spouseWillSignAndParticipate: "yes",
  safetyOrEmergency: "no",
}

const currentFitAssessment = {
  id: "fca_ok",
  userId: "user_1",
  policyVersion: FIT_CHECK_POLICY_VERSION,
  result: "fit",
  answers: ALL_YES,
  reasons: [],
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + FIT_CHECK_VALIDITY_MS),
}

const obligation = {
  id: "obl_1",
  contractKey: "contract_1",
  userId: "user_1",
  plan: "one_time",
  cycle: 1,
  stripeCustomerId: null,
  stripeSessionId: null,
  stripePriceId: "price_one_time",
  expectedAmountCents: 14900,
  expectedCurrency: "usd",
  quantity: 1,
  attempt: 1,
  status: "PENDING",
}

function request(body: unknown) {
  return new NextRequest("http://localhost:3000/api/stripe/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

function expectNoPaymentSideEffects() {
  expect(mockRetrievePrice).not.toHaveBeenCalled()
  expect(mockCreateCustomer).not.toHaveBeenCalled()
  expect(mockRetrieveCustomer).not.toHaveBeenCalled()
  expect(mockCreateCheckoutSession).not.toHaveBeenCalled()
  expect(mockObligationUpsert).not.toHaveBeenCalled()
  expect(mockTransaction).not.toHaveBeenCalled()
}

describe("create-checkout-session fit gate", () => {
  const oldEnv = process.env
  beforeEach(() => {
    process.env = {
      ...oldEnv,
      STRIPE_SECRET_KEY: "sk_test_local",
      ONE_TIME_PRICE_ID: "price_one_time",
      NEXT_PUBLIC_APP_URL: "https://www.freshstart-il.com",
    }
    mockGetCurrentUser.mockResolvedValue({ id: "user_1", email: "user@example.com" })
    mockAssessmentFindFirst.mockResolvedValue(currentFitAssessment)
    mockCreateCustomer.mockResolvedValue({ id: "cus_1" })
    mockRetrieveCustomer.mockResolvedValue({ id: "cus_1", deleted: false })
    mockSubscriptionFindUnique.mockResolvedValue(null)
    mockRetrievePrice.mockResolvedValue({
      id: "price_one_time", active: true, type: "one_time", unit_amount: 14900, currency: "usd",
    })
    mockObligationFindFirst.mockResolvedValue(null)
    mockObligationUpsert.mockResolvedValue(obligation)
    mockObligationUpdateMany.mockResolvedValue({ count: 1 })
    mockObligationFindUnique.mockResolvedValue({
      ...obligation, stripeCustomerId: "cus_1", stripeSessionId: "cs_1", status: "OPEN",
    })
    mockCreateCheckoutSession.mockResolvedValue({
      id: "cs_1", url: "https://checkout.test/session", status: "open",
    })
    mockTransaction.mockImplementation(async (fn: any) => fn(require("@/lib/db").prisma))
    jest.spyOn(console, "error").mockImplementation(() => {})
    jest.spyOn(console, "log").mockImplementation(() => {})
  })
  afterEach(() => {
    process.env = oldEnv
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  it("loads the assessment scoped to the session user, newest first, with a total order", async () => {
    await POST(request({ plan: "one_time" }))
    // `createdAt` alone is not a total order: two assessments can share a
    // millisecond, and the gate must not be able to pick a different one of
    // them on a later request. The `id` tiebreaker makes "newest" single-valued.
    expect(mockAssessmentFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user_1" },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),
    )
  })

  it("lets a current fit assessment through to the unchanged checkout flow", async () => {
    const response = await POST(request({ plan: "one_time" }))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      sessionId: "cs_1", url: "https://checkout.test/session",
    })
    expect(mockCreateCheckoutSession).toHaveBeenCalled()
  })

  it("blocks and asks for a fit check when no assessment exists", async () => {
    mockAssessmentFindFirst.mockResolvedValue(null)
    const response = await POST(request({ plan: "one_time" }))
    expect(response.status).toBe(409)
    expect((await response.json()).code).toBe("fit_check_required")
    expectNoPaymentSideEffects()
  })

  it("blocks an expired assessment even when it said fit", async () => {
    mockAssessmentFindFirst.mockResolvedValue({
      ...currentFitAssessment,
      createdAt: new Date(Date.now() - FIT_CHECK_VALIDITY_MS - 1000),
      expiresAt: new Date(Date.now() - 1000),
    })
    const response = await POST(request({ plan: "one_time" }))
    expect(response.status).toBe(409)
    expect((await response.json()).code).toBe("fit_check_required")
    expectNoPaymentSideEffects()
  })

  it("blocks an assessment written under a superseded policy version", async () => {
    mockAssessmentFindFirst.mockResolvedValue({
      ...currentFitAssessment, policyVersion: "2000-01-01.1",
    })
    const response = await POST(request({ plan: "one_time" }))
    expect(response.status).toBe(409)
    expect((await response.json()).code).toBe("fit_check_required")
    expectNoPaymentSideEffects()
  })

  it("blocks an assessment belonging to another user", async () => {
    mockAssessmentFindFirst.mockResolvedValue({
      ...currentFitAssessment, userId: "user_other",
    })
    const response = await POST(request({ plan: "one_time" }))
    expect(response.status).toBe(409)
    expect((await response.json()).code).toBe("fit_check_required")
    expectNoPaymentSideEffects()
  })

  it.each(["review_required", "out_of_scope"])(
    "blocks a current %s assessment with a neutral, non-legal message",
    async (result) => {
      mockAssessmentFindFirst.mockResolvedValue({ ...currentFitAssessment, result })
      const response = await POST(request({ plan: "one_time" }))
      const payload = await response.json()

      expect(response.status).toBe(409)
      expect(payload.code).toBe("fit_check_blocked")
      expect(payload.error).not.toMatch(/eligible|ineligible|qualify|you are not allowed by law/i)
      expectNoPaymentSideEffects()
    },
  )

  it("ignores client-supplied fit claims in the request body", async () => {
    mockAssessmentFindFirst.mockResolvedValue(null)
    const response = await POST(
      request({
        plan: "one_time",
        fitCheck: "fit",
        fitCheckResult: "fit",
        fitCheckPolicyVersion: FIT_CHECK_POLICY_VERSION,
      }),
    )
    expect(response.status).toBe(409)
    expect((await response.json()).code).toBe("fit_check_required")
    expectNoPaymentSideEffects()
  })

  it("fails closed when the assessment lookup itself fails", async () => {
    mockAssessmentFindFirst.mockRejectedValue(new Error("database unavailable"))
    const response = await POST(request({ plan: "one_time" }))
    expect(response.status).toBeGreaterThanOrEqual(400)
    expect(mockCreateCheckoutSession).not.toHaveBeenCalled()
    expect(mockObligationUpsert).not.toHaveBeenCalled()
  })

  it("still rejects an unsupported plan before it ever reads an assessment", async () => {
    const response = await POST(request({ plan: "annual" }))
    expect(response.status).toBe(400)
    expect(mockAssessmentFindFirst).not.toHaveBeenCalled()
    expectNoPaymentSideEffects()
  })

  it("still rejects an unauthenticated caller before it ever reads an assessment", async () => {
    mockGetCurrentUser.mockResolvedValue(null)
    const response = await POST(request({ plan: "one_time" }))
    expect(response.status).toBe(401)
    expect(mockAssessmentFindFirst).not.toHaveBeenCalled()
    expectNoPaymentSideEffects()
  })

  it("gates before the provider, not after: the assessment read precedes every Stripe call", async () => {
    const order: string[] = []
    mockAssessmentFindFirst.mockImplementation(async () => {
      order.push("fit_assessment")
      return currentFitAssessment
    })
    mockRetrievePrice.mockImplementation(async () => {
      order.push("stripe_price")
      return { id: "price_one_time", active: true, type: "one_time", unit_amount: 14900, currency: "usd" }
    })
    mockObligationUpsert.mockImplementation(async () => {
      order.push("obligation")
      return obligation
    })

    await POST(request({ plan: "one_time" }))

    expect(order[0]).toBe("fit_assessment")
    expect(order.indexOf("fit_assessment")).toBeLessThan(order.indexOf("obligation"))
  })
})
