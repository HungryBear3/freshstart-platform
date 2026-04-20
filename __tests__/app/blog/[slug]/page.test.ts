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

describe("Blog post generateMetadata", () => {
  it("includes correct canonical metadata URL", async () => {
    const params = { slug: "test-post" }
    const metadata = await generateMetadata({ params })
    expect(metadata.alternates?.canonical).toBe(
      "https://www.freshstart-il.com/blog/test-post"
    )
  })

  it("returns title and description", async () => {
    const params = { slug: "test-post" }
    const metadata = await generateMetadata({ params })
    expect(metadata.title).toBe("Test Post | Fresh Start IL")
    expect(metadata.description).toBe("Test description")
  })

  it("returns empty object for missing post", async () => {
    const { getPostBySlug } = require("@/lib/blog")
    ;(getPostBySlug as jest.Mock).mockResolvedValueOnce(null)
    const params = { slug: "nonexistent" }
    const metadata = await generateMetadata({ params })
    expect(metadata).toEqual({})
  })
})
