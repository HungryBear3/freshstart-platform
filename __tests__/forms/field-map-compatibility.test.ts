/**
 * @jest-environment node
 *
 * Questionnaire / field-map compatibility for the exact pinned artifacts.
 *
 * Compatibility has TWO halves. The questionnaire half is provable in this
 * repository and currently holds. The PDF half is not: the pinned artifacts are
 * deliberately absent, and no field map has ever been compared against one. So
 * every assertion here is about a check being EXECUTABLE and CLOSED, never about
 * a lane being ready.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"

import {
  OFFICIAL_FIELD_MAP_BINDINGS,
  getFieldMapCompatibility,
  getAllFieldMapCompatibility,
  isFieldMapCompatibilityProven,
  evaluateFieldMapBinding,
  type OfficialFieldMapBinding,
} from "@/lib/forms/field-map-compatibility"
import { ILLINOIS_COURT_FORMS, getFormById } from "@/lib/forms/illinois-court-forms"
import { PETITION_NO_CHILDREN_FIELD_MAP } from "@/lib/document-generation/official-forms/field-mappings"

const MAPPED_FORM_IDS = [
  "petition-no-children",
  "petition-with-children",
  "summons",
  "financial-affidavit",
  "parenting-plan",
]

describe("field-map bindings", () => {
  it("binds every declared map to a real catalog row", () => {
    expect(OFFICIAL_FIELD_MAP_BINDINGS.length).toBeGreaterThan(0)
    for (const binding of OFFICIAL_FIELD_MAP_BINDINGS) {
      expect(getFormById(binding.formId)).toBeDefined()
    }
  })

  it("covers exactly the five maps that exist, one row each", () => {
    expect(OFFICIAL_FIELD_MAP_BINDINGS.map((b) => b.formId).sort()).toEqual([...MAPPED_FORM_IDS].sort())
  })

  it("has no map whose questionnaire fields are missing from its owning questionnaire", () => {
    // F5: the questionnaire half currently holds for all five maps. Asserted so
    // that an edit breaking it is caught here rather than surfacing as silent
    // blanks in a generated document.
    for (const binding of OFFICIAL_FIELD_MAP_BINDINGS) {
      expect(evaluateFieldMapBinding(binding).missingQuestionnaireFields).toEqual([])
    }
  })

  it("leaves no declared field map unbound", () => {
    // A new `*_FIELD_MAP` added without a binding would be an ungoverned map:
    // invisible to every compatibility check here while still importable by a
    // filler. Read from source so the list cannot be kept in sync by hand.
    const source = readFileSync(
      join(process.cwd(), "lib/document-generation/official-forms/field-mappings.ts"),
      "utf8",
    )
    const declared = [...source.matchAll(/export const ([A-Z_0-9]+_FIELD_MAP)\b/g)].map((m) => m[1])
    expect(declared.length).toBeGreaterThan(0)
    const bound = new Set(OFFICIAL_FIELD_MAP_BINDINGS.map((b) => b.mapName))
    for (const name of declared) {
      expect(bound.has(name)).toBe(true)
    }
  })

  it("has not verified any map against its pinned artifact", () => {
    for (const binding of OFFICIAL_FIELD_MAP_BINDINGS) {
      expect(binding.verifiedAgainstArtifact).toBeNull()
    }
  })
})

describe("compatibility status", () => {
  it("reports every catalog row", () => {
    expect(getAllFieldMapCompatibility().map((c) => c.formId).sort()).toEqual(
      ILLINOIS_COURT_FORMS.map((f) => f.id).sort(),
    )
  })

  it("is `artifact_unverified` for each mapped row, naming the artifact as the blocker", () => {
    for (const id of MAPPED_FORM_IDS) {
      const result = getFieldMapCompatibility(id)
      expect(result.status).toBe("artifact_unverified")
      expect(result.blockers.join(" ")).toContain("artifact")
    }
  })

  it("is `no_field_map` for every row that has none", () => {
    const mapped = new Set(MAPPED_FORM_IDS)
    for (const form of ILLINOIS_COURT_FORMS) {
      if (mapped.has(form.id)) continue
      expect(getFieldMapCompatibility(form.id).status).toBe("no_field_map")
    }
  })

  it("throws for an id that is not in the catalog rather than reporting a status", () => {
    expect(() => getFieldMapCompatibility("allocation-judgment")).toThrow(/allocation-judgment/)
  })

  it("proves compatibility for NO catalog row", () => {
    for (const form of ILLINOIS_COURT_FORMS) {
      expect(isFieldMapCompatibilityProven(form.id)).toBe(false)
    }
    expect(isFieldMapCompatibilityProven("allocation-judgment")).toBe(false)
  })
})

describe("what a verification has to be to count", () => {
  const base: OfficialFieldMapBinding = {
    formId: "petition-no-children",
    mapName: "PETITION_NO_CHILDREN_FIELD_MAP",
    questionnaireId: "petition",
    mapping: PETITION_NO_CHILDREN_FIELD_MAP,
    verifiedAgainstArtifact: null,
  }
  const pinned = getFormById("petition-no-children")!.provenance!
  // Injected, never read off the system clock: a test that depends on today's
  // date is a time bomb that starts failing on some later day for no reason.
  const TODAY = new Date("2026-09-23T00:00:00Z")
  const good = {
    printedCode: pinned.printedCode,
    printedRevision: pinned.printedRevision,
    sha256: pinned.sha256,
    verifiedAt: "2026-09-23",
    method: "AcroForm field readback",
  }
  const evaluate = (verifiedAgainstArtifact: Partial<typeof good> | null) =>
    evaluateFieldMapBinding(
      {
        ...base,
        verifiedAgainstArtifact: verifiedAgainstArtifact
          ? { ...good, ...verifiedAgainstArtifact }
          : null,
      },
      { today: TODAY },
    )

  it("accepts a verification that matches the pinned artifact in every recorded respect", () => {
    const result = evaluate({})
    expect(result.status).toBe("compatible")
    expect(result.blockers).toEqual([])
  })

  it("rejects a verification against some OTHER artifact's bytes", () => {
    // A map checked against a different revision of the form is not a check of
    // the artifact the catalog pins.
    const result = evaluate({ sha256: "0".repeat(64) })
    expect(result.status).toBe("artifact_unverified")
    expect(result.blockers.join(" ")).toMatch(/sha-?256/i)
  })

  it("rejects a verification recording a different printed code", () => {
    // Matching bytes with a mismatched printed identity means one of the two
    // records is wrong. Accepting it would let a transcription error stand as
    // proof about an artifact nobody checked.
    const result = evaluate({ printedCode: "ATJ 999.9" })
    expect(result.status).toBe("artifact_unverified")
    expect(result.blockers.join(" ")).toMatch(/printed code/i)
  })

  it("rejects a verification recording a different printed revision", () => {
    const result = evaluate({ printedRevision: "01/24" })
    expect(result.status).toBe("artifact_unverified")
    expect(result.blockers.join(" ")).toMatch(/printed revision/i)
  })

  it.each([["empty", ""], ["blank", "   "], ["too short to say anything", "ok"]])(
    "rejects a %s method",
    (_label, method) => {
      const result = evaluate({ method })
      expect(result.status).toBe("artifact_unverified")
      expect(result.blockers.join(" ")).toMatch(/method/i)
    },
  )

  it.each([["", "empty"], ["2026-9-23", "not zero-padded"], ["23/09/2026", "wrong order"], ["2026-02-30", "not a real day"], ["yesterday", "not a date"]])(
    "rejects %s as a verification date (%s)",
    (verifiedAt) => {
      const result = evaluate({ verifiedAt })
      expect(result.status).toBe("artifact_unverified")
      expect(result.blockers.join(" ")).toMatch(/date/i)
    },
  )

  it("rejects a verification dated after today", () => {
    const result = evaluate({ verifiedAt: "2026-09-24" })
    expect(result.status).toBe("artifact_unverified")
    expect(result.blockers.join(" ")).toMatch(/future/i)
  })

  it("reports every defect at once rather than stopping at the first", () => {
    // A reviewer fixing one field at a time, told only about that field, learns
    // the record is sound the moment the last complaint stops — which is not the
    // same as the record being sound.
    const result = evaluate({ sha256: "0".repeat(64), printedCode: "ATJ 999.9", method: "" })
    expect(result.blockers.length).toBeGreaterThanOrEqual(3)
  })

  it("rejects a verification when the row pins no artifact at all", () => {
    const result = evaluateFieldMapBinding(
      {
        ...base,
        formId: "certificate-of-service",
        verifiedAgainstArtifact: { ...good, printedCode: "X", printedRevision: "01/25" },
      },
      { today: TODAY },
    )
    expect(result.status).toBe("artifact_unverified")
  })

  it("rejects a binding whose questionnaire does not exist, before looking at the artifact", () => {
    const result = evaluateFieldMapBinding({ ...base, questionnaireId: "basic-information" })
    expect(result.status).toBe("questionnaire_unresolved")
  })

  it("rejects a binding that reaches for a field its questionnaire does not have", () => {
    // Generation receives ONE questionnaire response object, so a field from
    // another questionnaire fills nothing and emits a blank.
    const result = evaluateFieldMapBinding({
      ...base,
      mapping: [
        ...PETITION_NO_CHILDREN_FIELD_MAP,
        { questionnaireField: "gross-monthly-salary", pdfField: "Income", type: "number" },
      ],
    })
    expect(result.status).toBe("questionnaire_fields_missing")
    expect(result.missingQuestionnaireFields).toEqual(["gross-monthly-salary"])
  })
})
