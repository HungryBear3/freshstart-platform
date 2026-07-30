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
  it("derives the complete static sitemap route corpus and rejects unsupported claims", () => {
    const sitemap = read("app/sitemap.ts");
    const routes = [...sitemap.matchAll(/url\("([^"`]+)"\)/g)].map((match) => match[1]);
    const sources = routes.map((route) => read(route === "/" ? "app/page.tsx" : `app${route}/page.tsx`)).join("\n");

    expect(routes).toHaveLength(17);
    expect(sources).not.toMatch(/court-ready|ready-to-file|error-free|required to be accepted/i);
    expect(sources).not.toMatch(/all required Illinois divorce forms|every required Illinois form/i);
    expect(sources).not.toMatch(/numbers in your filing match what a court would expect|applies the current schedule/i);
  });

  it("keeps unsupported support and timeline calculators fail-closed in public and authenticated UI", () => {
    const sources = [
      read("app/calculators/page.tsx"),
      read("app/dashboard/financial/child-support/page.tsx"),
      read("app/dashboard/financial/spousal-maintenance/page.tsx"),
      read("app/dashboard/financial/page.tsx"),
      read("app/dashboard/financial/summary/page.tsx"),
    ].join("\n");
    expect(sources).toMatch(/calculators are unavailable|calculator unavailable/i);
    expect(sources).not.toMatch(/<CardTitle>Child Support Calculator<\/CardTitle>|<CardTitle>Spousal Maintenance Calculator<\/CardTitle>|>\s*Calculate Child Support\s*<|>\s*Calculate Maintenance\s*<|>\s*Calculate Spousal Maintenance\s*<|>\s*Estimate Timeline\s*</i);
    expect(sources).not.toMatch(/\/legal-info\/timeline-calculator/);
  });

  it("marks retired subscription and trial operating plans as non-executable", () => {
    for (const path of [
      "docs/FS_V2_CTA_BACKEND_WIRING_PLAN.md",
      "docs/FS_V2_PREPROMOTION_CHECKLIST.md",
      "docs/FS_REFUND_POLICY_ALIGNMENT.md",
      "STRIPE_NEXT_STEPS.md",
      "STRIPE_TESTING_GUIDE.md",
      "STRIPE_READY_TO_TEST.md",
      "SYNC_SUBSCRIPTION_INSTRUCTIONS.md",
      "GET_SUBSCRIPTION_ID.md",
    ]) {
      expect(read(path).slice(0, 900)).toMatch(/SUPERSEDED — DO NOT EXECUTE|HISTORICAL AUDIT — NOT CURRENT OPERATING INSTRUCTIONS/);
      expect(read(path).slice(0, 900)).toMatch(/ONE_TIME_CHECKOUT_RELEASE_GATE\.md/);
    }
  });

  it("rechecks the current database role immediately before server-rendered admin reads", () => {
    const helper = read("lib/auth/require-current-admin-page.ts");
    const layout = read("app/admin/layout.tsx");
    const dashboard = read("app/admin/page.tsx");
    const telemetryApi = read("app/api/admin/marketing-links/stats/route.ts");
    expect(helper).toMatch(/prisma\.user\.findUnique/);
    expect(helper).toMatch(/currentUser\?\.role !== "admin"/);
    expect(layout).toMatch(/await requireCurrentAdminPage\(\)/);
    expect(dashboard).toMatch(/await requireCurrentAdminPage\(\)[\s\S]*prisma\.user\.count/);
    expect(telemetryApi).toMatch(/GET[\s\S]*await requireAdmin\(request\)[\s\S]*prisma\.marketingLink\.findMany/);
  });

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
      "app/terms/page.tsx",
      "app/contact/page.tsx",
      "app/not-found.tsx",
      "app/calculators/page.tsx",
      "app/legal-info/court-forms/page.tsx",
      "app/legal-info/process/page.tsx",
      "app/manifest.ts",
      "app/api/drip/send/route.ts",
      "app/auth/signup/signup-form.tsx",
      "app/api/stripe/create-checkout-session/route.ts",
      "app/v2/_components/checkout-intent.ts",
      "components/lead-magnet/checklist-form.tsx",
    ].map(read).join("\n");

    expect(sources).not.toMatch(/filed right|nothing gets rejected/i);
    expect(sources).not.toMatch(/money-back guarantee/i);
    expect(sources).not.toMatch(/\$299(?:\/yr|\/year|, annual|\)|\/subscription)/i);
    expect(sources).not.toMatch(/plan:\s*["']annual["']/i);
    expect(sources).not.toMatch(/Plus subscribers?|Essential and Plus/i);
    expect(sources).not.toMatch(/court-ready|ready-to-file|required to be accepted/i);
    expect(sources).not.toMatch(/Get Started Free|attorney fee ranges/i);
    expect(sources).not.toMatch(/complete divorce packet|every required form|no attorney required/i);
    expect(sources).not.toMatch(/all required Illinois divorce forms|every required Illinois form/i);
    expect(sources).not.toMatch(/know exactly what to gather|based on current court templates/i);
    expect(sources).not.toMatch(/tell you honestly whether FreshStart (?:or an attorney )?is the right/i);
    expect(sources).not.toMatch(/Marcus T\.|Priya R\.|Devon K\./i);
  });

  it("preserves one-time intent on public signup CTAs", () => {
    const sources = [
      "app/checklist/page.tsx",
      "app/calculators/page.tsx",
      "app/legal-info/process/page.tsx",
    ].map(read).join("\n");

    expect(sources).not.toMatch(/href=["']\/auth\/signup["']/);
    expect(sources.match(/plan=one_time/g)?.length).toBeGreaterThanOrEqual(3);
  });

  it("removes retired offer and court-readiness claims from active product copy", () => {
    const sources = [
      "components/legal/disclaimer.tsx",
      "app/dashboard/page.tsx",
      "components/help/help-sidebar.tsx",
      "components/onboarding/onboarding-wizard.tsx",
      "app/admin/attribution/page.tsx",
      "app/api/admin/marketing-links/stats/route.ts",
      "app/v2/_components/PricingTestimonials.tsx",
    ].map(read).join("\n");

    expect(sources).not.toMatch(/court-ready|required to be accepted/i);
    expect(sources).not.toMatch(/\$299(?:\/subscription|\/year|\/yr)/i);
    expect(sources).not.toMatch(/assuming \$299 per conversion|annual option/i);
  });

  it("keeps one-time customer access and dormant checkout copy consistent", () => {
    const dashboard = read("app/dashboard/page.tsx");
    const profile = read("app/dashboard/profile/page.tsx");
    const dormantCheckout = [
      read("app/v2/_components/PricingAddons.tsx"),
      read("components/stripe/subscribe-button.tsx"),
    ].join("\n");

    expect(dashboard).toContain('subscription.plan === "one_time"');
    expect(dashboard).toContain("Access through");
    expect(dashboard).not.toMatch(/Subscribe to access all features|Start your subscription|Complete Your Subscription|Required for all divorce cases/i);
    expect(profile).toContain('subscription.plan === "one_time"');
    expect(profile).toContain("Service Access");
    expect(profile).toContain("Access through:");
    expect(dormantCheckout).not.toMatch(/Included in Plus|Start Free Trial|plan = "annual"/i);
    expect(dormantCheckout).toContain('plan = "one_time"');
  });
});
