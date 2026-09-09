/** Pure file/region integration for the offline RLS recipe analyzer. */
import { extname } from "path"

import { type Finding, analyzeCode } from "./analyzer"
import { identityText, lineAt, lineStartsOf } from "./source-text"

export type TrackedFileReader = (file: string) => string | null

type LocatedFinding = Finding & { path: string; line: number }
type SqlRegion = { contents: string; offset: number }

/** Whole SQL files, or SQL/PostgreSQL fenced regions in Markdown runbooks. */
export const sqlRegions = (file: string, contents: string): SqlRegion[] => {
  if (extname(file).toLowerCase() !== ".md") return [{ contents, offset: 0 }]

  const regions: SqlRegion[] = []
  const lines = contents.match(/[^\r\n]*(?:\r\n|\r|\n|$)/g) ?? []
  let offset = 0
  let fence: { marker: string; start: number } | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (fence === null) {
      const opening = /^(`{3,}|~{3,})\s*(?:sql|postgresql)\b/i.exec(trimmed)
      if (opening) fence = { marker: opening[1], start: offset + line.length }
    } else if (
      trimmed.startsWith(fence.marker[0].repeat(fence.marker.length)) &&
      new RegExp(`^${fence.marker[0]}{${fence.marker.length},}\\s*$`).test(trimmed)
    ) {
      regions.push({ contents: contents.slice(fence.start, offset), offset: fence.start })
      fence = null
    }
    offset += line.length
  }

  if (fence !== null) regions.push({ contents: contents.slice(fence.start), offset: fence.start })
  return regions
}

export const formatSite = (finding: LocatedFinding): string => {
  const site = `${finding.path}:${finding.line}`
  if (finding.kind === "unsupported-dynamic-sql") return `${site} — unsupported dynamic SQL`
  if (finding.kind === "unsupported-procedural-language") {
    return `${site} — unsupported procedural language`
  }
  return site
}

/** Scan injected file contents without filesystem, process, network, or database access. */
export const scanFiles = (files: string[], read: TrackedFileReader): string[] => {
  const findings: LocatedFinding[] = []
  const unreadable: string[] = []

  for (const file of files) {
    const contents = read(file)
    if (contents === null) {
      unreadable.push(`${file}:unreadable`)
      continue
    }

    const lineStarts = lineStartsOf(contents)
    for (const region of sqlRegions(file, contents)) {
      for (const finding of analyzeCode(identityText(region.contents, region.offset), 0)) {
        findings.push({ ...finding, path: file, line: lineAt(lineStarts, finding.offset) })
      }
    }
  }

  const seen = new Set<string>()
  const sites = findings
    .filter(finding => {
      const key = `${finding.path}\u0000${finding.offset}\u0000${finding.kind}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort(
      (left, right) =>
        left.path.localeCompare(right.path) ||
        left.offset - right.offset ||
        left.kind.localeCompare(right.kind)
    )
    .map(formatSite)

  return [...sites, ...unreadable]
}
