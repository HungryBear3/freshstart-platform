import type { NextConfig } from "next";

// The pre-v2 informational site lived under /legal-info/*. The v2 redesign
// consolidates its public legal-info surface under /legal plus four topic
// pages (/grounds-for-divorce, /property-division, /child-custody,
// /support-calculations). To avoid leaving the old light-theme hub
// reachable while the v2 ports of cost-estimator / timeline-calculator /
// glossary are still pending, every public /legal-info entry point sends
// a permanent 301 redirect to /legal. The detailed write-ups at
// /legal-info/[slug] (grounds-for-divorce, property-division, etc.) and
// the policy pages (/legal-info/privacy, /legal-info/terms,
// /legal-info/disclaimer, /legal-info/refund-policy) remain reachable as
// they are linked from v2 footers and the policy summaries.
const LEGAL_INFO_REDIRECTS = [
  "/legal-info",
  "/legal-info/process",
  "/legal-info/requirements",
  "/legal-info/court-forms",
  // Added 2026-09-21 by the catalog reconciliation review. The document guide
  // carried its own hardcoded form list, independent of the catalog: it labelled
  // statewide ATJ artifacts with Cook County CCP numbers as `officialId`, named
  // artifacts the 2026-09-14 evidence packet could not corroborate, and stated
  // both a generation claim ("Our system fills out official Illinois court
  // forms using your answers") and a filing-readiness claim. Every catalog entry
  // is non-automation-eligible, so none of that is true today. The replacement
  // copy is owner/legal-gated and the page is questionnaire→form mapping, which
  // that lane does not touch — so the route is closed rather than rewritten.
  "/legal-info/document-guide",
  "/legal-info/court-resources",
  "/legal-info/cost-estimator",
  "/legal-info/timeline-calculator",
  "/legal-info/glossary",
] as const;

const LEGACY_ROUTE_REDIRECTS = [
  { source: "/how-it-works", destination: "/#how-it-works" },
  { source: "/calculators/child-support", destination: "/support-calculations" },
  { source: "/calculators/maintenance", destination: "/support-calculations" },
  { source: "/auth/login", destination: "/auth/signin" },
  // v2 was the pre-launch review alias; production lives at / and /pricing.
  // Permanent 301 so any stale external link or cached crawl lands on the
  // canonical surface instead of the now-internal /v2 paths.
  { source: "/v2", destination: "/" },
  { source: "/v2/pricing", destination: "/pricing" },
  // /legal-info/* article pages — preview audit found these still serving
  // 200 with root-canonical even though /legal-info itself redirects.
  // Map duplicates to their v2 topic page, and the thinner stubs to /legal.
  { source: "/legal-info/grounds-for-divorce", destination: "/grounds-for-divorce" },
  { source: "/legal-info/property-division", destination: "/property-division" },
  { source: "/legal-info/child-custody", destination: "/child-custody" },
  { source: "/legal-info/spousal-maintenance", destination: "/support-calculations" },
  { source: "/legal-info/divorce-basics", destination: "/legal" },
  { source: "/legal-info/child-support", destination: "/legal" },
  { source: "/legal-info/court-procedures", destination: "/legal" },
  { source: "/legal-info/legal-rights", destination: "/legal" },
] as const;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      ...LEGAL_INFO_REDIRECTS.map((source) => ({
        source,
        destination: "/legal",
        permanent: true,
      })),
      ...LEGACY_ROUTE_REDIRECTS.map(({ source, destination }) => ({
        source,
        destination,
        permanent: true,
      })),
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
