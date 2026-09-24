/**
 * @jest-environment node
 *
 * The generate route's official branch, driven through `POST` with the release
 * hold lifted in this test only.
 *
 * The 409 pause in `app/api/documents/generate/route.ts` refuses every official
 * request today, so these tests replace the hold predicate with `false` to
 * reach what sits behind it. That is the state the route will be in the day the
 * pause moves: an official request that cannot be served must still be refused
 * with nothing written — no placeholder `FormTemplate` looked up or created, no
 * `Document` row, no badge, and never a summary returned in its place.
 *
 * Every Prisma call is a mock, so a passing run proves no write was attempted.
 * No database is touched and no customer fixture is used. Nothing here lifts a
 * hold or authorizes generation.
 */

jest.mock("@/lib/db", () => ({
  prisma: {
    questionnaireResponse: { findUnique: jest.fn() },
    formTemplate: { findFirst: jest.fn(), create: jest.fn() },
    document: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
  },
}))

jest.mock("@/app/api/auth/[...nextauth]/route", () => ({ auth: jest.fn() }))
jest.mock("@/lib/badges/award-badge", () => ({
  awardBadge: jest.fn().mockResolvedValue({ earned: false }),
}))

jest.mock("@/lib/forms/field-map-compatibility", () => ({
  ...jest.requireActual("@/lib/forms/field-map-compatibility"),
  isFieldMapCompatibilityProven: jest.fn(() => false),
}))

// The real dispatch, wrapped so one case can make it reject; the hold predicate
// replaced so the branch behind it is reachable.
jest.mock("@/lib/document-generation/official-form-request", () => {
  const actual = jest.requireActual("@/lib/document-generation/official-form-request")
  return {
    ...actual,
    isOfficialFormGenerationPaused: jest.fn(() => false),
    generateOfficialFormForDocument: jest.fn(actual.generateOfficialFormForDocument),
  }
})

import { NextRequest } from "next/server"

import { auth } from "@/app/api/auth/[...nextauth]/route"
import { POST } from "@/app/api/documents/generate/route"
import { awardBadge } from "@/lib/badges/award-badge"
import { isFieldMapCompatibilityProven } from "@/lib/forms/field-map-compatibility"
import {
  generateOfficialFormForDocument,
  isOfficialFormGenerationPaused,
} from "@/lib/document-generation/official-form-request"

const prismaMock = jest.requireMock<{ prisma: Record<string, Record<string, jest.Mock>> }>(
  "@/lib/db",
).prisma
const proven = isFieldMapCompatibilityProven as jest.Mock
const paused = isOfficialFormGenerationPaused as jest.Mock
const dispatch = generateOfficialFormForDocument as jest.Mock

const TEST_USER = { id: "synthetic-user", name: "Test", email: "test@example.invalid" }

function post(documentType: string, extra: Record<string, unknown> = {}) {
  return new NextRequest(new URL("/api/documents/generate", "http://localhost"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      questionnaireResponseId: "synthetic-response",
      documentType,
      generationMode: "official",
      ...extra,
    }),
  })
}

function expectNothingWritten() {
  expect(prismaMock.formTemplate.findFirst).not.toHaveBeenCalled()
  expect(prismaMock.formTemplate.create).not.toHaveBeenCalled()
  expect(prismaMock.document.create).not.toHaveBeenCalled()
  expect(prismaMock.document.update).not.toHaveBeenCalled()
  expect(prismaMock.document.findUnique).not.toHaveBeenCalled()
  expect(prismaMock.document.findMany).not.toHaveBeenCalled()
  expect(awardBadge).not.toHaveBeenCalled()
}

beforeEach(() => {
  jest.clearAllMocks()
  paused.mockReturnValue(false)
  proven.mockReturnValue(false)
  ;(auth as jest.Mock).mockResolvedValue({ user: TEST_USER })
  prismaMock.questionnaireResponse.findUnique.mockResolvedValue({
    id: "synthetic-response",
    userId: TEST_USER.id,
    status: "completed",
    responses: { "petitioner-first-name": "A", "spouse-first-name": "B" },
    questionnaire: {},
  })
  prismaMock.formTemplate.findFirst.mockResolvedValue(null)
  prismaMock.formTemplate.create.mockResolvedValue({ id: "placeholder-template" })
  prismaMock.document.create.mockResolvedValue({ id: "doc", fileName: "f", type: "t", status: "ready" })
})

describe("behind the release hold, an unservable official request writes nothing", () => {
  it("refuses a document type with no official form", async () => {
    const response = await POST(post("marital-settlement"))
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body).toMatchObject({ code: "official_form_unsupported" })
    expect(body.document).toBeUndefined()
    expectNothingWritten()
  })

  it.each(["petition", "financial-affidavit", "parenting-plan"])(
    "refuses %s while its field map is unproven",
    async (documentType) => {
      const response = await POST(post(documentType))
      const body = await response.json()

      expect(response.status).toBe(409)
      expect(body).toMatchObject({ code: "official_form_unsupported" })
      expect(body.document).toBeUndefined()
      expectNothingWritten()
    },
  )

  it.each(["petition", "financial-affidavit", "parenting-plan"])(
    "reports a %s generation failure without writing",
    async (documentType) => {
      // Compatibility forced proven, as if that gate had also moved: the
      // template choke point still throws, which is the realistic later failure.
      proven.mockReturnValue(true)
      const originalFetch = global.fetch
      const fetchSpy = jest.fn()
      global.fetch = fetchSpy as unknown as typeof fetch
      try {
        const response = await POST(post(documentType))
        const body = await response.json()

        expect(response.status).toBe(500)
        expect(body).toMatchObject({ code: "official_form_generation_failed" })
        expect(body.document).toBeUndefined()
        expect(fetchSpy).not.toHaveBeenCalled()
        expectNothingWritten()
      } finally {
        global.fetch = originalFetch
      }
    },
  )

  it("refuses a regeneration without reading or updating the existing document", async () => {
    const response = await POST(post("petition", { documentId: "existing-doc" }))

    expect(response.status).toBe(409)
    expectNothingWritten()
  })

  it("never substitutes a summary if the dispatch itself rejects", async () => {
    dispatch.mockRejectedValueOnce(new Error("unexpected dispatch failure"))

    const response = await POST(post("petition"))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.document).toBeUndefined()
    expectNothingWritten()
  })
})

describe("the release hold itself", () => {
  it("still refuses before any lookup when the predicate holds", async () => {
    paused.mockReturnValue(true)

    const response = await POST(post("petition"))
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body).toMatchObject({ code: "official_form_generation_paused" })
    expect(prismaMock.questionnaireResponse.findUnique).not.toHaveBeenCalled()
    expect(dispatch).not.toHaveBeenCalled()
    expectNothingWritten()
  })

  it("is held by the unmocked predicate", () => {
    const { isOfficialFormGenerationPaused: actual } = jest.requireActual(
      "@/lib/document-generation/official-form-request",
    )
    expect(actual()).toBe(true)
  })
})
