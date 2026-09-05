/**
 * @jest-environment node
 *
 * `/api/documents/[id]` — the PAYLOAD pin, exercised with policy OPEN.
 *
 * Policy authorizes the FORM, never the bytes. Under production defaults the
 * open-path disclosure hold closes policy for every IWO row, so the byte path is
 * unreachable there and a test that never opens policy cannot prove anything
 * about it. These tests inject an explicit `approved` disclosure state — the
 * documented test-factory seam, the same one the packager's tests use — so the
 * successful path is actually reached and the pin is exercised on both sides:
 *
 *   - the canonical federal print is returned byte for byte; and
 *   - a row that merely NAMES the instrument while holding different, truncated,
 *     empty, or undecodable bytes is refused with zero bytes.
 *
 * `filterIwoFromPackage` already applies this pin for the ZIP path. The direct
 * download had no equivalent, so a stored row could pass every policy gate and
 * still hand out something that was never the federal form.
 *
 * The pinned default is asserted here too: with NO injected approval, canonical
 * bytes are still refused. The seam must not weaken the hold.
 *
 * Every dependency is injected. No database, no auth, no network.
 */
import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"

import { NextRequest } from "next/server"

import {
  createDocumentServeHandler,
  type ServeDocumentDeps,
  type ServeDocumentRow,
} from "@/lib/documents/serve-document-handler"
import { IWO_PROVENANCE } from "@/lib/forms/iwo-provenance"
import { GUARDED_ARTIFACT_DIR } from "@/lib/forms/official-artifact-access"
import type { IwoOpenPathDisclosureApproval } from "@/lib/forms/iwo-distribution-hold"

const CANONICAL_PDF = fs.readFileSync(path.join(GUARDED_ARTIFACT_DIR, IWO_PROVENANCE.file))
const CANONICAL_B64 = CANONICAL_PDF.toString("base64")

const USER_ID = "test-user-not-a-customer"

/** Inside the legacy transition window; keeps these tests off the wall clock. */
const OPEN_CLOCK = () => new Date("2026-05-01T12:00:00Z")

/**
 * Explicit owner approval, injected ONLY here. The pinned production constant is
 * `pending` and is deliberately not touched.
 */
const APPROVED: IwoOpenPathDisclosureApproval = {
  status: "approved",
  requestedOn: "2026-09-05",
  decisionRecord: "test-only-not-a-real-record",
  ledgerRecord: "test-only-not-a-real-record",
}

function iwoRow(over: Partial<ServeDocumentRow> = {}): ServeDocumentRow {
  return {
    id: "doc-iwo",
    userId: USER_ID,
    type: "income_withholding",
    fileName: "income-withholding-order.pdf",
    content: CANONICAL_B64,
    mimeType: "application/pdf",
    ...over,
  }
}

function handler(row: ServeDocumentRow | null, over: Partial<ServeDocumentDeps> = {}) {
  return createDocumentServeHandler({
    getUserId: async () => USER_ID,
    loadDocument: async () => row,
    loadStoredCounty: async () => "cook",
    now: OPEN_CLOCK,
    disclosureApproval: APPROVED,
    ...over,
  })
}

async function get(row: ServeDocumentRow | null, over: Partial<ServeDocumentDeps> = {}, query = "") {
  const res = await handler(row, over)(
    new NextRequest(new URL(`/api/documents/doc-iwo${query}`, "http://localhost")),
    { params: Promise.resolve({ id: "doc-iwo" }) },
  )
  const bytes = Buffer.from(await res.arrayBuffer())
  return { res, bytes, text: bytes.toString("utf8") }
}

