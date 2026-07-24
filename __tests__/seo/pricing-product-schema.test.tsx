/**
 * @jest-environment node
 */
import * as React from "react"
import ReactDOMServer from "react-dom/server"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { PricingProductsJsonLd } from "@/app/v2/_components/JsonLd"
import { PricingGuaranteeBand } from "@/app/v2/_components/PricingGuaranteeBand"
import { getTiers } from "@/app/v2/_components/tiers"

function payloadsForPricing() {
  const html = ReactDOMServer.renderToStaticMarkup(
    <PricingProductsJsonLd tiers={getTiers({ count: 2, recommendedTier: "plus" })} />,
  )
  return Array.from(
    html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g),
    (match) => JSON.parse(match[1]) as Record<string, unknown>,
  )
}

describe("pricing Product structured data", () => {
  it("emits one valid Product + simple Offer per visible tier", () => {
    const tiers = getTiers({ count: 2, recommendedTier: "plus" })
    const payloads = payloadsForPricing()

    expect(payloads).toHaveLength(tiers.length)
    payloads.forEach((product, index) => {
      const offer = product.offers as Record<string, unknown>
      expect(product["@type"]).toBe("Product")
      expect(product.name).toBe(`FreshStart IL — ${tiers[index].name}`)
      expect(product.image).toBe("https://www.freshstart-il.com/opengraph-image")
      expect(offer).toEqual({
        "@type": "Offer",
        priceCurrency: "USD",
        price: tiers[index].priceNumber.toFixed(2),
        url: "https://www.freshstart-il.com/pricing",
        availability: "https://schema.org/InStock",
      })
    })
  })

  it("emits no trial, billing-period, shipping, or invented return-policy claims", () => {
    const json = JSON.stringify(payloadsForPricing())
    expect(json).not.toMatch(
      /free trial|referenceQuantity|priceSpecification|unitText|shippingDetails|hasMerchantReturnPolicy/i,
    )
  })

  it("removes the visible seven-day free-trial claim", () => {
    const html = ReactDOMServer.renderToStaticMarkup(<PricingGuaranteeBand />)
    expect(html).toContain("There is no free trial")
    expect(html).not.toContain("Explore the full product with no card")
  })

  it("contains no positive free-trial claim in rendered or metadata/image sources", () => {
    const files = [
      "app/page.tsx",
      "app/pricing/page.tsx",
      "app/v2/page.tsx",
      "app/v2/pricing/page.tsx",
      "app/dashboard/page.tsx",
      "app/opengraph-image.tsx",
      "app/v2/_components/Hero.tsx",
      "app/v2/_components/PricingHero.tsx",
      "app/v2/_components/PricingMobileStickyCTA.tsx",
      "app/v2/_components/HomeView.tsx",
    ]
    const source = files.map((file) => readFileSync(join(process.cwd(), file), "utf8")).join("\n")
    expect(source).not.toMatch(/7-day free trial|explore everything risk-free/i)
  })
})
