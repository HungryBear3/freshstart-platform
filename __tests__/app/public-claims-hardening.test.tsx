/**
 * @jest-environment node
 */
import fs from "node:fs";
import path from "node:path";
import React from "react";
import ReactDOMServer from "react-dom/server";

import { HomeView } from "@/app/v2/_components/HomeView";
import PricingPage from "@/app/pricing/page";
import ChecklistPage from "@/app/checklist/page";

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

const render = (node: React.ReactElement) =>
  ReactDOMServer.renderToStaticMarkup(node);

describe("public claims hardening", () => {
  it("puts the document-preparation and legal boundary above the homepage fold", () => {
    const html = render(<HomeView />);
    expect(html).toMatch(/We prepare your forms\.[\s\S]*You file them\./);
    expect(html).toContain("Not a law firm. Not legal advice.");
    expect(html).toContain("you review everything before you file");
  });

  it("presents one flat price without subscription or outcome guarantees", () => {
    const html = render(<PricingPage />);
    expect(html).toContain("$149 one-time");
    expect(html).toContain("No subscription");
    expect(html).toContain("30-day refund policy");
    expect(html).not.toMatch(/\$299|annual subscription|money-back guarantee/i);
    expect(html).not.toMatch(/nothing gets rejected|filed right/i);
  });

  it("keeps the checklist general and tells readers to verify live clerk requirements", () => {
    const html = render(<ChecklistPage />);
    expect(html).toContain("Common Illinois divorce documents");
    expect(html).toContain("Timing checkpoints to verify");
    expect(html).toContain("Common clerical issues to review");
    expect(html).toContain("Verify current requirements with your circuit clerk before filing");
    expect(html).not.toMatch(/Cook County: \$|DuPage County: \$|Will County: ~?\$/);
    expect(html).not.toMatch(/Updated for 2026|All 102 Illinois counties/);
    expect(html).not.toMatch(/Deadlines You Can.t Miss|Top Reasons Courts Reject Filings/);
  });

  it("removes risky claims from active public route source", () => {
    const sources = [
      "app/page.tsx",
      "app/layout.tsx",
      "app/opengraph-image.tsx",
      "app/pricing/page.tsx",
      "app/v2/page.tsx",
      "app/v2/pricing/page.tsx",
      "app/v2/_components/Hero.tsx",
      "app/v2/_components/Header.tsx",
      "app/v2/_components/HomeView.tsx",
      "app/v2/_components/FeaturePills.tsx",
      "app/v2/_components/HowItWorks.tsx",
      "app/v2/_components/Testimonials.tsx",
      "app/v2/_components/ChecklistCapture.tsx",
      "app/v2/_components/PricingHero.tsx",
      "app/v2/_components/PricingView.tsx",
      "app/v2/_components/PricingGuaranteeBand.tsx",
      "app/v2/_components/PricingMobileStickyCTA.tsx",
      "app/v2/_components/Footer.tsx",
      "app/checklist/page.tsx",
      "app/faq/page.tsx",
      "app/about/page.tsx",
      "app/start/page.tsx",
      "app/legal-info/faq/page.tsx",
      "app/legal-info/refund-policy/page.tsx",
      "app/legal-info/terms/page.tsx",
      "components/lead-magnet/checklist-form.tsx",
    ].map(read).join("\n");

    expect(sources).not.toMatch(/filed right|nothing gets rejected/i);
    expect(sources).not.toMatch(/money-back guarantee/i);
    expect(sources).not.toMatch(/\$299(?:\/yr|\/year|, annual|\)|\/subscription)/i);
    expect(sources).not.toMatch(/plan:\s*["']annual["']/i);
    expect(sources).not.toMatch(/all required Illinois divorce forms|every required Illinois form/i);
    expect(sources).not.toMatch(/know exactly what to gather|based on current court templates/i);
    expect(sources).not.toMatch(/tell you honestly whether FreshStart (?:or an attorney )?is the right/i);
    expect(sources).not.toMatch(/Marcus T\.|Priya R\.|Devon K\./i);
  });
});
