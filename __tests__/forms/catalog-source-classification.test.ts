/**
 * @jest-environment node
 *
 * Source-classification invariants for the Illinois form catalog.
 *
 * The 2026-09-14 evidence packet
 * (`docs/legal-audit/fs-form-artifact-reconciliation-2026-09-14.md`) found that
 * the old catalog conflated four different kinds of thing under one "Illinois
 * court form" label. These tests encode the separation so it cannot silently
 * collapse again:
 *
 *   statewide official  → Illinois Supreme Court / ATJ standardized artifact
 *   federal official    → ACF/OMB artifact, separately guarded
 *   county / non-statewide → an artifact affirmatively evidenced as county-issued
 *   FreshStart template → authored here, never presented as an official form
 *   unverified identity → a local name with NO corroborated official artifact
 *
 * The last two classes are the ones that matter most: an unverified identity is
 * not the same claim as "this is a county form", and neither may carry an
 * official URL or any automation authority.
 *
 * These tests assert classification and fail-closed behavior only. They do not
 * assert that any mapping, generated output, or filing step is correct.
 */
import fs from "node:fs"
import path from "node:path"

import {
  FORM_AUTHORITY_CLASSES,
  ILLINOIS_COURT_FORMS,
  UNVERIFIED_CATALOG_VALUE,
  formatCatalogLastUpdated,
  getFormById,
  getFormPath,
  isAutoPacketComposable,
  isFormAutomationEligible,
  type CourtForm,
  type FormAuthority,
} from "@/lib/forms/illinois-court-forms"

const MANIFEST_PATH = path.join(
  process.cwd(),
  "docs/legal-audit/illinois-court-forms-manifest.json",
)

interface ManifestForm {
  id: string
  officialUrl: string | null
  authority: string
  automationStatus: string
  provenance: unknown
}

const manifestForms = (): ManifestForm[] =>
  JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")).forms

/** Classes that may name an official artifact. Everything else must not. */
const OFFICIAL_CLASSES: FormAuthority[] = ["illinois_supreme_court", "federal_acf"]

const byAuthority = (authority: FormAuthority): CourtForm[] =>
  ILLINOIS_COURT_FORMS.filter((f) => f.authority === authority)

describe("catalog shape", () => {
  it("holds exactly the 21 reconciled entries with unique ids", () => {
    expect(ILLINOIS_COURT_FORMS).toHaveLength(21)
    const ids = ILLINOIS_COURT_FORMS.map((f) => f.id)
    expect(new Set(ids).size).toBe(21)
  })

  it("stays exactly aligned with the manifest, entry for entry", () => {
    const manifest = manifestForms()
    expect(manifest).toHaveLength(21)
    expect(manifest.map((m) => m.id)).toEqual(ILLINOIS_COURT_FORMS.map((f) => f.id))
    for (const form of ILLINOIS_COURT_FORMS) {
      const entry = manifest.find((m) => m.id === form.id)!
      expect(entry.authority).toBe(form.authority)
      expect(entry.automationStatus).toBe(form.automationStatus)
      expect(entry.officialUrl).toBe(form.officialUrl)
      expect(entry.provenance ?? undefined).toEqual(form.provenance)
    }
  })
})

