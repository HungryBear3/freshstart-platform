/**
 * CC-05 PR-5 — non-official output boundary.
 *
 * Renders the personalized summary / checklist / filing guidance the $149 offer
 * actually sells, in a shape that cannot be mistaken for a court form:
 *
 *   - typed `officialForm: false` and `filingReady: false` (literal types);
 *   - a fixed banner as the first AND last line;
 *   - bullet layout only — no caption block, no numbered form lines, no blank
 *     fill or signature lines;
 *   - every input string is scanned for official markers, and ANY hit refuses
 *     the whole render. Markers are never stripped and the rest shipped; a
 *     half-cleaned document is still the wrong document.
 *   - the rendered text is re-scanned before it is returned.
 *
 * R5 — non-legal-advice. Marker scanning proves the output does not LOOK like
 * a court form; it says nothing about whether it gives legal advice. So every
 * sentence Fresh Start writes here — title, labels, checklist items, guidance —
 * is a fixed template chosen by id from `NON_OFFICIAL_TEMPLATES`; callers can
 * no longer pass guidance text at all. Summary values are the customer's own
 * answers, and each must fit its label's CLOSED schema (a county name from the
 * statewide list, a child count, a year) — so there is no free text left in
 * which to phrase advice. `findLegalAdviceContent`, which refuses
 * recommendations about rights, strategy, settlement, waiver, outcomes, or what
 * anyone "should" do, still runs on every value and on the assembled document
 * as a second, independent layer.
 *
 * The banner, chrome and every template are NEW user-visible copy and are held
 * for owner copy approval (`copyApproval` says so on every document). This
 * module is not wired to any route.
 *
 * Deterministic: no clock, no randomness, no I/O besides hashing.
 */
import crypto from "node:crypto"

import { ALL_ILLINOIS_COUNTIES } from "@/lib/counties/all-counties"
import { deepFreeze } from "@/lib/forms/form-stack/provenance-ledger"
import {
  canonicalizeForDetection,
  canonicalizeWithSlots,
  findDisplayTextDefects,
  slotTolerant,
} from "@/lib/forms/form-stack/text-canonicalization"

export const NON_OFFICIAL_OUTPUT_VERSION = "cc05-2026-09-26.1"

/** HOLD: new copy, pending owner approval. */
export const NON_OFFICIAL_BANNER =
  "FRESH START PERSONAL ORGANIZER — NOT A COURT FORM — NOT FOR FILING"

const CHROME = deepFreeze({
  about: "About this document",
  aboutBody:
    "This is a personal summary Fresh Start put together from your answers. It is not a court form, it is not filed with any court, and it is not legal advice.",
  summary: "What you told us",
  checklist: "Your checklist",
  guidance: "Filing guidance to confirm with your county",
})

