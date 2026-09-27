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
 *     hold catalog) — nothing else is accepted, however it is spelled;
 *   - hashes, sizes, counts and enums are exact-shape and bounded;
 *   - the two fields that are not vocabularies (a test command, AcroForm field
 *     names) are restricted-charset, length-bounded, and refused on any run of
 *     seven or more digits (phones in any national/international/extension
 *     form, SSNs, card numbers) or anything email-shaped;
 *   - unknown keys are refused, so nothing rides along unchecked.
 *
 * Violations are `request_invalid:<path>:<code>`. They NEVER contain the
 * offending value. Customer answers are not validated here: they are rendered
 * by PR-5 and appear in the packet only as a hash.
 *
 * No I/O.
 */
import { isCanonicalCountyId } from "@/lib/counties/county-iwo-workflow"
import { OFFICIAL_FIELD_MAP_BINDINGS } from "@/lib/forms/field-map-compatibility"
import {
  PINNED_FIELD_MAP_BINDINGS,
  validateFieldInventory,
} from "@/lib/forms/form-stack/field-map-compatibility"
import { SOURCE_CATALOG, SOURCE_CLASSES } from "@/lib/forms/form-stack/source-classification"
import { ILLINOIS_COURT_FORMS } from "@/lib/forms/illinois-court-forms"

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
const MEDIA_TYPES: readonly string[] = ["application/pdf", DOCX]
const TEST_STATUSES: readonly string[] = ["PASS", "FAIL", "NOT_RUN"]
const ARTIFACT_DIRS: readonly string[] = ["private/official-forms", "public/forms"]

