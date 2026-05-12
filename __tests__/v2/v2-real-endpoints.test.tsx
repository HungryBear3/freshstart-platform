/**
 * @jest-environment node
 *
 * Tests for the v2 components that now use real (non-stub) endpoints.
 *
 * RTL 16 + React 19 has an `act` compat hiccup with this jest setup, so we
 * stay on the same SSR pattern the rest of __tests__/v2/* uses:
 *
 *  - SSR-render the component and assert the rendered HTML.
 *  - Source-content assertion for the swap from stub → real endpoint
 *    (compile-time check that nothing reverts to STUB_ENDPOINTS).
 *
 * No real network call is made.
 */
import * as React from "react";
import ReactDOMServer from "react-dom/server";
import fs from "node:fs";
import path from "node:path";

import { ChecklistCapture } from "@/app/v2/_components/ChecklistCapture";
import {
  OrientationCall,
  ORIENTATION_CALENDLY_URL,
} from "@/app/v2/_components/OrientationCall";

function readSource(rel: string): string {
  return fs.readFileSync(
    path.resolve(__dirname, "..", "..", rel),
    "utf8",
  );
}

function ssr(node: React.ReactElement): string {
  return ReactDOMServer.renderToStaticMarkup(node);
}

describe("ChecklistCapture → /api/checklist", () => {
  const src = readSource("app/v2/_components/ChecklistCapture.tsx");

  it("targets the real /api/checklist endpoint, not the stub", () => {
    expect(src).toMatch(/['"]\/api\/checklist['"]/);
    expect(src).not.toMatch(/STUB_ENDPOINTS\.leadCapture/);
    // The comment that explains the swap mentions the stub path; the live
    // fetch call must not. Strip JS comments before checking.
    const stripped = src
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");
    expect(stripped).not.toMatch(/\/api\/_stub\/lead-capture/);
  });

  it("sends only { email } in the body (matches /api/checklist contract)", () => {
    // The route ignores anything else and derives source from the Referer
    // header, so the body must be exactly { email }.
    expect(src).toMatch(/JSON\.stringify\(\s*\{\s*email\s*\}\s*\)/);
  });

  it("renders the live success copy on the .done state (no preview wording)", () => {
    const html = ssr(<ChecklistCapture />);
    // Initial render: form visible, no status banner yet.
    expect(html).toContain("Send my checklist");
    expect(html).not.toContain("Mock:");
    expect(html).not.toContain("preview only");
    // The success and error strings should be present in source (renderable)
    expect(src).toMatch(/Check your inbox/i);
    expect(src).toMatch(/support@freshstart-il\.com/);
  });
});

describe("OrientationCall → public Calendly link", () => {
  const html = ssr(
    <OrientationCall
      page="homepage"
      eyebrow="Talk to a human"
      heading="Get a 15-minute orientation call before you commit."
      body="No sales pitch."
    />,
  );

  it("renders an anchor pointing at the public Calendly URL", () => {
    expect(html).toContain(`href="${ORIENTATION_CALENDLY_URL}"`);
    expect(ORIENTATION_CALENDLY_URL).toMatch(/^https:\/\/calendly\.com\//);
  });

  it("opens in a new tab with safe rel attributes", () => {
    expect(html).toContain('target="_blank"');
    expect(html).toMatch(/rel="[^"]*noopener[^"]*"/);
    expect(html).toMatch(/rel="[^"]*noreferrer[^"]*"/);
  });

  it("removed the old stub POST and its preview wording", () => {
    const src = readSource("app/v2/_components/OrientationCall.tsx");
    expect(src).not.toMatch(/STUB_ENDPOINTS\.orientation/);
    expect(src).not.toMatch(/\/api\/_stub\/orientation-call/);
    expect(src).not.toMatch(/Mock:/);
    expect(html).not.toContain("preview only");
  });
});
