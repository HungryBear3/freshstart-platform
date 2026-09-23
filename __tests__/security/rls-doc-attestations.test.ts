/**
 * @jest-environment node
 *
 * Offline RLS-documentation guard — pure filesystem + `git ls-files`. NO
 * database connection, NO network, NO reading of the production catalog.
 *
 * Guards the second half of the 2026-09-07 live-catalog review: the runbooks
 * around `prisma/enable_rls.sql` told an operator to paste the script into the
 * Supabase SQL Editor, and then attested to outcomes nobody had observed —
 * "33 security warnings resolved", "you should see 0 or significantly fewer
 * security concerns", "this satisfies the Supabase security scanner". None of
 * that was verified, and the controller catalog snapshot shows the script was
 * never applied to Production at all.
 *
 * Two distinct failures are pinned here:
 *
 *  1. **Live instruction.** Any tracked runbook that still tells an operator to
 *     run, apply, paste or open the retracted script.
 *  2. **Overclaimed attestation.** Any tracked text that asserts an outcome in
 *     the Supabase security-advisor UI, or asserts that RLS enforces per-user
 *     access for this application. It does not: Prisma connects as the table
 *     owner, and owners bypass RLS unless FORCE ROW LEVEL SECURITY is set.
 *
 * Failures report `path:line` and the claim's label — never a policy
 * expression and never a row count.
 */
import { execFileSync } from "child_process"
import { readFileSync, statSync } from "fs"
import { extname, join } from "path"

const REPO_ROOT = join(__dirname, "..", "..")

const RETRACTED_SCRIPT = "prisma/enable_rls.sql"

/**
 * Every tracked file that still names the retracted script must carry this
 * marker, so a future author cannot reintroduce it as live guidance without
 * first reading why it was withdrawn.
 */
const RETRACTION_MARKER = "RLS-SCRIPT-RETRACTED-2026-09-07"

const SCANNED_EXTENSIONS = [".sql", ".md"]

const MAX_SCANNED_BYTES = 2 * 1024 * 1024

/** Verbs that turn a mention of the script into an instruction to execute it. */
const RUN_VERB =
  /\b(?:run|runs|running|execute|executes|executing|apply|applies|applying|paste|pastes|pasting|copy|copies|open|opens)\b/i

/** A mention paired with a run verb is allowed only when it is being forbidden. */
const NEGATION =
  /\b(?:not|never|no longer|retracted|superseded|withdrawn|instead of)\b|don't|doesn't/i

/**
 * Claims the repository is not entitled to make. Each carries a label so a
 * failure names the defect rather than echoing the sentence.
 */
const BANNED_ATTESTATIONS: ReadonlyArray<{ label: string; pattern: RegExp }> = [
  {
    label: "asserts an observed count of security-advisor warnings",
    pattern:
      /\b(?:\d+|zero|no)\s+(?:remaining\s+)?(?:RLS|security)\s+(?:warnings|concerns|issues)\s+(?:resolved|remain|are\s+resolved)/i,
  },
  {
    label: "asserts the security-advisor warnings are or will be resolved",
    pattern:
      /security\s+warnings?\b[^.\n]{0,40}\b(?:should\s+now\s+be\s+|are\s+now\s+|now\s+)?resolved/i,
  },
  {
    label: "predicts what the security-advisor UI will display",
    pattern: /(?:0|zero)\s+or\s+significantly\s+fewer\s+security\s+concerns/i,
  },
  {
    label: "asserts the Supabase security scanner is satisfied",
    pattern: /satisf(?:y|ies|ied|ying)[^.\n]{0,40}\bsecurity\s+scanner/i,
  },
  {
    label: "asserts Supabase compliance was achieved",
    pattern: /Supabase\s+compliance[^.\n]{0,30}\bachieved/i,
  },
  {
    label: "asserts RLS enforces per-user access for this application",
    pattern: /enforced\s+at\s+(?:the\s+)?database\s+level/i,
  },
]

const NUL = String.fromCharCode(0)

const trackedFiles = (): string[] =>
  execFileSync("git", ["ls-files", "-z"], { cwd: REPO_ROOT, maxBuffer: 64 * 1024 * 1024 })
    .toString("utf8")
    .split(NUL)
    .filter(Boolean)

