/**
 * County procedural-workflow model for the federal Income Withholding for
 * Support (IWO).
 *
 * This extends the existing typed county registry (`ILLINOIS_COUNTIES`) and the
 * existing form catalog (`ILLINOIS_COURT_FORMS`); it is not a parallel county
 * system. Counties are keyed by the same ids used by `ILLINOIS_COUNTIES`.
 *
 * BOUNDARY — this module encodes PROCEDURAL INFORMATION and product-safety
 * gating only. It does not determine, and must not be extended to determine,
 * which filing path is legally correct for a particular case. Where the sources
 * on file conflict or are silent, the model reports `manual_conditional` and
 * stops. It never silently chooses file vs. do-not-file.
 *
 * Evidence basis: see docs/legal-audit/will-county-iwo-conditional-addendum-2026-08-09.md
 */
import { ILLINOIS_COUNTIES } from "./illinois-counties"
import {
  getFormsForCaseType,
  type CourtForm,
} from "@/lib/forms/illinois-court-forms"
import { validateIwo, type IwoRenewalEvidence, type IwoValidation } from "@/lib/forms/iwo-provenance"
import {
  operativeRefusalCopy,
  selectOperativeRefusal,
} from "@/lib/forms/iwo-refusal-copy"

/** Catalog id of the federal IWO in ILLINOIS_COURT_FORMS. */
export const IWO_FORM_ID = "income-withholding-order"

/** As-of date for the county evidence encoded in this module. */
export const IWO_WORKFLOW_AS_OF = "2026-08-09"

/**
 * `manual_conditional` — the sources on file conflict or are silent, so the
 * path is not determinable by the product and is routed to manual review.
 * `statewide_default` — only the statewide instruction is on file for this
 * county; no county-specific conflicting direction has been identified.
 */
export type IwoDisposition = "statewide_default" | "manual_conditional"

/** Stable, machine-readable reason codes. Consumers may snapshot these. */
export type IwoReasonCode =
  | "county_unknown_or_noncanonical"
  | "employer_change_scenario_conditional"
  | "federal_artifact_gate_closed"
  | "judge_direction_required"
  | "notice_proof_scope_unresolved"
  | "packet_placement_not_established"
  | "post_service_filing_conditional"
  | "proposed_order_lane_separate"
  | "will_local_rule_vs_statewide_filing_conflict"

export type IwoPathDecision =
  | "undetermined_manual_review"
  | "statewide_serve_employer_do_not_file"

export type IwoLaneDecision =
  | "conditional_unresolved"
  | "directed_by_case_specific_input"
  | "statewide_default_serve_employer"

/** Case-specific direction supplied from outside the product. Never synthesized. */
export type IwoCaseSpecificDirection =
  | "file_after_employer_service"
  | "serve_employer_only"
  | "proposed_order_submission"

export interface IwoLane {
  decision: IwoLaneDecision
  /** True only if the product itself picked the path. Must stay false. */
  autoDecided: boolean
  note: string
}

export interface IwoInstrumentIdentity {
  ombNumber: string
  /** Names the clerk response confirms refer to the SAME instrument. */
  sameInstrumentAliases: string[]
  /** The separate Support Order. Distinct from the IWO. */
  supportOrderFormCode: string
  supportOrderIsDistinctFromIwo: boolean
}

export interface IwoFilingConflict {
  localRule: string | null
  statewideInstruction: string
  /** Never true: the textual conflict is not resolved by the product. */
  resolved: boolean
}

export interface CountyIwoWorkflow {
  countyId: string
  disposition: IwoDisposition
  instrument: IwoInstrumentIdentity
  conflict: IwoFilingConflict
  /** Whether the IWO may be auto-composed into a packet for this county. */
  autoPacketPlacementAllowed: boolean
  evidence: { sources: string[]; asOf: string }
}

