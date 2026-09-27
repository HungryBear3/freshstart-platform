/**
 * @jest-environment node
 *
 * CC-05 R4 — strict calendar dates.
 *
 * `Date.parse` normalizes: `2026-02-30` silently becomes March 2nd, and a
 * timestamp carrying any offset is accepted and shifted. Trust and freshness
 * decisions must never be made on a date that did not exist or on a timestamp
 * outside the contract, so these parsers accept exact syntax AND require the
 * value to round-trip through the calendar unchanged.
 */
import {
  addCalendarYearsStrict,
  parseStrictIsoDate,
  parseStrictUtcTimestamp,
} from "@/lib/forms/form-stack/strict-date"

describe("R4 parseStrictIsoDate", () => {
  it("accepts real calendar days, including a real leap day", () => {
    expect(parseStrictIsoDate("2026-09-25")).toBe(Date.UTC(2026, 8, 25) / 86_400_000)
    expect(parseStrictIsoDate("2028-02-29")).toBe(Date.UTC(2028, 1, 29) / 86_400_000)
    expect(parseStrictIsoDate("2000-02-29")).not.toBeNull()
  })

  it.each([
    "2026-02-30",
    "2026-02-29",
    "2100-02-29",
    "2026-04-31",
    "2026-13-01",
    "2026-00-10",
    "2026-09-00",
    "2026-9-25",
    "26-09-25",
    "+002026-09-25",
    " 2026-09-25",
    "2026-09-25 ",
    "2026-09-25\n",
    "2026-09-25T00:00:00Z",
    "2026-09-25T00:00:00+05:00",
    "2026/09/25",
    "２０２６-09-25",
    "",
  ])("rejects %j", value => {
    expect(parseStrictIsoDate(value)).toBeNull()
  })

  it("rejects non-strings without coercion", () => {
    for (const v of [20260925, null, undefined, new Date("2026-09-25"), ["2026-09-25"]])
      expect(parseStrictIsoDate(v)).toBeNull()
  })
})

describe("R4 parseStrictUtcTimestamp", () => {
  it("accepts only the canonical toISOString form", () => {
    const iso = "2026-09-26T15:00:00.000Z"
    expect(parseStrictUtcTimestamp(iso)).toBe(Date.parse(iso))
  })

  it.each([
    "2026-02-30T15:00:00.000Z",
    "2027-02-29T00:00:00.000Z",
    "2026-09-26T24:00:00.000Z",
    "2026-09-26T23:59:60.000Z",
    "2026-09-26T15:00:00Z",
    "2026-09-26T15:00:00.000+00:00",
    "2026-09-26T15:00:00.000-05:00",
    "2026-09-26T15:00:00.000z",
    "2026-09-26 15:00:00.000Z",
    "2026-09-26T15:00:00.0000Z",
    "2026-09-26",
    "+002026-09-26T15:00:00.000Z",
  ])("rejects %j", value => {
    expect(parseStrictUtcTimestamp(value)).toBeNull()
  })
})

describe("R4 addCalendarYearsStrict", () => {
  it("adds whole years to a real day", () => {
    expect(addCalendarYearsStrict("2026-08-25", 1)).toBe("2027-08-25")
  })

  it("refuses a result that does not exist instead of rolling it forward", () => {
    expect(addCalendarYearsStrict("2028-02-29", 1)).toBeNull()
    expect(addCalendarYearsStrict("2026-02-30", 1)).toBeNull()
  })
})
