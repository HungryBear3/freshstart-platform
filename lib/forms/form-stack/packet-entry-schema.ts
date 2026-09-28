/**
 * CC-05 B1 — closed schemas for the evidence entries of an operator review
 * packet, as the VERIFIER reads them.
 *
 * Hashes prove only that bytes did not change after they were hashed. A forger
 * who re-hashes consistently can still drop an entry, add one, or put free text
 * into one. So the verifier parses every entry and checks it against the exact
 * shape the builder produces: pinned literals, closed vocabularies, bounded
 * numbers, dense lists, no undeclared keys, verdicts that agree with the
 * mandatory holds (R1) and test statuses that agree with their counts (R2).
 * Every reason string a gate can emit
 * is enumerated here; AcroForm field names are only ever 16-hex digests.
 *
 * `provenance.json` and `holds.json` are checked in `operator-review-packet.ts`
 * against its own pinned values. No I/O.
 */
import {
  boundedInt,
  exactly,
  isBoolean,
  isString,
  leaf,
  list,
  matches,
  oneOf,
  shape,
  type Check,
  type Reader,
  type Report,
} from "@/lib/forms/form-stack/closed-schema"
import { NON_OFFICIAL_OUTPUT_VERSION } from "@/lib/forms/form-stack/non-official-output"
import {
  FORM_IDS,
  MAPPING_IDS,
  MAX_COUNT,
  MAX_LIST,
  MAX_NON_OFFICIAL_ITEMS,
  PACKET_TEST_CATALOG,
  SHA256,
  TEST_STATUSES,
  withConsistentCounts,
} from "@/lib/forms/form-stack/packet-request-schema"
import {
  SOURCE_CATALOG,
  SOURCE_CLASSES,
  SOURCE_CLASSIFICATION_VERSION,
} from "@/lib/forms/form-stack/source-classification"
import { FORM_AUTHORITY_CLASSES, getFormById } from "@/lib/forms/illinois-court-forms"

/** Compatibility reason codes whose suffix is an AcroForm field name. */
export const FIELD_BEARING_REASONS: ReadonlySet<string> = new Set([
  "missing_critical_field",
  "missing_mapped_field",
  "unexpected_field",
  "critical_field_not_in_inventory",
  "critical_field_unmapped",
  "mapped_field_not_in_inventory",
])

const AUTHORITIES = Object.keys(FORM_AUTHORITY_CLASSES)
const INVENTORY_DEFECTS = [
  "inventory_not_array",
  "inventory_too_large",
  "field_name_not_string",
  "empty_field_name",
  "field_name_too_long",
  "field_name_control_character",
  "duplicate_field_name",
]

/** Every reason `classifySource` can return (PR-3). */
const CLASSIFICATION_REASONS: ReadonlySet<string> = new Set([
  "malformed_sha256",
  "unknown_artifact_hash",
  "catalog_conflict",
  "byte_length_mismatch",
  "form_id_mismatch",
  "media_type_mismatch",
  "successor_docx_presented_as_pdf",
  "claimed_class_conflicts_with_catalog",
  "main_catalog_pins_hash_to_other_form",
  "main_catalog_unknown_form",
  "main_catalog_artifact_mismatch",
  ...AUTHORITIES.map(a => `main_catalog_identity_unsupported:${a}`),
])