const INSTRUMENT_IDENTITY: IwoInstrumentIdentity = {
  ombNumber: "0970-0154",
  // Per the 2026-07-31 Will County Circuit Clerk response: these three names
  // refer to the same instrument.
  sameInstrumentAliases: [
    "Income Withholding for Support",
    "Withholding Order",
    "Federal Income Withholding for Support form (OMB 0970-0154)",
  ],
  // The Support Order referenced in the county e-filing instructions is the
  // state-approved ATJ 129.5 — a DIFFERENT instrument.
  supportOrderFormCode: "ATJ 129.5",
  supportOrderIsDistinctFromIwo: true,
}

const WILL_EVIDENCE_SOURCES = [
  "rex/research/illinois-divorce-county-baseline-20260727-next-response-20260731/WILL-IWO-CLERK-RESPONSE-ADDENDUM.md",
  "rex/research/illinois-divorce-county-baseline-20260727-next-response-20260731/will-clerk-response-verbatim.txt",
  "docs/legal-audit/iwo-source-closure-delta-audit-2026-07-27.md",
  "docs/legal-audit/will-county-iwo-clarification-sent-2026-07-27.md",
]

const STATEWIDE_EVIDENCE_SOURCES = [
  "docs/legal-audit/iwo-federal-provenance-2026-07-21.json",
]

/**
 * Neutral explanatory copy. Procedural description of what the sources say —
 * no recommendation, no guarantee, no universal-procedure claim.
 */
export const IWO_NEUTRAL_COPY: Record<"will" | "statewide_default", string[]> = {
  will: [
    "Will County's published local rule (Rule 8.09(C)) directs that the Income Withholding for Support be filed with the Circuit Clerk after it is served on the employer. The statewide form instruction (ATJ 127.3) states that this form is not filed with the Circuit Clerk.",
    "The Circuit Clerk's office has described actual practice as varying between filers, and reported that filing happens less often than not filing.",
    "Whether a particular case proceeds by employer service only, by filing after employer service, or by submitting a proposed order can depend on case-specific direction from the judge assigned to that case.",
    "Because of this, Fresh Start does not select a path and does not add this form to a packet automatically. The item is set aside for manual review with your information preserved.",
    "Universal placement of this form in an opening packet or a prove-up packet is not established by the sources on file.",
    "This is procedural information drawn from the sources listed, not legal advice.",
  ],
  statewide_default: [
    "Statewide form instructions (ATJ 127.3) describe the Income Withholding for Support as served on the employer rather than filed with the Circuit Clerk.",
    "The form applies where support is ordered, the payer is employed, and the employer is known. It follows a signed Order for Support (ATJ 129.5).",
    "This is procedural information drawn from the sources listed, not legal advice.",
  ],
}

/** Counties with an identified county-specific conflict requiring manual review. */
const MANUAL_CONDITIONAL_COUNTIES = new Set(["will"])

export function getCountyIwoWorkflow(countyId: string): CountyIwoWorkflow {
  // Fail closed on anything that is not a canonical, known county id. An
  // unrecognized value is NOT a statewide-default county — we do not know its
  // procedure, so it routes to manual review.
  const isRecognized = isCanonicalCountyId(countyId)
  const isManualConditional = !isRecognized || MANUAL_CONDITIONAL_COUNTIES.has(countyId)
  return {
    countyId,
    disposition: isManualConditional ? "manual_conditional" : "statewide_default",
    instrument: INSTRUMENT_IDENTITY,
    conflict: {
      localRule:
        isRecognized && MANUAL_CONDITIONAL_COUNTIES.has(countyId)
          ? "Will County Circuit Court Rule 8.09(C) — IWO served on the employer shall be filed with the Circuit Clerk"
          : null,
      statewideInstruction:
        "Statewide form instruction ATJ 127.3 — \"Do not file this form with the Circuit Clerk.\"",
      // Never resolved by the product.
      resolved: false,
    },
    autoPacketPlacementAllowed: !isManualConditional,
    evidence: {
      sources:
        isRecognized && MANUAL_CONDITIONAL_COUNTIES.has(countyId)
          ? [...WILL_EVIDENCE_SOURCES, ...STATEWIDE_EVIDENCE_SOURCES]
          : STATEWIDE_EVIDENCE_SOURCES,
      asOf: IWO_WORKFLOW_AS_OF,
    },
  }
}

