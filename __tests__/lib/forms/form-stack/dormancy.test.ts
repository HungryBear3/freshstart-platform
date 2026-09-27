/**
 * @jest-environment node
 *
 * CC-05 R9 — the form stack stays compiled off and unwired.
 *
 * Nothing outside `lib/forms/form-stack/` may import it, no form-stack module
 * reads the process environment, the trusted-receipt registry stays frozen and
 * empty, and every activation output is literal `false` in an evaluation no
 * caller can mutate — for every combination of receipts and flags.
 */
import fs from "node:fs"
import path from "node:path"

import {
  ACTIVATION_COMPILED_OFF,
  ACTIVATION_FLAG_NAMES,
  ACTIVATION_GATES,
  TRUSTED_RECEIPT_REGISTRY,
  evaluateActivation,
  receiptDigest,
  type GateReceipt,
} from "@/lib/forms/form-stack/activation-gates"
import { SOURCE_CATALOG, type ClassifiedSource } from "@/lib/forms/form-stack/source-classification"
import { getFormById } from "@/lib/forms/illinois-court-forms"

const ROOT = process.cwd()
const STACK_DIR = path.join(ROOT, "lib/forms/form-stack")
const SCAN_ROOTS = ["app", "lib", "components", "pages", "scripts", "middleware.ts", "hooks"]

function sourceFiles(p: string): string[] {
  const abs = path.join(ROOT, p)
  if (!fs.existsSync(abs)) return []
  if (fs.statSync(abs).isFile()) return /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(abs) ? [abs] : []
  return fs
    .readdirSync(abs)
    .flatMap(n => (n === "node_modules" || n.startsWith(".") ? [] : sourceFiles(path.join(p, n))))
}

describe("R9 unwired", () => {
  it("no production file outside the form stack imports it", () => {
    const importers = SCAN_ROOTS.flatMap(sourceFiles)
      .filter(f => !f.startsWith(STACK_DIR + path.sep))
      .filter(f => /form-stack/.test(fs.readFileSync(f, "utf8")))
      .map(f => path.relative(ROOT, f))
    expect(importers).toEqual([])
  })

  it("no form-stack module reads the environment, the network, storage or a database", () => {
    for (const f of sourceFiles("lib/forms/form-stack")) {
      const src = fs.readFileSync(f, "utf8")
      expect([path.basename(f), /process\.env/.test(src)]).toEqual([path.basename(f), false])
      expect(src).not.toMatch(
        /\bfetch\(|resend|nodemailer|sendEmail|@vercel\/blob|prisma|writeFile|from "node:(fs|http|https|net|child_process)"/
      )
    }
  })
})

describe("R9 compiled off, literally", () => {
  const PNC = getFormById("petition-no-children")!.provenance!
  const CURRENT: ClassifiedSource = {
    sha256: PNC.sha256,
    bytes: PNC.bytes,
    mediaType: "application/pdf",
    formId: "petition-no-children",
    sourceClass: "official_current",
    receiptId: "synthetic-evidence",
  }
  const SHA = "a".repeat(40)
  const MANIFEST = "e".repeat(64)
  const receipts = (): GateReceipt[] =>
    ACTIVATION_GATES.map(gate => ({
      gate,
      receiptId: `r-${gate}`,
      issuedBy: gate === "independent_exact_sha_review" ? "reviewer" : "owner",
      issuedOn: "2026-09-25",
      boundCommitSha: SHA,
      boundPacketManifestSha256: MANIFEST,
      evidenceArtifactSha256:
        gate === "authoritative_current_form_evidence" ? CURRENT.sha256 : null,
    }))

  it("the registry is frozen, empty and cannot be written", () => {
    expect(ACTIVATION_COMPILED_OFF).toBe(true)
    expect(Object.keys(TRUSTED_RECEIPT_REGISTRY)).toEqual([])
    expect(() => {
      ;(TRUSTED_RECEIPT_REGISTRY as Record<string, string>)["r-owner_approval"] = "x"
    }).toThrow(TypeError)
  })

  const envs: Record<string, string | undefined>[] = [
    {},
    ...ACTIVATION_FLAG_NAMES.flatMap(n => [{ [n]: "true" }, { [n]: "1" }, { [n]: "false" }]),
    Object.fromEntries(ACTIVATION_FLAG_NAMES.map(n => [n, "enabled"])),
  ]

  it.each(envs.map(e => [JSON.stringify(e), e]))(
    "every output is false and immutable (env %s, all receipts trusted)",
    (_n, env) => {
      const rs = receipts()
      const r = evaluateActivation(
        {
          subject: { commitSha: SHA, packetManifestSha256: MANIFEST, author: "author" },
          receipts: rs,
          env,
        },
        {
          clock: () => new Date("2026-09-26T12:00:00Z"),
          registry: Object.fromEntries(rs.map(x => [x.receiptId, receiptDigest(x)])),
          catalog: [...SOURCE_CATALOG, CURRENT],
        }
      )
      expect(r.state).not.toMatch(/^active/)
      for (const k of [
        "active",
        "generationEnabled",
        "deliveryEnabled",
        "routeEnabled",
        "terminalActivationReachable",
      ] as const) {
        expect(r[k]).toBe(false)
      }
      expect(Object.isFrozen(r)).toBe(true)
      expect(Object.isFrozen(r.gates)).toBe(true)
      expect(() => {
        ;(r as { active: boolean }).active = true
      }).toThrow(TypeError)
    }
  )
})
