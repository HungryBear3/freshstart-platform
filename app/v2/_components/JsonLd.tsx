import * as React from "react";
import type { PricingTier } from "./tiers";

const SITE_URL = "https://freshstart-il.com";

export function OrganizationAndWebsiteJsonLd() {
  const blocks = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "FreshStart-IL",
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      sameAs: [SITE_URL],
      description:
        "FreshStart-IL guides Illinois residents through uncontested divorce form preparation and filing steps.",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "FreshStart-IL",
      url: SITE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ];
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(blocks) }}
    />
  );
}

export function PricingProductsJsonLd({ tiers }: { tiers: PricingTier[] }) {
  const blocks = tiers.map((tier) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    name: `FreshStart-IL — ${tier.name}`,
    description: tier.tagline,
    brand: { "@type": "Brand", name: "FreshStart-IL" },
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: tier.priceNumber.toFixed(2),
      url: `${SITE_URL}/pricing`,
      availability: "https://schema.org/InStock",
      // Surface the 7-day free trial as a priceSpecification per the brief.
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: tier.priceNumber.toFixed(2),
        priceCurrency: "USD",
        unitText: tier.period,
        referenceQuantity: {
          "@type": "QuantitativeValue",
          value: 7,
          unitCode: "DAY",
          name: "Free trial period",
        },
      },
    },
  }));
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(blocks) }}
    />
  );
}