export interface IwoFederalFormState {
  /** True only when the pinned print is present, provenance-valid, unexpired,
   *  and OMB renewal review is not outstanding. Fail-closed. */
  usable: boolean
  /** The product does not fill this PDF. No field mappings exist for it. */
  fillable: boolean
  blockers: string[]
  validation: IwoValidation
}

export interface ResolvedIwoWorkflow {
  countyId: string
  disposition: IwoDisposition
  pathDecision: IwoPathDecision
  requiresManualReview: boolean
  /** Never true while any lane is unresolved or the federal gate is closed. */
  completed: boolean
  reasonCodes: IwoReasonCode[]
  lanes: {
    employerService: IwoLane
    postServiceFiling: IwoLane
    proposedOrder: IwoLane
    noticeProof: IwoLane
  }
  federalForm: IwoFederalFormState
  copy: string[]
  evidence: { sources: string[]; asOf: string }
}

export interface ResolveIwoWorkflowInput {
  countyId: string
  /** Directory holding the guarded federal artifact (private/official-forms). */
  artifactDir: string
  today?: Date
  employerChanged?: boolean
  /** Supplied from outside the product. The product never infers this. */
  caseSpecificDirection?: IwoCaseSpecificDirection
  /** Injected ONLY by test factories; product entry points never pass this. */
  renewalEvidence?: IwoRenewalEvidence
}

function federalFormState(
  artifactDir: string,
  today: Date,
  renewal?: IwoRenewalEvidence,
): IwoFederalFormState {
  const validation = validateIwo(artifactDir, today, renewal)
  return {
    // Any blocker — missing, invalid provenance, expired, renewal pending —
    // keeps the form from being presented as current/ready.
    usable: validation.blockers.length === 0,
    fillable: false,
    blockers: validation.blockers,
    validation,
  }
}

/**
 * Approved refusal copy for a closed federal artifact gate, selected by the
 * operative blocker. Empty only for a blocker outside `validateIwo`'s
 * vocabulary, which it cannot emit — refusing with no message beats borrowing
 * another cause's message and stating something untrue.
 */
function federalGateCopy(blockers: readonly string[]): string[] {
  const operative = selectOperativeRefusal(blockers)
  return operative === null ? [] : operativeRefusalCopy(operative)
}