// Patterns run on canonical text (see text-canonicalization.ts): lowercase,
// single spaces, "-" for every dash; each invisible-control run is a slot that
// `slotTolerant` lets read as nothing or as a space, independently (B4).
const MARKERS: readonly (readonly [string, RegExp])[] = deepFreeze([
  [
    "court_caption",
    /\bin the circuit court\b|\bcircuit court of\b|\bin re (the )?marriage of\b|\bjudicial circuit\b/,
  ],
  ["case_number", /\bcase ?(no\.?|number|#) ?[:#]? ?\w*\d/],
  [
    "official_form_number",
    /\bomb\b|\b\d{4}-\d{4}\b|\b(atj|dv-?wi|hfs) ?[-\d]|\bform (no\.?|number|code)\b/,
  ],
  [
    "signature",
    /\bsignature\b|\bsign here\b|_{3,}|\/s\/|penalt(y|ies) of perjury|\bnotar(y|ized)\b|\bverification by certification\b/,
  ],
  [
    "completion_or_acceptance_claim",
    /\b(court|form|filing)-? ?ready\b|\bready to (be )?filed?\b|\bcompleted? (court |official |legal )?forms?\b|\bprepared (court |official |legal )?(forms?|documents?|packets?)\b|\b(we|fresh start) prepared\b|\baccepted by (the )?(clerk|court|judge)\b|\bclerk-? ?accept|\bguarantee/,
  ],
  ["official_claim", /\bofficial/],
])

const SLOT_MARKERS = deepFreeze(MARKERS.map(([code, re]) => [code, slotTolerant(re)] as const))

/** Marker codes found under ANY per-control reading of `text`. */
export function findOfficialMarkers(text: string): string[] {
  const canonical = canonicalizeWithSlots(text)
  return SLOT_MARKERS.filter(([, re]) => re.test(canonical)).map(([code]) => code)
}

/**
 * HOLD: every string below is new copy pending owner review. Procedural only:
 * none recommends a choice, predicts an outcome or states a right.
 */
export const NON_OFFICIAL_TEMPLATES = deepFreeze({
  approval: "unapproved_pending_owner_review",
  titles: {
    divorce_organizer: "Your divorce organizer",
  },
  summaryLabels: {
    county: "County you told us",
    children_under_18: "Children under 18",
    marriage_year: "Year of marriage you told us",
    separation_year: "Year of separation you told us",
  },
  checklistItems: {
    gather_tax_returns: "Gather your last two years of tax returns",
    list_bank_accounts: "List your bank accounts and balances",
    gather_pay_stubs: "Gather your recent pay stubs",
    list_debts: "List your debts and monthly payments",
  },
  guidance: {
    ask_clerk_which_forms: "Ask the circuit clerk's office which forms your county expects.",
    ask_clerk_about_fees: "Ask the circuit clerk's office about filing fees in your county.",
    check_county_self_help: "Check your county court's self-help resources for local procedures.",
    talk_to_attorney: "For advice about your situation, talk to a lawyer licensed in Illinois.",
  },
} as const)

type Templates = typeof NON_OFFICIAL_TEMPLATES
export type TitleId = keyof Templates["titles"]
export type SummaryLabelId = keyof Templates["summaryLabels"]
export type ChecklistItemId = keyof Templates["checklistItems"]
export type GuidanceId = keyof Templates["guidance"]

const YEAR = /^(19[3-9]\d|20\d\d)$/
const COUNTY_NAMES: ReadonlySet<string> = new Set(ALL_ILLINOIS_COUNTIES)

/** The only values each summary label accepts. No label takes free text. */
const SUMMARY_VALUE_SCHEMAS: Readonly<Record<SummaryLabelId, (v: string) => boolean>> = {
  county: v => COUNTY_NAMES.has(v),
  children_under_18: v => /^(None|[1-9]|1\d)$/.test(v),
  marriage_year: v => YEAR.test(v),
  separation_year: v => YEAR.test(v),
}

export interface NonOfficialInput {
  titleId: TitleId
  /** `value` is the customer's own answer — the only free text accepted. */
  summary: { labelId: SummaryLabelId; value: string }[]
  checklist: { itemId: ChecklistItemId; done: boolean }[]
  guidance: GuidanceId[]
}

/** Own-property lookup only: `constructor` and `__proto__` are not template ids. */
function template(table: Readonly<Record<string, string>>, id: unknown): string | null {
  return typeof id === "string" && Object.prototype.hasOwnProperty.call(table, id)
    ? table[id]
    : null
}

// Run on canonical text. Deliberately broad: a customer fact that trips one of
// these is refused, not reworded — the policy fails closed.
const ADVICE: readonly (readonly [string, RegExp])[] = deepFreeze([
  [
    "prescriptive",
    /\bshould\b|\bought\b|\bhad better\b|\byou (must|need to|have to)\b|\b(it is|it's) (best|wise|better) to\b/,
  ],
  [
    "recommendation",
    /\brecommend|\badvis(e|es|ed|able|ing)\b|\bsuggest|\bbest (option|choice|move|course|path)\b|\bin (our|my) (view|opinion)\b/,
  ],
  ["waiver", /\bwaiv/],
  [
    "settlement",
    /\bsettl|\b(accept|agree to|take|sign) (the|this|that|their|his|her|any|an?) (offer|deal|terms|agreement)\b/,
  ],
  [
    "outcome",
    /\byou (will|would|are going to) (win|lose|get|receive|keep|obtain|be awarded)\b|\blikely\b|\bchances? (of|to|are)\b|\bthe (judge|court) will\b|\bguarantee/,
  ],
  [
    "rights",
    /\byour rights?\b|\bentitled\b|\byou have (a|the) right\b|\byou are (not )?(required|obligated)\b/,
  ],
  ["strategy", /\bstrateg|\bleverage\b|\btactic/],
])

const SLOT_ADVICE = deepFreeze(ADVICE.map(([code, re]) => [code, slotTolerant(re)] as const))

/** Advice categories found under ANY per-control reading of `text`. */
export function findLegalAdviceContent(text: string): string[] {
  const canonical = canonicalizeWithSlots(text)
  return SLOT_ADVICE.filter(([, re]) => re.test(canonical)).map(([code]) => code)
}

export interface NonOfficialDocument {
  kind: "fresh_start_non_official_summary"
  version: string
  officialForm: false
  filingReady: false
  banner: string
  copyApproval: "unapproved_pending_owner_review"
  text: string
  sha256: string
}

export type NonOfficialRender =
  | { ok: true; document: NonOfficialDocument }
  | { ok: false; violations: string[] }

// Built from an ASCII string so no raw U+2028/U+2029 ever sits in the source.
const LINE_BREAK = new RegExp("[\\r\\n\\u2028\\u2029]")
const MAX_LEN = 300
const MAX_ITEMS = 60

interface Resolved {
  title: string
  summary: { label: string; value: string }[]
  checklist: { text: string; done: boolean }[]
  guidance: string[]
}

/** `null` = malformed shape. Unknown ids are reported through `violations`. */
function resolveInput(input: NonOfficialInput, violations: Set<string>): Resolved | null {
  const isStr = (v: unknown): v is string => typeof v === "string"
  if (!input || typeof input !== "object") return null
  if (![input.summary, input.checklist, input.guidance].every(Array.isArray)) return null
  const T = NON_OFFICIAL_TEMPLATES
  const need = (t: string | null): string => {
    if (t === null) violations.add("unknown_template_id")
    return t ?? ""
  }
  const out: Resolved = {
    title: need(template(T.titles, input.titleId)),
    summary: [],
    checklist: [],
    guidance: [],
  }
  for (const s of input.summary) {
    if (!s || !isStr(s.value)) return null
    const label = template(T.summaryLabels, s.labelId)
    if (label !== null && !SUMMARY_VALUE_SCHEMAS[s.labelId](s.value)) {
      violations.add(`summary_value_invalid:${s.labelId}`)
    }
    out.summary.push({ label: need(label), value: s.value })
  }
  for (const c of input.checklist) {
    if (!c || typeof c.done !== "boolean") return null
    out.checklist.push({ text: need(template(T.checklistItems, c.itemId)), done: c.done })
  }
  for (const g of input.guidance) out.guidance.push(need(template(T.guidance, g)))
  if (new Set(input.guidance).size !== input.guidance.length)
    violations.add("duplicate_template_id")
  return out
}

export function renderNonOfficialSummary(input: NonOfficialInput): NonOfficialRender {
  const violations = new Set<string>()
  const doc = resolveInput(input, violations)
  if (doc === null) return { ok: false, violations: ["malformed_input"] }

  const lists = [doc.summary, doc.checklist, doc.guidance]
  if (lists.some(l => l.length > MAX_ITEMS)) violations.add("input_too_large")
  const chrome = new Set(
    [NON_OFFICIAL_BANNER, ...Object.values(CHROME)].flatMap(canonicalizeForDetection)
  )
  // Templates are reviewed copy and pinned by tests; only customer values are
  // untrusted. Every value is still checked the same way as before.
  for (const { value: s } of doc.summary) {
    if (s.length > MAX_LEN) violations.add("input_too_large")
    if (LINE_BREAK.test(s)) violations.add("multiline_value")
    // Original text is displayed only if it is already plain, canonical text.
    for (const d of findDisplayTextDefects(s)) violations.add(d)
    for (const v of canonicalizeForDetection(s)) {
      if (v.includes("not a court form") || chrome.has(v)) violations.add("chrome_forgery")
    }
    for (const m of findOfficialMarkers(s)) violations.add(m)
    for (const a of findLegalAdviceContent(s)) violations.add(`legal_advice:${a}`)
  }
  if (violations.size > 0) return { ok: false, violations: [...violations].sort() }

  const lines = [
    NON_OFFICIAL_BANNER,
    "",
    `# ${doc.title}`,
    "",
    `## ${CHROME.about}`,
    CHROME.aboutBody,
    "",
    `## ${CHROME.summary}`,
    ...doc.summary.map(s => `- ${s.label}: ${s.value}`),
    "",
    `## ${CHROME.checklist}`,
    ...doc.checklist.map(c => `- [${c.done ? "x" : " "}] ${c.text}`),
    "",
    `## ${CHROME.guidance}`,
    ...doc.guidance.map(g => `- ${g}`),
    "",
    NON_OFFICIAL_BANNER,
  ]
  const text = lines.join("\n")

  // Belt and braces: the assembled document is re-scanned as a whole.
  const post = [
    ...findOfficialMarkers(text),
    ...findLegalAdviceContent(text).map(a => `legal_advice:${a}`),
  ]
  if (post.length > 0) return { ok: false, violations: post.map(p => `${p}:assembled`) }

  return {
    ok: true,
    document: deepFreeze({
      kind: "fresh_start_non_official_summary",
      version: NON_OFFICIAL_OUTPUT_VERSION,
      officialForm: false,
      filingReady: false,
      banner: NON_OFFICIAL_BANNER,
      copyApproval: NON_OFFICIAL_TEMPLATES.approval,
      text,
      sha256: crypto.createHash("sha256").update(text).digest("hex"),
    }),
  }
}
