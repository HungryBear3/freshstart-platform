/**
 * @jest-environment node
 *
 * `/api/documents` (LIST) is an independent release path for the federal IWO.
 *
 * It listed every `Document` row the user owned, straight from Prisma, with the
 * `content` column included — so a legacy IWO row created before any gating
 * existed handed its full base64 payload to the client in a JSON list, with no
 * county, federal-evidence, disclosure-approval, or payload check anywhere on
 * the path.
 *
 * Two independent defects are closed here:
 *   1. list rows must never carry base64 `content` at all; and
 *   2. an IWO-classified row must be gated by the same authoritative-county +
 *      federal + disclosure-hold decision every other IWO surface uses, and
 *      omitted from the listing when that decision is closed.
 *
 * Every Prisma call is a mock. No database is touched.
 */

jest.mock("@/lib/db", () => ({
  prisma: {
    document: { findMany: jest.fn() },
    caseInfo: { findUnique: jest.fn() },
  },
}))

jest.mock("@/lib/auth/session", () => ({
  getCurrentUser: jest.fn(),
}))

import fs from "node:fs"
import path from "node:path"

import { NextRequest } from "next/server"

import { GET } from "@/app/api/documents/route"
import { getCurrentUser } from "@/lib/auth/session"
import { IWO_PROVENANCE } from "@/lib/forms/iwo-provenance"
import { GUARDED_ARTIFACT_DIR } from "@/lib/forms/official-artifact-access"

const prismaMock = (jest.requireMock("@/lib/db") as any).prisma

const CANONICAL_B64 = fs
  .readFileSync(path.join(GUARDED_ARTIFACT_DIR, IWO_PROVENANCE.file))
  .toString("base64")

/** Synthetic session. Not a real user, not a fixture, not a customer record. */
const TEST_USER = { id: "test-user-not-a-customer", name: "Test", email: "test@example.invalid" }

const GENERATED_AT = new Date("2026-05-01T00:00:00Z")

function docRow(over: Record<string, unknown> = {}) {
  return {
    id: "doc-petition",
    userId: TEST_USER.id,
    type: "petition",
    fileName: "petition.pdf",
    filePath: null,
    content: Buffer.from("%PDF-1.4\npetition\n").toString("base64"),
    mimeType: "application/pdf",
    status: "ready",
    generatedAt: GENERATED_AT,
    updatedAt: GENERATED_AT,
    questionnaireResponseId: null,
    ...over,
  }
}

function iwoDocRow(over: Record<string, unknown> = {}) {
  return docRow({
    id: "doc-iwo",
    type: "income_withholding",
    fileName: "income-withholding-order.pdf",
    content: CANONICAL_B64,
    ...over,
  })
}

function req() {
  return new NextRequest(new URL("/api/documents", "http://localhost"))
}

async function listWith(rows: unknown[], county: string | null = "cook") {
  prismaMock.document.findMany.mockResolvedValue(rows)
  prismaMock.caseInfo.findUnique.mockResolvedValue(county === null ? null : { county })
  const res = await GET(req())
  const body = await res.json()
  return { res, body, ids: (body.documents ?? []).map((d: { id: string }) => d.id) }
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(getCurrentUser as jest.Mock).mockResolvedValue(TEST_USER)
})

