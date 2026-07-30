/**
 * Unit tests for checklist lead magnet API
 * @jest-environment node
 */

const mockAfterCallbacks: Array<() => void | Promise<void>> = []
const mockAfter = jest.fn((callback: () => void | Promise<void>) => {
  mockAfterCallbacks.push(callback)
})

jest.mock("next/server", () => {
  const actual = jest.requireActual("next/server")
  return {
    ...actual,
    after: (callback: () => void | Promise<void>) => mockAfter(callback),
  }
})

const mockSendChecklistEmail = jest.fn()
const mockRateLimit = jest.fn()
const mockGetClientIdentifier = jest.fn()
const mockUpsert = jest.fn()
const mockEnrollInDrip = jest.fn()
const mockCaptureError = jest.fn()

jest.mock("@/lib/email", () => ({
  sendChecklistEmail: (...args: unknown[]) => mockSendChecklistEmail(...args),
}))

jest.mock("@/lib/rate-limit", () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
  getClientIdentifier: (...args: unknown[]) => mockGetClientIdentifier(...args),
}))

jest.mock("@/lib/db", () => ({
  prisma: {
    checklistSubscriber: {
      upsert: (...args: unknown[]) => mockUpsert(...args),
    },
  },
}))

jest.mock("@/lib/drip", () => ({
  enrollInDrip: (...args: unknown[]) => mockEnrollInDrip(...args),
}))

jest.mock("@/lib/monitoring/error-tracking", () => ({
  errorTracker: {
    captureError: (...args: unknown[]) => mockCaptureError(...args),
  },
}))

import { NextRequest } from "next/server"
import { POST } from "@/app/api/checklist/route"

function createRequest(body: unknown, referer = "https://www.freshstart-il.com/checklist") {
  return new NextRequest("http://localhost:3000/api/checklist", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      referer,
    },
    body: JSON.stringify(body),
  })
}

describe("POST /api/checklist", () => {
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>
  // This suite exercises the real PRODUCTION path of the route (rate-limit,
  // email, DB persistence, drip — all mocked above). The route no-ops in any
  // non-production environment, so we must establish a production environment
  // for these assertions; every external dependency is mocked, so no real
  // Redis/DB/email/network is ever touched.
  const savedEnv: Record<string, string | undefined> = {}
  const mutableEnv = process.env as Record<string, string | undefined>

  beforeEach(() => {
    savedEnv.NODE_ENV = mutableEnv.NODE_ENV
    savedEnv.VERCEL_ENV = mutableEnv.VERCEL_ENV
    savedEnv.CHECKLIST_FORCE_PREVIEW_NOOP = mutableEnv.CHECKLIST_FORCE_PREVIEW_NOOP
    mutableEnv.NODE_ENV = "production"
    delete mutableEnv.VERCEL_ENV
    delete mutableEnv.CHECKLIST_FORCE_PREVIEW_NOOP

    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    mockAfterCallbacks.length = 0
    mockAfter.mockClear()
    mockSendChecklistEmail.mockResolvedValue(undefined)
    mockRateLimit.mockResolvedValue({ allowed: true })
    mockGetClientIdentifier.mockReturnValue("test-client")
    mockUpsert.mockResolvedValue(undefined)
    mockEnrollInDrip.mockResolvedValue(undefined)
    mockCaptureError.mockClear()
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    if (savedEnv.NODE_ENV === undefined) delete mutableEnv.NODE_ENV
    else mutableEnv.NODE_ENV = savedEnv.NODE_ENV
    if (savedEnv.VERCEL_ENV === undefined) delete mutableEnv.VERCEL_ENV
    else mutableEnv.VERCEL_ENV = savedEnv.VERCEL_ENV
    if (savedEnv.CHECKLIST_FORCE_PREVIEW_NOOP === undefined)
      delete mutableEnv.CHECKLIST_FORCE_PREVIEW_NOOP
    else mutableEnv.CHECKLIST_FORCE_PREVIEW_NOOP = savedEnv.CHECKLIST_FORCE_PREVIEW_NOOP
  })

  it("sends the checklist immediately and schedules persistence via next/server after", async () => {
    const response = await POST(createRequest({ email: "Lead@Example.com" }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ success: true, mode: "production" })
    expect(mockSendChecklistEmail).toHaveBeenCalledWith("lead@example.com")
    expect(mockAfter).toHaveBeenCalledTimes(1)

    // Background work should be owned by Next's after() lifecycle, not raw
    // fire-and-forget promises after the response has been returned.
    expect(mockUpsert).not.toHaveBeenCalled()
    expect(mockEnrollInDrip).not.toHaveBeenCalled()

    await mockAfterCallbacks[0]()

    expect(mockUpsert).toHaveBeenCalledWith({
      where: { email: "lead@example.com" },
      update: {},
      create: {
        email: "lead@example.com",
        source: "checklist-page",
      },
    })
    expect(mockEnrollInDrip).toHaveBeenCalledWith("lead@example.com", "fs-checklist")
  })

  it("keeps a successful response if scheduled subscriber persistence fails", async () => {
    const dbError = new Error("Connection terminated due to connection timeout")
    mockUpsert.mockRejectedValue(dbError)

    const response = await POST(createRequest({ email: "lead@example.com" }, "https://www.freshstart-il.com/"))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ success: true, mode: "production" })

    await mockAfterCallbacks[0]()

    expect(mockCaptureError).toHaveBeenCalledWith(dbError, expect.objectContaining({
      path: "/api/checklist",
      email: "lead@example.com",
      context: "subscriber_db_save",
    }))
    expect(mockEnrollInDrip).toHaveBeenCalledWith("lead@example.com", "fs-checklist")
  })
})
