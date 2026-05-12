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

import { PricingAddons } from "@/app/v2/_components/PricingAddons";
import { ChecklistCapture } from "@/app/v2/_components/ChecklistCapture";
import { buildSignupFirstCheckoutUrl, planForTier } from "@/app/v2/_components/checkout-intent";
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

describe("signup-first checkout intent", () => {
  it("maps Essential to one-time checkout and Plus/unknown tiers to annual checkout", () => {
    expect(planForTier("essential")).toBe("one_time");
    expect(planForTier("plus")).toBe("annual");
    expect(planForTier("concierge")).toBe("annual");
  });

  it("builds a signup URL that preserves plan and source without hitting Stripe", () => {
    const url = buildSignupFirstCheckoutUrl({ plan: "one_time", source: "pricing_tier_essential" });
    expect(url).toContain("/auth/signup?");
    expect(url).toContain("redirect=%2Fpricing");
    expect(url).toContain("subscribe=true");
    expect(url).toContain("plan=one_time");
    expect(url).toContain("source=pricing_tier_essential");
  });

  it("removes start-trial/start-filing stubs from v2 CTA components", () => {
    const files = [
      "app/v2/_components/Hero.tsx",
      "app/v2/_components/Header.tsx",
      "app/v2/_components/PricingTiers.tsx",
      "app/v2/_components/PricingMobileStickyCTA.tsx",
    ];

    for (const file of files) {
      const src = readSource(file);
      expect(src).not.toMatch(/STUB_ENDPOINTS\.(startTrial|startFiling)/);
      expect(src).not.toMatch(/\/api\/_stub\/(start-trial|start-filing)/);
    }
  });

  it("resumes checkout only after authentication via the existing checkout-session route", () => {
    const src = readSource("app/v2/_components/PricingCheckoutResume.tsx");
    expect(src).toMatch(/status !== "authenticated"/);
    expect(src).toMatch(/\/api\/stripe\/create-checkout-session/);
    expect(src).not.toMatch(/stripe\.checkout/);
  });
});

describe("Essential access grant alignment", () => {
  it("keeps one-time payment webhook access at 60 days to match v2 marketing", () => {
    const src = readSource("app/api/webhooks/stripe/route.ts");
    expect(src).toMatch(/grant 60 days of access/);
    expect(src).toMatch(/60 \* 24 \* 60 \* 60 \* 1000/);
    expect(src).not.toMatch(/ninetyDaysOut/);
    expect(src).not.toMatch(/grant 90 days of access/);
  });
});

describe("v2 Google Analytics bridge", () => {
  it("dispatches v2 analytics events to the existing window.gtag surface", () => {
    const src = readSource("app/v2/_components/analytics.ts");
    expect(src).toMatch(/gtag\("event", eventName, params\)/);
    expect(src).toMatch(/select_content/);
    expect(src).toMatch(/generate_lead/);
    expect(src).toMatch(/add_to_cart/);
    expect(src).toMatch(/fs-v2-analytics-trace/);
    expect(src).not.toMatch(/Segment|RudderStack|posthog|new GoogleAnalytics/);
  });
});

describe("v2 launch add-ons", () => {
  it("ships only Parenting Plan Worksheet and Refile Assistance in the launch UI", () => {
    const html = ssr(<PricingAddons />);
    expect(html).toContain("Parenting plan worksheet");
    expect(html).toContain("Refile assistance");
    expect(html).not.toContain("Prenup template");
    expect(html).not.toContain("Mediation referral");
  });

  it("routes add-on purchase clicks through signup-first checkout once test price IDs exist", () => {
    const src = readSource("app/v2/_components/PricingAddons.tsx");
    const checkoutRoute = readSource("app/api/stripe/create-checkout-session/route.ts");
    const webhookRoute = readSource("app/api/webhooks/stripe/route.ts");
    expect(src).toMatch(/beginSignupFirstCheckout/);
    expect(src).toMatch(/parenting_plan/);
    expect(src).toMatch(/refile_assistance/);
    expect(src).not.toMatch(/STUB_ENDPOINTS\.addOn/);
    expect(checkoutRoute).toMatch(/PARENTING_PLAN_PRICE_ID/);
    expect(checkoutRoute).toMatch(/REFILE_PRICE_ID/);
    expect(webhookRoute).toMatch(/kind === "addon"/);
  });
});
