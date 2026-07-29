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
      "Our supported form drafts and filing notes focus on Illinois uncontested-divorce workflows rather than a generic 50-state template.",
  },
  {
    title: "Honest about what we are.",
    body:
      "We're software, not a law firm. We don't give legal advice. We give you clearer paperwork and a working filing roadmap, and we point you at a licensed Illinois attorney when your case needs one.",
  },
  {
    title: "Step-by-step, not just a stack of PDFs.",
    body:
      "The questionnaire organizes your answers into supported form drafts and a filing checklist that you review before filing.",
  },
  {
    title: "Plain pricing.",
    body:
      "$149 one-time, with no subscription. Refund requests are reviewed under the published 30-day refund policy.",
  },
];

export default function AboutPage() {
  return (
    <V2PageShell
      idSuffix="about"
      eyebrow="About"
      title="The Illinois divorce process, finally written like software."
      lede="FreshStart-IL organizes answers into supported Illinois uncontested-divorce form drafts and a filing roadmap. You review the drafts, pay court fees separately, and file them yourself."
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
        FreshStart-IL is designed for straightforward uncontested cases where
        both spouses agree on the basics. It prepares supported form drafts
        and filing guidance; it does not promise court acceptance or an outcome.
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
