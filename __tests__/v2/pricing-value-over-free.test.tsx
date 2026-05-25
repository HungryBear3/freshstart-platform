/**
 * @jest-environment node
 *
 * Pins the "why pay $149 vs. the free Illinois forms" value band:
 *  - it acknowledges the forms are free and frames FreshStart as time +
 *    organization + completeness + filing guidance (not secret form access),
 *  - it keeps the not-legal-advice / not-a-substitute-for-an-attorney
 *    disclaimer,
 *  - it adds no court-outcome guarantee, no attorney/law-firm implication,
 *    no bankruptcy/debt-relief content, and none of the banned quantified or
 *    court-acceptance claims the v2 review locked out, and
 *  - it actually mounts on the active /pricing surface.
 *
 * Compliance assertions run against the VISIBLE text (tags stripped) so a
 * reused styling class name (e.g. `fs-pr-guarantee`) can't create a false
 * positive — what matters is the copy a buyer actually reads.
 */
import * as React from "react";
import ReactDOMServer from "react-dom/server";

import { PricingValueOverFree } from "@/app/v2/_components/PricingValueOverFree";
import PricingPage from "@/app/pricing/page";

function ssr(node: React.ReactElement): string {
  return ReactDOMServer.renderToStaticMarkup(node);
}

function visibleText(node: React.ReactElement): string {
  return ssr(node)
    .replace(/<[^>]*>/g, " ") // drop tags + class names
    .replace(/\s+/g, " ")
    .trim();
}

describe("PricingValueOverFree band", () => {
  const text = visibleText(<PricingValueOverFree />);

  it("acknowledges the free forms and frames value as time + completeness", () => {
    expect(text).toContain("The Illinois forms are free");
    expect(text).toContain("free, official forms");
    expect(text).toContain("Organized and assembled for you");
    expect(text).toContain("Checked for completeness");
    expect(text).toContain("Filing steps in plain English");
  });

  it("keeps the not-legal-advice / not-a-substitute disclaimer", () => {
    expect(text).toMatch(/not legal advice/i);
    expect(text).toMatch(/not\s+a substitute for an attorney/i);
  });

  it("makes no court-outcome guarantee or claim of court acceptance", () => {
    expect(text).not.toMatch(
      /court-ready|guaranteed|guarantee (your|the|approval|results?|outcome)|accepted by|accepted statewide|same court acceptance|actually filed|will be approved|win your case/i,
    );
  });

  it("implies no attorney relationship or law firm", () => {
    expect(text).not.toMatch(/\blaw firm\b|our attorneys|our lawyers|we are lawyers/i);
  });

  it("adds no bankruptcy/debt-relief content and no banned quantified claims", () => {
    expect(text).not.toMatch(/bankrupt|debt[\s-]?relief/i);
    expect(text).not.toMatch(/80%|9 out of 10|1 in 12/);
  });
});

describe("the value band is mounted on the active /pricing surface", () => {
  it("renders within the v2 PricingPage", () => {
    expect(ssr(<PricingPage />)).toContain("The Illinois forms are free");
  });
});
