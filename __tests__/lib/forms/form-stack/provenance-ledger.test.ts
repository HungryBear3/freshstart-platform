/**
 * @jest-environment node
 *
 * CC-05 PR-2 — provenance continuation.
 *
 * PR-2A split one `expiration` field into three dates. What it did not do is say,
 * in a form code can check, which of those dates an outside authority actually
 * stated and which one Fresh Start derived. These tests pin that separation: the
 * external facts carry immutable source receipts, the derived cutoff carries its
 * derivation, its uncertainty, and its repin trigger, and the two can never be
 * silently swapped or allowed to drift from the runtime model.
 */
import { IWO_PROVENANCE, PINNED_OIRA_APPROVAL } from "@/lib/forms/iwo-provenance"
import {
  IWO_DERIVED_POLICY,
  IWO_EXTERNAL_FACTS,
  IWO_SOURCE_RECEIPTS,
  reconcileIwoProvenance,
} from "@/lib/forms/form-stack/provenance-ledger"

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v))

describe("PR-2 provenance ledger — pinned state", () => {
  it("reconciles with the PR-2A runtime model with zero discrepancies", () => {
    const r = reconcileIwoProvenance()
    expect(r.discrepancies).toEqual([])
    expect(r.consistent).toBe(true)
  })

  it("keeps the operative cutoff out of the external-fact set", () => {
    const externalIds = IWO_EXTERNAL_FACTS.map(f => f.id)
    expect(externalIds).not.toContain("legacy_transition_first_blocked_date")
    expect(IWO_EXTERNAL_FACTS.map(f => f.value)).not.toContain("2027-08-25")
    const cutoff = IWO_DERIVED_POLICY.find(p => p.id === "legacy_transition_first_blocked_date")
    expect(cutoff).toBeDefined()
    expect(cutoff!.kind).toBe("freshstart_derived_policy")
    expect(cutoff!.published).toBe(false)
    expect(cutoff!.value).toBe(IWO_PROVENANCE.legacyTransitionFirstBlockedDate)
  })

  it("preserves the uncertainty and repin requirement on the derived cutoff", () => {
    const cutoff = IWO_DERIVED_POLICY.find(p => p.id === "legacy_transition_first_blocked_date")!
    expect(cutoff.uncertainty.join(" ")).toMatch(/2027-08-31/)
    expect(cutoff.uncertainty.join(" ")).toMatch(/not an ACF-published/i)
    expect(cutoff.repinTrigger).toMatch(/ACF implementation/i)
  })

  it("binds every external fact to at least one pinned receipt", () => {
    const receiptIds = new Set(IWO_SOURCE_RECEIPTS.map(r => r.id))
    for (const fact of IWO_EXTERNAL_FACTS) {
      expect(fact.receiptIds.length).toBeGreaterThan(0)
      for (const id of fact.receiptIds) expect(receiptIds.has(id)).toBe(true)
    }
  })

  it("is immutable — receipts, facts and policy are deep-frozen", () => {
    expect(Object.isFrozen(IWO_SOURCE_RECEIPTS)).toBe(true)
    expect(Object.isFrozen(IWO_SOURCE_RECEIPTS[0])).toBe(true)
    expect(Object.isFrozen(IWO_EXTERNAL_FACTS[0].receiptIds)).toBe(true)
    expect(Object.isFrozen(IWO_DERIVED_POLICY[0].uncertainty)).toBe(true)
    expect(() => {
      ;(IWO_SOURCE_RECEIPTS[0] as { sha256: string }).sha256 = "0".repeat(64)
    }).toThrow(TypeError)
  })

  it("reports the canonical-URL host mismatch as an open uncertainty, not a fix", () => {
    const r = reconcileIwoProvenance()
    expect(r.openUncertainties).toContain("canonical_url_host_differs_from_retrieval_receipt")
    // No artifact replacement or repin happens as a side effect.
    expect(IWO_PROVENANCE.canonicalUrl).toMatch(/acf\.hhs\.gov/)
  })

  it("records the revised successor only as DOCX receipts", () => {
    const successors = IWO_SOURCE_RECEIPTS.filter(r => r.role === "revised_successor")
    expect(successors).toHaveLength(2)
    for (const s of successors) expect(s.mediaType).toMatch(/wordprocessingml/)
  })
})

describe("PR-2 provenance ledger — drift is detected, never absorbed", () => {
  const base = () => ({ provenance: clone(IWO_PROVENANCE), oira: clone(PINNED_OIRA_APPROVAL) })

  it("flags a runtime cutoff moved to the third-party 2027-08-31 wording", () => {
    const m = base()
    m.provenance.legacyTransitionFirstBlockedDate = "2027-08-31"
    const r = reconcileIwoProvenance(m)
    expect(r.consistent).toBe(false)
    expect(r.discrepancies).toContain(
      "legacy_transition_first_blocked_date_differs_from_derivation"
    )
  })

  it("flags the collection expiration being used as the operative cutoff", () => {
    const m = base()
    m.provenance.legacyTransitionFirstBlockedDate = m.provenance.collectionApprovalExpiresOn
    const r = reconcileIwoProvenance(m)
    expect(r.consistent).toBe(false)
    expect(r.discrepancies).toContain("derived_policy_value_collides_with_external_fact")
  })

  it("flags an artifact hash or length that no longer matches the retrieval receipt", () => {
    const m = base()
    m.provenance.expectedSha256 = "f".repeat(64)
    m.provenance.expectedBytes = 1
    const r = reconcileIwoProvenance(m)
    expect(r.discrepancies).toEqual(
      expect.arrayContaining([
        "artifact_sha256_differs_from_receipt",
        "artifact_bytes_differ_from_receipt",
      ])
    )
  })

  it("flags OIRA model drift field by field", () => {
    const m = base()
    m.oira.approvalDate = "2026-08-01"
    m.oira.collectionApprovalExpiresOn = "2030-08-31"
    m.oira.noticeOfActionSha256 = "a".repeat(64)
    m.provenance.printedLegacyPdfDate = "2029-08-31"
    const r = reconcileIwoProvenance(m)
    expect(r.discrepancies).toEqual(
      expect.arrayContaining([
        "oira_approval_date_differs_from_receipt",
        "collection_approval_expires_on_differs_from_receipt",
        "notice_of_action_sha256_differs_from_receipt",
        "printed_legacy_pdf_date_differs_from_receipt",
      ])
    )
  })
})