describe("source classification", () => {
  it("declares five distinct classes and gives every entry exactly one of them", () => {
    const declared = Object.keys(FORM_AUTHORITY_CLASSES) as FormAuthority[]
    expect(new Set(declared)).toEqual(
      new Set([
        "illinois_supreme_court",
        "federal_acf",
        "county_or_non_statewide",
        "freshstart_template",
        "unverified_identity",
      ]),
    )
    for (const form of ILLINOIS_COURT_FORMS) {
      expect(declared).toContain(form.authority)
    }
  })

  it("records, per class, whether it may ever name an official artifact", () => {
    for (const [authority, klass] of Object.entries(FORM_AUTHORITY_CLASSES)) {
      expect(klass.mayCarryOfficialArtifact).toBe(
        OFFICIAL_CLASSES.includes(authority as FormAuthority),
      )
      expect(klass.description.length).toBeGreaterThan(0)
    }
  })

  it("declares auto-packet composability separately from artifact-naming", () => {
    // These are two different questions and must not be derived from each other.
    // "May this class name an official PDF?" is a provenance claim. "May a row of
    // this class be dropped into an automatically composed packet?" is a
    // distribution decision, and for a county artifact it additionally depends on
    // which county's packet is being built.
    expect(
      Object.fromEntries(
        Object.entries(FORM_AUTHORITY_CLASSES).map(([k, v]) => [k, v.autoPacketComposability]),
      ),
    ).toEqual({
      illinois_supreme_court: "composable",
      federal_acf: "composable",
      county_or_non_statewide: "requires_county_context",
      freshstart_template: "never_composable",
      unverified_identity: "never_composable",
    })
  })

  it("binds full provenance to every statewide entry and to nothing else", () => {
    for (const form of ILLINOIS_COURT_FORMS) {
      if (!OFFICIAL_CLASSES.includes(form.authority)) {
        expect(form.officialUrl).toBeNull()
        expect(form.provenance).toBeUndefined()
        continue
      }
      expect(form.officialUrl).toBeTruthy()
      const p = form.provenance!
      expect(p.printedCode).toBeTruthy()
      expect(p.printedRevision).toBeTruthy()
      expect(p.retrievedAt).toBeTruthy()
      expect(p.contentType).toBe("application/pdf")
      expect(p.bytes).toBeGreaterThan(0)
      expect(p.sha256).toMatch(/^[0-9a-f]{64}$/)
    }
  })

  it("keeps the 16 statewide artifacts on the official Illinois Courts host", () => {
    const statewide = byAuthority("illinois_supreme_court")
    expect(statewide).toHaveLength(16)
    for (const form of statewide) {
      expect(form.officialUrl).toMatch(
        /^https:\/\/ilcourtsaudio\.blob\.core\.windows\.net\/antilles-resources\/resources\//,
      )
      expect(form.provenance!.printedCode).toMatch(/^ATJ \d+\.\d+$/)
      expect(form.provenance!.printedRevision).toMatch(/^\d{2}\/\d{2}$/)
    }
  })

  it("keeps exactly one federal entry and never files it under an Illinois class", () => {
    const federal = byAuthority("federal_acf")
    expect(federal.map((f) => f.id)).toEqual(["income-withholding-order"])
    expect(federal[0].provenance!.printedCode).toBe("OMB 0970-0154")
    expect(federal[0].officialUrl).not.toMatch(/ilcourtsaudio|illinoiscourts/)
  })

  it("classifies the three uncorroborated service names as unverified, not as county forms", () => {
    // The 2026-09-14 packet found no statewide artifact for these names. That is
    // an absence of evidence — it is NOT affirmative evidence that a county
    // issues them, which is the separate `county_or_non_statewide` claim.
    for (const id of [
      "certificate-of-service",
      "affidavit-service-special-process",
      "waiver-service",
    ]) {
      expect(getFormById(id)!.authority).toBe("unverified_identity")
    }
  })

  it("does not assert a county source for any entry on the current evidence", () => {
    expect(byAuthority("county_or_non_statewide")).toHaveLength(0)
  })

  it("keeps the settlement agreement labelled as FreshStart-authored", () => {
    const msa = getFormById("marital-settlement-agreement")!
    expect(msa.authority).toBe("freshstart_template")
    expect(msa.officialUrl).toBeNull()
    expect(msa.description).toMatch(/FreshStart template/i)
  })

  it("marks every non-official entry unsupported rather than merely unmapped", () => {
    for (const form of ILLINOIS_COURT_FORMS) {
      if (OFFICIAL_CLASSES.includes(form.authority)) continue
      expect(form.automationStatus).toBe("unsupported")
    }
  })
})

describe("catalog presence is not authority", () => {
  it("makes getFormPath throw for all 21 entries", () => {
    for (const form of ILLINOIS_COURT_FORMS) {
      expect(() => getFormPath(form)).toThrow()
    }
  })

  it("reports no entry as automation-eligible, the federal IWO least of all", () => {
    for (const form of ILLINOIS_COURT_FORMS) {
      expect(isFormAutomationEligible(form)).toBe(false)
    }
    // `separately_guarded` is the most restricted status in the catalog. It must
    // never read as an eligibility grant: if the id check in getFormPath were
    // ever relaxed, an eligible IWO would resolve to a public static path.
    expect(isFormAutomationEligible(getFormById("income-withholding-order")!)).toBe(false)
  })

  it("keeps the federal IWO off any static path with its own distinct refusal", () => {
    expect(() => getFormPath(getFormById("income-withholding-order")!)).toThrow(
      /no static path/i,
    )
    expect(() => getFormPath(getFormById("petition-no-children")!)).toThrow(
      /not automation-eligible/i,
    )
  })
})