export function resolveIwoWorkflow(input: ResolveIwoWorkflowInput): ResolvedIwoWorkflow {
  const today = input.today ?? new Date()
  const workflow = getCountyIwoWorkflow(input.countyId)
  const federalForm = federalFormState(input.artifactDir, today, input.renewalEvidence)

  if (workflow.disposition !== "manual_conditional") {
    // ── Statewide-default county, federal gate CLOSED ────────────────────────
    // The county's procedural default is irrelevant while the federal artifact
    // gate is shut: there is no form to serve on anybody. Returning the open
    // path here (`statewide_serve_employer_do_not_file`, no reason codes, no
    // manual review, and the statewide "served on the employer" copy) told a
    // caller the exact opposite of the gate's actual state, and did it while
    // `federalForm.usable` was false. Every field below moves to the refusing
    // side, and the copy states the cause that actually closed the gate.
    if (!federalForm.usable) {
      const blockedLane = (note: string): IwoLane => ({
        decision: "conditional_unresolved",
        autoDecided: false,
        note,
      })
      const gateNote =
        "The federal Income Withholding for Support artifact is not available for distribution, so this lane is not resolved."
      return {
        countyId: input.countyId,
        disposition: workflow.disposition,
        pathDecision: "undetermined_manual_review",
        requiresManualReview: true,
        completed: false,
        reasonCodes: ["federal_artifact_gate_closed"],
        lanes: {
          employerService: blockedLane(gateNote),
          postServiceFiling: blockedLane(gateNote),
          proposedOrder: blockedLane(gateNote),
          noticeProof: blockedLane(gateNote),
        },
        federalForm,
        copy: federalGateCopy(federalForm.blockers),
        evidence: workflow.evidence,
      }
    }

    const lane = (note: string): IwoLane => ({
      decision: "statewide_default_serve_employer",
      autoDecided: false,
      note,
    })
    return {
      countyId: input.countyId,
      disposition: workflow.disposition,
      pathDecision: "statewide_serve_employer_do_not_file",
      requiresManualReview: false,
      completed: false,
      reasonCodes: [],
      lanes: {
        employerService: lane("Statewide instruction: served on the employer."),
        postServiceFiling: lane("Statewide instruction: not filed with the Circuit Clerk."),
        proposedOrder: lane("No county-specific proposed-order lane identified."),
        noticeProof: lane("Statewide notice mechanics apply."),
      },
      federalForm,
      copy: IWO_NEUTRAL_COPY.statewide_default,
      evidence: workflow.evidence,
    }
  }

  // ── manual/conditional ─────────────────────────────────────────────────────
  // Either an identified county-specific conflict (Will), or a county id we do
  // not recognize — in which case we must not restate Will's specific conflict.
  const recognized = isCanonicalCountyId(input.countyId)
  const reasonCodes: IwoReasonCode[] = recognized
    ? [
        "will_local_rule_vs_statewide_filing_conflict",
        "judge_direction_required",
        "post_service_filing_conditional",
        "proposed_order_lane_separate",
        "notice_proof_scope_unresolved",
        "packet_placement_not_established",
      ]
    : ["county_unknown_or_noncanonical", "packet_placement_not_established"]
  if (input.employerChanged) reasonCodes.push("employer_change_scenario_conditional")
  if (!federalForm.usable) reasonCodes.push("federal_artifact_gate_closed")

  const directed = input.caseSpecificDirection !== undefined
  const directedLane = (note: string): IwoLane => ({
    decision: "directed_by_case_specific_input",
    // The direction came from outside the product; the product did not decide.
    autoDecided: false,
    note,
  })
  const unresolvedLane = (note: string): IwoLane => ({
    decision: "conditional_unresolved",
    autoDecided: false,
    note,
  })

  return {
    countyId: input.countyId,
    disposition: "manual_conditional",
    // Stays undetermined regardless of supplied direction: the product does not
    // convert a single input into a completed procedural path.
    pathDecision: "undetermined_manual_review",
    requiresManualReview: true,
    completed: false,
    reasonCodes: [...new Set(reasonCodes)].sort(),
    lanes: {
      employerService:
        directed && input.caseSpecificDirection !== "proposed_order_submission"
          ? directedLane("Employer service indicated by case-specific direction on file.")
          : unresolvedLane("Employer service depends on case-specific direction."),
      postServiceFiling:
        input.caseSpecificDirection === "file_after_employer_service"
          ? directedLane("Filing after employer service indicated by case-specific direction on file.")
          : unresolvedLane(
              recognized
                ? "Local rule directs filing after employer service; the statewide instruction directs not filing. Not resolved by the product."
                : "This county's filing procedure is not on file. Not resolved by the product.",
            ),
      proposedOrder:
        input.caseSpecificDirection === "proposed_order_submission"
          ? directedLane("Proposed-order submission indicated by case-specific direction on file.")
          : unresolvedLane("Proposed-order submission is a separate lane, used only in some cases."),
      noticeProof: unresolvedLane(
        recognized
          ? "Notice is required by the local rule; whether proof is filed, and its scope, is not established by the sources on file."
          : "Notice and proof mechanics for this county are not on file.",
      ),
    },
    federalForm,
    copy: recognized
      ? IWO_NEUTRAL_COPY.will
      : [
          "This form's handling depends on the county, and the county for this case has not been identified from the supported list. This item is set aside for manual review.",
        ],
    evidence: workflow.evidence,
  }
}

export interface DeferredPacketItem {
  formId: string
  disposition: IwoDisposition
  reasonCodes: IwoReasonCode[]
  copy: string[]
}

export interface CountyPacket {
  countyId: string
  forms: CourtForm[]
  /** Items intentionally withheld from automatic packet composition. */
  deferred: DeferredPacketItem[]
}

