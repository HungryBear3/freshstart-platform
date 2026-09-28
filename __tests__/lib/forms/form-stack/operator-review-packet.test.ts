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

import crypto from "node:crypto"

import {
  MANDATORY_PACKET_HOLD_IDS,
  OPERATOR_PACKET_ENTRY_NAMES,
  OPERATOR_PACKET_VERSION,
  OPTIONAL_PACKET_HOLDS,
  PINNED_PACKET_HOLDS,
  buildOperatorReviewPacket,
  canonicalJson,
  computeManifestSha256,
  verifyOperatorReviewPacket,
  type OperatorReviewPacket,
  type PacketRequest,
} from "@/lib/forms/form-stack/operator-review-packet"
import {
  PACKET_TEST_CATALOG,
  statusMatchesCounts,
} from "@/lib/forms/form-stack/packet-request-schema"

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
      summary: [{ labelId: "county", value: "Cook" }],
      checklist: [{ itemId: "gather_pay_stubs", done: false }],
      guidance: ["ask_clerk_which_forms"],
    },
  ],
  tests: [
    {
      testId: "form_stack_focused",
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
    expect(whole).not.toContain("Gather your recent pay stubs")
    expect(whole).not.toContain("Cook")
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

  it.each(PII)("refuses %j as a test id or command text, without echoing it", pii => {
    // B2: runs are catalog ids; command text is not an accepted field at all.
    refuses(r => (r.tests[0].testId = `jest ${pii}` as never), "tests[0].testId", pii)
    refuses(
      r => ((r.tests[0] as unknown as Record<string, unknown>).command = `jest ${pii}`),
      "tests[0]:unknown_key",
      pii
    )
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

  it("customer text is hashed, never copied; PII in a summary value is refused unechoed", () => {
    const r = request()
    r.nonOfficialInputs[0].summary[0].value = "Jane 3125550142 jane.doe@example.com"
    const out = buildOperatorReviewPacket(r, { clock: FIXED })
    expect(out.ok).toBe(false)
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

describe("R8 mandatory holds cannot be dropped", () => {
  const MANDATORY = [
    "official_form_generation_paused",
    "official_form_delivery_paused",
    "activation_dormant",
    "no_official_current_evidence",
    "no_proven_field_map_binding",
    "pr5_copy_content_approval_pending",
    "independent_exact_sha_review_pending",
    "release_activation_approval_pending",
  ]
  const sha = (c: string) => crypto.createHash("sha256").update(c).digest("hex")

  /** A forger who rewrites an entry AND recomputes every hash consistently. */
  const forge = (
    p: OperatorReviewPacket,
    over: Partial<OperatorReviewPacket> = {},
    holds?: (h: { id: string; reason: string; owner: string }[]) => unknown
  ): OperatorReviewPacket => {
    const entries = p.entries.map(e => {
      if (e.name !== "holds.json" || !holds) return e
      const content = JSON.stringify(holds(JSON.parse(e.content)))
      return { ...e, content, sha256: sha(content), bytes: Buffer.byteLength(content) }
    })
    const body = { ...p, entries, ...over }
    return { ...body, manifestSha256: computeManifestSha256(body) }
  }
  const verifyForged = (f: OperatorReviewPacket) => verifyOperatorReviewPacket(f, f.manifestSha256)

  it("pins exactly the eight mandatory hold identities", () => {
    expect([...MANDATORY_PACKET_HOLD_IDS]).toEqual(MANDATORY)
    expect(PINNED_PACKET_HOLDS.map(h => h.id)).toEqual(MANDATORY)
    expect(Object.isFrozen(MANDATORY_PACKET_HOLD_IDS)).toBe(true)
  })

  it("injects every mandatory hold and binds the set into the manifest", () => {
    const r = request()
    r.holdIds = []
    const p = build(r)
    expect(p.mandatoryHoldIds).toEqual(MANDATORY)
    const holds = JSON.parse(p.entries.find(e => e.name === "holds.json")!.content)
    expect(holds.map((h: { id: string }) => h.id).slice(0, 8)).toEqual(MANDATORY)
    expect(verifyOperatorReviewPacket(p, p.manifestSha256)).toEqual({ valid: true, reasons: [] })
    const unbound = { ...p, mandatoryHoldIds: MANDATORY.slice(1) }
    expect(verifyOperatorReviewPacket(unbound, p.manifestSha256).reasons).toContain(
      "manifest_hash_mismatch"
    )
  })

  it("a caller cannot pass a mandatory id as an optional hold to restate it", () => {
    const r = request()
    r.holdIds = ["activation_dormant" as never]
    const out = buildOperatorReviewPacket(r, { clock: FIXED })
    expect(out.ok).toBe(false)
    if (!out.ok) expect(out.violations).toContain("request_invalid:holdIds[0]:unknown_hold_id")
  })

  it.each(MANDATORY)("a consistently re-hashed packet without %s is invalid", id => {
    const f = forge(build(), {}, hs => hs.filter(h => h.id !== id))
    const v = verifyForged(f)
    expect(v.valid).toBe(false)
    expect(v.reasons).toContain(`mandatory_hold_missing:${id}`)
  })

  it("a reworded mandatory hold is invalid", () => {
    const f = forge(build(), {}, hs =>
      hs.map(h => (h.id === "activation_dormant" ? { ...h, reason: "Activation is fine." } : h))
    )
    expect(verifyForged(f).reasons).toContain("mandatory_hold_altered:activation_dormant")
  })

  it("a shrunken mandatory id list is invalid even when re-hashed", () => {
    const f = forge(build(), { mandatoryHoldIds: MANDATORY.slice(0, 5) })
    expect(verifyForged(f).reasons).toContain("mandatory_hold_set_mismatch")
  })

  it("a packet with no holds entry, or an unparseable one, is invalid", () => {
    const p = build()
    const noHolds = { ...p, entries: p.entries.filter(e => e.name !== "holds.json") }
    const f1 = { ...noHolds, manifestSha256: computeManifestSha256(noHolds) }
    expect(verifyForged(f1).reasons).toContain("holds_entry_missing")
    const f2 = forge(p, {}, () => "not holds")
    expect(verifyForged(f2).reasons).toContain("holds_entry_malformed")
  })

  it("R4: a builtAt that is not a canonical real timestamp is invalid", () => {
    for (const builtAt of ["2026-02-30T15:00:00.000Z", "2026-09-26T15:00:00+00:00"]) {
      expect(verifyForged(forge(build(), { builtAt })).reasons).toContain("malformed_built_at")
    }
  })
})

const sha256Hex = (c: string) => crypto.createHash("sha256").update(c).digest("hex")
type Loose = Record<string, unknown>
type LooseEntry = { name: string; sha256: string; bytes: number; content: string }
/** A forger who edits anything, then re-hashes every entry and the manifest consistently. */
const rehash = (p: Loose): OperatorReviewPacket => {
  const entries = (p.entries as LooseEntry[]).map(e => ({
    ...e,
    sha256: sha256Hex(e.content),
    bytes: Buffer.byteLength(e.content),
  }))
  const body = { ...p, entries } as unknown as OperatorReviewPacket
  return { ...body, manifestSha256: computeManifestSha256(body) }
}
const verdictOf = (f: OperatorReviewPacket) => verifyOperatorReviewPacket(f, f.manifestSha256)
const ENTRY_NAMES = [
  "provenance.json",
  "classification.json",
  "compatibility.json",
  "non-official-artifacts.json",
  "tests.json",
  "holds.json",
]
const PII_MARKS = ["Jane", "3125550142", "312:555:0142", "312_555_0142", "jane@example.com"]

describe("B1 the verifier requires the complete, exact packet contract", () => {
  it("pins the six entry names in order", () => {
    expect([...OPERATOR_PACKET_ENTRY_NAMES]).toEqual(ENTRY_NAMES)
    expect(build().entries.map(e => e.name)).toEqual(ENTRY_NAMES)
  })

  it("the reviewed counterexample — only holds.json, attacker version, non-SHA — is invalid", () => {
    const p = build()
    const f = rehash({
      ...p,
      version: "attacker-version",
      candidateSha: "not-a-sha",
      entries: p.entries.filter(e => e.name === "holds.json"),
    })
    const v = verdictOf(f)
    expect(v.valid).toBe(false)
    expect(v.reasons).toEqual(
      expect.arrayContaining([
        "packet_version_mismatch",
        "malformed_candidate_sha",
        ...ENTRY_NAMES.slice(0, 5).map(n => `entry_missing:${n}`),
      ])
    )
  })

  it.each(ENTRY_NAMES)("a re-hashed packet without %s is invalid", name => {
    const p = build()
    const v = verdictOf(rehash({ ...p, entries: p.entries.filter(e => e.name !== name) }))
    expect(v.valid).toBe(false)
    expect(v.reasons).toContain(`entry_missing:${name}`)
  })

  it.each(ENTRY_NAMES)("a re-hashed packet with %s twice is invalid", name => {
    const p = build()
    const extra = p.entries.find(e => e.name === name)!
    const v = verdictOf(rehash({ ...p, entries: [...p.entries, extra] }))
    expect(v.valid).toBe(false)
    expect(v.reasons).toContain(`entry_duplicate:${name}`)
  })

  it("an unknown entry is invalid and neither its name nor its body is echoed", () => {
    const p = build()
    const content = canonicalJson("call Jane 3125550142")
    const v = verdictOf(
      rehash({
        ...p,
        entries: [...p.entries, { name: "Jane-3125550142.json", sha256: "", bytes: 0, content }],
      })
    )
    expect(v.valid).toBe(false)
    expect(v.reasons).toContain("entry_unknown:6")
    for (const m of PII_MARKS) expect(JSON.stringify(v)).not.toContain(m)
  })

  it("entries out of order are invalid", () => {
    const p = build()
    const v = verdictOf(rehash({ ...p, entries: [...p.entries].reverse() }))
    expect(v.valid).toBe(false)
    expect(v.reasons).toContain("entry_order_mismatch")
  })

  it.each(["attacker-version", "", `${OPERATOR_PACKET_VERSION} `, "cc05-2026-09-26.2"])(
    "version %j is invalid",
    version => {
      const v = verdictOf(rehash({ ...build(), version }))
      expect(v.valid).toBe(false)
      expect(v.reasons).toContain("packet_version_mismatch")
    }
  )

  it.each([
    "not-a-sha",
    CANDIDATE.toUpperCase(),
    CANDIDATE.slice(1),
    `${CANDIDATE}0`,
    ` ${CANDIDATE}`,
    "g".repeat(40),
    "0".repeat(64),
  ])("candidate SHA %j is invalid", candidateSha => {
    const v = verdictOf(rehash({ ...build(), candidateSha }))
    expect(v.valid).toBe(false)
    expect(v.reasons).toContain("malformed_candidate_sha")
  })

  it.each(ENTRY_NAMES)("unparseable %s is invalid", name => {
    const p = build()
    const entries = p.entries.map(e => (e.name === name ? { ...e, content: "{" } : e))
    const v = verdictOf(rehash({ ...p, entries }))
    expect(v.valid).toBe(false)
    expect(v.reasons).toContain(`entry_malformed_json:${name}`)
  })

  it.each(ENTRY_NAMES)("non-canonical bytes for %s are invalid", name => {
    const p = build()
    const entries = p.entries.map(e =>
      e.name === name ? { ...e, content: JSON.stringify(JSON.parse(e.content), null, 1) } : e
    )
    const v = verdictOf(rehash({ ...p, entries }))
    expect(v.valid).toBe(false)
    expect(v.reasons).toContain(`entry_noncanonical:${name}`)
  })

  it("reordered keys are non-canonical", () => {
    const p = build()
    const entries = p.entries.map(e => {
      if (e.name !== "tests.json") return e
      const [t] = JSON.parse(e.content)
      const reversed = Object.fromEntries(Object.entries(t).reverse())
      return { ...e, content: JSON.stringify([reversed]) }
    })
    expect(verdictOf(rehash({ ...p, entries })).reasons).toContain("entry_noncanonical:tests.json")
  })

  // Canonical, re-hashed, but outside the entry's closed schema.
  const SCHEMA_MUTATIONS: [string, string, (body: unknown) => unknown][] = [
    ["provenance.json", "consistent flipped", b => ({ ...(b as Loose), consistent: false })],
    ["provenance.json", "free text added", b => ({ ...(b as Loose), note: "Jane 3125550142" })],
    ["classification.json", "shippable true", b => [{ ...(b as Loose[])[0], shippable: true }]],
    ["classification.json", "unknown key", b => [{ ...(b as Loose[])[0], note: "Jane" }]],
    [
      "classification.json",
      "free-text reason",
      b => [{ ...(b as Loose[])[0], reasons: ["call 3125550142"] }],
    ],
    [
      "classification.json",
      "class upgraded",
      b => [{ ...(b as Loose[])[0], sourceClass: "official_current" }],
    ],
    ["classification.json", "null element", () => [null]],
    [
      "compatibility.json",
      "compatible with reasons",
      b => [{ ...(b as Loose[])[0], compatible: true }],
    ],
    [
      "compatibility.json",
      "generation authorized",
      b => [{ ...(b as Loose[])[0], generationAuthorized: true }],
    ],
    [
      "compatibility.json",
      "field name in a reason",
      b => [{ ...(b as Loose[])[0], reasons: ["unexpected_field:Jane Doe"] }],
    ],
    [
      "compatibility.json",
      "unknown reason",
      b => [{ ...(b as Loose[])[0], reasons: ["no_bound_mapping", "jane_3125550142"] }],
    ],
    ["compatibility.json", "null element", () => [null]],
    [
      "non-official-artifacts.json",
      "officialForm true",
      b => [{ ...(b as Loose[])[0], officialForm: true }],
    ],
    [
      "non-official-artifacts.json",
      "markers present",
      b => [{ ...(b as Loose[])[0], officialMarkers: ["court_caption"] }],
    ],
    [
      "non-official-artifacts.json",
      "body smuggled",
      b => [{ ...(b as Loose[])[0], text: "Jane Doe, Cook County" }],
    ],
    [
      "non-official-artifacts.json",
      "index out of place",
      b => [{ ...(b as Loose[])[0], index: 5 }],
    ],
    ["non-official-artifacts.json", "null element", () => [null]],
    [
      "tests.json",
      "command text replaced",
      b => [{ ...(b as Loose[])[0], command: "jest 312_555_0142" }],
    ],
    ["tests.json", "unknown test id", b => [{ ...(b as Loose[])[0], testId: "jane_3125550142" }]],
    ["tests.json", "unknown key", b => [{ ...(b as Loose[])[0], note: "Jane" }]],
    ["tests.json", "duplicate test id", b => [(b as Loose[])[0], (b as Loose[])[0]]],
    ["tests.json", "null element", () => [null]],
    [
      "holds.json",
      "free-text hold added",
      b => [...(b as Loose[]), { id: "call_me", owner: "Jane", reason: "Call 312:555:0142" }],
    ],
    [
      "holds.json",
      "optional hold reworded",
      b => [...(b as Loose[]).slice(0, 8), { ...OPTIONAL_PACKET_HOLDS[1], reason: "Fine." }],
    ],
    ["holds.json", "optional hold twice", b => [...(b as Loose[]), (b as Loose[])[8]]],
    ["holds.json", "null element", b => [...(b as Loose[]), null]],
  ]
  it.each(SCHEMA_MUTATIONS)("%s: %s is invalid, without echo", (name, _what, mutate) => {
    const p = build()
    const entries = p.entries.map(e =>
      e.name === name ? { ...e, content: canonicalJson(mutate(JSON.parse(e.content))) } : e
    )
    const v = verdictOf(rehash({ ...p, entries }))
    expect(v.valid).toBe(false)
    expect(v.reasons.some(r => r.startsWith(`entry_schema_invalid:${name}`))).toBe(true)
    for (const m of PII_MARKS) expect(JSON.stringify(v)).not.toContain(m)
  })

  it("an unbound top-level field is invalid", () => {
    const v = verdictOf(rehash({ ...build(), note: "call Jane 3125550142" }))
    expect(v.valid).toBe(false)
    expect(v.reasons).toContain("packet_invalid:packet:unknown_key")
    for (const m of PII_MARKS) expect(JSON.stringify(v)).not.toContain(m)
  })

  it.each([
    ["null", null],
    ["string", "packet"],
    ["array", []],
    ["entries not an array", { ...build(), entries: "x" }],
    ["entry not an object", { ...build(), entries: [1, 2, 3, 4, 5, 6] }],
    ["missing field", Object.fromEntries(Object.entries(build()).filter(([k]) => k !== "builtAt"))],
  ])("a structurally broken packet (%s) is invalid and does not throw", (_n, packet) => {
    const v = verifyOperatorReviewPacket(packet as never, "0".repeat(64))
    expect(v.valid).toBe(false)
    expect(v.reasons.some(r => r.startsWith("packet_invalid:"))).toBe(true)
  })

  it("a built packet still verifies", () => {
    const p = build()
    expect(verifyOperatorReviewPacket(p, p.manifestSha256)).toEqual({ valid: true, reasons: [] })
  })
})

describe("B2 test results carry a closed testId, never caller command text", () => {
  const PAYLOADS = [
    "--customer=jane-doe --address=123-main-street",
    "Jane Doe",
    "jane-doe",
    "123 Main Street",
    "312_555_0142",
    "312:555:0142",
    "jane.doe@example.com",
    "jane@example",
    "31255501420000",
    "12345678901234567890",
  ]
  const TEST = { status: "PASS" as const, passed: 1, failed: 0, skipped: 0 }
  const withTests = (tests: unknown[]) => ({ ...request(), tests }) as unknown as PacketRequest

  it.each([
    "jest --customer=jane-doe --address=123-main-street",
    "jest 312_555_0142",
    "jest 312:555:0142",
    "jest __tests__/lib/forms/form-stack",
  ])("the reviewed command %j is refused — commands are no longer accepted", command => {
    const out = buildOperatorReviewPacket(withTests([{ command, ...TEST }]), { clock: FIXED })
    expect(out.ok).toBe(false)
    if (!out.ok) expect(out.violations).toContain("request_invalid:tests[0]:unknown_key")
    expect(JSON.stringify(out)).not.toContain(command)
  })

  it.each(PAYLOADS)("%j as a testId is refused, unechoed", payload => {
    const out = buildOperatorReviewPacket(withTests([{ testId: payload, ...TEST }]), {
      clock: FIXED,
    })
    expect(out.ok).toBe(false)
    if (!out.ok)
      expect(out.violations).toContain("request_invalid:tests[0].testId:not_in_vocabulary")
    expect(JSON.stringify(out)).not.toContain(payload)
  })

  it("every catalog testId renders only its pinned command", () => {
    const ids = Object.keys(PACKET_TEST_CATALOG) as (keyof typeof PACKET_TEST_CATALOG)[]
    expect(ids.length).toBeGreaterThan(0)
    for (const testId of ids) {
      const out = buildOperatorReviewPacket(withTests([{ testId, ...TEST }]), { clock: FIXED })
      if (!out.ok) throw new Error(out.violations.join(","))
      const tests = JSON.parse(out.packet.entries.find(e => e.name === "tests.json")!.content)
      expect(tests).toEqual([{ testId, command: PACKET_TEST_CATALOG[testId], ...TEST }])
    }
  })

  it("a testId may be reported once", () => {
    const t = { testId: "typescript", ...TEST }
    const out = buildOperatorReviewPacket(withTests([t, t]), { clock: FIXED })
    expect(out.ok).toBe(false)
    if (!out.ok) expect(out.violations).toContain("request_invalid:tests:duplicate_test_id")
  })

  // Every place a caller can put a string. Refused or digested — never copied.
  const SITES: [string, (r: Loose, payload: string) => void][] = [
    ["testId", (r, x) => ((r.tests as Loose[])[0].testId = x)],
    ["command key", (r, x) => ((r.tests as Loose[])[0].command = x)],
    ["extra test key", (r, x) => ((r.tests as Loose[])[0].note = x)],
    ["holdIds", (r, x) => (r.holdIds = [x])],
    ["candidateSha", (r, x) => (r.candidateSha = x)],
    ["classification formId", (r, x) => ((r.classificationQueries as Loose[])[0].formId = x)],
    ["mappingId", (r, x) => ((r.compatibilityQueries as Loose[])[0].mappingId = x)],
    [
      "artifact path",
      (r, x) => (((r.compatibilityQueries as Loose[])[0].artifact as Loose).path = x),
    ],
    [
      "field inventory",
      (r, x) => (((r.compatibilityQueries as Loose[])[0].artifact as Loose).fieldInventory = [x]),
    ],
    [
      "summary value",
      (r, x) => (((r.nonOfficialInputs as Loose[])[0].summary as Loose[])[0].value = x),
    ],
    ["extra request key", (r, x) => (r.note = x)],
  ]
  it.each(SITES)("no payload placed in %s reaches the packet or its violations", (_site, put) => {
    const base = () =>
      ({ ...request(), tests: [{ testId: "form_stack_focused", ...TEST }] }) as unknown as Loose
    // Matched control: the same request without the payload builds.
    expect(buildOperatorReviewPacket(base() as unknown as PacketRequest, { clock: FIXED }).ok).toBe(
      true
    )
    for (const payload of PAYLOADS) {
      const r = base()
      put(r, payload)
      const out = buildOperatorReviewPacket(r as unknown as PacketRequest, { clock: FIXED })
      expect([payload, JSON.stringify(out).includes(payload)]).toEqual([payload, false])
    }
  })
})

describe("B3 sparse lists and inherited fields are refused", () => {
  const sparse = (len: number, ...set: [number, unknown][]) => {
    const a: unknown[] = new Array(len)
    for (const [i, v] of set) a[i] = v
    return a
  }
  const at = (r: Loose, dotted: string): Loose =>
    dotted
      .split(".")
      .reduce((o: Loose, k) => (/^\d+$/.test(k) ? (o as never)[k] : o[k]) as Loose, r)
  const LISTS: [string, string, string][] = [
    ["classificationQueries", "", "classificationQueries"],
    ["compatibilityQueries", "", "compatibilityQueries"],
    ["nonOfficialInputs", "", "nonOfficialInputs"],
    ["tests", "", "tests"],
    ["holdIds", "", "holdIds"],
    [
      "fieldInventory",
      "compatibilityQueries.0.artifact",
      "compatibilityQueries[0].artifact.fieldInventory",
    ],
    ["summary", "nonOfficialInputs.0", "nonOfficialInputs[0].summary"],
    ["checklist", "nonOfficialInputs.0", "nonOfficialInputs[0].checklist"],
    ["guidance", "nonOfficialInputs.0", "nonOfficialInputs[0].guidance"],
  ]
  const run = (r: Loose) =>
    buildOperatorReviewPacket(r as unknown as PacketRequest, { clock: FIXED })

  it("the reviewed counterexample — new Array(1) for classification and tests — is refused", () => {
    const r = request() as unknown as Loose
    r.classificationQueries = new Array(1)
    r.tests = new Array(1)
    const out = run(r)
    expect(out.ok).toBe(false)
    if (!out.ok)
      expect(out.violations).toEqual(
        expect.arrayContaining([
          "request_invalid:classificationQueries[0]:hole",
          "request_invalid:tests[0]:hole",
        ])
      )
  })

  it.each(LISTS)("a hole in %s is refused, value-free", (key, parent, p) => {
    for (const make of [
      () => sparse(1),
      (first: unknown) => sparse(2, [0, first]),
      (first: unknown) => sparse(3, [0, first], [2, first]),
    ]) {
      const r = request() as unknown as Loose
      const holder = parent ? at(r, parent) : r
      const first = (holder[key] as unknown[])[0]
      holder[key] = make(first)
      const out = run(r)
      expect(out.ok).toBe(false)
      if (!out.ok)
        expect(
          out.violations.some(v => v.startsWith(`request_invalid:${p}[`) && v.endsWith(":hole"))
        ).toBe(true)
    }
  })

  it("a huge sparse list is refused without walking it", () => {
    const r = request() as unknown as Loose
    r.tests = new Array(4_000_000_000)
    const out = run(r)
    expect(out.ok).toBe(false)
    if (!out.ok) expect(out.violations).toContain("request_invalid:tests:too_long")
  })

  const OBJECTS: [string, (r: Loose) => Loose, string][] = [
    ["request", r => r, "request"],
    [
      "classification query",
      r => (r.classificationQueries as Loose[])[0],
      "classificationQueries[0]",
    ],
    ["compatibility query", r => (r.compatibilityQueries as Loose[])[0], "compatibilityQueries[0]"],
    [
      "artifact",
      r => (r.compatibilityQueries as Loose[])[0].artifact as Loose,
      "compatibilityQueries[0].artifact",
    ],
    ["test result", r => (r.tests as Loose[])[0], "tests[0]"],
    ["non-official input", r => (r.nonOfficialInputs as Loose[])[0], "nonOfficialInputs[0]"],
    [
      "summary item",
      r => ((r.nonOfficialInputs as Loose[])[0].summary as Loose[])[0],
      "nonOfficialInputs[0].summary[0]",
    ],
    [
      "checklist item",
      r => ((r.nonOfficialInputs as Loose[])[0].checklist as Loose[])[0],
      "nonOfficialInputs[0].checklist[0]",
    ],
  ]

  it.each(OBJECTS)("every field of a %s must be its own, not Object.prototype's", (_n, pick, p) => {
    const r = request() as unknown as Loose
    const obj = pick(r)
    const key = Object.keys(obj)[0]
    const value = obj[key]
    delete obj[key]
    const proto = Object.prototype as Loose
    let out: ReturnType<typeof run>
    proto[key] = value
    try {
      out = run(r)
    } finally {
      delete proto[key]
    }
    expect(out.ok).toBe(false)
    // Top-level fields keep the existing `request_invalid:<field>:` form.
    const field = p === "request" ? key : `${p}.${key}`
    if (!out.ok) expect(out.violations).toContain(`request_invalid:${field}:missing`)
  })

  it.each(OBJECTS)(
    "a %s inheriting every field from a custom prototype is refused",
    (_n, pick, p) => {
      const r = request() as unknown as Loose
      const obj = pick(r)
      const heir = Object.create({ ...obj })
      const out =
        obj === r
          ? run(heir)
          : (() => {
              // Swap the object for its heir wherever it sits in the request.
              const swap = (node: unknown): unknown =>
                node === obj
                  ? heir
                  : Array.isArray(node)
                    ? node.map(swap)
                    : node && typeof node === "object"
                      ? Object.fromEntries(Object.entries(node).map(([k, v]) => [k, swap(v)]))
                      : node
              return run(swap(r) as Loose)
            })()
      expect(out.ok).toBe(false)
      if (!out.ok) expect(out.violations).toContain(`request_invalid:${p}:not_object`)
    }
  )

  it("a getter is refused and never invoked", () => {
    const r = request() as unknown as Loose
    let calls = 0
    Object.defineProperty((r.tests as Loose[])[0], "status", {
      enumerable: true,
      get: () => {
        calls++
        return "PASS"
      },
    })
    const out = run(r)
    expect(out.ok).toBe(false)
    if (!out.ok) expect(out.violations).toContain("request_invalid:tests[0].status:accessor")
    expect(calls).toBe(0)
  })

  it("an array carrying a non-index own property is refused", () => {
    const r = request() as unknown as Loose
    const ids = ["banner_copy_owner_review"] as unknown as Loose
    ids.note = "Jane 3125550142"
    r.holdIds = ids
    const out = run(r)
    expect(out.ok).toBe(false)
    if (!out.ok) expect(out.violations).toContain("request_invalid:holdIds:unknown_key")
    expect(JSON.stringify(out)).not.toContain("Jane")
  })

  it("Date, Map and class instances are not data objects", () => {
    for (const odd of [new Date(0), new Map(), new (class Q {})()]) {
      const r = request() as unknown as Loose
      ;(r.tests as unknown[])[0] = odd
      const out = run(r)
      expect(out.ok).toBe(false)
      if (!out.ok) expect(out.violations).toContain("request_invalid:tests[0]:not_object")
    }
  })

  it("null-prototype data objects are accepted and build the identical packet", () => {
    const nullProto = (node: unknown): unknown =>
      Array.isArray(node)
        ? node.map(nullProto)
        : node && typeof node === "object"
          ? Object.assign(
              Object.create(null),
              Object.fromEntries(Object.entries(node).map(([k, v]) => [k, nullProto(v)]))
            )
          : node
    const out = run(nullProto(request()) as Loose)
    if (!out.ok) throw new Error(out.violations.join(","))
    expect(out.packet.manifestSha256).toBe(build().manifestSha256)
  })

  it("the verifier refuses a sparse entries list and an inherited entry", () => {
    const p = build()
    const holey = sparse(6, ...p.entries.slice(1).map((e, i) => [i + 1, e] as [number, unknown]))
    const v1 = verifyOperatorReviewPacket({ ...p, entries: holey } as never, p.manifestSha256)
    expect(v1.valid).toBe(false)
    expect(v1.reasons).toContain("packet_invalid:entries[0]:hole")
    const inherited = [Object.create(p.entries[0]), ...p.entries.slice(1)]
    const v2 = verifyOperatorReviewPacket({ ...p, entries: inherited } as never, p.manifestSha256)
    expect(v2.valid).toBe(false)
    expect(v2.reasons).toContain("packet_invalid:entries[0]:not_object")
  })
})

/** Rewrite one entry's parsed body, re-canonicalize, then re-hash everything. */
const forgeEntry = (name: string, mutate: (body: unknown) => unknown, p = build()) =>
  rehash({
    ...p,
    entries: p.entries.map(e =>
      e.name === name ? { ...e, content: canonicalJson(mutate(JSON.parse(e.content))) } : e
    ),
  })
const FREE_TEXT_MARKS = ["Jane", "Maple", "3125550142", "jane_doe"]

describe("X2 a forged classification reason must come from the closed catalog", () => {
  const asUnknown = (reasons: unknown[]) => (b: unknown) => [
    { ...(b as Loose[])[0], sourceClass: "unknown", receiptId: null, reasons },
  ]

  it("matched control: a re-hashed unknown classification with a catalog reason verifies", () => {
    const v = verdictOf(forgeEntry("classification.json", asUnknown(["unknown_artifact_hash"])))
    expect(v).toEqual({ valid: true, reasons: [] })
  })

  it.each([
    "Jane Doe 42 Maple St 3125550142",
    "unknown_artifact_hash Jane",
    " unknown_artifact_hash",
    "UNKNOWN_ARTIFACT_HASH",
    "main_catalog_identity_unsupported:jane_doe",
    "constructor",
    "__proto__",
    "toString",
    "",
  ])("reason %j is refused and never echoed", reason => {
    const f = forgeEntry("classification.json", asUnknown([reason]))
    const v = verdictOf(f)
    expect(v.valid).toBe(false)
    expect(v.reasons).toContain(
      "entry_schema_invalid:classification.json:[0].reasons[0]:not_in_vocabulary"
    )
    for (const m of FREE_TEXT_MARKS) expect(JSON.stringify(v)).not.toContain(m)
  })

  it("a free-text reason beside a catalog reason is refused", () => {
    const v = verdictOf(
      forgeEntry(
        "classification.json",
        asUnknown(["unknown_artifact_hash", "Jane Doe 42 Maple St 3125550142"])
      )
    )
    expect(v.valid).toBe(false)
    expect(v.reasons).toContain(
      "entry_schema_invalid:classification.json:[0].reasons[1]:not_in_vocabulary"
    )
  })
})

const failingRequest = (): PacketRequest => ({
  ...request(),
  tests: [{ testId: "form_stack_focused", status: "FAIL", passed: 0, failed: 9, skipped: 0 }],
})
const testsOf = (p: OperatorReviewPacket) =>
  JSON.parse(p.entries.find(e => e.name === "tests.json")!.content)
const FAIL_0_9 = {
  testId: "form_stack_focused",
  command: PACKET_TEST_CATALOG.form_stack_focused,
  status: "FAIL",
  passed: 0,
  failed: 9,
  skipped: 0,
}

/**
 * A data object whose FIRST own-descriptor read of each key yields `first` and
 * every later read — or any ordinary `get` — yields `later`. A reader that
 * reads once and builds from its copy sees only `first`; `get` is counted.
 */
const doubleRead = (first: Loose, later: Loose) => {
  const reads: Record<string, number> = {}
  let gets = 0
  const proxy = new Proxy(
    { ...first },
    {
      get: (t, k) => {
        gets++
        return typeof k === "string" && k in later ? later[k] : Reflect.get(t, k)
      },
      getOwnPropertyDescriptor: (t, k) => {
        const d = Reflect.getOwnPropertyDescriptor(t, k)
        if (!d || typeof k !== "string") return d
        reads[k] = (reads[k] ?? 0) + 1
        return { ...d, value: reads[k] === 1 ? first[k] : later[k] }
      },
    }
  )
  return { proxy, reads, gets: () => gets }
}

describe("X3 the emitted packet is bound to the validated snapshot", () => {
  it("a clock callback that rewrites the request after validation cannot change the packet", () => {
    const r = failingRequest()
    const out = buildOperatorReviewPacket(r, {
      clock: () => {
        Object.assign(r.tests[0], { status: "PASS", passed: 855, failed: 0 })
        r.tests.push({ testId: "typescript", status: "PASS", passed: 1, failed: 0, skipped: 0 })
        r.holdIds = []
        r.candidateSha = "f".repeat(40)
        r.classificationQueries[0].claimedClass = "official_successor_not_shippable"
        r.nonOfficialInputs[0].summary[0].value = "Jane Doe 3125550142"
        return FIXED()
      },
    })
    if (!out.ok) throw new Error(out.violations.join(","))
    expect(testsOf(out.packet)).toEqual([FAIL_0_9])
    expect(out.packet.candidateSha).toBe(CANDIDATE)
    expect(out.packet.manifestSha256).toBe(build(failingRequest()).manifestSha256)
    expect(JSON.stringify(out)).not.toContain("3125550142")
  })

  it("a double-read Proxy is read once per field and never through a getter", () => {
    const passing = {
      testId: "form_stack_focused",
      status: "PASS",
      passed: 855,
      failed: 0,
      skipped: 0,
    }
    const { testId, status, passed, failed, skipped } = FAIL_0_9
    const dr = doubleRead({ testId, status, passed, failed, skipped }, passing)
    const r = request() as unknown as Loose
    r.tests = [dr.proxy]
    const out = buildOperatorReviewPacket(r as unknown as PacketRequest, { clock: FIXED })
    if (!out.ok) throw new Error(out.violations.join(","))
    expect(testsOf(out.packet)).toEqual([FAIL_0_9])
    expect(dr.gets()).toBe(0)
    expect(dr.reads).toEqual({ testId: 1, status: 1, passed: 1, failed: 1, skipped: 1 })
    expect(out.packet.manifestSha256).toBe(build(failingRequest()).manifestSha256)
  })
})

describe("R1 a compatibility or classification verdict must agree with the mandatory holds", () => {
  const compat = (over: Loose) => (b: unknown) => [{ ...(b as Loose[])[0], ...over }]
  const CONTRADICTS_BINDING_HOLD =
    "entry_schema_invalid:compatibility.json:[0]:contradicts_hold:no_proven_field_map_binding"
  const CONTRADICTS_EVIDENCE_HOLD =
    "entry_schema_invalid:compatibility.json:[0]:contradicts_hold:no_official_current_evidence"

  it("the reviewed forgery — compatible, no reasons, official_current — is invalid", () => {
    const f = forgeEntry(
      "compatibility.json",
      compat({ compatible: true, reasons: [], sourceClass: "official_current" })
    )
    const v = verdictOf(f)
    expect(v.valid).toBe(false)
    expect(v.reasons).toEqual(
      expect.arrayContaining([CONTRADICTS_BINDING_HOLD, CONTRADICTS_EVIDENCE_HOLD])
    )
  })

  it.each([
    [
      "compatible, official_legacy",
      { compatible: true, reasons: [], sourceClass: "official_legacy" },
    ],
    ["compatible, unknown class", { compatible: true, reasons: [], sourceClass: "unknown" }],
    ["reachable-looking reason", { reasons: ["main_field_map_not_proven"] }],
    ["extra reason", { reasons: ["no_bound_mapping", "main_has_no_field_map"] }],
    ["reason twice", { reasons: ["no_bound_mapping", "no_bound_mapping"] }],
    ["other early reason", { reasons: ["ambiguous_mapping_binding"] }],
    [
      "digested field reason",
      { reasons: ["no_bound_mapping", `unexpected_field:field#${"0".repeat(16)}`] },
    ],
  ])("%s contradicts no_proven_field_map_binding", (_n, over) => {
    const v = verdictOf(forgeEntry("compatibility.json", compat(over)))
    expect(v.valid).toBe(false)
    expect(v.reasons).toContain(CONTRADICTS_BINDING_HOLD)
  })

  it("official_current with the one reachable result still contradicts no_official_current_evidence", () => {
    const v = verdictOf(
      forgeEntry("compatibility.json", compat({ sourceClass: "official_current" }))
    )
    expect(v.valid).toBe(false)
    expect(v.reasons).toContain(CONTRADICTS_EVIDENCE_HOLD)
    expect(v.reasons).not.toContain(CONTRADICTS_BINDING_HOLD)
  })

  it("an official_current classification contradicts no_official_current_evidence", () => {
    const v = verdictOf(
      forgeEntry("classification.json", b => [
        { ...(b as Loose[])[0], sourceClass: "official_current" },
      ])
    )
    expect(v.valid).toBe(false)
    expect(v.reasons).toContain(
      "entry_schema_invalid:classification.json:[0]:contradicts_hold:no_official_current_evidence"
    )
  })

  it.each([
    "official_legacy",
    "official_successor_not_shippable",
    "local_guidance_only",
    "unknown",
  ])(
    "matched control: %s with compatible false and exactly no_bound_mapping verifies",
    sourceClass => {
      const v = verdictOf(
        forgeEntry(
          "compatibility.json",
          compat({ compatible: false, reasons: ["no_bound_mapping"], sourceClass })
        )
      )
      expect(v).toEqual({ valid: true, reasons: [] })
    }
  )

  it("the holds the rule relies on are mandatory, and what they claim is still true", () => {
    expect(MANDATORY_PACKET_HOLD_IDS).toEqual(
      expect.arrayContaining(["no_official_current_evidence", "no_proven_field_map_binding"])
    )
    const p = build()
    const compatibility = JSON.parse(p.entries.find(e => e.name === "compatibility.json")!.content)
    expect(compatibility.map((c: Loose) => [c.compatible, c.reasons])).toEqual([
      [false, ["no_bound_mapping"]],
    ])
  })
})

describe("R2 a test status must agree with its counts", () => {
  type Row = [string, number, number, number]
  const INCONSISTENT: Row[] = [
    ["PASS", 1, 500, 0],
    ["PASS", 0, 0, 0],
    ["PASS", 0, 0, 7],
    ["PASS", 0, 3, 0],
    ["FAIL", 9, 0, 0],
    ["FAIL", 0, 0, 0],
    ["FAIL", 0, 0, 4],
    ["NOT_RUN", 900, 0, 0],
    ["NOT_RUN", 0, 1, 0],
    ["NOT_RUN", 5, 5, 0],
  ]
  const CONSISTENT: Row[] = [
    ["PASS", 1, 0, 0],
    ["PASS", 855, 0, 34],
    ["FAIL", 0, 9, 0],
    ["FAIL", 850, 5, 2],
    ["NOT_RUN", 0, 0, 0],
    ["NOT_RUN", 0, 0, 12],
  ]
  const row = ([status, passed, failed, skipped]: Row) => ({
    testId: "form_stack_focused",
    status,
    passed,
    failed,
    skipped,
  })
  const withTests = (tests: unknown[]) => ({ ...request(), tests }) as unknown as PacketRequest
  const INCONSISTENT_REQUEST = "request_invalid:tests[0]:status_counts_inconsistent"
  const INCONSISTENT_ENTRY = "entry_schema_invalid:tests.json:[0]:status_counts_inconsistent"

  it.each(INCONSISTENT)("the request %s passed=%d failed=%d skipped=%d is refused", (...r) => {
    const out = buildOperatorReviewPacket(withTests([row(r)]), { clock: FIXED })
    expect(out.ok).toBe(false)
    if (!out.ok) expect(out.violations).toContain(INCONSISTENT_REQUEST)
  })

  it.each(CONSISTENT)("the request %s passed=%d failed=%d skipped=%d builds", (...r) => {
    const out = buildOperatorReviewPacket(withTests([row(r)]), { clock: FIXED })
    if (!out.ok) throw new Error(out.violations.join(","))
    expect(testsOf(out.packet)).toEqual([
      { ...row(r), command: PACKET_TEST_CATALOG.form_stack_focused },
    ])
  })

  it.each(INCONSISTENT)("a re-hashed tests.json with %s %d/%d/%d is invalid", (...r) => {
    const v = verdictOf(forgeEntry("tests.json", b => [{ ...(b as Loose[])[0], ...row(r) }]))
    expect(v.valid).toBe(false)
    expect(v.reasons).toContain(INCONSISTENT_ENTRY)
  })

  it.each(CONSISTENT)(
    "matched control: a re-hashed tests.json with %s %d/%d/%d verifies",
    (...r) => {
      const v = verdictOf(forgeEntry("tests.json", b => [{ ...(b as Loose[])[0], ...row(r) }]))
      expect(v).toEqual({ valid: true, reasons: [] })
    }
  )

  it("the rule is judged on the one validated read, not a later one", () => {
    const good = doubleRead(row(["FAIL", 0, 9, 0]), row(["PASS", 1, 500, 0]))
    const ok = buildOperatorReviewPacket(withTests([good.proxy]), { clock: FIXED })
    if (!ok.ok) throw new Error(ok.violations.join(","))
    expect(testsOf(ok.packet)).toEqual([FAIL_0_9])
    expect(good.gets()).toBe(0)

    const bad = doubleRead(row(["PASS", 1, 500, 0]), row(["PASS", 1, 0, 0]))
    const refused = buildOperatorReviewPacket(withTests([bad.proxy]), { clock: FIXED })
    expect(refused.ok).toBe(false)
    if (!refused.ok) expect(refused.violations).toContain(INCONSISTENT_REQUEST)
    expect(bad.gets()).toBe(0)
  })

  it("a clock callback cannot make the emitted counts inconsistent", () => {
    const r = failingRequest()
    const out = buildOperatorReviewPacket(r, {
      clock: () => {
        Object.assign(r.tests[0], { status: "PASS", passed: 900, failed: 500 })
        return FIXED()
      },
    })
    if (!out.ok) throw new Error(out.violations.join(","))
    expect(testsOf(out.packet)).toEqual([FAIL_0_9])
  })

  it("counts stay integer, nonnegative and bounded alongside the rule", () => {
    for (const [field, bad] of [
      ["passed", -1],
      ["failed", 1.5],
      ["skipped", Number.NaN],
      ["passed", 1_000_001],
    ] as const) {
      const t = { ...row(["FAIL", 0, 9, 0]), [field]: bad }
      const out = buildOperatorReviewPacket(withTests([t]), { clock: FIXED })
      expect(out.ok).toBe(false)
      if (!out.ok)
        expect(out.violations).toContain(`request_invalid:tests[0].${field}:out_of_range`)
    }
  })
})

// Guards whose only killing case was also caught by a newer check (R1), or
// that no earlier test reached. Each case here fails if its one guard goes.
describe("load-bearing guards the R1 hold checks would otherwise mask", () => {
  const classification = (over: Loose) => (b: unknown) => [{ ...(b as Loose[])[0], ...over }]
  const at = (code: string) => `entry_schema_invalid:classification.json:[0]:${code}`

  it.each([
    ["official_legacy carrying a reason", { reasons: ["unknown_artifact_hash"] }],
    ["legacy receipt relabelled local_guidance_only", { sourceClass: "local_guidance_only" }],
    ["legacy receipt relabelled successor", { sourceClass: "official_successor_not_shippable" }],
  ])("classification: %s is not in the catalog", (_n, over) => {
    const v = verdictOf(forgeEntry("classification.json", classification(over)))
    expect(v.valid).toBe(false)
    expect(v.reasons).toContain(at("positive_class_not_in_catalog"))
  })

  it.each([
    ["unknown keeping a receipt", { sourceClass: "unknown", reasons: ["unknown_artifact_hash"] }],
    ["unknown with no reason", { sourceClass: "unknown", receiptId: null, reasons: [] }],
  ])("classification: %s is inconsistent", (_n, over) => {
    const v = verdictOf(forgeEntry("classification.json", classification(over)))
    expect(v.valid).toBe(false)
    expect(v.reasons).toContain(at("unknown_class_inconsistent"))
  })

  it("compatibility: compatible with the one reachable reason contradicts its reasons", () => {
    const v = verdictOf(
      forgeEntry("compatibility.json", b => [{ ...(b as Loose[])[0], compatible: true }])
    )
    expect(v.valid).toBe(false)
    expect(v.reasons).toContain(
      "entry_schema_invalid:compatibility.json:[0]:compatible_contradicts_reasons"
    )
  })

  it("an Array subclass instance is not a plain list", () => {
    class Sneaky extends Array {}
    const r = request() as unknown as Loose
    r.holdIds = Object.setPrototypeOf(["banner_copy_owner_review"], Sneaky.prototype)
    const out = buildOperatorReviewPacket(r as unknown as PacketRequest, { clock: FIXED })
    expect(out.ok).toBe(false)
    if (!out.ok) expect(out.violations).toContain("request_invalid:holdIds:not_array")
  })

  it("tests.json: a command under an unknown testId has no pin, so it is unpinned too", () => {
    const v = verdictOf(
      forgeEntry("tests.json", b => [{ ...(b as Loose[])[0], testId: "jane_3125550142" }])
    )
    expect(v.valid).toBe(false)
    expect(v.reasons).toEqual(
      expect.arrayContaining([
        "entry_schema_invalid:tests.json:[0].testId:not_in_vocabulary",
        "entry_schema_invalid:tests.json:[0].command:not_pinned_value",
      ])
    )
    expect(JSON.stringify(v)).not.toContain("3125550142")
  })

  it("statusMatchesCounts refuses non-number counts on its own", () => {
    expect(statusMatchesCounts({ status: "PASS", passed: "5", failed: 0 })).toBe(false)
    expect(statusMatchesCounts({ status: "FAIL", passed: 0, failed: "1" })).toBe(false)
    expect(statusMatchesCounts({ status: "PASS", passed: 5, failed: 0 })).toBe(true)
    expect(statusMatchesCounts({ status: "FAIL", passed: 0, failed: 1 })).toBe(true)
  })
})