describe("auto packet composability", () => {
  const COOK = { countyId: "cook" }

  it("excludes every entry whose identity is not corroborated", () => {
    for (const id of [
      "certificate-of-service",
      "affidavit-service-special-process",
      "waiver-service",
    ]) {
      expect(isAutoPacketComposable(getFormById(id)!, COOK)).toBe(false)
    }
  })

  it("excludes the FreshStart-authored template on its own, distinct ground", () => {
    // Authorship is KNOWN here — the row is not an unverified identity. It is
    // withheld because a FreshStart template is not an official court form, and
    // that must stay a separate statement from "we could not corroborate this".
    const msa = getFormById("marital-settlement-agreement")!
    expect(msa.authority).toBe("freshstart_template")
    expect(isAutoPacketComposable(msa, COOK)).toBe(false)
  })

  it("keeps corroborated official artifacts composable, mapping status aside", () => {
    // These are real, byte-pinned statewide artifacts. Their open question is
    // field mapping, not identity, so identity is not the thing withholding them.
    for (const id of [
      "petition-no-children",
      "financial-affidavit",
      "financial-additional-cash",
      "child-support-order",
      "income-withholding-order",
    ]) {
      expect(isAutoPacketComposable(getFormById(id)!, COOK)).toBe(true)
    }
  })

  it("never auto-composes a county artifact without a matching county context", () => {
    // The catalog holds no county row today, so this invariant is asserted
    // against a constructed one: a county-issued artifact is composable ONLY
    // into the packet of the county that issues it, and never when the row does
    // not name its issuing county at all.
    const base = getFormById("summons")!
    const cookIssued: CourtForm = {
      ...base,
      id: "cook-local-form",
      authority: "county_or_non_statewide",
      officialUrl: null,
      provenance: undefined,
      issuingCountyId: "cook",
    }
    expect(isAutoPacketComposable(cookIssued, { countyId: "cook" })).toBe(true)
    expect(isAutoPacketComposable(cookIssued, { countyId: "dupage" })).toBe(false)
    expect(isAutoPacketComposable(cookIssued, { countyId: "" })).toBe(false)
    expect(
      isAutoPacketComposable({ ...cookIssued, issuingCountyId: undefined }, { countyId: "cook" }),
    ).toBe(false)
  })

  it("does not read composability off the artifact-naming flag", () => {
    // `mayCarryOfficialArtifact` is false for the county class, yet a matching
    // county row IS composable — so the two can no longer be the same bit.
    expect(FORM_AUTHORITY_CLASSES.county_or_non_statewide.mayCarryOfficialArtifact).toBe(false)
    expect(FORM_AUTHORITY_CLASSES.county_or_non_statewide.autoPacketComposability).toBe(
      "requires_county_context",
    )
  })
})

describe("case-type applicability", () => {
  it("scopes the child-support and health-insurance continuations to cases with children", () => {
    // ATJ 253.1 (Additional My Child Support) and ATJ 254.3 (Additional Health
    // Insurance) are Financial Affidavit continuations for child-related
    // entries. Marking them `both` put them in every no-children packet.
    for (const id of [
      "financial-additional-child-support",
      "financial-additional-health-insurance",
    ]) {
      expect(getFormById(id)!.requiredFor).toEqual(["with_children"])
    }
  })
})

describe("date precision is never invented", () => {
  it("never synthesizes a day from a month-only printed revision", () => {
    // A printed revision of "03/25" states a MONTH. Expanding it to 2025-03-01
    // manufactures a day the artifact never claimed.
    for (const form of ILLINOIS_COURT_FORMS.filter(
      (f) => f.authority === "illinois_supreme_court",
    )) {
      expect(form.provenance!.printedRevision).toMatch(/^\d{2}\/\d{2}$/)
      expect(form.lastUpdated).toMatch(/^\d{4}-\d{2}$/)
      const [mm, yy] = form.provenance!.printedRevision.split("/")
      expect(form.lastUpdated).toBe(`20${yy}-${mm}`)
    }
  })

  it("stamps no artifact date on a row with no corroborated artifact", () => {
    for (const form of ILLINOIS_COURT_FORMS) {
      if (OFFICIAL_CLASSES.includes(form.authority)) continue
      expect(form.version).toBe(UNVERIFIED_CATALOG_VALUE)
      expect(form.lastUpdated).toBe(UNVERIFIED_CATALOG_VALUE)
      expect(form.lastUpdated).not.toMatch(/^\d{4}-\d{2}/)
    }
  })

  it("renders the sentinel as a non-date in customer-visible copy", () => {
    expect(formatCatalogLastUpdated(UNVERIFIED_CATALOG_VALUE)).toBe("not verified")
    expect(formatCatalogLastUpdated("2025-03")).toBe("2025-03")
  })

  it("keeps the manifest at the same precision as the catalog", () => {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")).forms as Array<{
      id: string
      catalogVersion: string
      catalogLastUpdated: string
    }>
    for (const form of ILLINOIS_COURT_FORMS) {
      const entry = manifest.find((m) => m.id === form.id)!
      expect(entry.catalogVersion).toBe(form.version)
      expect(entry.catalogLastUpdated).toBe(form.lastUpdated)
    }
  })
})
