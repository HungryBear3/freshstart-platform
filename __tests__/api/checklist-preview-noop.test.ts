/**
 * @jest-environment node
 *
 * /api/checklist preview-noop guard.
 *
 * Vercel Preview must not send real email, write to the DB, or enroll
 * visitors in the drip campaign. This test mocks every side-effect
 * dependency and asserts none of them is called when the route runs in
 * a non-production environment. Production behavior is also covered.
 */

// `next/server`'s `after()` needs Next.js routing context. In jest we stub
// it to a synchronous no-op so the production branch of the route can be
// exercised end-to-end without invoking the queued persistence callback.
jest.mock("next/server", () => {
  const actual = jest.requireActual("next/server")
  return {
    ...actual,
    after: jest.fn((_fn: () => unknown) => undefined),
  }
})

jest.mock("@/lib/email", () => ({
  sendChecklistEmail: jest.fn().mockResolvedValue(undefined),
}))
jest.mock("@/lib/rate-limit", () => ({
  rateLimit: jest.fn().mockResolvedValue({ allowed: true }),
  getClientIdentifier: jest.fn().mockReturnValue("test-client"),
}))
jest.mock("@/lib/db", () => ({
  prisma: {
    checklistSubscriber: {
      upsert: jest.fn().mockResolvedValue(undefined),
    },
  },
}))
jest.mock("@/lib/drip", () => ({
  enrollInDrip: jest.fn().mockResolvedValue(undefined),
}))
jest.mock("@/lib/monitoring/error-tracking", () => ({
  errorTracker: { captureError: jest.fn() },
}))

import { POST } from "@/app/api/checklist/route"
import { sendChecklistEmail } from "@/lib/email"
import { prisma } from "@/lib/db"
import { enrollInDrip } from "@/lib/drip"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { after } from "next/server"

