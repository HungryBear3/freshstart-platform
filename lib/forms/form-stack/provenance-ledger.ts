/**
 * CC-05 PR-2 — IWO provenance ledger.
 *
 * PR-2A (`lib/forms/iwo-provenance.ts`) separated three dates that used to be
 * one field. This ledger separates the next thing that was still mixed: WHO
 * stated each value. Every value is one of two kinds:
 *
 *   - `external_fact` — stated by an outside authority (ACF, OIRA, Reginfo,
 *     Illinois Courts). Bound to at least one immutable source receipt.
 *   - `freshstart_derived_policy` — Fresh Start's own conservative derivation.
 *     Never published by any authority. Carries its derivation, its open
 *     uncertainty, and the event that requires a repin.
 *
 * `reconcileIwoProvenance()` proves the runtime model still agrees with this
 * ledger. It REPORTS drift; it never repairs, repins, or replaces anything.
 * Evidence: docs/legal-audit/iwo-omb-renewal-transition-2026-09-01.md.
 *
 * No I/O. Safe to import from tests and scripts.
 */
import {
  IWO_PROVENANCE,
  PINNED_OIRA_APPROVAL,
  type IwoOiraApproval,
} from "@/lib/forms/iwo-provenance"
import { addCalendarYearsStrict } from "@/lib/forms/form-stack/strict-date"

export function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const key of Object.keys(value as object))
      deepFreeze((value as Record<string, unknown>)[key])
  }
  return value
}

export type ReceiptRole =
  | "legacy_artifact"
  | "oira_notice_of_action"
  | "supporting_statement"
  | "comment_tracker"
  | "revised_successor"
  | "state_companion_instruction"

/** An immutable record of one official retrieval. Never edited in place. */
export interface SourceReceipt {
  id: string
  role: ReceiptRole
  /** Verbatim locator from the evidence overlay. Not every source recorded a URL. */
  locator: string
  /** Date the evidence overlay recorded this receipt (not necessarily fetch time). */
  recordedOn: string
  mediaType: string
  bytes: number
  sha256: string
}

export interface ExternalFact {
  kind: "external_fact"
  id: string
  value: string
  statedBy: string
  receiptIds: readonly string[]
}

export interface DerivedPolicy {
  kind: "freshstart_derived_policy"
  id: string
  value: string
  derivedFrom: readonly string[]
  rule: string
  /** Always false: no authority published this value. */
  published: false
  uncertainty: readonly string[]
  repinTrigger: string
}

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

export const IWO_SOURCE_RECEIPTS: readonly SourceReceipt[] = deepFreeze([
  {
    id: "acf_legacy_iwo_pdf_20260901",
    role: "legacy_artifact",
    locator: "https://acf.gov/sites/default/files/documents/ocse/omb_0970_0154.pdf?download=1",
    recordedOn: "2026-09-01",
    mediaType: "application/pdf",
    bytes: 505412,
    sha256: "2b15c02a46b66a7d0fa2bd80d4644d5d6d5e6798911225f8e0272b45fe20b551",
  },
  {
    id: "oira_noa_1826353",
    role: "oira_notice_of_action",
    locator: "https://www.reginfo.gov/public/do/DownloadNOA?requestID=1826353",
    recordedOn: "2026-09-01",
    mediaType: "application/pdf",
    bytes: 97827,
    sha256: "c2b68202cf4741b0f0a811457e40e6470b1fadce4a3a2f781e5dcb6b2c0df652",
  },
  {
    id: "reginfo_supporting_statement_170863901",
    role: "supporting_statement",
    locator: "Reginfo object 170863901",
    recordedOn: "2026-09-01",
    mediaType: DOCX,
    bytes: 53572,
    sha256: "aa7c52c254be46a0ebfaf394d1551b5c300d5a25aad41285a27ad8898d485933",
  },
  {
    id: "reginfo_comment_tracker_170864001",
    role: "comment_tracker",
    locator: "Reginfo object 170864001",
    recordedOn: "2026-09-01",
    mediaType: DOCX,
    bytes: 285980,
    sha256: "5cec90049b1803eb1a6ffd9bda051f040405c2bce41bf5881d92b626f0edb0b6",
  },
  {
    id: "reginfo_revised_iwo_170850302",
    role: "revised_successor",
    locator: "Reginfo object 170850302",
    recordedOn: "2026-09-01",
    mediaType: DOCX,
    bytes: 50777,
    sha256: "6cc4f2c57ae0b590591caad4b9335f2fbe55df4f663cdb1daa001b07e4b4e6e3",
  },
  {
    id: "reginfo_revised_iwo_170850402",
    role: "revised_successor",
    locator: "Reginfo object 170850402",
    recordedOn: "2026-09-01",
    mediaType: DOCX,
    bytes: 50777,
    sha256: "b245fe5dba479718e01bf428215d1af87628a92aae34cae61dbd42e2a797990d",
  },
  {
    id: "il_dv_wi_130_3_companion",
    role: "state_companion_instruction",
    locator: "Illinois companion instruction DV-WI 130.3 (03/23); URL not recorded in the overlay",
    recordedOn: "2026-09-01",
    mediaType: "application/pdf",
    bytes: 732299,
    sha256: "a344ecbd7ff66f73e2ba1ebc19c963b88f34f0aecf707cfa8c457eb4db7f8815",
  },
] satisfies SourceReceipt[])

