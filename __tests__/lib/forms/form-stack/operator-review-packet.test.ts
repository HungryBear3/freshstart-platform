/**
 * @jest-environment node
 *
 * CC-05 PR-6 — operator review packet.
 *
 * The packet is what a human operator reviews before any later release step. It
 * must be hash-bound (any change after review is detectable), PII-minimized
 * (non-official artifacts appear by hash and shape, never by body), computed
 * from the gates themselves (a caller cannot hand in a pre-baked "compatible"),
 * and incapable of delivery.
 */
import fs from "node:fs"
import path from "node:path"

import {
  PINNED_PACKET_HOLDS,
  buildOperatorReviewPacket,
  verifyOperatorReviewPacket,
  type PacketRequest,
} from "@/lib/forms/form-stack/operator-review-packet"

const CANDIDATE = "2e165d22010d51b66c568ab7ecda41a375a9cb19"
const FIXED = () => new Date("2026-09-26T15:00:00.000Z")

const request = (): PacketRequest => ({
  candidateSha: CANDIDATE,
  classificationQueries: [
    {
      sha256: "2b15c02a46b66a7d0fa2bd80d4644d5d6d5e6798911225f8e0272b45fe20b551",
      bytes: 505412,
      mediaType: "application/pdf",
      formId: "income-withholding-order",
    },
  ],
  compatibilityQueries: [
    {
      mappingId: "petition-no-children",
      mappingVersion: "unbound",
      artifact: {
        formId: "petition-no-children",
        path: "public/forms/petition-dissolution-no-children.pdf",
        sha256: "0".repeat(64),
        bytes: 1,
        mediaType: "application/pdf",
        fieldInventory: [],
      },
    },
  ],
  nonOfficialInputs: [
    {
      titleId: "divorce_organizer",
      summary: [{ labelId: "county", value: "Synthetic Cookfact" }],
      checklist: [{ itemId: "gather_pay_stubs", done: false }],
      guidance: ["ask_clerk_which_forms"],
    },
  ],
  tests: [
    {
      command: "jest __tests__/lib/forms/form-stack",
      status: "PASS",
      passed: 1,
      failed: 0,
      skipped: 0,
    },
  ],
  holds: [{ id: "owner_copy_approval_banner", reason: "New banner copy", owner: "product owner" }],
})

const build = (r = request()) => {
  const out = buildOperatorReviewPacket(r, { clock: FIXED })
  if (!out.ok) throw new Error(out.violations.join(","))
  return out.packet
}

describe("PR-6 packet contents", () => {
  it("is bound to the candidate, the injected clock, and delivery none", () => {
    const p = build()
    expect(p.candidateSha).toBe(CANDIDATE)
    expect(p.builtAt).toBe("2026-09-26T15:00:00.000Z")
    expect(p.delivery).toBe("none")
    expect(p.manifestSha256).toMatch(/^[0-9a-f]{64}$/)
  })

  it("computes provenance, classification and compatibility itself", () => {
    const p = build()
    const body = (name: string) => JSON.parse(p.entries.find(e => e.name === name)!.content)
    expect(body("provenance.json").consistent).toBe(true)
    expect(body("classification.json")[0].sourceClass).toBe("official_legacy")
    expect(body("compatibility.json")[0].compatible).toBe(false)
    expect(body("compatibility.json")[0].reasons).toContain("no_bound_mapping")
  })

  it("ignores caller-supplied verdicts smuggled into queries", () => {
    const r = request() as unknown as { compatibilityQueries: Record<string, unknown>[] }
    r.compatibilityQueries[0].compatible = true
    r.compatibilityQueries[0].reasons = []
    const p = build(r as unknown as PacketRequest)
    const compat = JSON.parse(p.entries.find(e => e.name === "compatibility.json")!.content)
    expect(compat[0].compatible).toBe(false)
  })

  it("carries non-official artifacts by hash and shape only, never their body", () => {
    const p = build()
    const art = JSON.parse(p.entries.find(e => e.name === "non-official-artifacts.json")!.content)
    expect(art[0].sha256).toMatch(/^[0-9a-f]{64}$/)
    expect(art[0].officialMarkers).toEqual([])
    const whole = p.entries.map(e => e.content).join("\n")
    expect(whole).not.toContain("Synthetic Cookfact")
  })

  it("always carries the pinned holds, which the caller cannot drop", () => {
    const r = request()
    r.holds = []
    const p = build(r)
    const holds = JSON.parse(p.entries.find(e => e.name === "holds.json")!.content)
    for (const h of PINNED_PACKET_HOLDS)
      expect(holds.map((x: { id: string }) => x.id)).toContain(h.id)
  })

  it("is deterministic for the same request and clock", () => {
    expect(build().manifestSha256).toBe(build().manifestSha256)
  })
})

describe("PR-6 adversarial", () => {
  it("refuses PII anywhere in the request", () => {
    for (const pii of [
      "jane.doe@example.com",
      "(312) 555-0142",
      "123-45-6789",
      "4111 1111 1111 1111",
    ]) {
      const r = request()
      r.holds.push({ id: "x", reason: pii, owner: "o" })
      const out = buildOperatorReviewPacket(r, { clock: FIXED })
      expect(out.ok).toBe(false)
    }
  })

  it("refuses a non-official artifact that fails its own boundary", () => {
    const r = request()
    r.nonOfficialInputs[0].summary[0].value = "Your court-ready forms"
    const out = buildOperatorReviewPacket(r, { clock: FIXED })
    expect(out.ok).toBe(false)
    if (!out.ok) expect(out.violations).toContain("non_official_render_refused:0")
  })

  it("refuses a malformed candidate SHA and an invalid clock", () => {
    const r = request()
    r.candidateSha = "HEAD"
    expect(buildOperatorReviewPacket(r, { clock: FIXED }).ok).toBe(false)
    expect(buildOperatorReviewPacket(request(), { clock: () => new Date("nope") }).ok).toBe(false)
  })

  it("detects any entry changed after review", () => {
    const p = build()
    const reviewed = p.manifestSha256
    expect(verifyOperatorReviewPacket(p, reviewed)).toEqual({ valid: true, reasons: [] })
    const tampered = {
      ...p,
      entries: p.entries.map(e =>
        e.name === "compatibility.json" ? { ...e, content: e.content.replace("false", "true") } : e
      ),
    }
    const v = verifyOperatorReviewPacket(tampered, reviewed)
    expect(v.valid).toBe(false)
    expect(v.reasons).toContain("entry_hash_mismatch:compatibility.json")
  })

  it("detects a re-hashed packet that differs from the one reviewed", () => {
    const reviewed = build().manifestSha256
    const r = request()
    r.tests[0].passed = 2
    const rebuilt = build(r)
    const v = verifyOperatorReviewPacket(rebuilt, reviewed)
    expect(v.valid).toBe(false)
    expect(v.reasons).toContain("manifest_changed_after_review")
  })

  it("cannot deliver — the module has no network, email or storage path", () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), "lib/forms/form-stack/operator-review-packet.ts"),
      "utf8"
    )
    expect(src).not.toMatch(/\bfetch\(|resend|nodemailer|sendEmail|@vercel\/blob|prisma|writeFile/i)
  })
})
