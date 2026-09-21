/**
 * @jest-environment node
 *
 * Packet composition must not treat an unverified catalog identity as a form.
 *
 * Automatic packet composition is a generation/filing-readiness path: whatever
 * lands in `packet.forms` is presented as something the case actually needs. The
 * 2026-09-14 evidence packet could not corroborate four local identities against
 * any official artifact, so those rows must be withheld from composition — and
 * surfaced, not silently dropped.
 *
 * The federal IWO keeps its own separate gate. Nothing here touches it.
 */
import path from "node:path"

import {
  getOpeningPacketForms,
  getProveUpPacketForms,
} from "@/lib/counties/county-iwo-workflow"

const REAL_ARTIFACT_DIR = path.join(process.cwd(), "private", "official-forms")
const OPTS = { artifactDir: REAL_ARTIFACT_DIR, today: new Date("2026-08-10T00:00:00Z") }

/** Rows with NO corroborated official artifact behind the local name. */
const UNVERIFIED_IDS = [
  "certificate-of-service",
  "affidavit-service-special-process",
  "waiver-service",
]

/** Rows whose authorship is known and is FreshStart's own. A different fact. */
const FRESHSTART_TEMPLATE_IDS = ["marital-settlement-agreement"]

const ALL_WITHHELD_IDS = [...UNVERIFIED_IDS, ...FRESHSTART_TEMPLATE_IDS]

describe("unverified identities are withheld from automatic packets", () => {
  it.each(["cook", "dupage", "will", "notacounty"])(
    "keeps them out of the %s opening packet",
    (countyId) => {
      const packet = getOpeningPacketForms(countyId, true, OPTS)
      const ids = packet.forms.map((f) => f.id)
      for (const withheld of ALL_WITHHELD_IDS) expect(ids).not.toContain(withheld)
    },
  )

  it("keeps them out of the prove-up packet", () => {
    const ids = getProveUpPacketForms("cook", true, OPTS).forms.map((f) => f.id)
    // `marital-settlement-agreement` is the judgment-category row that would
    // otherwise reach prove-up on catalog presence alone.
    expect(ids).not.toContain("marital-settlement-agreement")
  })

  it("surfaces each withheld row with its class instead of dropping it", () => {
    const packet = getOpeningPacketForms("cook", true, OPTS)
    const surfaced = [
      ...packet.withheldUnverified,
      ...packet.withheldFreshStartTemplates,
      ...packet.withheldCountyMismatch,
    ]
    expect(surfaced.map((w) => w.formId).sort()).toEqual([...ALL_WITHHELD_IDS].sort())
    for (const withheld of surfaced) {
      expect(withheld.automationStatus).toBe("unsupported")
    }
  })

  it("does not file the FreshStart template under 'unverified identity'", () => {
    // Saying "we could not corroborate this identity" about a document we wrote
    // ourselves is untrue in both directions: the authorship is known, and the
    // absence-of-evidence class must stay reserved for actual absences.
    const packet = getOpeningPacketForms("cook", true, OPTS)
    for (const id of FRESHSTART_TEMPLATE_IDS) {
      expect(packet.withheldUnverified.map((w) => w.formId)).not.toContain(id)
    }
    expect(packet.withheldFreshStartTemplates.map((w) => w.formId)).toEqual(
      FRESHSTART_TEMPLATE_IDS,
    )
    for (const w of packet.withheldFreshStartTemplates) {
      expect(w.authority).toBe("freshstart_template")
    }
  })

  it("keeps the unverified bucket to exactly the uncorroborated identities", () => {
    const packet = getOpeningPacketForms("cook", true, OPTS)
    expect(packet.withheldUnverified.map((w) => w.formId).sort()).toEqual(
      [...UNVERIFIED_IDS].sort(),
    )
    for (const w of packet.withheldUnverified) {
      expect(w.authority).toBe("unverified_identity")
    }
  })

  it("holds no county-mismatch row on the current evidence", () => {
    // The bucket exists so a county artifact cannot leak into another county's
    // packet. No catalog row claims a county issuer today.
    expect(getOpeningPacketForms("cook", true, OPTS).withheldCountyMismatch).toEqual([])
  })

  it("does not route withheld identities through the IWO deferral vocabulary", () => {
    // `deferred` carries IWO disposition/reason codes. Reusing it here would
    // conflate a catalog-identity gap with the federal artifact gate.
    const packet = getOpeningPacketForms("cook", true, OPTS)
    const deferredIds = packet.deferred.map((d) => d.formId)
    for (const withheld of ALL_WITHHELD_IDS) expect(deferredIds).not.toContain(withheld)
  })

  it("still composes the corroborated statewide artifacts", () => {
    const ids = getOpeningPacketForms("cook", true, OPTS).forms.map((f) => f.id)
    expect(ids).toEqual(
      expect.arrayContaining([
        "petition-with-children",
        "summons",
        "financial-affidavit",
        "parenting-plan",
        "judgment-with-children",
        "child-support-order",
      ]),
    )
  })
})

describe("case-type scoping of the Financial Affidavit continuations", () => {
  const CHILD_SCOPED = [
    "financial-additional-child-support",
    "financial-additional-health-insurance",
  ]

  it("keeps the child-support and health-insurance continuations out of a no-children packet", () => {
    const ids = getOpeningPacketForms("cook", false, OPTS).forms.map((f) => f.id)
    for (const id of CHILD_SCOPED) expect(ids).not.toContain(id)
  })

  it("still composes them into a with-children packet", () => {
    const ids = getOpeningPacketForms("cook", true, OPTS).forms.map((f) => f.id)
    for (const id of CHILD_SCOPED) expect(ids).toContain(id)
  })

  it("leaves the case-type-neutral continuations in both packets", () => {
    const neutral = [
      "financial-additional-debts",
      "financial-additional-cash",
      "financial-additional-investments",
      "financial-additional-business-interests",
      "financial-additional-life-insurance",
    ]
    const withChildren = getOpeningPacketForms("cook", true, OPTS).forms.map((f) => f.id)
    const noChildren = getOpeningPacketForms("cook", false, OPTS).forms.map((f) => f.id)
    for (const id of neutral) {
      expect(withChildren).toContain(id)
      expect(noChildren).toContain(id)
    }
  })
})
