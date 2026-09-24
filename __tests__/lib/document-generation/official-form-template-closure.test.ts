/**
 * @jest-environment node
 *
 * The official-form generation surface, closed by construction.
 *
 * PR #21 made `getFormPath` throw for all 21 catalog rows. Three other builders
 * of the SAME public static path were left behind: `getFormTemplatePath`, and
 * five hardcoded `/forms/….pdf` constants inside the three fillers. They are
 * unreachable today only because the generate route returns 409 for
 * `generationMode === "official"` before dispatch — the same "closed by
 * accident" posture the 2026-09-21 review closed on the catalog side (§6.2).
 *
 * F2/F3 of docs/legal-audit/fs-field-map-compatibility-ledger-2026-09-23.md.
 * Nothing here lifts a hold or authorizes generation.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"

import {
  generateOfficialForm,
  getFormTemplatePath,
  isFormTypeSupported,
  OFFICIAL_FORM_TYPES,
  QUARANTINED_FORM_TYPES,
  type OfficialFormType,
} from "@/lib/document-generation/official-forms"
import { resolveOfficialFormTemplateSource } from "@/lib/document-generation/official-forms/template-source"
import { OFFICIAL_FIELD_MAP_BINDINGS } from "@/lib/forms/field-map-compatibility"
import { getFormById } from "@/lib/forms/illinois-court-forms"

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8")

const FILLERS = [
  "lib/document-generation/official-forms/petition-filler.ts",
  "lib/document-generation/official-forms/financial-affidavit-filler.ts",
  "lib/document-generation/official-forms/parenting-plan-filler.ts",
]

describe("the generation identity set is bound to the catalog", () => {
  it("names at least one type, so the assertions below are not vacuous", () => {
    expect(OFFICIAL_FORM_TYPES.length).toBeGreaterThan(0)
  })

  it("has no generation identity the catalog does not contain", () => {
    for (const type of OFFICIAL_FORM_TYPES) {
      expect(getFormById(type)).toBeDefined()
    }
  })

  it("admits only statewide official rows that actually have a field map", () => {
    // Derived rather than eyeballed: a generation identity exists because a
    // bound field map and a statewide artifact exist for it, not because
    // somebody once wrote the string into a union.
    const eligible = OFFICIAL_FIELD_MAP_BINDINGS.filter(
      (b) => getFormById(b.formId)?.authority === "illinois_supreme_court",
    ).map((b) => b.formId)
    expect(eligible.length).toBeGreaterThan(0)
    expect([...OFFICIAL_FORM_TYPES].sort()).toEqual([...eligible].sort())
  })

  it("admits no row the catalog reclassified away from a statewide official form", () => {
    for (const type of OFFICIAL_FORM_TYPES) {
      expect(getFormById(type)!.authority).toBe("illinois_supreme_court")
    }
    for (const id of ["certificate-of-service", "marital-settlement-agreement"]) {
      expect(OFFICIAL_FORM_TYPES as readonly string[]).not.toContain(id)
    }
  })

  it("supports no form type", () => {
    for (const type of OFFICIAL_FORM_TYPES) {
      expect(isFormTypeSupported(type)).toBe(false)
    }
    expect(isFormTypeSupported("allocation-judgment")).toBe(false)
  })
})

describe("the identities removed from the generation set stay removed", () => {
  const quarantined = QUARANTINED_FORM_TYPES.map((q) => q.formType)

  it("records every one of them with a reason", () => {
    expect(QUARANTINED_FORM_TYPES.length).toBeGreaterThan(0)
    for (const entry of QUARANTINED_FORM_TYPES) {
      expect(getFormById(entry.formType)).toBeDefined()
      expect(entry.reason.length).toBeGreaterThan(10)
    }
  })

  it("keeps them disjoint from the generation set", () => {
    for (const id of quarantined) {
      expect(OFFICIAL_FORM_TYPES as readonly string[]).not.toContain(id)
    }
  })

  it("accounts for the whole legacy set, so nothing was dropped instead of closed", () => {
    // The nine identities this module accepted before this change. Listed here
    // so a removal cannot quietly become a deletion nobody recorded.
    const legacy = [
      "petition-no-children",
      "petition-with-children",
      "financial-affidavit",
      "parenting-plan",
      "summons",
      "certificate-of-service",
      "judgment-no-children",
      "judgment-with-children",
      "marital-settlement-agreement",
    ]
    expect([...OFFICIAL_FORM_TYPES, ...quarantined].sort()).toEqual([...legacy].sort())
  })

  it("supports none of them and builds no path for any of them", () => {
    for (const id of quarantined) {
      expect(isFormTypeSupported(id)).toBe(false)
      expect(() => resolveOfficialFormTemplateSource(id)).toThrow()
    }
  })

  it("refuses to generate any of them", async () => {
    for (const id of quarantined) {
      await expect(
        generateOfficialForm(id as unknown as OfficialFormType, {}, {
          parent1Name: "A",
          parent2Name: "B",
        }),
      ).rejects.toThrow()
    }
  })

  it("refuses an identity the catalog does not contain at all, without crashing", async () => {
    await expect(
      generateOfficialForm("allocation-judgment" as unknown as OfficialFormType, {}),
    ).rejects.toThrow(/allocation-judgment/)
  })
})

describe("no static artifact path is constructible", () => {
  it("throws from getFormTemplatePath for every generation identity", () => {
    for (const type of OFFICIAL_FORM_TYPES) {
      expect(() => getFormTemplatePath(type)).toThrow(new RegExp(type))
    }
  })

  it("throws from the single template-source choke point for every catalog row", () => {
    for (const type of OFFICIAL_FORM_TYPES) {
      expect(() => resolveOfficialFormTemplateSource(type)).toThrow()
    }
    expect(() => resolveOfficialFormTemplateSource("certificate-of-service")).toThrow()
  })

  it("leaves no hardcoded /forms/ artifact path in the fillers", () => {
    for (const rel of FILLERS) {
      expect(read(rel)).not.toMatch(/['"`]\/forms\/[^'"`]+\.pdf['"`]/)
    }
  })

  it("leaves no /forms/ artifact path table in the official-forms index", () => {
    expect(read("lib/document-generation/official-forms/index.ts")).not.toMatch(
      /['"`]\/forms\/[^'"`]+\.pdf['"`]/,
    )
  })
})

describe("generation refuses before it can fetch anything", () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
  })

  it.each(OFFICIAL_FORM_TYPES as readonly OfficialFormType[])(
    "refuses %s without issuing a request",
    async (type) => {
      const spy = jest.fn()
      global.fetch = spy as unknown as typeof fetch

      await expect(
        generateOfficialForm(type, {}, { parent1Name: "A", parent2Name: "B" }),
      ).rejects.toThrow()
      expect(spy).not.toHaveBeenCalled()
    },
  )

  it("says the field map is unverified rather than that the form is unimplemented", async () => {
    // "not yet implemented" would misdescribe five maps that exist and are
    // fully written; the blocker is that none has been checked against its PDF.
    await expect(generateOfficialForm("petition-no-children", {})).rejects.toThrow(
      /field map|compatib/i,
    )
  })
})
