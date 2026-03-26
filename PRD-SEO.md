# FreshStart IL SEO Sprint — PRD

## Goal
Fix critical SEO gaps on freshstart-il.com to improve Google indexing and rankings for Illinois divorce keywords.

## Tasks (in order)

### 1. Fix sitemap.ts — CRITICAL
File: `app/sitemap.ts`

The sitemap currently includes static pages and legal-info pages from the DB, but is MISSING all blog posts. Add blog posts dynamically by reading from `content/blog/` directory.

Use the `fs` module to read blog slugs:
```ts
import fs from 'fs'
import path from 'path'

const blogDir = path.join(process.cwd(), 'content/blog')
const blogSlugs = fs.readdirSync(blogDir)
  .filter(f => f.endsWith('.md'))
  .map(f => f.replace('.md', ''))

const blogPages: MetadataRoute.Sitemap = blogSlugs.map(slug => ({
  url: url(`/blog/${slug}`),
  lastModified: new Date(),
  changeFrequency: 'monthly' as const,
  priority: 0.8,
}))
```

Also add the blog index page `/blog` with priority 0.8.

Include blog pages in the final return array alongside staticPages and legalPages.

### 2. Add JSON-LD Article schema to blog posts
File: `app/blog/[slug]/page.tsx`

Add Article structured data to each blog post. Pattern (same as app/page.tsx which already uses JSON-LD):
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "post.title",
  "description": "post.description",
  "datePublished": "post.date",
  "publisher": {
    "@type": "Organization",
    "name": "FreshStart IL",
    "url": "https://www.freshstart-il.com"
  }
}
```

Inject via `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />` above the article content.

### 3. Improve homepage metadata
File: `app/layout.tsx`

The current description is "Guide people in Illinois through their divorce process with questionnaires, document generation, and court-ready forms." — this is too corporate/internal.

Update to something user-focused like:
- description: "Illinois divorce paperwork — simplified. FreshStart IL fills out your court forms automatically, calculates child support, and tracks your deadlines. Start free."
- keywords: add "illinois uncontested divorce", "illinois divorce forms online", "pro se divorce illinois", "illinois divorce without lawyer", "cook county divorce forms"

### 4. Write 4 new high-value blog posts
Create these files in `content/blog/`:

**Post A:** `uncontested-divorce-illinois-checklist.md`
- Title: "Illinois Uncontested Divorce Checklist: Everything You Need Before You File"
- Target keyword: "uncontested divorce illinois checklist"
- Content: Step-by-step checklist covering: residency requirements, 6-month separation confirmation, asset/debt inventory, parenting plan agreement, financial affidavit prep, filing fee info, and court forms needed. Practical and actionable. 800-1000 words. End with CTA to freshstart-il.com to generate forms automatically.

**Post B:** `illinois-divorce-without-lawyer.md`
- Title: "How to Get a Divorce in Illinois Without a Lawyer (Pro Se Guide)"
- Target keyword: "illinois divorce without lawyer"
- Content: Who qualifies for pro se divorce (uncontested cases), what you need, step-by-step filing process, common mistakes, when you DO need an attorney, and how FreshStart IL handles the paperwork. 800-1000 words. Include CTA.

**Post C:** `illinois-parenting-plan-guide.md`
- Title: "Illinois Parenting Plan: What It Needs to Include (2026 Guide)"
- Target keyword: "illinois parenting plan"
- Content: Explain what a parenting plan is required to include under Illinois law, decision-making responsibilities, parenting time schedules, holiday schedules, dispute resolution clauses, and how to write one. 700-900 words. Include CTA.

**Post D:** `cook-county-divorce-filing-fees.md`
- Title: "Cook County Divorce Filing Fees 2026 — What to Expect"
- Target keyword: "cook county divorce filing fees"
- Content: Current filing fees for Cook County Circuit Court, fee waiver eligibility (in forma pauperis), additional costs to expect (process serving, certified copies), comparison to attorney costs, and how FreshStart IL reduces total cost. 600-800 words. Include CTA.

### 5. Improve internal linking in existing blog posts
In the existing blog posts (especially `how-to-file-for-divorce-in-illinois.md`, `illinois-divorce-forms.md`, and `uncontested-divorce-illinois-guide.md`), add at least 2 internal links each:
- Link to `/start` or `/checklist` with anchor text like "start your Illinois divorce paperwork"
- Link to `/calculators` with anchor text like "calculate your child support"
- Link to relevant other blog posts where natural (e.g., forms post links to checklist post)

### 6. Add canonical tags to blog posts
In `app/blog/[slug]/page.tsx`, add canonical URL to the generateMetadata return:
```ts
alternates: {
  canonical: `https://www.freshstart-il.com/blog/${params.slug}`
}
```

## Done Criteria
- [x] sitemap.ts exports all blog URLs + /blog index (11 existing + 4 new = 15 blog URLs)
- [x] Blog posts have JSON-LD Article schema
- [x] Blog posts have canonical tags in metadata
- [x] Homepage metadata description is user-focused (not internal/corporate)
- [x] 4 new blog posts exist in content/blog/ with proper frontmatter (title, description, date, slug)
- [x] Existing blog posts have internal links added
- [x] Everything compiles without TypeScript errors (run `npx tsc --noEmit` to check)
- [x] Commit all changes with message: "feat(seo): fix sitemap, add schema, new blog posts"

## Notes
- Do NOT modify any auth, dashboard, Stripe, or Supabase-related code
- Do NOT change any existing page layouts or styles
- Blog post dates should be 2026-03-25
- Keep the brand voice: warm, empathetic, supportive — people going through a hard time
- All CTAs should link to `/start` (the signup/start flow) or `/checklist`
- The site serves Illinois residents going through uncontested divorce — keep content Illinois-specific
