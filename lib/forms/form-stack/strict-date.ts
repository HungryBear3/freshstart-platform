/**
 * CC-05 R4 — strict calendar dates and timestamps.
 *
 * `Date.parse` is permissive in two ways that matter to trust decisions: it
 * rolls impossible days forward (`2026-02-30` becomes March 2nd) and it accepts
 * any offset. A receipt dated on a day that never existed must be malformed,
 * not "fresh". So each parser here accepts one exact syntax AND requires the
 * value to round-trip through the calendar unchanged.
 *
 * No clock, no I/O.
 */

const DAY_MS = 86_400_000
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/
const UTC_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

/**
 * `YYYY-MM-DD`, a real calendar day, nothing else. Returns the UTC day number
 * (days since 1970-01-01) or `null`. No offsets, no time part, no whitespace.
 */
export function parseStrictIsoDate(value: unknown): number | null {
  if (typeof value !== "string") return null
  const m = ISO_DATE.exec(value)
  if (!m) return null
  const ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  if (Number.isNaN(ms)) return null
  if (new Date(ms).toISOString().slice(0, 10) !== value) return null
  return ms / DAY_MS
}

/**
 * The canonical `Date#toISOString` form only: `YYYY-MM-DDTHH:MM:SS.sssZ`.
 * Any offset (including `+00:00`), a missing fraction, a lowercase `z`, a leap
 * second or an impossible day is rejected. Returns epoch ms or `null`.
 */
export function parseStrictUtcTimestamp(value: unknown): number | null {
  if (typeof value !== "string" || !UTC_TIMESTAMP.test(value)) return null
  const ms = Date.parse(value)
  if (Number.isNaN(ms)) return null
  return new Date(ms).toISOString() === value ? ms : null
}

/** Adds whole years; `null` when the input or the result is not a real day. */
export function addCalendarYearsStrict(isoDate: string, years: number): string | null {
  if (parseStrictIsoDate(isoDate) === null || !Number.isInteger(years)) return null
  const [y, m, d] = isoDate.split("-")
  const out = `${String(Number(y) + years).padStart(4, "0")}-${m}-${d}`
  return parseStrictIsoDate(out) === null ? null : out
}
