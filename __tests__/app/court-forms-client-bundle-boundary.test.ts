/**
 * @jest-environment node
 *
 * The Court Forms Library client component must not value-import the catalog.
 *
 * WHY A SOURCE-LEVEL TEST. `lib/forms/court-forms-read-model.ts` resolves
 * `relatedQuestionnaires` server-side and ships only resolved links on the DTO,
 * and `__tests__/forms/court-forms-questionnaire-links.test.ts` proves the
 * serialized props carry none of the unsupported slugs. That is the whole of what
 * a props assertion can prove. It says nothing about the MODULE GRAPH: because
 * `ILLINOIS_COURT_FORMS` is built by top-level `il()` / `unsupported()` calls, any
 * value import from `illinois-court-forms` into a `"use client"` module drags all
 * 21 rows into the browser chunk — every pinned `sha256`, every `officialUrl`, and
 * every unresolved questionnaire slug — no matter what the DTO omits.
 *
 * That is exactly what happened: before this boundary existed the built chunk
 * carried all eight unresolved slugs and the pinned petition `sha256`, and the
 * route's 308 redirect was the only thing making it unreachable. Redirects move.
 *
 * Reading the source is deliberate. Jest resolves `@/…` through moduleNameMapper
 * and would happily import both modules, so an import-based test cannot see the
 * distinction a bundler sees. Same technique as
 * `__tests__/app/financial-affidavit-claims.test.ts`.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"

const ROOT = join(__dirname, "..", "..")
const CLIENT = "app/legal-info/court-forms/court-forms-client.tsx"
const LEAF = "lib/forms/court-forms-presentation.ts"
const CATALOG = "lib/forms/illinois-court-forms.ts"

function read(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

/**
 * `//` and `/* *\/` comments removed, so a structural assertion cannot be
 * satisfied — or defeated — by prose. This file's own header names
 * `ILLINOIS_COURT_FORMS` to explain the hazard; a scan that counted that as code
 * would be checking documentation, not the module graph.
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "")
}

/**
 * Every top-level import statement in `source`, as whole statements.
 *
 * Accumulated line by line rather than by one regex: a lazy `[\s\S]*?` between
 * `import` and a target specifier will happily span the statements in between, so
 * a single pattern reports the whole import block as one match for whichever
 * module it was asked about. Statement boundaries have to be found, not guessed.
 */
function importStatements(source: string): string[] {
  const statements: string[] = []
  let current: string | null = null
  for (const line of stripComments(source).split("\n")) {
    if (current === null && /^import\b/.test(line)) current = line
    else if (current !== null) current += `\n${line}`
    else continue
    // Complete once the specifier's closing quote is on the accumulated text:
    // either `from "x"` or a bare side-effect `import "x"`.
    if (/(?:from\s*|^import\s*)["'][^"']+["']/m.test(current.split("\n").pop()!)) {
      statements.push(current)
      current = null
    }
  }
  return statements
}

/**
 * Import statements naming `moduleSpecifier`, split into all and value-only.
 *
 * `import type { X } from` and `import { type X } from` are erased at compile
 * time and pull nothing into the bundle, so they are not violations. A bare
 * `import "…"` for side effects IS a value import and must be caught.
 */
function importsOf(source: string, moduleSpecifier: string) {
  const all = importStatements(source).filter((statement) =>
    new RegExp(String.raw`["'][^"']*${moduleSpecifier}["']`).test(statement),
  )
  return {
    all,
    value: all.filter((statement) => {
      if (/^import\s+type\s/.test(statement)) return false
      const named = statement.match(/\{([\s\S]*)\}/)
      if (!named) return true
      const bindings = named[1].split(",").map((b) => b.trim()).filter(Boolean)
      // Every named binding prefixed with `type` ⇒ nothing is emitted.
      return bindings.length === 0 || bindings.some((b) => !/^type\s/.test(b))
    }),
  }
}

describe("court-forms client bundle boundary", () => {
  const client = read(CLIENT)

  it("is a client component, so its imports decide what reaches the browser", () => {
    expect(client.startsWith('"use client"')).toBe(true)
  })

  it("value-imports nothing from the catalog module", () => {
    const { value } = importsOf(client, "lib/forms/illinois-court-forms")
    expect(value).toEqual([])
  })

  it("takes its presentation vocabulary from the client-safe leaf instead", () => {
    const { value } = importsOf(client, "lib/forms/court-forms-presentation")
    expect(value).toHaveLength(1)
    for (const binding of [
      "FORM_CATEGORIES",
      "UNVERIFIED_CATALOG_VALUE",
      "formatCatalogLastUpdated",
    ]) {
      expect(value[0]).toContain(binding)
    }
  })

  it("still imports the DTO types, type-only, from the server read model", () => {
    const { all, value } = importsOf(client, "lib/forms/court-forms-read-model")
    expect(all).toHaveLength(1)
    expect(value).toEqual([])
  })

  it("does not reach the catalog transitively through the leaf", () => {
    const leafCode = stripComments(read(LEAF))
    expect(importsOf(leafCode, "lib/forms/illinois-court-forms").all).toEqual([])
    // A leaf that built rows of its own would reintroduce the same problem.
    expect(leafCode).not.toContain("ILLINOIS_COURT_FORMS")
    expect(leafCode).not.toMatch(/\bil\(|\bunsupported\(/)
    // And it must import nothing at all, so no future edit can smuggle rows in
    // one hop further out.
    expect(importStatements(leafCode)).toEqual([])
  })

  it("keeps the catalog's re-exports, so server importers need no change", () => {
    const catalog = stripComments(read(CATALOG))
    for (const name of [
      "UNVERIFIED_CATALOG_VALUE",
      "formatCatalogLastUpdated",
      "FORM_CATEGORIES",
      "FormCategory",
    ]) {
      expect(catalog).toContain(name)
    }
    // The definitions moved; they must not be duplicated back into the catalog,
    // where the two copies could drift.
    expect(catalog).not.toMatch(/export const FORM_CATEGORIES/)
    expect(catalog).not.toMatch(/export const UNVERIFIED_CATALOG_VALUE/)
    expect(catalog).not.toMatch(/export function formatCatalogLastUpdated/)
  })

  it("keeps the unresolved questionnaire slugs out of the client's import reach", () => {
    // The eight slugs live in catalog rows. With no value import from the catalog,
    // none of them can reach this chunk. Asserted on the source the bundler reads,
    // one slug at a time: a combined check passes as soon as one is absent.
    const slugs = [
      "basic-information",
      "financial-information",
      "assets-debts",
      "marriage-details",
      "children-information",
      "income-employment",
      "property-division",
    ]
    for (const slug of slugs) {
      expect(client).not.toContain(slug)
      expect(read(LEAF)).not.toContain(slug)
    }
    // `parenting-plan` is deliberately not scanned: it is also a catalog form id
    // and a filename stem, so its absence here would not be evidence of anything.
  })
})
