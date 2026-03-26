import { generateMetadata } from '@/app/blog/[slug]/page'

describe('Blog post generateMetadata', () => {
  it('includes correct canonical metadata URL', async () => {
    const params = { slug: 'test-post' }
    const metadata = await generateMetadata({ params })
    expect(metadata.canonical).toBe('https://www.freshstart-il.com/blog/test-post')
  })
})
