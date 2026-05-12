/**
 * @jest-environment node
 *
 * Regression coverage for the county-list consumers — both lists used as
 * dropdown sources must agree with the canonical 102-county helper, must
 * include Ford County, and must use the "De Witt" (space) spelling.
 */
import { ALL_ILLINOIS_COUNTIES } from "@/lib/counties/all-counties"
import { ILLINOIS_COUNTIES as CALC_LIST } from "@/lib/calculators/constants"

describe("county-list consumers stay in sync with the canonical list", () => {
  it("lib/calculators/constants.ts ILLINOIS_COUNTIES has exactly 102 entries", () => {
    expect(CALC_LIST).toHaveLength(102)
  })

  it("lib/calculators/constants.ts ILLINOIS_COUNTIES contains Ford County", () => {
    expect(CALC_LIST).toContain("Ford")
  })

  it("lib/calculators/constants.ts ILLINOIS_COUNTIES uses 'De Witt' (with space)", () => {
    expect(CALC_LIST).toContain("De Witt")
    expect(CALC_LIST).not.toContain("DeWitt")
  })

  it("ALL_ILLINOIS_COUNTIES and calculators ILLINOIS_COUNTIES contain the same names", () => {
    const a = new Set([...ALL_ILLINOIS_COUNTIES])
    const b = new Set([...CALC_LIST])
    const inAOnly = [...a].filter((x) => !b.has(x))
    const inBOnly = [...b].filter((x) => !a.has(x))
    expect(inAOnly).toEqual([])
    expect(inBOnly).toEqual([])
  })
})

describe("components/efiling/county-instructions.tsx imports the canonical list", () => {
  it("its rendered dropdown source is ALL_ILLINOIS_COUNTIES (length 102, contains Ford and De Witt)", async () => {
    // The component re-exports the canonical array under its local
    // ILLINOIS_COUNTIES binding. We don't render the full client component
    // here (it pulls Radix Select); we just import the source module
    // statically to assert the alias points at the helper.
    const fs = await import("node:fs")
    const path = await import("node:path")
    const src = fs.readFileSync(
      path.resolve(__dirname, "..", "..", "..", "components/efiling/county-instructions.tsx"),
      "utf8",
    )
    expect(src).toMatch(/from\s+["']@\/lib\/counties\/all-counties["']/)
    expect(src).toMatch(/ILLINOIS_COUNTIES\s*=\s*ALL_ILLINOIS_COUNTIES/)
    // Guard against re-introduction of the local hand-maintained array.
    expect(src).not.toMatch(/const\s+ILLINOIS_COUNTIES\s*=\s*\[/)
  })
})
