/**
 * CC-05 R3 — closed schemas for operator-review-packet metadata.
 *
 * The blocked packet scanned the whole request as one JSON string with four
 * regexes, so a separator-free phone number (`3125550142`) sailed through into
 * `holds.json`. A regex over free text cannot prove the absence of personal
 * data; a closed schema can. So every metadata field is checked on its own:
 *
 *   - identifiers come from a CLOSED vocabulary (main's catalog, the pinned
 *     supplemental catalog, main's field-map names, canonical county ids, the
 *     hold catalog, the test catalog) — nothing else is accepted, however it
 *     is spelled;
 *   - B2: a test result names its run by `testId` only. The command shown in
 *     the packet is pinned in `PACKET_TEST_CATALOG`; a caller can no longer
 *     supply command text at all, so no name, address or contact detail can
 *     ride in on one;
 *   - hashes, sizes, counts and enums are exact-shape and bounded;
 *   - the one field that is not a vocabulary (AcroForm field names) is
 *     restricted-charset, length-bounded, and refused on any run of seven or
 *     more digits or anything email-shaped — and the packet carries field
 *     names only as digests;
 *   - B3: every list must be dense and every field an own data property
 *     (`closed-schema.ts`); unknown keys are refused, so nothing rides along
 *     unchecked;
 *   - the builder uses the parsed COPY, never the caller's object.
 *
 * Violations are `request_invalid:<path>:<code>`. They NEVER contain the
 * offending value. Customer answers are not validated here beyond their
 * shape: they are rendered by PR-5 and appear in the packet only as a hash.
 *
 * No I/O.
 */
import { isCanonicalCountyId } from "@/lib/counties/county-iwo-workflow"
import { OFFICIAL_FIELD_MAP_BINDINGS } from "@/lib/forms/field-map-compatibility"
import {
  boundedInt,
  isBoolean,
  isString,
  leaf,
  list,
  matches,
  oneOf,
  shape,
  type Check,
  type Reader,
} from "@/lib/forms/form-stack/closed-schema"
import {
  PINNED_FIELD_MAP_BINDINGS,
  validateFieldInventory,
} from "@/lib/forms/form-stack/field-map-compatibility"
import type { PacketRequest } from "@/lib/forms/form-stack/operator-review-packet"
import { deepFreeze } from "@/lib/forms/form-stack/provenance-ledger"
import { SOURCE_CATALOG, SOURCE_CLASSES } from "@/lib/forms/form-stack/source-classification"
import { ILLINOIS_COURT_FORMS } from "@/lib/forms/illinois-court-forms"

/**
 * B2: the only test runs a packet can report, by id, with the command an
 * operator sees pinned here. Adding a run is a reviewed change to this table.
 */
export const PACKET_TEST_CATALOG = deepFreeze({
  form_stack_focused: "npm test -- __tests__/lib/forms/form-stack",
  full_repository: "npm test",
  typescript: "npm run type-check",
  diff_check: "git diff --check",
} as const)
export type PacketTestId = keyof typeof PACKET_TEST_CATALOG

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
const MEDIA_TYPES: readonly string[] = ["application/pdf", DOCX]
export const TEST_STATUSES: readonly string[] = ["PASS", "FAIL", "NOT_RUN"]
const ARTIFACT_DIRS: readonly string[] = ["private/official-forms", "public/forms"]

export const FORM_IDS: ReadonlySet<string> = new Set([
  ...ILLINOIS_COURT_FORMS.map(f => f.id),
  ...SOURCE_CATALOG.map(e => e.formId),
])
export const MAPPING_IDS: ReadonlySet<string> = new Set([
  ...OFFICIAL_FIELD_MAP_BINDINGS.map(b => b.mapName),
  ...ILLINOIS_COURT_FORMS.map(f => f.id),
  ...PINNED_FIELD_MAP_BINDINGS.map(b => b.mappingId),
])
const MAPPING_VERSIONS: ReadonlySet<string> = new Set([
  "unbound",
  ...PINNED_FIELD_MAP_BINDINGS.map(b => b.mappingVersion),
])
/** The only artifact paths a query may name: main's filenames in the two known dirs. */
const ARTIFACT_PATHS: ReadonlySet<string> = new Set(
  ILLINOIS_COURT_FORMS.flatMap(f => ARTIFACT_DIRS.map(d => `${d}/${f.filename}`))
)

