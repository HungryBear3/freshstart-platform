/**
 * Guardrails for the canonical Illinois-county list.
 *
 * If any of these tests fail, the "available in all 102 counties" availability
 * claim on the marketing site is no longer literally true and the copy must be
 * updated before deploy.
 */
import {
  ALL_ILLINOIS_COUNTIES,
  ILLINOIS_COUNTY_COUNT,
} from "@/lib/counties/all-counties"

describe("ALL_ILLINOIS_COUNTIES (canonical)", () => {
  it("has exactly 102 entries", () => {
    expect(ALL_ILLINOIS_COUNTIES).toHaveLength(ILLINOIS_COUNTY_COUNT)
    expect(ILLINOIS_COUNTY_COUNT).toBe(102)
  })

  it("has no duplicate names (case-insensitive)", () => {
    const lower = ALL_ILLINOIS_COUNTIES.map((c) => c.toLowerCase())
    const unique = new Set(lower)
    expect(unique.size).toBe(ALL_ILLINOIS_COUNTIES.length)
  })

  it("includes the multi-word and punctuated names exactly", () => {
    // These are the historical foot-guns that get accidentally split or
    // de-spaced by parsers / copy tools.
    expect(ALL_ILLINOIS_COUNTIES).toContain("Jo Daviess")
    expect(ALL_ILLINOIS_COUNTIES).toContain("Rock Island")
    expect(ALL_ILLINOIS_COUNTIES).toContain("St. Clair")
    expect(ALL_ILLINOIS_COUNTIES).toContain("DeKalb")
    expect(ALL_ILLINOIS_COUNTIES).toContain("De Witt")
    // Guard against regression to the older no-space spelling, which exists
    // in older versions of the e-filing dropdown and calculator constants.
    expect(ALL_ILLINOIS_COUNTIES).not.toContain("DeWitt")
    expect(ALL_ILLINOIS_COUNTIES).toContain("Ford")
    expect(ALL_ILLINOIS_COUNTIES).toContain("DuPage")
    expect(ALL_ILLINOIS_COUNTIES).toContain("LaSalle")
  })

  it("includes the major-population counties", () => {
    // Sanity check against population top-10; not exhaustive.
    for (const c of [
      "Cook",
      "DuPage",
      "Lake",
      "Will",
      "Kane",
      "McHenry",
      "Winnebago",
      "Madison",
      "St. Clair",
      "Champaign",
    ]) {
      expect(ALL_ILLINOIS_COUNTIES).toContain(c)
    }
  })

  it("entries are non-empty trimmed strings", () => {
    for (const c of ALL_ILLINOIS_COUNTIES) {
      expect(typeof c).toBe("string")
      expect(c.length).toBeGreaterThan(0)
      expect(c).toBe(c.trim())
    }
  })
})
