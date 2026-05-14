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
