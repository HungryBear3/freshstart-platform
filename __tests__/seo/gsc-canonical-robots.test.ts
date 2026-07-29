/**
 * @jest-environment node
 *
 * Google Search Console hardening — defects verified against production on
 * 2026-07-28 by plain GET (no GSC API, no URL Inspection):
 *
 *   GET /                        -> canonical https://www.freshstart-il.com
 *                                   robots "index, follow"
 *   GET /questionnaires          -> 200, robots "index, follow",
 *                                   canonical https://www.freshstart-il.com  (homepage!)
 *   GET /questionnaires/divorce  -> 200, robots "index, follow",
 *                                   canonical https://www.freshstart-il.com  (homepage!)
 *   GET /auth/signin             -> 200, robots "index, follow"
 *
 * Root cause of the wrong canonicals: app/layout.tsx declared
 * `alternates.canonical: "/"`, and Next metadata cascades to every route that
 * does not declare its own — so ~40 internal routes advertised the homepage as
 * their canonical.
 *
 * These tests assert the *resolved* canonical string using the same resolver
 * Next uses to render <link rel="canonical">, so they pin the exact serialized
 * output rather than the authored shorthand.
 */

// app/questionnaires/page.tsx is an auth-gated server component. Stub its data
// and session dependencies so the module can be loaded for its metadata export
// without touching a database. Same pattern as app/sitemap.test.ts.
jest.mock("@/lib/db", () => ({
  prisma: {
    questionnaire: { findMany: jest.fn() },
    questionnaireResponse: { findMany: jest.fn() },
  },
}))
jest.mock("@/lib/auth/session", () => ({ getSession: jest.fn() }))
jest.mock("@/lib/blog", () => ({ getAllPosts: () => [] }))

import { readFileSync } from "fs"
import { resolve } from "path"
import type { Metadata } from "next"

import { metadata as rootMetadata } from "@/app/layout"
import { metadata as homeMetadata } from "@/app/page"
import { metadata as signinMetadata } from "@/app/auth/signin/page"
import { metadata as questionnairesMetadata } from "@/app/questionnaires/page"
import { metadata as questionnairesLayoutMetadata } from "@/app/questionnaires/layout"
import sitemap from "@/app/sitemap"
import robots from "@/app/robots"

const PROD_ORIGIN = "https://www.freshstart-il.com"

// next.config.ts does not set `trailingSlash`, so Next resolves canonicals with
// trailingSlash: false. Asserted below so this constant cannot drift silently.
const TRAILING_SLASH = false

const nextConfigSrc = readFileSync(resolve(__dirname, "../../next.config.ts"), "utf8")

/**
 * Resolve a declared canonical exactly the way Next renders it.
 *
 * `pathname` is the *request* path. Next only consults it for "./"-relative
 * canonicals, which is why a declared absolute-path canonical is inherently
 * independent of the request's query string — the property the query-variant
 * cases below rely on.
 */
function resolveCanonical(canonical: string, pathname: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { resolveAbsoluteUrlWithPathname } = require("next/dist/lib/metadata/resolvers/resolve-url")
  return resolveAbsoluteUrlWithPathname(
    canonical,
    rootMetadata.metadataBase,
    pathname,
    { trailingSlash: TRAILING_SLASH },
  )
}

function declaredCanonical(m: Metadata): string | undefined {
  const alts = m.alternates as { canonical?: string } | undefined
  return alts?.canonical
}

function declaredRobots(m: Metadata): { index?: boolean; follow?: boolean } | undefined {
  return m.robots as { index?: boolean; follow?: boolean } | undefined
}

// ── 0. resolver preconditions ───────────────────────────────────────────────

describe("GSC — canonical resolution preconditions", () => {
  it("next.config.ts does not enable trailingSlash", () => {
    expect(nextConfigSrc).not.toMatch(/trailingSlash/)
  })

  it("metadataBase is the canonical production www origin", () => {
    expect(rootMetadata.metadataBase?.toString()).toBe(`${PROD_ORIGIN}/`)
  })
})

