/**
 * Extended validation tests - sanitizeString and escapeHtml
 * @jest-environment node
 */

import { sanitizeString, escapeHtml } from "@/lib/security/validation"

describe("sanitizeString", () => {
  it("removes script tags", () => {
    expect(sanitizeString("<script>alert(1)</script>hello")).not.toContain("<script>")
  })

  it("removes event handlers", () => {
    expect(sanitizeString('onclick="alert(1)"')).not.toContain("onclick")
  })

  it("allows safe text", () => {
    expect(sanitizeString("Hello World")).toBe("Hello World")
  })
})

describe("escapeHtml", () => {
  it("escapes < and >", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;")
  })

  it("escapes quotes", () => {
    expect(escapeHtml('"test"')).toContain("&quot;")
  })

  it("handles empty string", () => {
    expect(escapeHtml("")).toBe("")
  })
})
