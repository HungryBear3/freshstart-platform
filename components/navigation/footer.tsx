import Link from "next/link"
import { VisitorCounter } from "@/components/visitor-counter"

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-bold text-gray-900 mb-4">FreshStart IL</h3>
            <p className="text-sm text-gray-600 mb-4">
              Your guide through the Illinois divorce process. We provide clear,
              step-by-step guidance to help you navigate your divorce with confidence.
            </p>
            <VisitorCounter showToday={true} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/legal-info"
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Legal Information
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/documents"
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Documents
                </Link>
              </li>
              <li>
                <Link
                  href="/questionnaires"
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Questionnaires
                </Link>
              </li>
              <li>
                <Link
                  href="/legal-info/prenups-in-illinois"
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Prenups & Postnups
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/legal-info/faq"
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/legal-info/disclaimer"
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Disclaimer
                </Link>
              </li>
              <li>
                <Link
                  href="/legal-info/privacy"
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/legal-info/terms"
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            © {new Date().getFullYear()} FreshStart IL. All rights reserved. This
            platform provides information only and does not constitute legal advice.
          </p>
        </div>
      </div>
    </footer>
  )
}
