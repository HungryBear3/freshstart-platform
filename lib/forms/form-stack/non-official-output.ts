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
 * The banner and chrome sentences are NEW user-visible copy and are held for
 * owner copy approval. This module is not wired to any route.
 *
 * Deterministic: no clock, no randomness, no I/O besides hashing.
 */
import crypto from "node:crypto"

import { deepFreeze } from "@/lib/forms/form-stack/provenance-ledger"

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

const MARKERS: readonly (readonly [string, RegExp])[] = deepFreeze([
  [
    "court_caption",
    /\bin the circuit court\b|\bcircuit court of\b|\bin re (the )?marriage of\b|\bjudicial circuit\b/i,
  ],
  ["case_number", /\bcase\s*(no\.?|number|#)\s*[:#]?\s*\w*\d/i],
  [
    "official_form_number",
    /\bOMB\b|\b\d{4}-\d{4}\b|\b(ATJ|DV-WI|HFS)\s*[-\d]|\bform\s+(no\.?|number|code)\b/i,
  ],
  [
    "signature",
    /\bsignature\b|\bsign here\b|_{3,}|\/s\/|penalt(y|ies) of perjury|\bnotar(y|ized)\b|\bverification by certification\b/i,
  ],
  [
    "completion_or_acceptance_claim",
    /\b(court|form|filing)[- ]ready\b|\bready to (be )?filed?\b|\bcompleted? (court |official |legal )?forms?\b|\bprepared (court |official |legal )?(forms?|documents?|packets?)\b|\b(we|fresh start) prepared\b|\baccepted by (the )?(clerk|court|judge)\b|\bclerk[- ]accept|\bguarantee/i,
  ],
  ["official_claim", /\bofficial\b/i],
])

export function findOfficialMarkers(text: string): string[] {
  return MARKERS.filter(([, re]) => re.test(text)).map(([code]) => code)
}

export interface NonOfficialInput {
  title: string
  summary: { label: string; value: string }[]
  checklist: { text: string; done: boolean }[]
  guidance: string[]
}

export interface NonOfficialDocument {
  kind: "fresh_start_non_official_summary"
  version: string
  officialForm: false
  filingReady: false
  banner: string
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

function collectStrings(input: NonOfficialInput): string[] | null {
  const isStr = (v: unknown): v is string => typeof v === "string"
  if (!input || !isStr(input.title)) return null
  if (![input.summary, input.checklist, input.guidance].every(Array.isArray)) return null
  const out = [input.title]
  for (const s of input.summary) {
    if (!s || !isStr(s.label) || !isStr(s.value)) return null
    out.push(s.label, s.value)
  }
  for (const c of input.checklist) {
    if (!c || !isStr(c.text) || typeof c.done !== "boolean") return null
    out.push(c.text)
  }
  for (const g of input.guidance) {
    if (!isStr(g)) return null
    out.push(g)
  }
  return out
}

export function renderNonOfficialSummary(input: NonOfficialInput): NonOfficialRender {
  const strings = collectStrings(input)
  if (strings === null) return { ok: false, violations: ["malformed_input"] }

  const violations = new Set<string>()
  const lists = [input.summary, input.checklist, input.guidance]
  if (lists.some(l => l.length > MAX_ITEMS)) violations.add("input_too_large")
  const chrome = [NON_OFFICIAL_BANNER, ...Object.values(CHROME)].map(s => s.toLowerCase())
  for (const s of strings) {
    if (s.length > MAX_LEN) violations.add("input_too_large")
    if (LINE_BREAK.test(s)) violations.add("multiline_value")
    const lower = s.toLowerCase()
    if (lower.includes("not a court form") || chrome.includes(lower.trim()))
      violations.add("chrome_forgery")
    for (const m of findOfficialMarkers(s)) violations.add(m)
  }
  if (violations.size > 0) return { ok: false, violations: [...violations].sort() }

  const lines = [
    NON_OFFICIAL_BANNER,
    "",
    `# ${input.title}`,
    "",
    `## ${CHROME.about}`,
    CHROME.aboutBody,
    "",
    `## ${CHROME.summary}`,
    ...input.summary.map(s => `- ${s.label}: ${s.value}`),
    "",
    `## ${CHROME.checklist}`,
    ...input.checklist.map(c => `- [${c.done ? "x" : " "}] ${c.text}`),
    "",
    `## ${CHROME.guidance}`,
    ...input.guidance.map(g => `- ${g}`),
    "",
    NON_OFFICIAL_BANNER,
  ]
  const text = lines.join("\n")

  // Belt and braces: the assembled document is re-scanned as a whole.
  const post = findOfficialMarkers(text)
  if (post.length > 0) return { ok: false, violations: post.map(p => `${p}:assembled`) }

  return {
    ok: true,
    document: deepFreeze({
      kind: "fresh_start_non_official_summary",
      version: NON_OFFICIAL_OUTPUT_VERSION,
      officialForm: false,
      filingReady: false,
      banner: NON_OFFICIAL_BANNER,
      text,
      sha256: crypto.createHash("sha256").update(text).digest("hex"),
    }),
  }
}