/** Every reason `checkFieldMapCompatibility` can return (PR-4), field names digested. */
const COMPATIBILITY_REASONS: ReadonlySet<string> = new Set([
  "no_bound_mapping",
  "ambiguous_mapping_binding",
  "binding_incomplete",
  "binding_inventory_hash_invalid",
  "mapping_version_mismatch",
  "artifact_sha256_mismatch",
  "mapping_bound_to_different_artifact",
  "artifact_bytes_mismatch",
  "form_id_mismatch",
  "artifact_path_mismatch",
  "source_identity_mismatch",
  "field_inventory_drift",
  "inventory_set_mismatch",
  "main_invalid_county_context",
  "main_not_composable_for_county",
  "main_field_map_not_proven",
  "main_template_source_unavailable",
  "main_has_no_field_map",
  "main_mapping_name_mismatch",
  "main_mapping_fields_differ",
  ...INVENTORY_DEFECTS.flatMap(d => [
    `binding_inventory_invalid:${d}`,
    `observed_inventory_invalid:${d}`,
  ]),
  ...SOURCE_CLASSES.map(c => `source_not_mappable:${c}`),
  ...[...CLASSIFICATION_REASONS].filter(r => r.startsWith("main_")).map(r => `classification:${r}`),
  ...["unsupported", "separately_guarded"].map(s => `main_automation_status_excluded:${s}`),
])
const DIGESTED_FIELD_REASON = new RegExp(
  `^(${[...FIELD_BEARING_REASONS].join("|")}):field#[0-9a-f]{16}$`
)

export function isCompatibilityReason(r: unknown): boolean {
  return typeof r === "string" && (COMPATIBILITY_REASONS.has(r) || DIGESTED_FIELD_REASON.test(r))
}

/**
 * R1: two mandatory holds are claims about the pinned state, and every verdict
 * in the packet must agree with them, however consistently it was re-hashed.
 * Lifting either hold is a reviewed change here, never a packet edit.
 *
 *   - `no_official_current_evidence`: `SOURCE_CATALOG` pins no official_current
 *     artifact, so no classification or compatibility item carries that class.
 *   - `no_proven_field_map_binding`: `PINNED_FIELD_MAP_BINDINGS` is empty, so
 *     the one result `checkFieldMapCompatibility` can return is
 *     `compatible: false` with exactly `["no_bound_mapping"]`.
 */
const CONTRADICTS_NO_CURRENT_EVIDENCE = "contradicts_hold:no_official_current_evidence"
const CONTRADICTS_NO_PROVEN_BINDING = "contradicts_hold:no_proven_field_map_binding"

const nullOr =
  (check: Check): Check =>
  v =>
    v === null ? null : check(v)
const RECEIPT_IDS = SOURCE_CATALOG.map(e => e.receiptId)

/** `mainCatalog` must be exactly main's identity for the reported form id. */
const mainCatalogFor = (formId: unknown): Reader => {
  const row = typeof formId === "string" ? getFormById(formId) : undefined
  if (!row) return leaf(exactly(null))
  return shape({
    formId: leaf(exactly(row.id)),
    authority: leaf(exactly(row.authority)),
    automationStatus: leaf(exactly(row.automationStatus)),
  })
}

const classificationItem: Reader = (v, path, report) => {
  const base = shape({
    version: leaf(exactly(SOURCE_CLASSIFICATION_VERSION)),
    sourceClass: leaf(oneOf(SOURCE_CLASSES)),
    formId: leaf(oneOf(FORM_IDS)),
    receiptId: leaf(nullOr(oneOf(RECEIPT_IDS))),
    mainCatalog: m => m,
    shippable: leaf(exactly(false)),
    reasons: list(leaf(oneOf(CLASSIFICATION_REASONS)), 20),
  })(v, path, report)
  if (!base) return base
  if (base.sourceClass === "official_current") report(path, CONTRADICTS_NO_CURRENT_EVIDENCE)
  mainCatalogFor(base.formId)(base.mainCatalog, `${path}.mainCatalog`, report)
  const reasons = Array.isArray(base.reasons) ? base.reasons : []
  if (base.sourceClass === "unknown") {
    if (base.receiptId !== null || reasons.length === 0) report(path, "unknown_class_inconsistent")
  } else if (
    reasons.length > 0 ||
    !SOURCE_CATALOG.some(
      e =>
        e.receiptId === base.receiptId &&
        e.formId === base.formId &&
        e.sourceClass === base.sourceClass
    )
  ) {
    report(path, "positive_class_not_in_catalog")
  }
  return base
}

