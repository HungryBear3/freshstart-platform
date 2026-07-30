"use client"

import { useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"

const DISMISS_KEY = "upgrade_banner_dismissed_v1"

export function UpgradeBanner() {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false
    return sessionStorage.getItem(DISMISS_KEY) === "1"
  })

  if (dismissed) return null

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1")
    setDismissed(true)
  }

  return (
    <div className="relative flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
      <span className="flex-1">
        <strong>Ready to file?</strong> Prepare supported Illinois divorce form drafts
        and a filing roadmap for <strong>$149 one-time with 60 days of service access</strong>, with no subscription.{" "}
        <Link href="/pricing" className="font-semibold underline underline-offset-2 hover:text-blue-700">
          Get started →
        </Link>
      </span>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded p-0.5 hover:bg-blue-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
