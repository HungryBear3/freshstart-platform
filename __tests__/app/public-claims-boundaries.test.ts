import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("public offer and legal-information boundaries", () => {
  it("discloses the 60-day service-access period at principal purchase entry points", () => {
    const sources = [
      "app/v2/_components/Hero.tsx",
      "app/v2/_components/PricingHero.tsx",
      "app/v2/_components/PricingMobileStickyCTA.tsx",
      "app/v2/_components/tiers.ts",
      "app/start/page.tsx",
      "app/dashboard/page.tsx",
      "app/dashboard/profile/page.tsx",
      "app/calculators/page.tsx",
      "app/about/page.tsx",
      "app/legal-info/refund-policy/page.tsx",
      "components/lead-magnet/checklist-form.tsx",
      "components/dashboard/upgrade-banner.tsx",
      "app/terms/page.tsx",
    ].map(read);
    for (const source of sources) expect(source).toMatch(/60(?: days? (?:of service )?access|-day access)/i);
  });

  it("does not publish a stale arithmetic court-cost estimate", () => {
    const page = read("app/legal-info/cost-estimator/page.tsx");
    expect(page).toContain("does not publish a calculated total");
    expect(page).toContain("illinoiscourts.gov/courts/circuit-court");
    expect(page).toContain("fee-waiver-civil");
    expect(page).not.toContain("estimateCosts(");
    expect(page).not.toMatch(/Court fees and required costs only/);
  });

  it("does not state a pre-filing 90-day rule or county-duration venue rule", () => {
    const pages = [
      "app/legal-info/process/page.tsx",
      "app/legal-info/requirements/page.tsx",
      "app/legal-info/[slug]/page.tsx",
      "app/legal-info/glossary/page.tsx",
      "app/api/admin/seed-legal-content/route.ts",
    ].map(read);
    for (const page of pages) {
      expect(page).not.toMatch(/90 days before filing/i);
      expect(page).not.toMatch(/county where either spouse has lived for at least 90 days/i);
    }
    expect(pages.join("\n")).toContain("County venue is separate");
  });

  it("marks the Financial Affidavit as conditional in the document guide", () => {
    const guide = read("app/legal-info/document-guide/page.tsx");
    const block = guide.slice(guide.indexOf('id: "financial-affidavit"'), guide.indexOf('id: "schedule-a"'));
    expect(block).toMatch(/required:\s*false/);
    expect(block).toMatch(/May be required depending on the case or court/);
    const otherPages = [
      "app/legal-info/requirements/page.tsx",
      "app/legal-info/glossary/page.tsx",
    ].map(read).join("\n");
    expect(otherPages).not.toMatch(/Required (?:disclosure|in Illinois divorces)/i);
    expect(otherPages).toMatch(/may require/i);
  });

  it("does not advertise the retired arithmetic cost estimator", () => {
    const landing = read("app/calculators/page.tsx");
    expect(landing).not.toMatch(/cost estimation|cost estimates/i);
    expect(landing).not.toMatch(/based on official Illinois (?:statutory )?guidelines/i);
    expect(landing).toMatch(/general educational/i);
  });

  it("keeps indexed blog posts within the same legal and product-claim boundaries", () => {
    // Match lib/blog.ts (and therefore app/sitemap.ts): every .md file directly
    // inside content/blog is loaded and indexed.
    const postsDirectory = join(process.cwd(), "content/blog");
    const indexedPostPaths = readdirSync(postsDirectory)
      .filter((fileName) => fileName.endsWith(".md"))
      .map((fileName) => `content/blog/${fileName}`);
    const indexedPosts = indexedPostPaths.map((path) => ({ path, source: read(path) }));
    const posts = indexedPosts.map(({ source }) => source).join("\n");

    expect(indexedPostPaths).toHaveLength(16);
    expect(posts).not.toMatch(/90 days before filing|90-day residency|lived in Illinois for \*{0,2}90 days\*{0,2} before filing/i);
    expect(posts).not.toMatch(/required in all Illinois divorces|Financial Affidavit \(both (?:parties|spouses)\)/i);
    expect(posts).not.toMatch(/court-ready|ready to (?:sign and )?file|error-free|Illinois-compliant/i);
    expect(posts).not.toMatch(/handles all (?:of )?(?:the )?forms|generate(?:s)? (?:all|every|the correct) (?:of )?(?:your )?(?:Illinois )?(?:court )?forms/i);
    expect(posts).not.toMatch(/requires? (?:a )?\*{0,2}(?:6-month|six-month) separation|must have been living separate and apart for at least (?:6|six) months|need to wait|mandatory waiting period of (?:6|six) months/i);
    expect(posts).not.toMatch(/(?:ensures?|guarantees?|make sure) (?:that )?(?:your )?(?:forms|paperwork|documents?).*(?:complete|correct|accepted)|complete MSA with all required provisions/i);
    expect(posts).not.toMatch(/more likely to be approved as-is|seen favorably by courts|provision[^\n.]*is sufficient/i);
    expect(posts).not.toMatch(/Parent [AB] pays \$|(?:146\+?|40%\+) (?:nights|of nights)[^\n.]*(?:reduces?|credit)/i);

    const productPosts = indexedPosts.filter(({ source }) => /Fresh\s*Start IL/i.test(source));
    for (const { source } of productPosts) {
      expect(source).toMatch(/supported (?:Illinois uncontested-divorce )?form drafts/i);
      expect(source).toMatch(/(?:you|users?) review/i);
      expect(source).toMatch(/(?:you|users?)[^\n]*(?:file|files)/i);
      expect(source).toMatch(/not a law firm/i);
      expect(source).toMatch(/does not provide legal advice|not legal advice/i);
      expect(source).toMatch(/does not[^\n.]*guarantee|do not guarantee/i);
      expect(source).toMatch(/(?:60 days of access|60-day)/i);
    }
  });

  it("does not present six months as a categorical separation or waiting requirement", () => {
    const page = read("app/grounds-for-divorce/page.tsx");
    expect(page).not.toMatch(/have lived [\s\S]*separate and apart[\s\S]*for at least 6\s*months/i);
    expect(page).not.toMatch(/6-month separation period is waived/i);
    expect(page).toMatch(/rebuttable presumption/i);
  });
});
