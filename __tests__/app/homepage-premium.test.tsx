import ReactDOMServer from "react-dom/server"

// The premium homepage redesign is mounted at the preview route, NOT at "/".
// Production "/" stays on the v2 HomeView, so this branch can't accidentally
// ship the redesign. We render the preview composition directly here.
import PremiumHomepagePreview from "@/app/preview/premium-homepage/page"
import { Header } from "@/components/navigation/header"

jest.mock("@/components/help/help-sidebar", () => ({
  HelpSidebar: () => null,
}))

jest.mock("@/components/visitor-counter", () => ({
  VisitorCounter: () => <div>Visitor Counter</div>,
}))

describe("FreshStart premium homepage refresh", () => {
  it("renders the premium hero copy and trust pills from the approved design", () => {
    const html = ReactDOMServer.renderToStaticMarkup(<PremiumHomepagePreview />)

    expect(html).toContain("Illinois Divorce")
    expect(html).toContain("Done Right.")
    expect(html).toContain("Trusted by residents in all 102 Illinois counties")
    expect(html).toContain("Secure &amp; Private")
    expect(html).toContain("Under 2 Hours")
    // Legally-safe phrasing: "Reviewable Form Drafts" — NOT "Court-Ready Forms".
    // FreshStart prepares drafts/guidance and does not promise court acceptance.
    expect(html).toContain("Reviewable Form Drafts")
    expect(html).not.toContain("Court-Ready Forms")
    expect(html).toContain("All 102 IL Counties")
  })

  it("removes the attorney quote band and duplicate pre-call card from the homepage", () => {
    const html = ReactDOMServer.renderToStaticMarkup(<PremiumHomepagePreview />)

    expect(html).not.toContain("Erin Birt")
    expect(html).not.toContain("Attorney-Reviewed Platform")
    expect(html).not.toContain("Need help deciding?")
  })

  it("extends the premium treatment into lower homepage sections", () => {
    const html = ReactDOMServer.renderToStaticMarkup(<PremiumHomepagePreview />)

    expect(html).toContain("bg-slate-900/95")
    expect(html).toContain("bg-slate-950/60")
    expect(html).toContain("Why FreshStart IL")
  })

  it("uses the darker premium navigation shell", () => {
    const html = ReactDOMServer.renderToStaticMarkup(<Header />)

    expect(html).toContain("bg-slate-950")
    expect(html).toContain("bg-amber-300")
  })
})
