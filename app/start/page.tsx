import type { Metadata } from "next"
import Link from "next/link"
import { Logo } from "@/components/navigation/Logo"
import {
  ClipboardList,
  Rocket,
  Calculator,
  BookOpen,
  ExternalLink,
} from "lucide-react"

export const metadata: Metadata = {
  title: "FreshStart IL — Illinois Divorce Guidance",
  description:
    "Illinois divorce forms, checklists, and calculators. Get started with FreshStart IL — your guide through the Illinois divorce process.",
  openGraph: {
    title: "FreshStart IL — Illinois Divorce Guidance",
    description:
      "Illinois-specific divorce guidance. Free checklist, calculators, and auto-generated court forms.",
  },
}

const links = [
  {
    href: "/checklist",
    icon: ClipboardList,
    label: "Free Illinois Divorce Checklist",
    sublabel: "Required forms, fees, deadlines — instant email delivery",
    primary: true,
  },
  {
    href: "/auth/signup",
    icon: Rocket,
    label: "Start Free 7-Day Trial",
    sublabel: "Generate all 4 required court forms · $299/year after trial",
    primary: false,
  },
  {
    href: "/calculators",
    icon: Calculator,
    label: "Free Calculators",
    sublabel: "Child support & spousal maintenance (Illinois guidelines)",
    primary: false,
  },
  {
    href: "/legal-info",
    icon: BookOpen,
    label: "Illinois Divorce Guides",
    sublabel: "Process, forms, timelines, costs — Illinois-specific",
    primary: false,
  },
]

export default function StartPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-start px-4 py-12">
      {/* Brand */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <Logo />
        <p className="text-gray-600 text-sm text-center max-w-xs">
          Illinois divorce guidance — forms, checklists, and calculators
        </p>
      </div>

      {/* Link cards */}
      <div className="w-full max-w-sm flex flex-col gap-3">
        {links.map((link) => {
          const Icon = link.icon
          return (
            <Link key={link.href} href={link.href}>
              <div
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                  link.primary
                    ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700 shadow-md"
                    : "bg-white border-gray-200 text-gray-900 hover:border-blue-300 hover:shadow-sm"
                }`}
              >
                <div
                  className={`p-2 rounded-lg flex-shrink-0 ${
                    link.primary ? "bg-blue-500" : "bg-blue-50"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      link.primary ? "text-white" : "text-blue-600"
                    }`}
                  />
                </div>
                <div className="min-w-0">
                  <p
                    className={`font-semibold text-sm leading-tight ${
                      link.primary ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {link.label}
                  </p>
                  <p
                    className={`text-xs mt-0.5 leading-tight ${
                      link.primary ? "text-blue-100" : "text-gray-500"
                    }`}
                  >
                    {link.sublabel}
                  </p>
                </div>
                <ExternalLink
                  className={`h-4 w-4 flex-shrink-0 ml-auto ${
                    link.primary ? "text-blue-200" : "text-gray-300"
                  }`}
                />
              </div>
            </Link>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-10 text-center">
        <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          freshstart-il.com
        </Link>
        <p className="text-xs text-gray-400 mt-1">
          Illinois divorce guidance · Not legal advice
        </p>
      </div>
    </div>
  )
}
