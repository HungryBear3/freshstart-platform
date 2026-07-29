import { getAllPosts, getPostBySlug } from '@/lib/blog'
import { SITE_URL } from '@/lib/site-url'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

type BlogPostPageParams = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: BlogPostPageParams) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return {}
  return {
    title: `${post.title} | Fresh Start IL`,
    description: post.description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `/blog/${slug}`,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "FreshStart-IL — Illinois divorce form preparation." }],
    },
    twitter: {
      card: "summary_large_image",
      images: ["/opengraph-image"],
    },
  }
}

export default async function BlogPostPage({ params }: BlogPostPageParams) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    publisher: {
      "@type": "Organization",
      name: "FreshStart IL",
      url: SITE_URL,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-3xl mx-auto px-4 py-16">
        <a href="/blog" className="text-blue-600 text-sm hover:underline mb-6 inline-block">← Back to Blog</a>
        <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
        <p className="text-sm text-gray-400 mb-8">
          {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <div
          className="prose prose-gray max-w-none"
          dangerouslySetInnerHTML={{ __html: post.contentHtml || '' }}
        />
      </div>
    </>
  )
}
