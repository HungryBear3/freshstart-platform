import sitemap from './sitemap'
import fs from 'fs'
import path from 'path'
import { prisma } from '@/lib/db'
import * as blog from '@/lib/blog'

jest.mock('fs')
jest.mock('@/lib/db', () => ({
  prisma: {
    legalContent: {
      findMany: jest.fn(),
    },
  },
}))

const fsMock = fs as jest.Mocked<typeof fs>

describe('sitemap', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('includes static pages, legal pages, and blog pages plus blog index', async () => {
    // Mock legalContent DB
    const mockLegalPages = [
      { slug: 'privacy-policy', updatedAt: new Date('2023-01-01') },
      { slug: 'terms-of-service', updatedAt: new Date('2023-02-01') },
    ]
    ;(prisma.legalContent.findMany as jest.Mock).mockResolvedValue(mockLegalPages)

    // Mock fs for blog posts
    fsMock.readdirSync.mockReturnValue(['post1.md', 'post2.md'])
    fsMock.statSync.mockImplementation((filePath) => {
      return { mtime: new Date('2023-03-01') }
    })

    // Mock getAllPosts from blog module
    jest.spyOn(blog, 'getAllPosts').mockReturnValue([
      { slug: 'post1', title: 'Post 1', description: '', date: '2023-03-01', content: '' },
      { slug: 'post2', title: 'Post 2', description: '', date: '2023-03-02', content: '' },
    ])

    const result = await sitemap()

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: expect.stringMatching('/') }),
        expect.objectContaining({ url: expect.stringMatching('/legal-info/privacy-policy') }),
        expect.objectContaining({ url: expect.stringMatching('/legal-info/terms-of-service') }),
        expect.objectContaining({ url: expect.stringMatching('/blog/post1') }),
        expect.objectContaining({ url: expect.stringMatching('/blog/post2') }),
      ])
    )
  })
})
