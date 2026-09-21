/** @jest-environment node */

jest.mock("@/lib/db", () => ({
  prisma: {
    questionnaireResponse: { findUnique: jest.fn() },
    formTemplate: { findFirst: jest.fn(), create: jest.fn() },
    document: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
  },
}))

jest.mock("@/app/api/auth/[...nextauth]/route", () => ({ auth: jest.fn() }))
jest.mock("@/lib/badges/award-badge", () => ({ awardBadge: jest.fn() }))

import { NextRequest } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { GET, POST } from "@/app/api/documents/generate/route"

const prismaMock = (jest.requireMock("@/lib/db") as any).prisma

beforeEach(() => {
  jest.clearAllMocks()
  ;(auth as jest.Mock).mockResolvedValue({
    user: { id: "synthetic-user", name: "Test", email: "test@example.invalid" },
  })
})

function post(documentType: string) {
  return new NextRequest(new URL("/api/documents/generate", "http://localhost"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      questionnaireResponseId: "synthetic-response",
      documentType,
      generationMode: "official",
    }),
  })
}

describe("official form generation release hold", () => {
  it.each(["petition", "financial-affidavit", "parenting-plan"])(
    "refuses %s before any lookup or write",
    async (documentType) => {
      const response = await POST(post(documentType))
      const body = await response.json()

      expect(response.status).toBe(409)
      expect(response.headers.get("Cache-Control")).toMatch(/no-store/)
      expect(body).toMatchObject({ code: "official_form_generation_paused" })
      expect(body.document).toBeUndefined()
      expect(prismaMock.questionnaireResponse.findUnique).not.toHaveBeenCalled()
      expect(prismaMock.formTemplate.findFirst).not.toHaveBeenCalled()
      expect(prismaMock.formTemplate.create).not.toHaveBeenCalled()
      expect(prismaMock.document.create).not.toHaveBeenCalled()
      expect(prismaMock.document.update).not.toHaveBeenCalled()
    },
  )

  it("advertises no official form types while the hold is active", async () => {
    const response = await GET(
      new NextRequest(new URL("/api/documents/generate", "http://localhost")),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.documentTypes).toHaveLength(4)
    for (const type of body.documentTypes) {
      expect(type.supportsOfficialForm).toBe(false)
      expect(type.officialFormTypes).toEqual([])
    }
  })
})
