/**
 * @jest-environment node
 *
 * `/api/documents/[id]` (DOWNLOAD) is the last independent release path for the
 * federal IWO.
 *
 * It authenticated the caller and checked row ownership, then handed back the
 * stored bytes unconditionally. A legacy `Document` row created before any
 * gating existed — or by any other code path — therefore released the federal
 * Income Withholding for Support print to its owner with no county, federal
 * currentness, or disclosure-approval check anywhere on the path. Omitting such
 * a row from `/api/documents` closes the listing but not the direct URL.
 *
 * Two independent defects are closed here:
 *   1. an IWO-classified row must be refused, with zero bytes, whenever the same
 *      authoritative availability gate every other IWO surface uses is closed;
 *      and
 *   2. a payload that decodes to nothing must be refused rather than served as
 *      an empty but successful download.
 *
 * Auth, ownership, and exact-byte delivery for allowed non-IWO rows are pinned
 * here too, because this change sits directly on that path.
 *
 * Every Prisma call is a mock. No database is touched.
 */

jest.mock("@/lib/db", () => ({
  prisma: {
    document: { findUnique: jest.fn(), delete: jest.fn() },
    caseInfo: { findUnique: jest.fn() },
  },
}))

jest.mock("@/app/api/auth/[...nextauth]/route", () => ({
  auth: jest.fn(),
}))

import fs from "node:fs"
import path from "node:path"

import { NextRequest } from "next/server"

import { GET } from "@/app/api/documents/[id]/route"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { IWO_PROVENANCE } from "@/lib/forms/iwo-provenance"
import { GUARDED_ARTIFACT_DIR } from "@/lib/forms/official-artifact-access"

const prismaMock = (jest.requireMock("@/lib/db") as any).prisma

const CANONICAL_PDF = fs.readFileSync(path.join(GUARDED_ARTIFACT_DIR, IWO_PROVENANCE.file))
const CANONICAL_B64 = CANONICAL_PDF.toString("base64")

/** Synthetic session. Not a real user, not a fixture, not a customer record. */
const USER_ID = "test-user-not-a-customer"
const OTHER_USER_ID = "test-other-user-not-a-customer"

const PETITION_BYTES = Buffer.from("%PDF-1.4\npetition body\n%%EOF\n")

function docRow(over: Record<string, unknown> = {}) {
  return {
    id: "doc-petition",
    userId: USER_ID,
    type: "petition",
    fileName: "petition.pdf",
    content: PETITION_BYTES.toString("base64"),
    mimeType: "application/pdf",
    status: "ready",
    ...over,
  }
}

function iwoRow(over: Record<string, unknown> = {}) {
  return docRow({
    id: "doc-iwo",
    type: "income_withholding",
    fileName: "income-withholding-order.pdf",
    content: CANONICAL_B64,
    ...over,
  })
}

function req(query = "") {
  return new NextRequest(new URL(`/api/documents/doc-1${query}`, "http://localhost"))
}

async function get(row: unknown, opts: { county?: string | null; query?: string } = {}) {
  prismaMock.document.findUnique.mockResolvedValue(row)
  prismaMock.caseInfo.findUnique.mockResolvedValue(
    opts.county === undefined || opts.county === null ? null : { county: opts.county },
  )
  const res = await GET(req(opts.query ?? ""), { params: Promise.resolve({ id: "doc-1" }) })
  const bytes = Buffer.from(await res.arrayBuffer())
  return { res, bytes, text: bytes.toString("utf8") }
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(auth as jest.Mock).mockResolvedValue({ user: { id: USER_ID } })
})

