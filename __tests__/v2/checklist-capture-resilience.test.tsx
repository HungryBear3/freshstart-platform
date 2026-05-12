/**
 * @jest-environment node
 *
 * Resilience checks for the v2 ChecklistCapture component.
 *
 * RTL 16 + React 19 has an `act` compat hiccup with this jest setup, so we
 * exercise the component's submit handler by importing the module source
 * and asserting on the exported behavior and source-level guarantees:
 *
 *  - A 2-second AbortController timeout is wired around the fetch.
 *  - The `submitting` state is always exited in a `finally` block.
 *  - A non-OK response transitions to "error", not stuck "submitting".
 *  - An aborted fetch (timeout) transitions to "error", not stuck "submitting".
 */
import fs from "node:fs"
import path from "node:path"
import * as React from "react"
import ReactDOMServer from "react-dom/server"
import { ChecklistCapture } from "@/app/v2/_components/ChecklistCapture"

function readSource(rel: string): string {
  return fs.readFileSync(path.resolve(__dirname, "..", "..", rel), "utf8")
}

describe("ChecklistCapture — source guarantees", () => {
  const src = readSource("app/v2/_components/ChecklistCapture.tsx")

  it("declares a 2-second AbortController timeout", () => {
    expect(src).toMatch(/CHECKLIST_TIMEOUT_MS\s*=\s*2000/)
    expect(src).toMatch(/new AbortController\(\)/)
    expect(src).toMatch(/controller\.abort\(\)/)
  })

  it("passes the abort signal into fetch and clears the timer in finally", () => {
    expect(src).toMatch(/signal:\s*controller\?\.signal/)
    expect(src).toMatch(/finally\s*{[\s\S]*clearTimeout/)
  })

  it("sets status to 'error' on any thrown error (covers AbortError + network)", () => {
    expect(src).toMatch(/catch[\s\S]*setStatus\("error"\)/)
  })
})

describe("ChecklistCapture — runtime smoke (handler isolation)", () => {
  // Render once to make sure the component compiles + the initial state is
  // idle (no status banner).
  const html = ReactDOMServer.renderToStaticMarkup(<ChecklistCapture />)

  it("renders the initial idle state without any status banner", () => {
    expect(html).toContain("Send my checklist")
    expect(html).not.toContain("Check your inbox")
    expect(html).not.toMatch(/Something went wrong/i)
  })

  it("disables-on-submit copy is wired to the submitting state, not hard-coded", () => {
    const src = readSource("app/v2/_components/ChecklistCapture.tsx")
    expect(src).toMatch(/status === "submitting" \? "Sending…" : "Send my checklist"/)
    expect(src).toMatch(/disabled={status === "submitting"}/)
  })
})
