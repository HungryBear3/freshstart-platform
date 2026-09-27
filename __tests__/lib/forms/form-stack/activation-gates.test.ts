/**
 * @jest-environment node
 *
 * CC-05 PR-7 — dormant activation state machine.
 *
 * Four independent receipts are modelled — owner approval, authoritative
 * current-form evidence, independent exact-SHA review, release approval — and
 * each is verified against a pinned trusted-receipt registry that is EMPTY. Even
 * with every receipt verified (only possible with an injected registry in these
 * tests), the terminal state is unreachable: activation is compiled off, and
 * `active` / generation / delivery / route are literal `false`. Environment
 * flags can only raise anomalies; they never enable anything.
 */
import {
  ACTIVATION_COMPILED_OFF,
  ACTIVATION_GATES,
  TRUSTED_RECEIPT_REGISTRY,
  evaluateActivation,
  inspectActivationFlags,
  receiptDigest,
  type ActivationSubject,
  type GateReceipt,
} from "@/lib/forms/form-stack/activation-gates"
import { SOURCE_CATALOG, type ClassifiedSource } from "@/lib/forms/form-stack/source-classification"

const SHA = "3c68207aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".replace(/[^0-9a-f]/g, "a").padEnd(40, "a")
const MANIFEST = "e".repeat(64)
const CURRENT: ClassifiedSource = {
  sha256: "c".repeat(64),
  bytes: 10,
  mediaType: "application/pdf",
  formId: "synthetic-current",
  sourceClass: "official_current",
  receiptId: "synthetic-evidence",
}
const subject: ActivationSubject = {
  commitSha: SHA,
  packetManifestSha256: MANIFEST,
  author: "implementer",
}
const NOW = () => new Date("2026-09-26T12:00:00Z")

const receipt = (gate: GateReceipt["gate"], over: Partial<GateReceipt> = {}): GateReceipt => ({
  gate,
  receiptId: `r-${gate}`,
  issuedBy: gate === "independent_exact_sha_review" ? "independent-reviewer" : "owner",
  issuedOn: "2026-09-25",
  boundCommitSha: SHA,
  boundPacketManifestSha256: MANIFEST,
  evidenceArtifactSha256: gate === "authoritative_current_form_evidence" ? CURRENT.sha256 : null,
  ...over,
})
const all = () => ACTIVATION_GATES.map(g => receipt(g))
const registryFor = (rs: GateReceipt[]) =>
  Object.fromEntries(rs.map(r => [r.receiptId, receiptDigest(r)]))
const run = (
  rs: GateReceipt[],
  env: Record<string, string | undefined> = {},
  registry = registryFor(rs)
) =>
  evaluateActivation(
    { subject, receipts: rs, env },
    { clock: NOW, registry, catalog: [...SOURCE_CATALOG, CURRENT] }
  )

describe("PR-7 production defaults", () => {
  it("is compiled off and pins an empty trusted-receipt registry", () => {
    expect(ACTIVATION_COMPILED_OFF).toBe(true)
    expect(Object.keys(TRUSTED_RECEIPT_REGISTRY)).toEqual([])
    expect(Object.isFrozen(TRUSTED_RECEIPT_REGISTRY)).toBe(true)
  })

  it("with no receipts and default deps: dormant, every output false", () => {
    const r = evaluateActivation({ subject, receipts: [], env: {} }, { clock: NOW })
    expect(r.state).toBe("dormant")
    expect(r).toMatchObject({
      active: false,
      generationEnabled: false,
      deliveryEnabled: false,
      routeEnabled: false,
    })
    expect(r.gates.every(g => !g.satisfied)).toBe(true)
  })

  it("even perfect receipts fail against the real (empty) registry", () => {
    const r = evaluateActivation(
      { subject, receipts: all(), env: {} },
      { clock: NOW, catalog: [...SOURCE_CATALOG, CURRENT] }
    )
    expect(r.state).toBe("dormant")
    expect(r.gates.flatMap(g => g.reasons)).toContain("untrusted_receipt")
  })
})

