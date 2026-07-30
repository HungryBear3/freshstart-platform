/**
 * @jest-environment node
 *
 * Regression coverage for the rendered-journey findings from the 2026-07-30
 * independent CD audit. These assertions protect public SSR contracts and the
 * CSS selector that controls CTA contrast; no browser or external service is used.
 */
import * as React from "react"
import ReactDOMServer from "react-dom/server"
import fs from "node:fs"
import path from "node:path"

import StartPage from "@/app/start/page"
import RefundPolicyPage from "@/app/legal-info/refund-policy/page"
import FaqPage from "@/app/faq/page"

function ssr(node: React.ReactElement): string {
  return ReactDOMServer.renderToStaticMarkup(node)
}

function readSource(rel: string): string {
  return fs.readFileSync(path.resolve(__dirname, "..", "..", rel), "utf8")
}

function rgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16)) as [
    number,
    number,
    number,
  ]
}

function relativeLuminance(hex: string): number {
  const channels = rgb(hex).map((channel) => {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function contrast(foreground: string, background: string): number {
  const [lighter, darker] = [relativeLuminance(foreground), relativeLuminance(background)].sort(
    (a, b) => b - a,
  )
  return (lighter + 0.05) / (darker + 0.05)
}

function composite(foreground: string, background: string, alpha: number): string {
  const blended = rgb(foreground).map((channel, index) =>
    Math.round(alpha * channel + (1 - alpha) * rgb(background)[index]),
  )
  return `#${blended.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`
}

describe("CD rendered-journey regressions", () => {
  it("keeps the refund contract in the current shell without legacy promotions or telemetry", () => {
    const html = ssr(<RefundPolicyPage />)

    expect(html).toMatch(/class="fs-page"/)
    expect(html).toMatch(/fs-hd/)
    expect(html).toMatch(/fs-ft/)
    expect(html).toMatch(/refund review within 30 days/i)
    expect(html).toMatch(/\$149 one-time for 60 days of service access/i)
    expect(html).toMatch(/court filing fees, county fees/i)
    expect(html).toMatch(/built for uncontested matters/i)
    expect(html).toContain('href="mailto:support@freshstart-il.com"')
    expect(html).toContain('href="/legal-info/terms"')
    expect(html).toContain('href="/legal-info/privacy"')
    expect(html).toMatch(/does not create an attorney-client relationship/i)
    expect(html).toMatch(/requirements may vary by county/i)
    expect(html).not.toMatch(/deadline tracking/i)
    expect(html).not.toMatch(/prenups?\s*(?:&amp;|&)\s*postnups?/i)
    expect(html).not.toMatch(/data-visitor-counter|\/api\/visitor-count\b/i)
  })

  it("keeps /start accurate and removes all promotion of withdrawn calculators", () => {
    const html = ssr(<StartPage />)

    expect(html).toMatch(/class="fs-page"/)
    expect(html).toMatch(/fs-hd/)
    expect(html).toMatch(/fs-ft/)
    expect(html).toMatch(/not a law firm/i)
    expect(html).toMatch(/\$149 one-time/i)
    expect(html).toMatch(/60 days of service access/i)
    expect(html).toMatch(/no subscription/i)
    expect(html).toMatch(/general Illinois divorce information/i)
    expect(html).toContain('href="/pricing"')
    expect(html).not.toContain('href="/calculators"')
    expect(html).not.toMatch(/calculators?|child support (?:&amp;|&) spousal maintenance/i)
  })

  it("binds the FAQ pricing CTA to the primary-button contrast override", () => {
    const html = ssr(<FaqPage />)
    const css = readSource("app/v2/_components/shell.css")

    expect(html).toMatch(
      /<a class="fs-btn fs-btn-primary fs-btn-md" href="\/pricing">See pricing →<\/a>/,
    )
    expect(css).toMatch(/\.fs-doc-body\s+a\.fs-btn\s*\{[\s\S]*?text-decoration:\s*none/)
    expect(css).toMatch(
      /\.fs-doc-body\s+a\.fs-btn-primary\s*\{[\s\S]*?color:\s*#0b1020/,
    )
    expect(css).toMatch(
      /\.fs-doc-body\s+a\.fs-btn-primary:hover\s*\{[\s\S]*?color:\s*#0b1020/,
    )
  })

  it("keeps small metadata and eyebrow text above WCAG AA contrast", () => {
    const css = readSource("app/v2/_components/shell.css")
    const card = "#161d3f"
    const meta = "#858dbb"
    const eyebrow = "#c0afff"
    const gradientBackgrounds = [
      composite("#a78bfa", card, 0.18),
      composite("#60a5fa", card, 0.18),
    ]

    expect(css).toMatch(/\.fs-doc-meta\s*\{[\s\S]*?color:\s*#858dbb/)
    expect(css).toMatch(/\.fs-doc-eyebrow\s*\{[\s\S]*?color:\s*#c0afff/)
    expect(contrast(meta, card)).toBeGreaterThanOrEqual(4.5)
    for (const background of gradientBackgrounds) {
      expect(contrast(eyebrow, background)).toBeGreaterThanOrEqual(4.5)
    }
  })
})