const FORM_IDS: ReadonlySet<string> = new Set([
  ...ILLINOIS_COURT_FORMS.map(f => f.id),
  ...SOURCE_CATALOG.map(e => e.formId),
])
const MAPPING_IDS: ReadonlySet<string> = new Set([
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

const SHA256 = /^[0-9a-f]{64}$/
const TEST_COMMAND = /^[a-z0-9_./:= -]{1,160}$/
const FIELD_NAME = /^[A-Za-z0-9 _.[\]()#-]{1,128}$/
/** Seven digits with any common separators between them. */
const DIGIT_RUN = /(?:\d[\s().+/-]*){7,}/
const EMAIL_LIKE = /[^\s@]+@[^\s@]+/
const MAX_BYTES = 100_000_000
const MAX_COUNT = 1_000_000
const MAX_LIST = 50

export function looksLikePersonalData(text: string): boolean {
  return DIGIT_RUN.test(text) || EMAIL_LIKE.test(text)
}

type Field = (value: unknown) => string | null

const oneOf =
  (vocab: ReadonlySet<string> | readonly string[]): Field =>
  v =>
    typeof v === "string" && (vocab instanceof Set ? vocab.has(v) : vocab.includes(v))
      ? null
      : "not_in_vocabulary"
const sha256: Field = v => (typeof v === "string" && SHA256.test(v) ? null : "malformed_sha256")
const boundedInt =
  (min: number, max: number): Field =>
  v =>
    Number.isInteger(v) && (v as number) >= min && (v as number) <= max ? null : "out_of_range"
const county: Field = v => (isCanonicalCountyId(v) ? null : "not_in_vocabulary")
const testCommand: Field = v => {
  if (typeof v !== "string" || !TEST_COMMAND.test(v)) return "pattern"
  return looksLikePersonalData(v) ? "personal_data_shape" : null
}
const fieldInventory: Field = v => {
  if (!Array.isArray(v)) return "not_array"
  if (v.length > 5000) return "too_long"
  if (validateFieldInventory(v).length > 0) return "invalid_inventory"
  for (const f of v as string[]) {
    if (!FIELD_NAME.test(f)) return "pattern"
    if (looksLikePersonalData(f)) return "personal_data_shape"
  }
  return null
}

type Shape = Record<string, { check: Field; optional?: boolean }>

const CLASSIFICATION: Shape = {
  sha256: { check: sha256 },
  bytes: { check: boundedInt(1, MAX_BYTES) },
  mediaType: { check: oneOf(MEDIA_TYPES) },
  formId: { check: oneOf(FORM_IDS) },
  claimedClass: { check: oneOf(SOURCE_CLASSES), optional: true },
}
const ARTIFACT: Shape = {
  formId: { check: oneOf(FORM_IDS) },
  path: { check: oneOf(ARTIFACT_PATHS) },
  sha256: { check: sha256 },
  bytes: { check: boundedInt(1, MAX_BYTES) },
  mediaType: { check: oneOf(MEDIA_TYPES) },
  fieldInventory: { check: fieldInventory },
}
const TEST_RESULT: Shape = {
  command: { check: testCommand },
  status: { check: oneOf(TEST_STATUSES) },
  passed: { check: boundedInt(0, MAX_COUNT) },
  failed: { check: boundedInt(0, MAX_COUNT) },
  skipped: { check: boundedInt(0, MAX_COUNT) },
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v)
}

function checkShape(value: unknown, shape: Shape, path: string, out: string[]): void {
  if (!isPlainObject(value)) {
    out.push(`request_invalid:${path}:not_object`)
    return
  }
  for (const key of Object.keys(value)) {
    if (!Object.prototype.hasOwnProperty.call(shape, key)) {
      out.push(`request_invalid:${path}:unknown_key`)
      break
    }
  }
  for (const [key, { check, optional }] of Object.entries(shape)) {
    const v = value[key]
    if (v === undefined && optional) continue
    const code = check(v)
    if (code) out.push(`request_invalid:${path}.${key}:${code}`)
  }
}

function checkList(
  value: unknown,
  path: string,
  out: string[],
  each: (v: unknown, p: string) => void
): void {
  if (!Array.isArray(value)) {
    out.push(`request_invalid:${path}:not_array`)
    return
  }
  if (value.length > MAX_LIST) out.push(`request_invalid:${path}:too_long`)
  value.slice(0, MAX_LIST).forEach((v, i) => each(v, `${path}[${i}]`))
}

/**
 * Every schema violation in a packet request, as value-free codes. `holdIds`
 * is checked against `optionalHoldIds` — mandatory holds are injected by the
 * builder and are never accepted from a caller.
 */
export function validatePacketRequest(
  req: unknown,
  optionalHoldIds: ReadonlySet<string>
): string[] {
  const out: string[] = []
  if (!isPlainObject(req)) return ["request_invalid:request:not_object"]
  const top = new Set([
    "candidateSha",
    "classificationQueries",
    "compatibilityQueries",
    "nonOfficialInputs",
    "tests",
    "holdIds",
  ])
  if (Object.keys(req).some(k => !top.has(k))) out.push("request_invalid:request:unknown_key")
  if (typeof req.candidateSha !== "string" || !/^[0-9a-f]{40}$/.test(req.candidateSha)) {
    out.push("request_invalid:candidateSha:malformed_sha")
  }
  checkList(req.classificationQueries, "classificationQueries", out, (v, p) =>
    checkShape(v, CLASSIFICATION, p, out)
  )
  checkList(req.compatibilityQueries, "compatibilityQueries", out, (v, p) => {
    checkShape(
      v,
      {
        mappingId: { check: oneOf(MAPPING_IDS) },
        mappingVersion: { check: oneOf(MAPPING_VERSIONS) },
        countyId: { check: county },
        artifact: { check: () => null },
      },
      p,
      out
    )
    if (isPlainObject(v)) checkShape(v.artifact, ARTIFACT, `${p}.artifact`, out)
  })
  checkList(req.tests, "tests", out, (v, p) => checkShape(v, TEST_RESULT, p, out))
  checkList(req.holdIds, "holdIds", out, (v, p) => {
    if (typeof v !== "string" || !optionalHoldIds.has(v)) {
      out.push(`request_invalid:${p}:unknown_hold_id`)
    }
  })
  if (Array.isArray(req.holdIds) && new Set(req.holdIds).size !== req.holdIds.length) {
    out.push("request_invalid:holdIds:duplicate")
  }
  if (!Array.isArray(req.nonOfficialInputs)) {
    out.push("request_invalid:nonOfficialInputs:not_array")
  } else if (req.nonOfficialInputs.length > MAX_LIST) {
    out.push("request_invalid:nonOfficialInputs:too_long")
  }
  return out
}
