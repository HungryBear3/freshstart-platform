/**
 * Generation-route containment for the federal IWO (C-4 / PR-1).
 * @jest-environment node
 *
 * `/api/documents/generate` persists the caller's `documentType` verbatim onto
 * `Document.type`, and its unallowlisted `default:` branch creates a `ready` row
 * for ANY value. That is an independent path to a row the package guard would
 * later have to withhold as a federal instrument.
 *
 * These tests assert the rejection happens BEFORE persistence — not that the
 * row is cleaned up afterwards. Every Prisma write is a mock, so a passing run
 * proves no write was attempted at all. No database is touched and no customer
 * fixture is used.
 */

jest.mock("@/lib/db", () => ({
  prisma: {
    questionnaireResponse: { findUnique: jest.fn() },
    formTemplate: { findFirst: jest.fn(), create: jest.fn() },
    document: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

jest.mock("@/app/api/auth/[...nextauth]/route", () => ({
  auth: jest.fn(),
}))

jest.mock("@/lib/badges/award-badge", () => ({
  awardBadge: jest.fn().mockResolvedValue({ earned: false }),
}))

import { NextRequest } from "next/server"

import { auth } from "@/app/api/auth/[...nextauth]/route"
import { POST } from "@/app/api/documents/generate/route"
import { isIwoDocument, identifiesIwo } from "@/lib/forms/iwo-package-guard"

/** The mocked client the route actually holds. Every write here is a spy. */
const prismaMock = (jest.requireMock("@/lib/db") as any).prisma

/** Synthetic session. Not a real user, not a fixture, not a customer record. */
const TEST_USER = { id: "test-user-not-a-customer", name: "Test", email: "test@example.invalid" }

function post(body: unknown): NextRequest {
  return new NextRequest(new URL("/api/documents/generate", "http://localhost"), {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  })
}

/** Every write the route can reach. None may be called for a denied type. */
function everyWrite() {
  return [
    prismaMock.document.create,
    prismaMock.document.update,
    prismaMock.formTemplate.create,
  ]
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(auth as jest.Mock).mockResolvedValue({ user: TEST_USER })
})

// ─────────────────────────────────────────────────────────────────────────────
// The five identities named by the corrected design.
// ─────────────────────────────────────────────────────────────────────────────
const DENIED_IDENTITIES = [
  "income-withholding-order",
  "iwo",
  "0970-0154",
  "0970 0154",
  "09700154",
]

describe("generation route denies IWO-identifying documentType before persistence", () => {
  it.each(DENIED_IDENTITIES)("refuses %p with 403 and creates nothing", async (documentType) => {
    const res = await POST(post({ questionnaireResponseId: "qr-1", documentType }))

    expect(res.status).toBe(403)
    for (const write of everyWrite()) expect(write).not.toHaveBeenCalled()
    // Denied before the route even looks the questionnaire up.
    expect(prismaMock.questionnaireResponse.findUnique).not.toHaveBeenCalled()
    expect(prismaMock.formTemplate.findFirst).not.toHaveBeenCalled()
  })

  it.each(DENIED_IDENTITIES)("returns no document and no rename for %p", async (documentType) => {
    const res = await POST(post({ questionnaireResponseId: "qr-1", documentType }))
    const body = await res.json()

    // No row handed back under any name.
    expect(body.document).toBeUndefined()
    expect(body.badgeEarned).toBeUndefined()
    // The refused type is echoed as-is: not silently relabelled "summary" or
    // anything else. A rename would hide the refusal from the caller.
    expect(body.documentType).toBe(documentType)
    expect(res.headers.get("Cache-Control")).toMatch(/no-store/)
  })

  it("says only what Fresh Start does, and claims nothing about federal status", async () => {
    const res = await POST(post({ questionnaireResponseId: "qr-1", documentType: "iwo" }))
    const body = await res.json()

    expect(body.message).toBe(
      "Fresh Start does not generate the federal Income Withholding for Support form (OMB 0970-0154). No document was created.",
    )
    // No advice, no acceptance claim, no assertion about the form's federal state.
    expect(body.message).not.toMatch(/valid|invalid|accept|approv|expire|court will|legal advice/i)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Coextensiveness: the packager and the route agree, by construction.
// ─────────────────────────────────────────────────────────────────────────────
describe("route denial is coextensive with the package classifier", () => {
  /** Identities the classifier accepts, plus qualified look-alikes it must not. */
  const CORPUS = [
    ...DENIED_IDENTITIES,
    "IWO",
    "iwo.pdf",
    "Income Withholding for Support",
    "income_withholding_order",
    "Withholding Order.pdf",
    "INCOME-WITHHOLDING.PDF",
    "income withholding for support order",
    "federal income withholding for support form omb 0970 0154",
    // Must NOT be caught: qualified tax/payroll documents and unrelated types.
    "State Tax Withholding Order",
    "Income Withholding Certificate",
    "petition",
    "financial-affidavit",
    "parenting-plan",
    "marital-settlement",
    "kiwo",
    "summary",
  ]

  it.each(CORPUS)(
    "%p: every identity the classifier accepts is denied before row creation",
    async (documentType) => {
      const classified = isIwoDocument({ type: documentType, fileName: documentType })
      // The route reuses the classifier's own single-field predicate.
      expect(identifiesIwo(documentType)).toBe(classified)

      prismaMock.questionnaireResponse.findUnique.mockResolvedValue(null)
      const res = await POST(post({ questionnaireResponseId: "qr-1", documentType }))

      if (classified) {
        expect(res.status).toBe(403)
        for (const write of everyWrite()) expect(write).not.toHaveBeenCalled()
        expect(prismaMock.questionnaireResponse.findUnique).not.toHaveBeenCalled()
      } else {
        // Not an IWO identity: the deny branch is not what stopped it. It went
        // on to normal handling (here, a 404 for the missing questionnaire).
        expect(res.status).not.toBe(403)
        expect(prismaMock.questionnaireResponse.findUnique).toHaveBeenCalled()
      }
    },
  )
})
