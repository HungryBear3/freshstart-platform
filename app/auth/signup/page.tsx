import { Suspense } from "react"
import type { Metadata } from "next"
import { V2PageShell } from "@/app/v2/_components/V2PageShell"
import { SignUpForm } from "./signup-form"

export const metadata: Metadata = {
  title: "Create your FreshStart-IL account",
  description:
    "Create your FreshStart-IL account. The signup flow preserves your pricing intent — pick a plan and you'll resume checkout right after you sign in.",
  alternates: { canonical: "/auth/signup" },
}

export default function SignUpPage() {
  return (
    <V2PageShell
      idSuffix="signup"
      eyebrow="Account"
      title="Create your FreshStart-IL account."
      lede="One minute. We'll send a verification link, and if you started from a pricing CTA, you'll resume checkout the moment you sign in."
      disclaimer={null}
    >
      <div className="fs-auth-slot">
        <Suspense fallback={<p>Loading…</p>}>
          <SignUpForm />
        </Suspense>
      </div>
    </V2PageShell>
  )
}
