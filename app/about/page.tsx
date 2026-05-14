import type { Metadata } from "next";
import Link from "next/link";
import { V2PageShell } from "@/app/v2/_components/V2PageShell";
import { DEFAULT_OG_IMAGE, DEFAULT_TWITTER_IMAGE } from "@/lib/seo-metadata";

export const metadata: Metadata = {
  title: "About",
  description:
    "Who we are, why we built FreshStart-IL, and the principles that shape it. Illinois divorce form drafts and step-by-step filing guidance — without the attorney bill.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About FreshStart-IL",
    description:
      "Why we built FreshStart-IL: Illinois-specific divorce form drafts and step-by-step filing guidance, built for residents — not a 50-state template.",
    url: "/about",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    title: "About FreshStart-IL",
    description:
      "Why we built FreshStart-IL: Illinois-specific divorce form drafts and step-by-step filing guidance.",
    images: [DEFAULT_TWITTER_IMAGE],
  },
};

const VALUES = [
  {
    title: "Built for Illinois, specifically.",
    body:
      "Every form, calculator, and county note is built around Illinois law and Illinois Supreme Court approved standardized forms — not a generic 50-state template.",
  },
  {
    title: "Honest about what we are.",
    body:
      "We're software, not a law firm. We don't give legal advice. We give you clearer paperwork and a working filing roadmap, and we point you at a licensed Illinois attorney when your case needs one.",
  },
  {
    title: "Step-by-step, not just a stack of PDFs.",
    body:
      "The questionnaire turns your situation into a packet with the right boxes ticked, the right schedules attached, and a county-aware filing checklist.",
  },
  {
    title: "Plain pricing.",
    body:
      "$149 one-time for Essential or $299/year for Plus. 30-day money-back if the product isn't right for you or there's a service issue on our side.",
  },
];

export default function AboutPage() {
  return (
    <V2PageShell
      idSuffix="about"
      eyebrow="About"
      title="The Illinois divorce process, finally written like software."
      lede="FreshStart-IL exists because Illinois divorce paperwork shouldn't require a $15,000 retainer for an uncontested case. We turn the same standardized forms an attorney would file into a guided, county-aware questionnaire you can finish in one focused session."
    >
      <h2>How we think about the work</h2>
      {VALUES.map((v) => (
        <section key={v.title}>
          <h3>{v.title}</h3>
          <p>{v.body}</p>
        </section>
      ))}

      <h2>When to use FreshStart-IL — and when not to</h2>
      <p>
        Most Illinois divorces are uncontested. If you and your spouse can
        agree on the broad strokes, FreshStart-IL can save you thousands
        in attorney fees and produce a clean, court-ready packet.
      </p>
      <p>
        If your case is contested, involves a complicated business, a
        valuation dispute, or safety concerns, you should{" "}
        <strong>talk to a licensed Illinois attorney before filing</strong>.
        FreshStart-IL isn&apos;t built to mediate that.
      </p>

      <h2>Where to start</h2>
      <ul>
        <li>
          <Link href="/pricing">See pricing →</Link>
        </li>
        <li>
          <Link href="/legal">Browse the legal-info library →</Link>
        </li>
        <li>
          <Link href="/contact">Contact support →</Link>
        </li>
      </ul>
    </V2PageShell>
  );
}
