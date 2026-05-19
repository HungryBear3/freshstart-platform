import { readFileSync } from "fs"
import { join } from "path"
import { metadata } from "../../app/layout"

describe("Homepage metadata", () => {
  it("has user-focused description texts", () => {
    expect(metadata.description).toContain("Simplify")
    expect((metadata.openGraph as { description?: string }).description).toContain("Simplify")
    expect((metadata.twitter as { description?: string }).description).toContain("Simplify")
  })

  it("renders root JSON-LD as individual objects with @context, not one array payload", () => {
    const source = readFileSync(join(process.cwd(), "app/layout.tsx"), "utf8")

    expect(source).toContain("organizationAndWebsiteJsonLd.map((jsonLd)")
    expect(source).toContain("JSON.stringify(jsonLd)")
    expect(source).not.toContain("JSON.stringify(organizationAndWebsiteJsonLd)")
  })
})
