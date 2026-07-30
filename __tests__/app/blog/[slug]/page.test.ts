jest.mock("@/lib/blog", () => ({
  getPostBySlug: jest.fn().mockResolvedValue({
    title: "Test Post",
    description: "Test description",
    slug: "test-post",
    date: "2025-01-01",
    contentHtml: "<p>Test content</p>",
  }),
  getAllPosts: jest.fn().mockReturnValue([]),
}))

import { generateMetadata } from "@/app/blog/[slug]/page"
import { SITE_URL } from "@/lib/site-url"

describe("Blog post generateMetadata", () => {
  it("includes correct canonical metadata URL", async () => {
    const params = Promise.resolve({ slug: "test-post" })
    const metadata = await generateMetadata({ params })
    // The route returns a ROOT-RELATIVE canonical; Next.js resolves it against
    // `metadataBase` (set in app/layout.tsx to SITE_URL) when rendering the tag.
    // Assert both the raw relative value and that it resolves to the correct
    // absolute URL — this is the same guarantee as before, without depending on
    // metadataBase being applied inside generateMetadata (it is not).
    expect(metadata.alternates?.canonical).toBe("/blog/test-post")
    expect(new URL(String(metadata.alternates?.canonical), SITE_URL).toString()).toBe(
      "https://www.freshstart-il.com/blog/test-post"
    )
  })

  it("returns title and description", async () => {
    const params = Promise.resolve({ slug: "test-post" })
    const metadata = await generateMetadata({ params })
    expect(metadata.title).toBe("Test Post | Fresh Start IL")
    expect(metadata.description).toBe("Test description")
  })

  it("returns empty object for missing post", async () => {
    const { getPostBySlug } = require("@/lib/blog")
    ;(getPostBySlug as jest.Mock).mockResolvedValueOnce(null)
    const params = Promise.resolve({ slug: "nonexistent" })
    const metadata = await generateMetadata({ params })
    expect(metadata).toEqual({})
  })
})
