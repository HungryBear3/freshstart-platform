/**
 * @jest-environment node
 */

import fs from "node:fs"
import path from "node:path"

describe("privacy data export fit-check coverage", () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), "app/api/auth/export-data/route.ts"),
    "utf8",
  )

  it("loads and returns fit-check assessments in the user export", () => {
    expect(source).toMatch(/include:\s*\{[\s\S]*fitCheckAssessments:\s*true/)
    expect(source).toMatch(/fitCheckAssessments:\s*userData\.fitCheckAssessments/)
    expect(source).toContain('exportVersion: "1.2"')
  })
})