/**
 * County-aware packet composition.
 *
 * For counties whose IWO handling is `manual_conditional`, the IWO is withheld
 * from automatic composition and surfaced as a deferred manual-review item —
 * the underlying case data is preserved, and nothing is silently dropped.
 * For every other county the composition is byte-for-byte the existing
 * `getFormsForCaseType` behavior.
 */
export interface PacketCompositionOptions {
  /** Directory holding the guarded federal artifact. */
  artifactDir: string
  today?: Date
  /** Injected ONLY by test factories; product entry points never pass this. */
  renewalEvidence?: IwoRenewalEvidence
}

function composePacket(
  countyId: string,
  baseForms: CourtForm[],
  options: PacketCompositionOptions,
): CountyPacket {
  const workflow = getCountyIwoWorkflow(countyId)
  const federal = validateIwo(options.artifactDir, options.today ?? new Date(), options.renewalEvidence)
  const federalGateOpen = federal.blockers.length === 0

  // The federal artifact gate applies to EVERY county. A non-Will county keeps
  // its existing procedural default ONLY while that gate is open.
  const countyAllows = workflow.autoPacketPlacementAllowed
  if (countyAllows && federalGateOpen) {
    return { countyId, forms: baseForms, deferred: [] }
  }

  const forms = baseForms.filter((f) => f.id !== IWO_FORM_ID)
  if (baseForms.length === forms.length) {
    // The IWO was not in this packet to begin with — nothing to withhold.
    return { countyId, forms, deferred: [] }
  }

  const reasonCodes: IwoReasonCode[] = []
  if (!countyAllows) {
    if (!isCanonicalCountyId(countyId)) {
      reasonCodes.push("county_unknown_or_noncanonical")
    } else {
      reasonCodes.push(
        "judge_direction_required",
        "packet_placement_not_established",
        "will_local_rule_vs_statewide_filing_conflict",
      )
    }
  }
  if (!federalGateOpen) reasonCodes.push("federal_artifact_gate_closed")

  return {
    countyId,
    forms,
    deferred: [
      {
        formId: IWO_FORM_ID,
        disposition: workflow.disposition,
        reasonCodes: [...new Set(reasonCodes)].sort(),
        // A closed federal gate no longer borrows one fixed sentence: the
        // deferred item states the cause that actually closed it.
        copy: countyAllows ? federalGateCopy(federal.blockers) : IWO_NEUTRAL_COPY.will,
      },
    ],
  }
}

export function getOpeningPacketForms(
  countyId: string,
  hasChildren: boolean,
  options: PacketCompositionOptions,
): CountyPacket {
  return composePacket(countyId, getFormsForCaseType(hasChildren), options)
}

/**
 * Prove-up packet composition. Derived from the same catalog; the IWO is
 * subject to the same county disposition and federal gate as the opening packet.
 */
export function getProveUpPacketForms(
  countyId: string,
  hasChildren: boolean,
  options: PacketCompositionOptions,
): CountyPacket {
  const proveUp = getFormsForCaseType(hasChildren).filter(
    (f) => f.category === "judgment" || f.category === "support",
  )
  return composePacket(countyId, proveUp, options)
}

/**
 * Canonical county ids are the exact lowercase slugs used as keys in
 * ILLINOIS_COUNTIES (e.g. "will", "dupage").
 *
 * This is deliberately STRICT and does not normalize. Blank, whitespace-padded,
 * mixed-case ("Will"), display-form ("Will County"), or unknown values all
 * return false so callers fail closed to manual review rather than silently
 * being treated as a `statewide_default` county. Note that `CaseInfo.county` is
 * free text today, so most stored values will not be canonical — that is the
 * intended fail-closed path, not a bug.
 */
export function isCanonicalCountyId(countyId: unknown): countyId is string {
  if (typeof countyId !== "string") return false
  if (countyId.length === 0) return false
  if (!/^[a-z]+$/.test(countyId)) return false
  return Object.prototype.hasOwnProperty.call(ILLINOIS_COUNTIES, countyId)
}

/** Convenience: is this a county id the registry actually knows about? */
export function isKnownCounty(countyId: string): boolean {
  return isCanonicalCountyId(countyId)
}
