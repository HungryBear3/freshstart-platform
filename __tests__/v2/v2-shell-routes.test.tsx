/**
 * @jest-environment node
 *
 * Smoke + content guardrails for the v2 design-continuity routes:
 *
 *  /faq, /about, /contact, /legal, /privacy, /terms, /disclaimer,
 *  /grounds-for-divorce, /property-division, /child-custody,
 *  /support-calculations,
 *  /auth/signin, /auth/signup
 *
 * Each route must:
 *  - SSR without throwing,
 *  - render the v2 `fs-page` shell (Header + Footer or the auth wrapper),
 *  - keep the "not legal advice" posture intact on informational pages.
 *
 * Auth pages additionally must preserve the signup-first checkout intent
 * (plan / source / callbackUrl / subscribe) — those are verified by
 * reading the source modules directly so this test does not require a
 * full NextAuth SessionProvider.
 */
import * as React from "react";
import ReactDOMServer from "react-dom/server";
import fs from "node:fs";
import path from "node:path";

import LegalIndex from "@/app/legal/page";
import GroundsPage from "@/app/grounds-for-divorce/page";
import PropertyPage from "@/app/property-division/page";
import CustodyPage from "@/app/child-custody/page";
import SupportPage from "@/app/support-calculations/page";
import PrivacyPage from "@/app/privacy/page";
import TermsPage from "@/app/terms/page";
import DisclaimerPage from "@/app/disclaimer/page";
import FaqPage from "@/app/faq/page";
import AboutPage from "@/app/about/page";
import ContactPage from "@/app/contact/page";

function ssr(node: React.ReactElement): string {
  return ReactDOMServer.renderToStaticMarkup(node);
}

function readSource(rel: string): string {
  return fs.readFileSync(path.resolve(__dirname, "..", "..", rel), "utf8");
}

const INFO_ROUTES: Array<{ label: string; render: () => string; expects: string[] }> = [
  {
    label: "/legal",
    render: () => ssr(<LegalIndex />),
    expects: [
      "Illinois divorce",
      "/grounds-for-divorce",
      "/property-division",
      "/child-custody",
      "/support-calculations",
    ],
  },
  {
    label: "/grounds-for-divorce",
    render: () => ssr(<GroundsPage />),
    expects: ["irreconcilable differences", "no-fault", "separate and apart"],
  },
  {
    label: "/property-division",
    render: () => ssr(<PropertyPage />),
    expects: ["equitable distribution", "marital", "non-marital"],
  },
  {
    label: "/child-custody",
    render: () => ssr(<CustodyPage />),
    expects: ["parenting time", "decision-making", "parenting plan"],
  },
  {
    label: "/support-calculations",
    render: () => ssr(<SupportPage />),
    expects: ["750 ILCS 5/505", "750 ILCS 5/504", "income-shares"],
  },
  {
    label: "/privacy",
    render: () => ssr(<PrivacyPage />),
    expects: ["Privacy", "support@freshstart-il.com", "/legal-info/privacy"],
  },
  {
    label: "/terms",
    render: () => ssr(<TermsPage />),
    expects: ["Terms of Service", "Refund Policy", "/legal-info/terms"],
  },
  {
    label: "/disclaimer",
    render: () => ssr(<DisclaimerPage />),
    expects: [
      "attorney",
      "not a law firm",
      "/legal-info/disclaimer",
    ],
  },
  {
    label: "/faq",
    render: () => ssr(<FaqPage />),
    expects: ["Essential", "Plus", "support@freshstart-il.com"],
  },
  {
    label: "/about",
    render: () => ssr(<AboutPage />),
    expects: ["FreshStart-IL", "Illinois", "30-day"],
  },
  {
    label: "/contact",
    render: () => ssr(<ContactPage />),
    expects: ["support@freshstart-il.com", "FreshStart-IL", "not a law firm"],
  },
];