// ─────────────────────────────────────────────────────────────────────────────
// 1. Authentication and ownership are unchanged.
// ─────────────────────────────────────────────────────────────────────────────
describe("authentication and ownership are preserved", () => {
  it("returns 401 without an authenticated session", async () => {
    ;(auth as jest.Mock).mockResolvedValue(null)
    const res = await GET(req(), { params: Promise.resolve({ id: "doc-1" }) })

    expect(res.status).toBe(401)
    expect(prismaMock.document.findUnique).not.toHaveBeenCalled()
  })

  it("returns 404 for a row that does not exist", async () => {
    const { res } = await get(null)
    expect(res.status).toBe(404)
  })

  it("returns 403 for a row owned by another user", async () => {
    const { res, bytes } = await get(docRow({ userId: OTHER_USER_ID }))

    expect(res.status).toBe(403)
    expect(bytes.includes(PETITION_BYTES)).toBe(false)
  })

  it("refuses another user's IWO row without consulting the gate", async () => {
    const { res } = await get(iwoRow({ userId: OTHER_USER_ID }))

    expect(res.status).toBe(403)
    expect(prismaMock.caseInfo.findUnique).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. IWO-classified rows are refused while the gate is closed. Production
//    defaults hold distribution closed pending owner approval of the open-path
//    disclosure wording, so no IWO row may be downloaded at all.
// ─────────────────────────────────────────────────────────────────────────────
describe("IWO rows are refused with zero bytes", () => {
  it.each([
    { type: "income_withholding", fileName: "income-withholding-order.pdf" },
    { type: "iwo", fileName: "form.pdf" },
    { type: "withholding_order", fileName: "order.pdf" },
    { type: "support", fileName: "Withholding Order.pdf" },
    { type: "support", fileName: "OMB 0970-0154.pdf" },
    { type: "income withholding for support", fileName: "f.pdf" },
  ])("refuses %p under the pinned disclosure hold", async (shape) => {
    const { res, bytes } = await get(iwoRow(shape), { county: "cook" })

    expect(res.status).toBe(403)
    expect(bytes.length).toBeGreaterThan(0) // a JSON refusal, not the artifact
    expect(bytes.includes(CANONICAL_PDF.subarray(0, 64))).toBe(false)
    expect(res.headers.get("Content-Type")).not.toBe("application/pdf")
  })

  it("refuses an IWO row for a Will county case", async () => {
    const { res } = await get(iwoRow(), { county: "will" })
    expect(res.status).toBe(403)
  })

  it("refuses an IWO row when the stored county is free text", async () => {
    const { res } = await get(iwoRow(), { county: "Cook County" })
    expect(res.status).toBe(403)
  })

  it("refuses an IWO row when no case record exists at all", async () => {
    const { res } = await get(iwoRow(), { county: null })
    expect(res.status).toBe(403)
  })

  it("ignores a county asserted in the query string", async () => {
    const { res } = await get(iwoRow(), { county: null, query: "?county=cook" })
    expect(res.status).toBe(403)
  })

  it("refuses with the route's existing generic 403 body, not new copy", async () => {
    const { res, text } = await get(iwoRow(), { county: "cook" })

    // The same body this route already returns for an ownership failure. A
    // refusal here must not introduce customer-facing wording of its own: the
    // gate can close for the open-path disclosure hold, which has no approved
    // wording at all, so the truthful option is the generic refusal.
    expect(res.status).toBe(403)
    expect(JSON.parse(text)).toEqual({ error: "Forbidden" })
    expect(res.headers.get("Cache-Control")).toBe("no-store, max-age=0, must-revalidate")
  })

  it("is byte-identical to the ownership refusal body", async () => {
    const gated = await get(iwoRow(), { county: "cook" })
    const notOwned = await get(docRow({ userId: OTHER_USER_ID }))

    expect(gated.text).toBe(notOwned.text)
  })

  it("never leaks an IWO refusal token or copy in the refusal body", async () => {
    const { text } = await get(iwoRow(), { county: "cook" })

    expect(text).not.toContain("open_path_disclosure_unapproved")
    expect(text).not.toMatch(/0970/)
    expect(text).not.toMatch(/withholding/i)
    expect(text).not.toMatch(/expir/i)
    expect(text).not.toMatch(/not available/i)
    expect(text).not.toMatch(/download/i)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. A payload that decodes to nothing is refused, not served as an empty 200.
// ─────────────────────────────────────────────────────────────────────────────
describe("empty and undecodable payloads are refused", () => {
  it.each([
    ["missing content", null],
    ["empty string", ""],
    ["whitespace only", "   "],
    ["undecodable base64", "!!!!"],
  ])("refuses a PDF row with %s", async (_label, content) => {
    const { res, bytes } = await get(docRow({ content }))

    expect(res.status).toBe(404)
    expect(res.headers.get("Content-Type")).not.toBe("application/pdf")
    expect(bytes.length).toBeGreaterThan(0)
  })

  it("refuses a text row whose content is only whitespace", async () => {
    const { res } = await get(docRow({ content: "   ", mimeType: "text/plain" }))
    expect(res.status).toBe(404)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. Allowed non-IWO rows keep their exact current behavior.
// ─────────────────────────────────────────────────────────────────────────────
describe("non-IWO download behavior is preserved", () => {
  it("returns the exact decoded PDF bytes inline", async () => {
    const { res, bytes } = await get(docRow())

    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toBe("application/pdf")
    expect(res.headers.get("Content-Disposition")).toBe('inline; filename="petition.pdf"')
    expect(bytes.equals(PETITION_BYTES)).toBe(true)
  })

  it("returns the same bytes as an attachment when download is requested", async () => {
    const { res, bytes } = await get(docRow(), { query: "?download=true" })

    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Disposition")).toBe('attachment; filename="petition.pdf"')
    expect(bytes.equals(PETITION_BYTES)).toBe(true)
  })

  it("returns text content as stored", async () => {
    const { res, text } = await get(
      docRow({ fileName: "petition.txt", content: "PETITION BODY", mimeType: "text/plain" }),
    )

    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toBe("text/plain")
    expect(text).toBe("PETITION BODY")
  })

  it.each([
    { type: "tax_document", fileName: "Employee Tax Withholding Certificate.pdf" },
    { type: "tax_document", fileName: "State Tax Withholding Order.pdf" },
    { type: "payroll", fileName: "Payroll Withholding Notice.pdf" },
    { type: "financial_affidavit", fileName: "affidavit.pdf" },
  ])("still serves qualified non-IWO document %p", async (shape) => {
    const { res, bytes } = await get(docRow(shape))

    expect(res.status).toBe(200)
    expect(bytes.equals(PETITION_BYTES)).toBe(true)
  })

  it("does not consult the case record for a non-IWO row", async () => {
    await get(docRow())
    expect(prismaMock.caseInfo.findUnique).not.toHaveBeenCalled()
  })

  it("returns 500 when the lookup fails", async () => {
    prismaMock.document.findUnique.mockRejectedValue(new Error("boom"))
    const res = await GET(req(), { params: Promise.resolve({ id: "doc-1" }) })
    expect(res.status).toBe(500)
  })
})
