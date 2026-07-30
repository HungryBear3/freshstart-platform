/**
 * @jest-environment node
 *
 * Regression coverage for the canonical refund-policy route + the stale
 * "free to use" copy on legal-info/terms and legal-info/faq.
 *
 * Pattern matches the rest of the v2 / app tests: renderToStaticMarkup,
 * no DOM. We assert on the produced HTML / the page module's exported
 * data structures.
 */
import * as React from "react";
import ReactDOMServer from "react-dom/server";
import fs from "node:fs";
import path from "node:path";

import RefundPolicyPage from "@/app/legal-info/refund-policy/page";

function ssr(node: React.ReactElement): string {
  return ReactDOMServer.renderToStaticMarkup(node);
}

describe("/legal-info/refund-policy", () => {
  const html = ssr(<RefundPolicyPage />);

  it("renders the canonical refund-policy headline", () => {
    expect(html).toContain("Refund Policy");
    expect(html).toContain("request a refund review within 30 days");
    expect(html).not.toMatch(/money-back guarantee/i);
  });

  it("uses support@freshstart-il.com, never refund@", () => {
    expect(html).toContain("support@freshstart-il.com");
    expect(html).not.toMatch(/refund@freshstart-il\.com/i);
  });

  it("states that refunds are not based on spouse contestation or court outcomes", () => {
    expect(html).toMatch(/spouse stopped agreeing/i);
    expect(html).toMatch(/court hearing|court outcome/i);
    expect(html).toMatch(/clerk|county/i);
  });

  it("says no retention call is required", () => {
    expect(html).toMatch(/without a retention/i);
  });

  it("links to terms and privacy from the policy body", () => {
    expect(html).toContain("/legal-info/terms");
    expect(html).toContain("/legal-info/privacy");
  });

  it("includes the 'not legal advice' disclaimer", () => {
    expect(html).toMatch(/not legal advice/i);
  });
});

describe("legal-info copy alignment with paid plans", () => {
  function readSourceFile(rel: string): string {
    const p = path.resolve(__dirname, "..", "..", "..", rel);
    return fs.readFileSync(p, "utf8");
  }

  it("terms page no longer claims FreshStart IL is free to use", () => {
    const src = readSourceFile("app/legal-info/terms/page.tsx");
    expect(src).not.toMatch(/free to use/i);
    // Should now reference the paid plans + refund policy
    expect(src).toMatch(/\$149 one-time/);
    expect(src).not.toMatch(/Plus/);
    expect(src).toMatch(/refund-policy/);
  });

  it("faq page no longer claims FreshStart IL is free to use", () => {
    const src = readSourceFile("app/legal-info/faq/page.tsx");
    expect(src).not.toMatch(/FreshStart IL is free to use/i);
    expect(src).toMatch(/\$149/);
    expect(src).not.toMatch(/\$299/);
    expect(src).toMatch(/refund-policy/);
  });

  it("v2 PricingView refund FAQ uses support@, not refund@, and links the policy", () => {
    const src = readSourceFile("app/v2/_components/PricingView.tsx");
    expect(src).not.toMatch(/refund@freshstart-il\.com/i);
    expect(src).toMatch(/support@freshstart-il\.com/);
    expect(src).toMatch(/\/legal-info\/refund-policy/);
  });
});