export const SHA256 = /^[0-9a-f]{64}$/
export const COMMIT_SHA = /^[0-9a-f]{40}$/
const FIELD_NAME = /^[A-Za-z0-9 _.[\]()#-]{1,128}$/
/** Seven digits with any common separators between them. */
const DIGIT_RUN = /(?:\d[\s().+/-]*){7,}/
const EMAIL_LIKE = /[^\s@]+@[^\s@]+/
const MAX_BYTES = 100_000_000
export const MAX_COUNT = 1_000_000
export const MAX_LIST = 50
const MAX_INVENTORY = 5000
/** Mirrors PR-5's per-list item limit; the renderer refuses more as well. */
export const MAX_NON_OFFICIAL_ITEMS = 60

export function looksLikePersonalData(text: string): boolean {
  return DIGIT_RUN.test(text) || EMAIL_LIKE.test(text)
}

const sha256: Check = matches(SHA256, "malformed_sha256")
const county: Check = v => (isCanonicalCountyId(v) ? null : "not_in_vocabulary")

/** Dense list of strings, then one value-free code for the inventory as a whole. */
const fieldInventory: Reader = (v, path, report) => {
  const names = list(leaf(isString), MAX_INVENTORY)(v, path, report)
  if (names === null || names.some(n => typeof n !== "string")) return names
  const code =
    validateFieldInventory(names as string[]).length > 0
      ? "invalid_inventory"
      : (names as string[]).some(f => !FIELD_NAME.test(f))
        ? "pattern"
        : (names as string[]).some(looksLikePersonalData)
          ? "personal_data_shape"
          : null
  if (code) report(path, code)
  return names
}

const CLASSIFICATION = shape({
  sha256: leaf(sha256),
  bytes: leaf(boundedInt(1, MAX_BYTES)),
  mediaType: leaf(oneOf(MEDIA_TYPES)),
  formId: leaf(oneOf(FORM_IDS)),
  claimedClass: { read: leaf(oneOf(SOURCE_CLASSES)), optional: true },
})
const COMPATIBILITY = shape({
  mappingId: leaf(oneOf(MAPPING_IDS)),
  mappingVersion: leaf(oneOf(MAPPING_VERSIONS)),
  countyId: leaf(county),
  artifact: shape({
    formId: leaf(oneOf(FORM_IDS)),
    path: leaf(oneOf(ARTIFACT_PATHS)),
    sha256: leaf(sha256),
    bytes: leaf(boundedInt(1, MAX_BYTES)),
    mediaType: leaf(oneOf(MEDIA_TYPES)),
    fieldInventory,
  }),
})
/** Shape only: PR-5 resolves every id and validates every value itself. */
const NON_OFFICIAL_INPUT = shape({
  titleId: leaf(isString),
  summary: list(shape({ labelId: leaf(isString), value: leaf(isString) }), MAX_NON_OFFICIAL_ITEMS),
  checklist: list(shape({ itemId: leaf(isString), done: leaf(isBoolean) }), MAX_NON_OFFICIAL_ITEMS),
  guidance: list(leaf(isString), MAX_NON_OFFICIAL_ITEMS),
})
const TEST_RESULT = shape({
  testId: leaf(oneOf(Object.keys(PACKET_TEST_CATALOG))),
  status: leaf(oneOf(TEST_STATUSES)),
  passed: leaf(boundedInt(0, MAX_COUNT)),
  failed: leaf(boundedInt(0, MAX_COUNT)),
  skipped: leaf(boundedInt(0, MAX_COUNT)),
})

export type ParsedPacketRequest =
  | { ok: true; value: PacketRequest }
  | { ok: false; violations: string[] }

/**
 * Parse a packet request into a fresh, fully checked copy. `holdIds` is
 * checked against `optionalHoldIds` — mandatory holds are injected by the
 * builder and are never accepted from a caller.
 */
export function parsePacketRequest(
  req: unknown,
  optionalHoldIds: ReadonlySet<string>
): ParsedPacketRequest {
  const out: string[] = []
  const report = (path: string, code: string) => out.push(`request_invalid:${path}:${code}`)
  const holdId: Check = v =>
    typeof v === "string" && optionalHoldIds.has(v) ? null : "unknown_hold_id"
  const value = shape({
    candidateSha: leaf(matches(COMMIT_SHA, "malformed_sha")),
    classificationQueries: list(CLASSIFICATION, MAX_LIST),
    compatibilityQueries: list(COMPATIBILITY, MAX_LIST),
    nonOfficialInputs: list(NON_OFFICIAL_INPUT, MAX_LIST),
    tests: list(TEST_RESULT, MAX_LIST),
    holdIds: list(leaf(holdId), MAX_LIST),
  })(req, "request", report)
  if (value) {
    const unique = (xs: unknown[], code: string, path: string) => {
      if (new Set(xs).size !== xs.length) report(path, code)
    }
    if (Array.isArray(value.holdIds)) unique(value.holdIds, "duplicate", "holdIds")
    if (Array.isArray(value.tests)) {
      unique(
        value.tests.map(t => (t as { testId?: unknown } | null)?.testId),
        "duplicate_test_id",
        "tests"
      )
    }
  }
  // `request:` rather than `request.` for top-level paths, as before.
  const violations = out.map(v => v.replace(/^request_invalid:request\./, "request_invalid:"))
  if (violations.length > 0 || value === null) {
    return {
      ok: false,
      violations: violations.length ? violations : ["request_invalid:request:not_object"],
    }
  }
  return { ok: true, value: value as unknown as PacketRequest }
}

/** Every schema violation in a packet request, as value-free codes. */
export function validatePacketRequest(
  req: unknown,
  optionalHoldIds: ReadonlySet<string>
): string[] {
  const r = parsePacketRequest(req, optionalHoldIds)
  return r.ok ? [] : r.violations
}
