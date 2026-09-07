/**
 * @jest-environment node
 *
 * Offline secret-exposure regression — pure filesystem + `git`, NO database
 * access and NO reading of secret-bearing local `.env*` files. The tracked
 * `.env.example` template is intentionally scanned.
 *
 * Guards the two findings from the 2026-09-06 security re-audit:
 *
 *  1. (H2) A live-host PostgreSQL credential tracked in the working tree.
 *     Documentation — not env handling — was the leak vector: three Supabase
 *     connection strings carried a real password at `c237998`.
 *  2. (M2) `.gitignore` gaps that let an operator commit a real environment
 *     file. `.env.production`, `.env.development` and `.env.staging` were not
 *     ignored at `c237998`, while `.env.example` must stay trackable.
 *
 * A failure reports `path:line` ONLY. The matched value is never placed in an
 * assertion, a message, or a snapshot, so a failing run — in a terminal, in CI
 * logs, or in a screenshot pasted into a ticket — cannot re-leak the secret it
 * just caught.
 */
import { execFileSync, spawnSync } from "child_process"
import { readFileSync, statSync } from "fs"
import { basename, join } from "path"

const REPO_ROOT = join(__dirname, "..", "..")

/** Anything that looks like an environment file. Never opened by this test. */
const ENV_FILE = /(^|\/)\.env(\.|$)/

/** The one environment file that is allowed to be tracked and must not be ignored. */
const TRACKABLE_ENV_FILES = [".env.example"]

/** Unsafe variants an operator could plausibly create locally and commit by accident. */
const MUST_BE_IGNORED = [
  ".env",
  ".env.local",
  ".env.test",
  ".env.test.local",
  ".env.development",
  ".env.development.local",
  ".env.staging",
  ".env.staging.local",
  ".env.production",
  ".env.production.local",
]

/**
 * `postgres://user:password@host` — the password group is deliberately allowed
 * to be empty so that credential-free example URLs are recognised rather than
 * skipped by the matcher.
 */