// ── 1. root canonical serialization ─────────────────────────────────────────
//
// Next collapses a root canonical to origin form (`resolve-url.js`:
// `result.pathname === '/' && !searchParams.size ? result.origin : result.href`),
// so the rendered tag is `https://www.freshstart-il.com` with no path. That is
// not expressible any other way from app metadata — a declared "/", an absolute
// string, and a URL instance all collapse identically — and it is RFC 3986
// §6.2.3 equivalent to `https://www.freshstart-il.com/`. What must hold is that
// the root canonical and the sitemap's root entry denote the SAME url after
// normalization, and that the homepage is the only page claiming it.

describe("GSC — root canonical", () => {
  it("homepage declares its own canonical (not inherited from the layout)", () => {
    expect(declaredCanonical(homeMetadata)).toBe("/")
  })

  it("serializes to the production www origin", () => {
    expect(resolveCanonical("/", "/")).toBe(PROD_ORIGIN)
  })

  it("normalizes to the same URL as the sitemap's root entry", async () => {
    const entries = await sitemap()
    const rootEntry = entries.find((e) => new URL(e.url).pathname === "/")
    expect(rootEntry).toBeDefined()
    expect(new URL(rootEntry!.url).href).toBe(new URL(resolveCanonical("/", "/")).href)
    expect(new URL(resolveCanonical("/", "/")).href).toBe(`${PROD_ORIGIN}/`)
  })

  it("is unaffected by request query variants", () => {
    for (const requestPath of ["/", "/?utm_source=google", "/?gclid=abc123"]) {
      expect(resolveCanonical("/", requestPath)).toBe(PROD_ORIGIN)
    }
  })

  it("the homepage stays indexable", () => {
    const r = declaredRobots(rootMetadata)
    expect(r?.index).toBe(true)
    expect(r?.follow).toBe(true)
    // The homepage must not override it back to noindex.
    expect(declaredRobots(homeMetadata)).toBeUndefined()
  })
})

// ── 2. the root layout no longer donates its canonical ──────────────────────

describe("GSC — root layout declares no canonical", () => {
  it("app/layout.tsx omits alternates.canonical", () => {
    const alts = rootMetadata.alternates as { canonical?: unknown } | undefined
    expect(alts).toBeDefined()
    expect(alts!.canonical).toBeUndefined()
  })

  it("still publishes the RSS alternate", () => {
    const alts = rootMetadata.alternates as { types?: Record<string, unknown> }
    expect(alts.types?.["application/rss+xml"]).toBe("/rss.xml")
  })
})

// ── 3. internal routes are noindex, nofollow with route-appropriate canonicals ─

const INTERNAL_ROUTES = [
  {
    route: "/questionnaires",
    metadata: questionnairesMetadata,
    canonical: "/questionnaires",
    queryVariants: ["/questionnaires?foo=1", "/questionnaires?returnTo=%2Fdashboard"],
  },
  {
    route: "/auth/signin",
    metadata: signinMetadata,
    canonical: "/auth/signin",
    queryVariants: ["/auth/signin?callbackUrl=%2Fdashboard", "/auth/signin?error=CredentialsSignin"],
  },
]

describe("GSC — internal routes emit noindex, nofollow", () => {
  it.each(INTERNAL_ROUTES)("$route declares index:false and follow:false", ({ metadata }) => {
    const r = declaredRobots(metadata)
    expect(r).toBeDefined()
    expect(r!.index).toBe(false)
    expect(r!.follow).toBe(false)
  })

  it("/questionnaires/[type] inherits noindex from the segment layout", () => {
    // The dynamic route is a client component and cannot export metadata, so
    // the directive has to come from app/questionnaires/layout.tsx.
    const r = declaredRobots(questionnairesLayoutMetadata)
    expect(r).toBeDefined()
    expect(r!.index).toBe(false)
    expect(r!.follow).toBe(false)
  })
})

