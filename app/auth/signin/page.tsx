import { Suspense } from "react"
import type { Metadata } from "next"
import { V2PageShell } from "@/app/v2/_components/V2PageShell"
import { SignInForm } from "./signin-form"

// Account surface, not marketing: excluded from the sitemap and must not be
// indexed. robots.txt intentionally does NOT disallow /auth, so crawlers can
// still fetch the page and see this directive. The canonical stays the route's
// own path (never the homepage) so the ?callbackUrl= variants consolidate onto
// /auth/signin rather than onto unrelated content.
export const metadata: Metadata = {
  title: "Sign in — FreshStart-IL",
  description: "Sign in to your FreshStart-IL account.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/auth/signin" },
}

export default function SignInPage() {
  return (
    <V2PageShell
      idSuffix="signin"
      eyebrow="Account"
      title="Sign in to FreshStart-IL"
      lede="Welcome back. Your case data and generated documents are right where you left them."
      disclaimer={null}
    >
      <div className="fs-auth-slot">
        <Suspense fallback={<p>Loading…</p>}>
          <SignInForm />
        </Suspense>
      </div>
    </V2PageShell>
  )
}