function makeRequest(body: unknown): Request {
  return new Request("https://example.test/api/checklist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

const ENV_KEYS = [
  "NODE_ENV",
  "VERCEL_ENV",
  "CHECKLIST_FORCE_PREVIEW_NOOP",
] as const

function snapshotEnv() {
  const snap: Record<string, string | undefined> = {}
  for (const k of ENV_KEYS) snap[k] = process.env[k]
  return snap
}

function restoreEnv(snap: Record<string, string | undefined>) {
  const mutableEnv = process.env as Record<string, string | undefined>
  for (const k of ENV_KEYS) {
    if (snap[k] === undefined) delete mutableEnv[k]
    else mutableEnv[k] = snap[k]
  }
}

describe("/api/checklist — preview noop guarantees", () => {
  let envSnap: ReturnType<typeof snapshotEnv>

  beforeEach(() => {
    envSnap = snapshotEnv()
    ;(sendChecklistEmail as jest.Mock).mockClear()
    ;(prisma.checklistSubscriber.upsert as jest.Mock).mockClear()
    ;(enrollInDrip as jest.Mock).mockClear()
    ;(rateLimit as jest.Mock).mockClear()
    ;(getClientIdentifier as jest.Mock).mockClear()
    ;(after as jest.Mock).mockClear()
  })

  afterEach(() => restoreEnv(envSnap))

  it("returns 200 { success: true, mode: 'preview_noop' } in test/dev env", async () => {
    ;(process.env as any).NODE_ENV = "test"
    delete process.env.VERCEL_ENV
    delete process.env.CHECKLIST_FORCE_PREVIEW_NOOP
    const res = await POST(makeRequest({ email: "test@example.com" }) as any)
    expect(res.status).toBe(200)
    const body = (await res.json()) as { success: boolean; mode: string }
    expect(body.success).toBe(true)
    expect(body.mode).toBe("preview_noop")
  })

  it("never calls sendChecklistEmail / DB upsert / drip enrollment in preview mode", async () => {
    ;(process.env as any).NODE_ENV = "test"
    delete process.env.VERCEL_ENV
    delete process.env.CHECKLIST_FORCE_PREVIEW_NOOP
    await POST(makeRequest({ email: "ghost@example.com" }) as any)
    expect(sendChecklistEmail).not.toHaveBeenCalled()
    expect(prisma.checklistSubscriber.upsert).not.toHaveBeenCalled()
    expect(enrollInDrip).not.toHaveBeenCalled()
  })

  it("never calls rateLimit / getClientIdentifier / after() in preview mode (no Upstash, no DB, no scheduled work)", async () => {
    ;(process.env as any).NODE_ENV = "test"
    delete process.env.VERCEL_ENV
    delete process.env.CHECKLIST_FORCE_PREVIEW_NOOP
    const res = await POST(makeRequest({ email: "ghost@example.com" }) as any)
    expect(res.status).toBe(200)
    expect(rateLimit).not.toHaveBeenCalled()
    expect(getClientIdentifier).not.toHaveBeenCalled()
    expect(after).not.toHaveBeenCalled()
  })

  it("VERCEL_ENV='preview' branch also bypasses rateLimit/Upstash", async () => {
    ;(process.env as any).NODE_ENV = "production"
    process.env.VERCEL_ENV = "preview"
    await POST(makeRequest({ email: "preview@example.com" }) as any)
    expect(rateLimit).not.toHaveBeenCalled()
    expect(getClientIdentifier).not.toHaveBeenCalled()
  })

  it("CHECKLIST_FORCE_PREVIEW_NOOP override also bypasses rateLimit/Upstash", async () => {
    ;(process.env as any).NODE_ENV = "production"
    process.env.VERCEL_ENV = "production"
    process.env.CHECKLIST_FORCE_PREVIEW_NOOP = "true"
    await POST(makeRequest({ email: "forced@example.com" }) as any)
    expect(rateLimit).not.toHaveBeenCalled()
    expect(getClientIdentifier).not.toHaveBeenCalled()
  })

  it("invalid email short-circuits before rateLimit/getClientIdentifier (no Upstash on bad input)", async () => {
    delete process.env.VERCEL_ENV
    const res = await POST(makeRequest({ email: "not-an-email" }) as any)
    expect(res.status).toBe(400)
    expect(rateLimit).not.toHaveBeenCalled()
    expect(getClientIdentifier).not.toHaveBeenCalled()
  })

  it("falls into preview mode when VERCEL_ENV='preview' even if NODE_ENV=production", async () => {
    ;(process.env as any).NODE_ENV = "production"
    process.env.VERCEL_ENV = "preview"
    const res = await POST(makeRequest({ email: "x@y.com" }) as any)
    const body = (await res.json()) as { mode: string }
    expect(body.mode).toBe("preview_noop")
    expect(sendChecklistEmail).not.toHaveBeenCalled()
  })

  it("respects CHECKLIST_FORCE_PREVIEW_NOOP=true even on production", async () => {
    ;(process.env as any).NODE_ENV = "production"
    process.env.VERCEL_ENV = "production"
    process.env.CHECKLIST_FORCE_PREVIEW_NOOP = "true"
    const res = await POST(makeRequest({ email: "x@y.com" }) as any)
    const body = (await res.json()) as { mode: string; reason?: string }
    expect(body.mode).toBe("preview_noop")
    expect(body.reason).toBe("forced_via_env")
    expect(sendChecklistEmail).not.toHaveBeenCalled()
  })

  it("rejects invalid email even in preview mode without firing side effects", async () => {
    delete process.env.VERCEL_ENV
    const res = await POST(makeRequest({ email: "not-an-email" }) as any)
    expect(res.status).toBe(400)
    expect(sendChecklistEmail).not.toHaveBeenCalled()
    expect(prisma.checklistSubscriber.upsert).not.toHaveBeenCalled()
    expect(enrollInDrip).not.toHaveBeenCalled()
  })

  it("in real production (NODE_ENV=production, VERCEL_ENV=production), sends email and returns mode='production'", async () => {
    ;(process.env as any).NODE_ENV = "production"
    process.env.VERCEL_ENV = "production"
    delete process.env.CHECKLIST_FORCE_PREVIEW_NOOP
    const res = await POST(makeRequest({ email: "real@example.com" }) as any)
    const body = (await res.json()) as { success: boolean; mode: string }
    expect(body.success).toBe(true)
    expect(body.mode).toBe("production")
    expect(sendChecklistEmail).toHaveBeenCalledWith("real@example.com")
  })

  it("in real production, rate-limit IS consulted (Upstash path is exercised behind the mock)", async () => {
    ;(process.env as any).NODE_ENV = "production"
    process.env.VERCEL_ENV = "production"
    delete process.env.CHECKLIST_FORCE_PREVIEW_NOOP
    await POST(makeRequest({ email: "rl@example.com" }) as any)
    expect(getClientIdentifier).toHaveBeenCalledTimes(1)
    expect(rateLimit).toHaveBeenCalledTimes(1)
    // Production must also schedule the post-response persistence.
    expect(after).toHaveBeenCalledTimes(1)
  })

  it("in real production, rate-limit denial returns 429 without sending email", async () => {
    ;(process.env as any).NODE_ENV = "production"
    process.env.VERCEL_ENV = "production"
    delete process.env.CHECKLIST_FORCE_PREVIEW_NOOP
    ;(rateLimit as jest.Mock).mockResolvedValueOnce({ allowed: false })
    const res = await POST(makeRequest({ email: "blocked@example.com" }) as any)
    expect(res.status).toBe(429)
    expect(sendChecklistEmail).not.toHaveBeenCalled()
  })
})