const scannableFiles = (): string[] =>
  trackedFiles().filter(file => SCANNED_EXTENSIONS.includes(extname(file).toLowerCase()))

const read = (file: string): string | null => {
  try {
    if (statSync(join(REPO_ROOT, file)).size > MAX_SCANNED_BYTES) return null
    return readFileSync(join(REPO_ROOT, file), "utf8")
  } catch {
    return null
  }
}

/** Strips `--` line comments and `/* *\/` blocks, leaving executable SQL only. */
const executableSql = (sql: string): string =>
  sql
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/--.*$/gm, "")
    .trim()

describe("retracted RLS script", () => {
  it("stays tracked, so the retraction notice cannot silently disappear", () => {
    expect(trackedFiles()).toContain(RETRACTED_SCRIPT)
  })

  it("contains no executable SQL", () => {
    // A tombstone, not a script: every remaining byte must be commentary.
    expect(executableSql(read(RETRACTED_SCRIPT) ?? "")).toBe("")
  })

  it("is named only by files that also carry the retraction marker", () => {
    const unmarked = scannableFiles().filter(file => {
      const contents = read(file)
      return (
        contents !== null &&
        contents.includes("enable_rls.sql") &&
        !contents.includes(RETRACTION_MARKER)
      )
    })
    expect(unmarked).toEqual([])
  })

  it("is never presented as something to run, apply, paste or open", () => {
    const sites: string[] = []
    for (const file of scannableFiles()) {
      const contents = read(file)
      if (contents === null || !contents.includes("enable_rls.sql")) continue
      contents.split("\n").forEach((line, index) => {
        if (!line.includes("enable_rls.sql")) return
        if (!RUN_VERB.test(line)) return
        if (NEGATION.test(line)) return
        sites.push(`${file}:${index + 1}`)
      })
    }
    expect(sites).toEqual([])
  })
})

describe("RLS attestations in tracked documentation", () => {
  it("states the Markdown SQL-fence scan boundary without claiming every Markdown byte", () => {
    for (const file of [RETRACTED_SCRIPT, "prisma/RLS_SETUP_GUIDE.md"]) {
      const contents = read(file) ?? ""
      expect(contents).not.toContain("any tracked `.sql` or `.md` file")
      expect(contents).toMatch(
        /tracked `\.sql` files and SQL-fenced blocks in tracked `\.md` files/i
      )
    }
  })

  it("claims no outcome in the Supabase security-advisor UI and no database-level user scoping", () => {
    const findings: string[] = []
    for (const file of scannableFiles()) {
      const contents = read(file)
      if (contents === null) continue
      contents.split("\n").forEach((line, index) => {
        for (const { label, pattern } of BANNED_ATTESTATIONS) {
          if (pattern.test(line)) findings.push(`${file}:${index + 1} — ${label}`)
        }
      })
    }
    expect(findings).toEqual([])
  })
})

describe("attestation detector", () => {
  const labelsFor = (line: string) =>
    BANNED_ATTESTATIONS.filter(({ pattern }) => pattern.test(line)).map(({ label }) => label)

  it("catches an observed-warning-count claim", () => {
    // One sentence can make two banned claims; both are reported.
    expect(labelsFor("- **33 security warnings resolved** by enabling RLS")).toEqual([
      "asserts an observed count of security-advisor warnings",
      "asserts the security-advisor warnings are or will be resolved",
    ])
  })

  it("catches a prediction about the advisor UI", () => {
    expect(labelsFor("You should see 0 or significantly fewer security concerns")).toEqual([
      "predicts what the security-advisor UI will display",
    ])
  })

  it("catches a scanner-satisfied claim", () => {
    expect(labelsFor("These policies satisfy Supabase security scanner requirements.")).toEqual([
      "asserts the Supabase security scanner is satisfied",
    ])
  })

  it("catches a database-level user-scoping claim", () => {
    expect(labelsFor("User-scoped data access enforced at database level")).toEqual([
      "asserts RLS enforces per-user access for this application",
    ])
  })

  it("permits an accurate, hedged statement about RLS being enabled", () => {
    expect(
      labelsFor("RLS is enabled on every public table; Prisma connects as owner and bypasses it.")
    ).toEqual([])
  })
})