export const IWO_EXTERNAL_FACTS: readonly ExternalFact[] = deepFreeze([
  {
    kind: "external_fact",
    id: "printed_legacy_pdf_date",
    value: "2026-08-31",
    statedBy: "ACF (printed on the legacy PDF)",
    receiptIds: ["acf_legacy_iwo_pdf_20260901"],
  },
  {
    kind: "external_fact",
    id: "omb_control_number",
    value: "0970-0154",
    statedBy: "OIRA",
    receiptIds: ["oira_noa_1826353", "acf_legacy_iwo_pdf_20260901"],
  },
  {
    kind: "external_fact",
    id: "icr_reference_number",
    value: "202607-0970-002",
    statedBy: "OIRA",
    receiptIds: ["oira_noa_1826353"],
  },
  {
    kind: "external_fact",
    id: "oira_approval_date",
    value: "2026-08-25",
    statedBy: "OIRA",
    receiptIds: ["oira_noa_1826353"],
  },
  {
    kind: "external_fact",
    id: "collection_approval_expires_on",
    value: "2029-08-31",
    statedBy: "OIRA",
    receiptIds: ["oira_noa_1826353"],
  },
  {
    kind: "external_fact",
    id: "legacy_extended_one_additional_year",
    value: "currently approved IWO extended one additional year for state programming",
    statedBy: "OCSE supporting statement",
    receiptIds: ["reginfo_supporting_statement_170863901"],
  },
  {
    kind: "external_fact",
    id: "revised_successor_published_as_docx_only",
    value: DOCX,
    statedBy: "Reginfo",
    receiptIds: ["reginfo_revised_iwo_170850302", "reginfo_revised_iwo_170850402"],
  },
] satisfies ExternalFact[])

export const IWO_DERIVED_POLICY: readonly DerivedPolicy[] = deepFreeze([
  {
    kind: "freshstart_derived_policy",
    id: "legacy_transition_first_blocked_date",
    value: "2027-08-25",
    derivedFrom: ["oira_approval_date", "legacy_extended_one_additional_year"],
    rule: "oira_approval_date + 1 calendar year; the first BLOCKED Chicago day",
    published: false,
    uncertainty: [
      "Conservative Fresh Start derivation; not an ACF-published implementation deadline.",
      "A third-party comment describes 2027-08-31; that wording is not the agency's and is not adopted.",
    ],
    repinTrigger: "An explicit ACF implementation or effective-date notice for the revised IWO.",
  },
  {
    kind: "freshstart_derived_policy",
    id: "transition_whole_day_time_zone",
    value: "America/Chicago",
    derivedFrom: [],
    rule: "Fail closed for the entire first blocked calendar day in this zone.",
    published: false,
    uncertainty: ["Fresh Start operating zone; no authority states a zone for this cutoff."],
    repinTrigger: "Owner policy change only.",
  },
] satisfies DerivedPolicy[])

export interface ProvenanceModels {
  provenance: Pick<
    typeof IWO_PROVENANCE,
    | "printedLegacyPdfDate"
    | "collectionApprovalExpiresOn"
    | "legacyTransitionFirstBlockedDate"
    | "expectedSha256"
    | "expectedBytes"
    | "ombNumber"
    | "canonicalUrl"
  >
  oira: IwoOiraApproval
}

export interface ProvenanceReconciliation {
  consistent: boolean
  discrepancies: string[]
  /** Known, deliberately unresolved questions. Reported every time; never auto-fixed. */
  openUncertainties: string[]
}

