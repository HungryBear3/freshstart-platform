/**
 * @jest-environment node
 *
 * `summons` has a catalog row and a bound field map, and no filler.
 *
 * Membership in `OFFICIAL_FORM_TYPES` records that identity (catalog + map); it
 * must not also stand for "this module can generate it". Every assertion below
 * runs with field-map compatibility forced PROVEN, because that is the future
 * state in which the two meanings would part: a verified summons map would make
 * `isFormTypeSupported("summons")` true while `generateOfficialForm` fell into
 * its "not yet implemented" default.
 *
 * Nothing here lifts a hold or authorizes generation.
 */
jest.mock("@/lib/forms/field-map-compatibility", () => ({
  ...jest.requireActual("@/lib/forms/field-map-compatibility"),
  isFieldMapCompatibilityProven: jest.fn(() => true),
}))

import {
  generateOfficialForm,
  isFormTypeSupported,
  OFFICIAL_FORM_FILLER_TYPES,
  OFFICIAL_FORM_TYPES,
} from "@/lib/document-generation/official-forms"

describe("with every field map treated as proven", () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
  })

  it("still supports a type that has a filler, so the forced proof is live", () => {
    expect(isFormTypeSupported("petition-no-children")).toBe(true)
  })

  it("does not support summons, which has a field map but no filler", () => {
    expect(OFFICIAL_FORM_TYPES as readonly string[]).toContain("summons")
    expect(isFormTypeSupported("summons")).toBe(false)
  })

  it("refuses summons by naming the missing filler, without issuing a request", async () => {
    const spy = jest.fn()
    global.fetch = spy as unknown as typeof fetch

    await expect(generateOfficialForm("summons", {})).rejects.toThrow(
      /summons has no filler.*No official form was generated/,
    )
    expect(spy).not.toHaveBeenCalled()
  })
})

describe("the filler set", () => {
  it("is a strict subset of the generation identity set", () => {
    for (const type of OFFICIAL_FORM_FILLER_TYPES) {
      expect(OFFICIAL_FORM_TYPES as readonly string[]).toContain(type)
    }
    expect(OFFICIAL_FORM_FILLER_TYPES.length).toBeLessThan(OFFICIAL_FORM_TYPES.length)
  })

  it("names exactly the four types a filler exists for", () => {
    expect([...OFFICIAL_FORM_FILLER_TYPES].sort()).toEqual(
      [
        "financial-affidavit",
        "parenting-plan",
        "petition-no-children",
        "petition-with-children",
      ].sort(),
    )
  })
})