const compatibilityItem: Reader = (v, path, report) => {
  const base = shape({
    compatible: leaf(isBoolean),
    generationAuthorized: leaf(exactly(false)),
    mappingId: leaf(oneOf(MAPPING_IDS)),
    reasons: list(
      leaf(v => (isCompatibilityReason(v) ? null : "not_in_vocabulary")),
      16_000
    ),
    sourceClass: leaf(oneOf(SOURCE_CLASSES)),
  })(v, path, report)
  if (!base) return base
  const reasons = Array.isArray(base.reasons) ? base.reasons : null
  if (reasons && base.compatible !== (reasons.length === 0)) {
    report(path, "compatible_contradicts_reasons")
  }
  if (base.sourceClass === "official_current") report(path, CONTRADICTS_NO_CURRENT_EVIDENCE)
  // Exactly one reason; with the check above, that also pins compatible: false.
  if (reasons?.length !== 1 || reasons[0] !== "no_bound_mapping") {
    report(path, CONTRADICTS_NO_PROVEN_BINDING)
  }
  return base
}

const artifactsList: Reader = (v, path, report) => {
  const items = list(item => item, MAX_LIST)(v, path, report)
  items?.forEach((item, i) =>
    shape({
      index: leaf(exactly(i)),
      kind: leaf(exactly("fresh_start_non_official_summary")),
      version: leaf(exactly(NON_OFFICIAL_OUTPUT_VERSION)),
      officialForm: leaf(exactly(false)),
      filingReady: leaf(exactly(false)),
      sha256: leaf(matches(SHA256, "malformed_sha256")),
      bytes: leaf(boundedInt(1, 1_000_000)),
      officialMarkers: list(
        leaf(() => "marker_present"),
        0
      ),
      shape: shape({
        summary: leaf(boundedInt(0, MAX_NON_OFFICIAL_ITEMS)),
        checklist: leaf(boundedInt(0, MAX_NON_OFFICIAL_ITEMS)),
        guidance: leaf(boundedInt(0, MAX_NON_OFFICIAL_ITEMS)),
      }),
    })(item, `${path}[${i}]`, report)
  )
  return items
}

const TEST_IDS = Object.keys(PACKET_TEST_CATALOG) as (keyof typeof PACKET_TEST_CATALOG)[]
const testItem: Reader = withConsistentCounts((v, path, report) => {
  const base = shape({
    command: leaf(isString),
    failed: leaf(boundedInt(0, MAX_COUNT)),
    passed: leaf(boundedInt(0, MAX_COUNT)),
    skipped: leaf(boundedInt(0, MAX_COUNT)),
    status: leaf(oneOf(TEST_STATUSES)),
    testId: leaf(oneOf(TEST_IDS)),
  })(v, path, report)
  if (base && (TEST_IDS as unknown[]).includes(base.testId)) {
    const pinned = PACKET_TEST_CATALOG[base.testId as keyof typeof PACKET_TEST_CATALOG]
    if (base.command !== pinned) report(`${path}.command`, "not_pinned_value")
  } else if (base) {
    report(`${path}.command`, "not_pinned_value")
  }
  return base
})
const testsList: Reader = (v, path, report) => {
  const items = list(testItem, MAX_LIST)(v, path, report)
  const ids = (items ?? []).map(t => (t as { testId?: unknown } | null)?.testId)
  if (new Set(ids).size !== ids.length) report(path, "duplicate_test_id")
  return items
}

/** Closed schema per evidence entry the verifier parses here. */
export const ENTRY_SCHEMAS: Readonly<Record<string, Reader>> = {
  "classification.json": list(classificationItem, MAX_LIST),
  "compatibility.json": list(compatibilityItem, MAX_LIST),
  "non-official-artifacts.json": artifactsList,
  "tests.json": testsList,
}

export type { Report }
