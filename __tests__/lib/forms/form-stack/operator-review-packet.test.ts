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
      countyId: "cook",
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
  holdIds: ["banner_copy_owner_review"],
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

  it("refuses caller-supplied verdicts smuggled into queries (closed schema)", () => {
    const r = request() as unknown as { compatibilityQueries: Record<string, unknown>[] }
    r.compatibilityQueries[0].compatible = true
    r.compatibilityQueries[0].reasons = []
    const out = buildOperatorReviewPacket(r as unknown as PacketRequest, { clock: FIXED })
    expect(out.ok).toBe(false)
    if (!out.ok)
      expect(out.violations).toContain("request_invalid:compatibilityQueries[0]:unknown_key")
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
    r.holdIds = []
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
  // R3: a closed, length-bounded schema per metadata field. Every rejection
  // is a code and a path — never the offending value.
  const PHONES = [
    "3125550142",
    "(312) 555-0142",
    "312.555.0142",
    "+1 312 555 0142",
    "+44 20 7946 0958",
    "312-555-0142 x12",
    "(312) 555-0142 ext. 7",
  ]
  const PII = [...PHONES, "jane.doe@example.com", "123-45-6789", "123456789", "4111 1111 1111 1111"]

  const refuses = (mutate: (r: PacketRequest) => void, path: string, pii: string) => {
    const r = request()
    mutate(r)
    const out = buildOperatorReviewPacket(r, { clock: FIXED })
    expect(out.ok).toBe(false)
    if (!out.ok)
      expect(out.violations.some(v => v.startsWith(`request_invalid:${path}`))).toBe(true)
    expect(JSON.stringify(out)).not.toContain(pii)
  }

  it.each(PII)("refuses %j in a test command, without echoing it", pii => {
    refuses(r => (r.tests[0].command = `jest ${pii}`), "tests[0].command", pii)
  })

  it.each(PII)("refuses %j as a hold (holds are ids, never text)", pii => {
    refuses(r => (r.holdIds = [pii] as never), "holdIds[0]", pii)
    refuses(r => (r.holdIds = [`call ${pii}`] as never), "holdIds[0]", pii)
  })

  it.each(PHONES)("refuses %j in every identifier-shaped field", pii => {
    refuses(r => (r.classificationQueries[0].formId = pii), "classificationQueries[0].formId", pii)
    refuses(
      r => (r.compatibilityQueries[0].mappingId = pii),
      "compatibilityQueries[0].mappingId",
      pii
    )
    refuses(
      r => (r.compatibilityQueries[0].mappingVersion = pii),
      "compatibilityQueries[0].mappingVersion",
      pii
    )
    refuses(
      r => (r.compatibilityQueries[0].countyId = pii),
      "compatibilityQueries[0].countyId",
      pii
    )
    refuses(
      r => (r.compatibilityQueries[0].artifact.path = `public/forms/${pii}.pdf`),
      "compatibilityQueries[0].artifact.path",
      pii
    )
    refuses(
      r => (r.compatibilityQueries[0].artifact.fieldInventory = [`Phone ${pii}`]),
      "compatibilityQueries[0].artifact.fieldInventory",
      pii
    )
  })

  it("refuses out-of-vocabulary media types, classes and statuses", () => {
    refuses(
      r => (r.classificationQueries[0].mediaType = "text/plain"),
      "classificationQueries[0].mediaType",
      "text/plain"
    )
    refuses(
      r => (r.classificationQueries[0].claimedClass = "trusted" as never),
      "classificationQueries[0].claimedClass",
      "trusted"
    )
    refuses(r => (r.tests[0].status = "MOSTLY" as never), "tests[0].status", "MOSTLY")
    refuses(r => (r.tests[0].passed = -1), "tests[0].passed", "-1")
    refuses(r => (r.classificationQueries[0].bytes = 1.5), "classificationQueries[0].bytes", "1.5")
  })

  it("customer text is hashed, never copied: PII in a summary value appears nowhere", () => {
    const r = request()
    r.nonOfficialInputs[0].summary[0].value = "Jane 3125550142 jane.doe@example.com"
    const out = buildOperatorReviewPacket(r, { clock: FIXED })
    expect(out.ok).toBe(true)
    const bytes = JSON.stringify(out)
    for (const pii of ["3125550142", "jane.doe@example.com", "Jane"])
      expect(bytes).not.toContain(pii)
  })

  it("field names never appear in compatibility reasons, only their digests", () => {
    const r = request()
    r.compatibilityQueries[0].artifact.fieldInventory = ["Petitioner Name", "Zeta Field"]
    const out = buildOperatorReviewPacket(r, { clock: FIXED })
    if (!out.ok) throw new Error(out.violations.join(","))
    const bytes = JSON.stringify(out)
    expect(bytes).not.toContain("Zeta Field")
    expect(bytes).not.toContain("Petitioner Name")
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