describe("GSC — internal routes are self-canonical, never homepage-canonical", () => {
  it.each(INTERNAL_ROUTES)("$route declares canonical $canonical", ({ metadata, canonical }) => {
    expect(declaredCanonical(metadata)).toBe(canonical)
  })

  it.each(INTERNAL_ROUTES)("$route never canonicalizes to the homepage", ({ metadata }) => {
    const c = declaredCanonical(metadata)!
    expect(c).not.toBe("/")
    expect(resolveCanonical(c, c)).not.toBe(PROD_ORIGIN)
    expect(resolveCanonical(c, c)).not.toBe(`${PROD_ORIGIN}/`)
  })

  it.each(INTERNAL_ROUTES)("$route resolves to its own absolute URL", ({ canonical }) => {
    expect(resolveCanonical(canonical, canonical)).toBe(`${PROD_ORIGIN}${canonical}`)
  })

  it.each(INTERNAL_ROUTES)(
    "$route emits the identical canonical for every query variant",
    ({ metadata, canonical, queryVariants }) => {
      const expected = `${PROD_ORIGIN}${canonical}`
      // The declared canonical carries no query of its own...
      expect(declaredCanonical(metadata)).not.toContain("?")
      // ...so every query variant of the request resolves to the same tag.
      for (const requestPath of queryVariants) {
        expect(resolveCanonical(canonical, requestPath)).toBe(expected)
      }
    },
  )

  it("/questionnaires/[type] deliberately declares no canonical of its own", () => {
    // Emitting none is correct for a noindexed dynamic route: a segment-level
    // canonical would point every /questionnaires/<type> at /questionnaires,
    // which is the same wrong-canonical defect one level down.
    const alts = questionnairesLayoutMetadata.alternates as { canonical?: unknown } | undefined
    expect(alts?.canonical).toBeUndefined()
  })
})

// ── 4. noindex must remain crawlable to be honoured ─────────────────────────

describe("GSC — robots.txt does not hide the noindex directives", () => {
  it("does not disallow /questionnaires or /auth", async () => {
    const { rules } = robots()
    const rule = Array.isArray(rules) ? rules[0] : rules
    const disallow = ([] as string[]).concat(rule.disallow ?? [])
    for (const path of ["/questionnaires", "/auth", "/auth/signin"]) {
      expect(disallow.some((d) => path.startsWith(d))).toBe(false)
    }
  })

  it("still disallows /dashboard and /api", async () => {
    const { rules } = robots()
    const rule = Array.isArray(rules) ? rules[0] : rules
    const disallow = ([] as string[]).concat(rule.disallow ?? [])
    expect(disallow).toEqual(expect.arrayContaining(["/dashboard", "/api"]))
  })
})

// ── 5. the sitemap still excludes every route we just noindexed ─────────────

describe("GSC — sitemap excludes the noindexed internal routes", () => {
  it("lists neither /questionnaires nor /auth/*", async () => {
    const urls = (await sitemap()).map((e) => e.url)
    for (const u of urls) {
      expect(u).not.toMatch(/\/questionnaires(\/|$)/)
      expect(u).not.toMatch(/\/auth(\/|$)/)
    }
  })
})

// ── 6. apex host redirect is NOT claimed by repository code ─────────────────
//
// Verified 2026-07-28: https://freshstart-il.com/<any path> answers 307 from
// the Vercel edge with `content-type: text/plain`, path-preserving, before the
// Next app runs — while app-level redirects from next.config.ts answer 308
// (/v2 -> /, /legal-info -> /legal). The apex hop is a Vercel *domain* redirect
// configured outside this repository, so no next.config.ts / middleware.ts /
// vercel.json rule can intercept it. This test exists to keep anyone from
// adding a rule that looks like a fix but can never execute.

describe("GSC — apex redirect is left to Vercel domain configuration", () => {
  it("next.config.ts declares no host-conditional apex redirect", () => {
    expect(nextConfigSrc).not.toMatch(/freshstart-il\.com/)
    expect(nextConfigSrc).not.toMatch(/type:\s*["']host["']/)
  })

  it("middleware.ts does not attempt a host redirect and does not match public routes", () => {
    const src = readFileSync(resolve(__dirname, "../../middleware.ts"), "utf8")
    expect(src).not.toMatch(/freshstart-il\.com/)
    // The matcher never sees "/" or the apex, so a host redirect here would be
    // dead code regardless of the Vercel edge behaviour.
    expect(src).toMatch(/matcher:\s*\[\s*["']\/dashboard\/:path\*["']/)
  })
})
