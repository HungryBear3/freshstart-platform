import type { Metadata } from "next"
import Link from "next/link"
import { V2PageShell } from "@/app/v2/_components/V2PageShell"
import { DEFAULT_OG_IMAGE } from "@/lib/seo-metadata"

export const metadata: Metadata = {
  title: "Start — Illinois divorce form preparation",
  description:
    "Start with FreshStart IL's free checklist, review the $149 one-time document-preparation service, or read Illinois divorce information.",
  alternates: { canonical: "/start" },
  openGraph: {
    title: "Start with FreshStart IL",
    description:
      "Choose the free checklist, review $149 one-time form preparation, or read Illinois divorce information.",
    images: [DEFAULT_OG_IMAGE],
  },
}

const links = [
  {
    href: "/checklist",
    label: "Free Illinois Divorce Checklist",
    sublabel: "Common documents and filing checkpoints — instant email delivery",
  },
  {
    href: "/pricing",
    label: "Review the $149 Filing Option",
    sublabel: "$149 one-time · 60 days of service access · No subscription",
  },
  {
    href: "/legal-info",
    label: "Illinois Divorce Guides",
    sublabel: "General information about process, forms, timelines, and costs",
  },
]

export default function StartPage() {
  return (
    <V2PageShell
      idSuffix="start"
      eyebrow="Start here"
      title="Choose the next step that fits."
      lede="Use the free checklist, review our one-time form-preparation service, or read general Illinois divorce information."
    >
      <div className="fs-doc-cards">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="fs-doc-card">
            <div className="fs-doc-card-title">{link.label}</div>
            <p className="fs-doc-card-body">{link.sublabel}</p>
          </Link>
        ))}
      </div>
    </V2PageShell>
  )
}
