/**
 * @jest-environment node
 */
import React from "react";
import ReactDOMServer from "react-dom/server";

import PricingPage from "@/app/pricing/page";
import { PricingValueOverFree } from "@/app/v2/_components/PricingValueOverFree";

const render = (node: React.ReactElement) =>
  ReactDOMServer.renderToStaticMarkup(node);

describe("pricing value versus free official forms", () => {
  it("states that official forms are free and explains the paid preparation work", () => {
    const html = render(<PricingValueOverFree />);
    expect(html).toContain("Official Illinois court forms are available free");
    expect(html).toContain("FreshStart charges for organizing your answers into supported form drafts");
    expect(html).toContain("not legal advice");
    const visibleText = html.replace(/<[^>]+>/g, " ");
    expect(visibleText).not.toMatch(/right packet|all required forms|court-ready|guarantee/i);
  });

  it("renders on the active pricing route", () => {
    expect(render(<PricingPage />)).toContain("Official Illinois court forms are available free");
  });
});