describe("v2 design-continuity routes — informational pages", () => {
  for (const route of INFO_ROUTES) {
    describe(route.label, () => {
      const html = route.render();

      it("SSRs inside the v2 fs-page shell", () => {
        expect(html).toMatch(/class="fs-page"/);
        expect(html).toMatch(/fs-hd/); // Header
        expect(html).toMatch(/fs-ft/); // Footer
      });

      it("contains expected topical content", () => {
        for (const fragment of route.expects) {
          expect(html).toContain(fragment);
        }
      });

      it("keeps the 'not legal advice' posture (or links to the disclaimer)", () => {
        expect(html).toMatch(/not legal advice|not a law firm|\/disclaimer/i);
      });
    });
  }
});

describe("v2 Header/Footer point at the real continuity routes", () => {
  const header = readSource("app/v2/_components/Header.tsx");
  const footer = readSource("app/v2/_components/Footer.tsx");

  it("Header links to /legal and /faq (not /v2# anchors)", () => {
    expect(header).toMatch(/href="\/legal"/);
    expect(header).toMatch(/href="\/faq"/);
    expect(header).not.toMatch(/href="\/v2#legal-info"/);
    expect(header).not.toMatch(/href="\/v2#faq"/);
  });

  it("Footer links to every real route (not /v2# anchors)", () => {
    const expected = [
      "/grounds-for-divorce",
      "/property-division",
      "/child-custody",
      "/support-calculations",
      "/about",
      "/faq",
      "/contact",
      "/legal",
      "/privacy",
      "/terms",
      "/disclaimer",
    ];
    for (const href of expected) {
      expect(footer).toMatch(new RegExp(`href="${href}"`));
    }
    expect(footer).toContain('href="/#how-it-works"');
    expect(footer).toContain('href="/pricing"');
    expect(footer).toContain('href="/#capture"');

    // The anchors that used to expose the internal /v2 namespace must be gone.
    const forbiddenAnchors = [
      "/v2#how-it-works",
      "/v2/pricing",
      "/v2#capture",
      "/v2#legal-info",
      "/v2#faq",
      "/v2#about",
      "/v2#contact",
      "/v2#privacy",
      "/v2#terms",
      "/v2#disclaimer",
    ];
    for (const anchor of forbiddenAnchors) {
      expect(footer).not.toContain(`href="${anchor}"`);
    }
  });
});

describe("/auth/signin + /auth/signup — v2 chrome + intent preservation", () => {
  const signinPage = readSource("app/auth/signin/page.tsx");
  const signupPage = readSource("app/auth/signup/page.tsx");
  const signinForm = readSource("app/auth/signin/signin-form.tsx");
  const signupForm = readSource("app/auth/signup/signup-form.tsx");

  it("/auth/signin page wraps SignInForm in the v2 shell", () => {
    expect(signinPage).toMatch(/V2PageShell/);
    expect(signinPage).toMatch(/SignInForm/);
  });

  it("/auth/signup page wraps SignUpForm in the v2 shell", () => {
    expect(signupPage).toMatch(/V2PageShell/);
    expect(signupPage).toMatch(/SignUpForm/);
  });

  it("SignInForm still preserves the signup-first checkout intent", () => {
    expect(signinForm).toMatch(/markCheckoutResumeFromSearch/);
    expect(signinForm).toMatch(/searchParams\.get\("callbackUrl"\)/);
    expect(signinForm).toMatch(/searchParams\.get\("subscribe"\)/);
    // signIn call shape unchanged
    expect(signinForm).toMatch(/signIn\("credentials"/);
  });

  it("SignUpForm still propagates plan/source/callbackUrl/subscribe through to signin", () => {
    expect(signupForm).toMatch(/searchParams\.get\("redirect"\)/);
    expect(signupForm).toMatch(/searchParams\.get\("plan"\)/);
    expect(signupForm).toMatch(/searchParams\.get\("source"\)/);
    expect(signupForm).toMatch(/subscribe:\s*"true"/);
    expect(signupForm).toMatch(/callbackUrl:\s*"\/pricing"/);
    // Auth backend call shape unchanged
    expect(signupForm).toMatch(/\/api\/auth\/register/);
  });

  it("SignUpForm preserves the subscribe-flow branch and not just the default redirect", () => {
    // The branching logic that builds the URLSearchParams must still exist.
    expect(signupForm).toMatch(/isSubscribeFlow/);
    expect(signupForm).toMatch(/router\.push\(`\/auth\/signin\?\$\{params\.toString\(\)\}`\)/);
  });
});
