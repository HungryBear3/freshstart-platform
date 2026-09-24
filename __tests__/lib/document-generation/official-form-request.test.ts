/**
 * @jest-environment node
 *
 * The generate route's official-form dispatch, tested without its 409 pause.
 *
 * `app/api/documents/generate/route.ts` refuses `generationMode === "official"`
 * before dispatch, so the dispatch itself is unreachable through the route. It
 * used to catch any official-form error and fall through to a summary PDF,
 * returned 201 as though the request had been served. These tests pin what the
 * dispatch does once reached: it refuses, and never hands back a summary.
 *
 * Nothing here lifts a hold or authorizes generation.
 */
jest.mock("@/lib/forms/field-map-compatibility", () => ({
  ...jest.requireActual("@/lib/forms/field-map-compatibility"),
  isFieldMapCompatibilityProven: jest.fn(() => false),
}))

import { readFileSync } from "node:fs"
import { join } from "node:path"

import { isFieldMapCompatibilityProven } from "@/lib/forms/field-map-compatibility"
import { generateOfficialFormForDocument } from "@/lib/document-generation/official-form-request"

const proven = isFieldMapCompatibilityProven as jest.Mock

const request = (documentType: string, responses: unknown = {}) =>
  generateOfficialFormForDocument({
    documentType,
    responses,
    fallbackPetitionerName: "Petitioner",
    flatten: true,
    generatedAt: new Date("2026-09-23T12:00:00Z"),
  })

beforeEach(() => {
  proven.mockReturnValue(false)
})

describe("an official request that cannot be served is refused", () => {
  it("refuses a document type with no official form", async () => {
    const result = await request("marital-settlement")
    expect(result).toMatchObject({ ok: false, status: 409, code: "official_form_unsupported" })
    expect(result).not.toHaveProperty("pdfBytes")
  })

  it.each(["petition", "financial-affidavit", "parenting-plan"])(
    "refuses %s while its field map is unproven",
    async (documentType) => {
      const result = await request(documentType)
      expect(result).toMatchObject({ ok: false, status: 409, code: "official_form_unsupported" })
      expect(result).not.toHaveProperty("pdfBytes")
    },
  )
})

describe("an official generation error is reported, not swallowed", () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
  })

  it.each(["petition", "financial-affidavit", "parenting-plan"])(
    "returns a failure for %s when a later choke point throws",
    async (documentType) => {
      // Compatibility forced proven, as if the earlier gate had moved: the
      // template choke point still throws, and that error must surface.
      proven.mockReturnValue(true)
      const spy = jest.fn()
      global.fetch = spy as unknown as typeof fetch

      const result = await request(documentType, {
        "petitioner-first-name": "A",
        "spouse-first-name": "B",
      })

      expect(result).toMatchObject({
        ok: false,
        status: 500,
        code: "official_form_generation_failed",
      })
      expect(result).not.toHaveProperty("pdfBytes")
      expect(spy).not.toHaveBeenCalled()
    },
  )

  it("returns a failure rather than throwing when the responses are unreadable", async () => {
    proven.mockReturnValue(true)
    await expect(request("petition", null)).resolves.toMatchObject({
      ok: false,
      code: "official_form_generation_failed",
    })
  })
})

describe("the route has no silent summary fallback for official requests", () => {
  const route = readFileSync(
    join(process.cwd(), "app/api/documents/generate/route.ts"),
    "utf8",
  )

  it("dispatches official requests only through the non-throwing helper", () => {
    expect(route).toMatch(/generateOfficialFormForDocument\(/)
    expect(route).not.toMatch(/\bgenerateOfficialForm\(/)
    expect(route).not.toMatch(/isFormTypeSupported/)
  })

  it("carries no fall-through to summary generation", () => {
    expect(route).not.toMatch(/falling back to summary/i)
    expect(route).not.toMatch(/Fall through to summary/i)
  })
})
