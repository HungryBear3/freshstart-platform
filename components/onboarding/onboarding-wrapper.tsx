"use client"

import { useState, useEffect } from "react"
import { OnboardingWizard } from "./onboarding-wizard"

interface OnboardingWrapperProps {
  hasCompletedOnboarding: boolean
}

export function OnboardingWrapper({ hasCompletedOnboarding }: OnboardingWrapperProps) {
  const [showWizard, setShowWizard] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !hasCompletedOnboarding) {
      setShowWizard(true)
    }
  }, [mounted, hasCompletedOnboarding])

  const handleComplete = async () => {
    try {
      await fetch("/api/auth/complete-onboarding", { method: "POST", credentials: "include" })
      setShowWizard(false)
    } catch (err) {
      console.error("Failed to complete onboarding:", err)
    }
  }

  if (!showWizard) return null

  return <OnboardingWizard open={showWizard} onComplete={handleComplete} />
}
