import * as React from "react";
import { SITE_URL } from "@/lib/site-url";
import type { PricingTier } from "./tiers";

const PRODUCT_IMAGE_URL = `${SITE_URL}/opengraph-image`;

export function OrganizationAndWebsiteJsonLd() {
  const blocks = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "FreshStart IL",
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      sameAs: [SITE_URL],
      description:
        "FreshStart IL guides Illinois residents through uncontested divorce form preparation and filing steps.",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "FreshStart IL",
      url: SITE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ];
  return (
    <>
      {blocks.map((block) => (
        <script
          key={block["@type"]}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </>
  );
}

export function PricingProductsJsonLd({ tiers }: { tiers: PricingTier[] }) {
  const blocks = tiers.map((tier) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    name: `FreshStart IL — ${tier.name}`,
    description: tier.tagline,
    brand: { "@type": "Brand", name: "FreshStart IL" },
    image: PRODUCT_IMAGE_URL,
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: tier.priceNumber.toFixed(2),
      url: `${SITE_URL}/pricing`,
      availability: "https://schema.org/InStock",
    },
  }));
  return (
    <>
      {blocks.map((block) => (
        <script
          key={block.name}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </>
  );
}