/** Every refusal on this path is the route's generic 403. Nothing else. */
function expectGenericRefusal(res: Response, text: string) {
  expect(res.status).toBe(403)
  expect(JSON.parse(text)).toEqual({ error: "Forbidden" })
  expect(res.headers.get("Content-Type")).not.toBe("application/pdf")
  expect(text).not.toContain("open_path_disclosure_unapproved")
  expect(text).not.toMatch(/0970|withholding|provenance|sha/i)
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Policy open + canonical bytes: exact bytes, unchanged delivery.
// ─────────────────────────────────────────────────────────────────────────────
describe("an approved policy releases the canonical print byte for byte", () => {
  it("returns the exact pinned artifact", async () => {
    const { res, bytes } = await get(iwoRow())

    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toBe("application/pdf")
    expect(bytes.equals(CANONICAL_PDF)).toBe(true)
    expect(bytes.length).toBe(IWO_PROVENANCE.expectedBytes)
    expect(crypto.createHash("sha256").update(bytes).digest("hex")).toBe(
      IWO_PROVENANCE.expectedSha256,
    )
  })

  it("still honors the download disposition", async () => {
    const { res, bytes } = await get(iwoRow(), {}, "?download=true")

    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Disposition")).toBe(
      'attachment; filename="income-withholding-order.pdf"',
    )
    expect(bytes.equals(CANONICAL_PDF)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. Policy open + anything that is not the pinned print: zero bytes.
// ─────────────────────────────────────────────────────────────────────────────
describe("a payload that is not the pinned print is refused", () => {
  const IMPOSTOR = Buffer.from("%PDF-1.4\nnot the federal form\n%%EOF\n")

  it("refuses a different PDF stored under an IWO name", async () => {
    const { res, bytes, text } = await get(iwoRow({ content: IMPOSTOR.toString("base64") }))

    expectGenericRefusal(res, text)
    expect(bytes.includes(IMPOSTOR)).toBe(false)
  })

  it("refuses a truncated copy of the canonical print", async () => {
    const truncated = CANONICAL_PDF.subarray(0, CANONICAL_PDF.length - 1).toString("base64")
    const { res, bytes, text } = await get(iwoRow({ content: truncated }))

    expectGenericRefusal(res, text)
    expect(bytes.length).toBeLessThan(IWO_PROVENANCE.expectedBytes)
  })

  it("refuses a same-length payload with a different hash", async () => {
    const mutated = Buffer.from(CANONICAL_PDF)
    mutated[mutated.length - 1] = mutated[mutated.length - 1] ^ 0xff
    const { res, text } = await get(iwoRow({ content: mutated.toString("base64") }))

    expect(mutated.length).toBe(IWO_PROVENANCE.expectedBytes)
    expectGenericRefusal(res, text)
  })

  it.each([
    ["empty content", ""],
    ["missing content", null],
    ["whitespace only", "   "],
    ["undecodable base64", "!!!!"],
  ])("refuses an IWO row with %s", async (_label, content) => {
    const { res, bytes, text } = await get(iwoRow({ content }))

    expectGenericRefusal(res, text)
    expect(bytes.includes(CANONICAL_PDF.subarray(0, 64))).toBe(false)
  })

  it("refuses the canonical bytes stored under a non-PDF mime type", async () => {
    const { res, text } = await get(iwoRow({ mimeType: "text/plain" }))

    expectGenericRefusal(res, text)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. The seam does not weaken the pinned default, and policy still outranks the
//    payload: a closed gate never reaches the pin at all.
// ─────────────────────────────────────────────────────────────────────────────
describe("the pinned default and the policy gate still govern", () => {
  it("refuses canonical bytes when no approval is injected", async () => {
    const { res, bytes, text } = await get(iwoRow(), { disclosureApproval: undefined })

    expectGenericRefusal(res, text)
    expect(bytes.includes(CANONICAL_PDF.subarray(0, 64))).toBe(false)
  })

  it("refuses canonical bytes for a free-text county even with approval", async () => {
    const { res, text } = await get(iwoRow(), { loadStoredCounty: async () => "Cook County" })

    expectGenericRefusal(res, text)
  })

  it("refuses canonical bytes for a Will county case even with approval", async () => {
    const { res, text } = await get(iwoRow(), { loadStoredCounty: async () => "will" })

    expectGenericRefusal(res, text)
  })

  it("does not apply the federal pin to a non-IWO row", async () => {
    const other = Buffer.from("%PDF-1.4\npetition body\n%%EOF\n")
    const { res, bytes } = await get(
      iwoRow({
        type: "petition",
        fileName: "petition.pdf",
        content: other.toString("base64"),
      }),
    )

    expect(res.status).toBe(200)
    expect(bytes.equals(other)).toBe(true)
  })
})
