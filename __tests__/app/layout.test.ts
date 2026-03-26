import { metadata } from "../../app/layout"

describe("Homepage metadata", () => {
  it("has user-focused description texts", () => {
    expect(metadata.description).toContain("Simplify")
    expect(metadata.openGraph.description).toContain("Simplify")
    expect(metadata.twitter.description).toContain("Simplify")
  })
})