const POSTGRES_URL = /postgres(?:ql)?:\/\/([^\s:@/"'`]+):([^\s@"'`]*)@([^\s/:"'`]+)/gi

/** `db.<ref>.supabase.co`, `aws-0-*.pooler.supabase.com`, `aws-0-*.supabase.com`. */
const SUPABASE_HOST = /(?:^|\.)(?:pooler\.)?supabase\.(?:co|com)$/i

/**
 * Allowlist, not a denylist: a password is safe only if it is recognisably a
 * placeholder. Anything unrecognised fails closed and is reported.
 */
const PLACEHOLDER_PASSWORD = new RegExp(
  [
    "^$", // postgres://user:@host — no credential present
    "^\\[[^\\]]*\\]$", // [YOUR-PASSWORD]
    "^<[^>]*>$", // <your-password>
    "^\\$\\{[^}]*\\}$", // ${DATABASE_PASSWORD}
    "^\\{\\{?[^{}]*\\}?\\}$", // {password} / {{password}}
    "^%[A-Za-z0-9_]+%$", // %DB_PASSWORD%
    "^(?:YOUR[-_]?)?(?:DB[-_]?|DATABASE[-_]?)?PASS(?:WORD)?$",
    "^(?:YOUR[-_]?)?SECRET$",
    "^(?:CHANGE[-_]?ME|PLACEHOLDER|REDACTED|EXAMPLE)$",
    "^[x*.…]+$", // xxxx / **** / ...
  ].join("|"),
  "i"
)

/** Skip anything too large to be hand-written documentation or source. */
const MAX_SCANNED_BYTES = 2 * 1024 * 1024

/** Binary sentinel, built at runtime so no NUL byte is ever stored in this source file. */
const NUL = String.fromCharCode(0)

const trackedFiles = (): string[] =>
  execFileSync("git", ["ls-files", "-z"], { cwd: REPO_ROOT, maxBuffer: 64 * 1024 * 1024 })
    .toString("utf8")
    .split(NUL)
    .filter(Boolean)

const isIgnored = (candidate: string): boolean =>
  spawnSync("git", ["check-ignore", "-q", "--no-index", "--", candidate], { cwd: REPO_ROOT })
    .status === 0

/**
 * Env files are never opened — with one exception. `.env.example` is committed
 * on purpose, so it is the one env file that MUST be scanned: a real credential
 * pasted into the template would otherwise ship completely unchecked.
 */
const isUnscannableEnvFile = (file: string): boolean =>
  ENV_FILE.test(file) && !TRACKABLE_ENV_FILES.includes(basename(file))

/** Returns file contents, or null when the file is oversized or unreadable. */
type TrackedFileReader = (file: string) => string | null

const readTrackedFile: TrackedFileReader = file => {
  try {
    if (statSync(join(REPO_ROOT, file)).size > MAX_SCANNED_BYTES) return null
    return readFileSync(join(REPO_ROOT, file), "utf8")
  } catch {
    return null
  }
}

/**
 * Returns `path:line` for every tracked line carrying a non-placeholder
 * password against a Supabase host. The value itself is discarded before it
 * can reach any caller.
 *
 * The file list and reader are injectable so the scanning boundary itself can
 * be tested without creating any real environment file on disk.
 */
const liveSupabaseCredentialSites = (
  files: string[] = trackedFiles(),
  read: TrackedFileReader = readTrackedFile
): string[] => {
  const sites: string[] = []

  for (const file of files) {
    if (isUnscannableEnvFile(file)) continue

    const contents = read(file)
    if (contents === null) continue
    if (contents.includes(NUL) || !/postgres/i.test(contents)) continue

    const lines = contents.split("\n")
    for (let index = 0; index < lines.length; index++) {
      POSTGRES_URL.lastIndex = 0
      let match: RegExpExecArray | null
      while ((match = POSTGRES_URL.exec(lines[index])) !== null) {
        const [, , password, host] = match
        if (!SUPABASE_HOST.test(host)) continue
        if (PLACEHOLDER_PASSWORD.test(password)) continue
        sites.push(`${file}:${index + 1}`)
      }
    }
  }

  return sites
}

describe("no tracked live credentials", () => {
  it("tracks no non-placeholder PostgreSQL password against a Supabase host", () => {
    // Reported as `path:line` only — never the matched value.
    expect(liveSupabaseCredentialSites()).toEqual([])
  })

  it("ignores every unsafe .env variant", () => {
    expect(MUST_BE_IGNORED.filter(candidate => !isIgnored(candidate))).toEqual([])
  })

  it("keeps the .env.example template trackable", () => {
    expect(TRACKABLE_ENV_FILES.filter(candidate => isIgnored(candidate))).toEqual([])
  })

  it("tracks no environment file other than the .env.example template", () => {
    const tracked = trackedFiles().filter(
      file => ENV_FILE.test(file) && !TRACKABLE_ENV_FILES.includes(basename(file))
    )
    expect(tracked).toEqual([])
  })
})

describe("environment-file scanning boundary", () => {
  /**
   * Assembled from per-line fragments. This file is itself a tracked file that
   * the scanner above walks, so a literal connection string here would make the
   * suite flag its own source. The scanner is line-based, so fragments split
   * across source lines can never recombine into a match.
   */
  const SYNTHETIC_LIVE_CREDENTIAL_URL = [
    "postgresql://postgres:",
    "s3cr3tNotAPlaceholder",
    "@db.example-ref.supabase",
    ".co:6543/postgres",
  ].join("")

  it("scans the committed .env.example template but never opens an unsafe env file", () => {
    const opened: string[] = []
    const read = (file: string) => {
      opened.push(file)
      return file === ".env.example" ? SYNTHETIC_LIVE_CREDENTIAL_URL : ""
    }

    const candidates = [".env.example", ".env", ".env.local", ".env.production", "README.md"]

    // `.env.example` is committed on purpose, so a credential pasted into the
    // template must be caught like any other tracked file.
    expect(liveSupabaseCredentialSites(candidates, read)).toEqual([".env.example:1"])
    expect(opened).toContain(".env.example")

    // Every other env variant stays unread, even if one were somehow tracked.
    expect(opened.filter(file => ENV_FILE.test(file) && file !== ".env.example")).toEqual([])
  })
})