function fact(id: string): string {
  const f = IWO_EXTERNAL_FACTS.find(x => x.id === id)
  if (!f) throw new Error(`provenance ledger missing external fact ${id}`)
  return f.value
}

function receipt(id: string): SourceReceipt {
  const r = IWO_SOURCE_RECEIPTS.find(x => x.id === id)
  if (!r) throw new Error(`provenance ledger missing receipt ${id}`)
  return r
}

/**
 * Compare the runtime model with the ledger. The default argument is the real
 * runtime model; tests pass modified copies to prove drift is caught.
 */
export function reconcileIwoProvenance(
  models: ProvenanceModels = { provenance: IWO_PROVENANCE, oira: PINNED_OIRA_APPROVAL }
): ProvenanceReconciliation {
  const { provenance: p, oira } = models
  const out: string[] = []
  const check = (ok: boolean, code: string) => {
    if (!ok) out.push(code)
  }

  const artifact = receipt("acf_legacy_iwo_pdf_20260901")
  const noa = receipt("oira_noa_1826353")
  check(p.expectedSha256 === artifact.sha256, "artifact_sha256_differs_from_receipt")
  check(p.expectedBytes === artifact.bytes, "artifact_bytes_differ_from_receipt")
  check(
    p.printedLegacyPdfDate === fact("printed_legacy_pdf_date"),
    "printed_legacy_pdf_date_differs_from_receipt"
  )
  check(p.ombNumber === fact("omb_control_number"), "omb_number_differs_from_receipt")
  check(
    oira.icrReferenceNumber === fact("icr_reference_number"),
    "icr_reference_differs_from_receipt"
  )
  check(oira.approvalDate === fact("oira_approval_date"), "oira_approval_date_differs_from_receipt")
  check(
    p.collectionApprovalExpiresOn === fact("collection_approval_expires_on") &&
      oira.collectionApprovalExpiresOn === fact("collection_approval_expires_on"),
    "collection_approval_expires_on_differs_from_receipt"
  )
  check(oira.noticeOfActionSha256 === noa.sha256, "notice_of_action_sha256_differs_from_receipt")
  check(oira.noticeOfActionBytes === noa.bytes, "notice_of_action_bytes_differ_from_receipt")

  // The derived cutoff: must equal its own derivation AND the runtime value,
  // and must never coincide with a value an authority actually stated.
  const cutoff = IWO_DERIVED_POLICY.find(x => x.id === "legacy_transition_first_blocked_date")!
  check(
    addCalendarYearsStrict(fact("oira_approval_date"), 1) === cutoff.value &&
      p.legacyTransitionFirstBlockedDate === cutoff.value,
    "legacy_transition_first_blocked_date_differs_from_derivation"
  )
  const externalValues = new Set(IWO_EXTERNAL_FACTS.map(f => f.value))
  check(
    !IWO_DERIVED_POLICY.some(d => externalValues.has(d.value)) &&
      !externalValues.has(p.legacyTransitionFirstBlockedDate),
    "derived_policy_value_collides_with_external_fact"
  )
  const externalIds = new Set(IWO_EXTERNAL_FACTS.map(f => f.id))
  for (const d of IWO_DERIVED_POLICY) {
    check(!externalIds.has(d.id), `derived_policy_listed_as_external:${d.id}`)
    check(
      d.published === false && d.uncertainty.length > 0 && d.repinTrigger.length > 0,
      `derived_policy_missing_uncertainty_or_repin:${d.id}`
    )
    for (const src of d.derivedFrom)
      check(externalIds.has(src), `derived_policy_unknown_source:${d.id}:${src}`)
  }
  const receiptIds = new Set(IWO_SOURCE_RECEIPTS.map(r => r.id))
  for (const f of IWO_EXTERNAL_FACTS) {
    check(
      f.receiptIds.length > 0 && f.receiptIds.every(id => receiptIds.has(id)),
      `external_fact_unreceipted:${f.id}`
    )
  }

  // Main reconciled the canonical URL to the exact retrieval address
  // (acf.gov, `?download=1`). Any difference from the receipt is drift now,
  // not an open question — compared as whole strings, not by host.
  check(p.canonicalUrl === artifact.locator, "canonical_url_differs_from_receipt")

  const openUncertainties: string[] = []

  return { consistent: out.length === 0, discrepancies: out, openUncertainties }
}
