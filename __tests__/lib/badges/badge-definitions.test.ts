/**
 * Unit tests for badge definitions
 * @jest-environment node
 */

import { BADGE_DEFINITIONS } from "@/lib/badges/badge-definitions"

describe("BADGE_DEFINITIONS", () => {
  it("includes all expected badges", () => {
    const ids = Object.keys(BADGE_DEFINITIONS)
    expect(ids).toContain("onboarding")
    expect(ids).toContain("first_petition")
    expect(ids).toContain("first_document")
    expect(ids).toContain("case_info")
  })

  it("each badge has required fields", () => {
    for (const badge of Object.values(BADGE_DEFINITIONS)) {
      expect(badge).toHaveProperty("id")
      expect(badge).toHaveProperty("name")
      expect(badge).toHaveProperty("description")
      expect(badge).toHaveProperty("icon")
      expect(typeof badge.name).toBe("string")
      expect(typeof badge.description).toBe("string")
      expect(badge.name.length).toBeGreaterThan(0)
      expect(badge.description.length).toBeGreaterThan(0)
    }
  })
})
