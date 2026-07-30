/**
 * @jest-environment node
 *
 * Guards the FreshStart v2 design shell on high-intent public routes that had
 * drifted back to the legacy light/blue layout.
 */
import * as React from "react";
import ReactDOMServer from "react-dom/server";
import { readFileSync } from "fs";
import { resolve } from "path";

import ChecklistPage from "@/app/checklist/page";
import NotFound from "@/app/not-found";

function ssr(node: React.ReactElement): string {
  return ReactDOMServer.renderToStaticMarkup(node);
}

describe("FreshStart public design shell consistency", () => {
  it("/checklist renders inside the v2 dark marketing shell with full nav and CTA", () => {
    const html = ssr(<ChecklistPage />);

    expect(html).toContain('class="fs-page"');
    expect(html).toContain("The Illinois divorce checklist, without the legal fog.");
    expect(html).toContain("How it works");
    expect(html).toContain("Pricing");
    expect(html).toContain("Legal Info");
    expect(html).toContain("FAQ");
    expect(html).toContain("Start my filing");
    expect(html).not.toContain("The Illinois Divorce Checklist</h1>");
    expect(html).not.toMatch(/Cook County: \$|DuPage County: \$|Will County: ~?\$/);
    expect(html).not.toMatch(/Updated for 2026|All 102 Illinois counties/);
    expect(html).not.toMatch(/Deadlines You Can.t Miss|Top Reasons Courts Reject Filings/);
    expect(html).toContain("Verify current requirements with your circuit clerk before filing");
  });

  it("404/not-found renders inside the v2 dark marketing shell", () => {
    const html = ssr(<NotFound />);

    expect(html).toContain('class="fs-page"');
    expect(html).toContain("This page moved, but your filing path did not.");
    expect(html).toContain("Start my filing");
    expect(html).toContain("Go to homepage");
    expect(html).not.toContain("Page Not Found</h2>");
  });

  it("v2 structured-data brand names use the canonical FreshStart IL spelling", () => {
    const jsonLdSource = readFileSync(
      resolve(__dirname, "../../app/v2/_components/JsonLd.tsx"),
      "utf8",
    );

    expect(jsonLdSource).toContain('name: "FreshStart IL"');
    expect(jsonLdSource).not.toContain("FreshStart-IL");
  });
});