describe("PR-7 gate progression (injected registry)", () => {
  it("advances gate by gate, in order, and never reaches active", () => {
    const rs = all()
    expect(run(rs.slice(0, 1)).state).toBe("owner_approved")
    expect(run(rs.slice(0, 2)).state).toBe("current_evidence_pinned")
    expect(run(rs.slice(0, 3)).state).toBe("exact_sha_reviewed")
    const full = run(rs)
    expect(full.state).toBe("release_approved_compiled_off")
    expect(full.active).toBe(false)
    expect(full.generationEnabled).toBe(false)
    expect(full.deliveryEnabled).toBe(false)
    expect(full.routeEnabled).toBe(false)
  })

  it("a later receipt without the earlier one does not skip ahead", () => {
    const rs = all()
    expect(run([rs[3], rs[2]]).state).toBe("dormant")
  })
})

describe("PR-7 adversarial receipts", () => {
  it("rejects a review bound to a different SHA (artifact changed after review)", () => {
    const rs = all()
    rs[2] = receipt("independent_exact_sha_review", { boundCommitSha: "b".repeat(40) })
    const r = run(rs)
    expect(r.state).toBe("current_evidence_pinned")
    expect(r.gates[2].reasons).toContain("receipt_bound_to_different_sha")
  })

  it("rejects a receipt bound to a different review packet", () => {
    const rs = all()
    rs[0] = receipt("owner_approval", { boundPacketManifestSha256: "f".repeat(64) })
    expect(run(rs).gates[0].reasons).toContain("receipt_bound_to_different_packet")
  })

  it("rejects a self-review as not independent", () => {
    const rs = all()
    rs[2] = receipt("independent_exact_sha_review", { issuedBy: "implementer" })
    expect(run(rs).gates[2].reasons).toContain("review_not_independent")
  })

  it("rejects current-form evidence that is not official_current", () => {
    const rs = all()
    rs[1] = receipt("authoritative_current_form_evidence", {
      evidenceArtifactSha256: "2b15c02a46b66a7d0fa2bd80d4644d5d6d5e6798911225f8e0272b45fe20b551",
    })
    expect(run(rs).gates[1].reasons).toContain("evidence_not_official_current:official_legacy")
  })

  it("rejects a receipt the caller backdated or re-dated after trust was pinned", () => {
    const rs = all()
    const registry = registryFor(rs)
    rs[0] = { ...rs[0], issuedOn: "2026-09-26" }
    expect(run(rs, {}, registry).gates[0].reasons).toContain("untrusted_receipt")
  })

  it("rejects stale and future-dated receipts against the injected clock", () => {
    const stale = all()
    stale[0] = receipt("owner_approval", { issuedOn: "2026-06-01" })
    expect(run(stale).gates[0].reasons).toContain("stale_receipt")
    const future = all()
    future[0] = receipt("owner_approval", { issuedOn: "2026-10-01" })
    expect(run(future).gates[0].reasons).toContain("future_dated_receipt")
  })

  it("rejects malformed and duplicate receipts", () => {
    const rs = all()
    rs[0] = receipt("owner_approval", { boundCommitSha: "HEAD" })
    expect(run(rs).gates[0].reasons).toContain("malformed_receipt")
    const dup = [...all(), receipt("owner_approval", { receiptId: "second" })]
    expect(run(dup).gates[0].reasons).toContain("duplicate_receipt")
  })
})

describe("PR-7 flags never enable", () => {
  it("absent flags are the default-off state", () => {
    expect(inspectActivationFlags({})).toEqual([])
  })

  it("an enabled or malformed flag is an anomaly that holds the machine dormant", () => {
    expect(inspectActivationFlags({ FS_OFFICIAL_FORMS_ENABLED: "true" })).toContain(
      "unexpected_enable_flag:FS_OFFICIAL_FORMS_ENABLED"
    )
    expect(inspectActivationFlags({ FS_OFFICIAL_FORM_DELIVERY: "yes please" })).toContain(
      "malformed_flag:FS_OFFICIAL_FORM_DELIVERY"
    )
    const r = run(all(), { FS_FORM_STACK_ACTIVATION: "1" })
    expect(r.state).toBe("held_flag_anomaly")
    expect(r.active).toBe(false)
    expect(r.anomalies).toContain("unexpected_enable_flag:FS_FORM_STACK_ACTIVATION")
  })

  it("an explicit off value is not an anomaly", () => {
    expect(inspectActivationFlags({ FS_OFFICIAL_FORMS_ENABLED: "false" })).toEqual([])
  })
})