// ─────────────────────────────────────────────────────────────────────────────
// 1. No base64 content ever leaves the list boundary.
// ─────────────────────────────────────────────────────────────────────────────
describe("list rows carry no document content", () => {
  it("omits `content` from every row", async () => {
    const { res, body } = await listWith([docRow()])

    expect(res.status).toBe(200)
    expect(body.documents).toHaveLength(1)
    expect(body.documents[0]).not.toHaveProperty("content")
  })

  it("never returns the stored base64 payload anywhere in the response", async () => {
    const { body } = await listWith([docRow(), iwoDocRow()])

    const serialized = JSON.stringify(body)
    expect(serialized).not.toContain(CANONICAL_B64.slice(0, 64))
    expect(serialized).not.toContain(Buffer.from("%PDF-1.4\npetition\n").toString("base64"))
  })

  it("does not ask the database for the content column", async () => {
    await listWith([docRow()])

    const args = prismaMock.document.findMany.mock.calls[0][0]
    expect(args.select).toBeDefined()
    expect(args.select.content).toBeFalsy()
  })

  it("still returns the fields the dashboard renders", async () => {
    const { body } = await listWith([docRow()])

    expect(body.documents[0]).toMatchObject({
      id: "doc-petition",
      type: "petition",
      fileName: "petition.pdf",
      status: "ready",
    })
    expect(body.documents[0].generatedAt).toBeDefined()
    expect(body.documents[0].updatedAt).toBeDefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. IWO-classified rows are gated. Production defaults hold distribution
//    closed pending owner approval of the open-path disclosure wording, so no
//    IWO row may be listed at all.
// ─────────────────────────────────────────────────────────────────────────────
describe("IWO rows are gated out of the listing", () => {
  it.each([
    { id: "a", type: "income_withholding", fileName: "income-withholding-order.pdf" },
    { id: "b", type: "iwo", fileName: "form.pdf" },
    { id: "c", type: "withholding_order", fileName: "order.pdf" },
    { id: "d", type: "support", fileName: "Withholding Order.pdf" },
    { id: "e", type: "support", fileName: "OMB 0970-0154.pdf" },
    { id: "f", type: "income withholding for support", fileName: "f.pdf" },
  ])("omits %p under the pinned disclosure hold", async (shape) => {
    const { ids } = await listWith([docRow(), iwoDocRow(shape)])

    expect(ids).toEqual(["doc-petition"])
  })

  it("omits IWO rows for a Will county case", async () => {
    const { ids } = await listWith([docRow(), iwoDocRow()], "will")
    expect(ids).toEqual(["doc-petition"])
  })

  it("omits IWO rows when the stored county is free text", async () => {
    const { ids } = await listWith([docRow(), iwoDocRow()], "Cook County")
    expect(ids).toEqual(["doc-petition"])
  })

  it("omits IWO rows when no case record exists at all", async () => {
    const { ids } = await listWith([docRow(), iwoDocRow()], null)
    expect(ids).toEqual(["doc-petition"])
  })

  it("returns an empty list rather than an error when only IWO rows exist", async () => {
    const { res, body } = await listWith([iwoDocRow()])
    expect(res.status).toBe(200)
    expect(body.documents).toEqual([])
  })

  it("never leaks an IWO refusal token or copy into the list body", async () => {
    const { body } = await listWith([docRow(), iwoDocRow()])

    const serialized = JSON.stringify(body)
    expect(serialized).not.toContain("open_path_disclosure_unapproved")
    expect(serialized).not.toMatch(/0970/)
    expect(serialized).not.toMatch(/withholding/i)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. Non-IWO behavior, auth, and ownership are untouched.
// ─────────────────────────────────────────────────────────────────────────────
describe("non-IWO listing behavior is preserved", () => {
  it.each([
    { id: "t1", type: "tax_document", fileName: "Employee Tax Withholding Certificate.pdf" },
    { id: "t2", type: "tax_document", fileName: "State Tax Withholding Order.pdf" },
    { id: "t3", type: "payroll", fileName: "Payroll Withholding Notice.pdf" },
    { id: "t4", type: "financial_affidavit", fileName: "affidavit.pdf" },
  ])("still lists qualified non-IWO document %p", async (shape) => {
    const { ids } = await listWith([docRow(), docRow(shape)])
    expect(ids).toEqual(["doc-petition", shape.id])
  })

  it("scopes the query to the authenticated user and preserves ordering", async () => {
    await listWith([docRow()])

    const args = prismaMock.document.findMany.mock.calls[0][0]
    expect(args.where).toEqual({ userId: TEST_USER.id })
    expect(args.orderBy).toEqual({ generatedAt: "desc" })
  })

  it("returns 401 without an authenticated user", async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValue(null)
    const res = await GET(req())

    expect(res.status).toBe(401)
    expect(prismaMock.document.findMany).not.toHaveBeenCalled()
  })

  it("does not query the case record when no IWO row is present", async () => {
    await listWith([docRow()])
    expect(prismaMock.caseInfo.findUnique).not.toHaveBeenCalled()
  })

  it("returns 500 when the query fails", async () => {
    prismaMock.document.findMany.mockRejectedValue(new Error("boom"))
    const res = await GET(req())
    expect(res.status).toBe(500)
  })
})
