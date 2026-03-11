"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileText, Users, Sparkles, ChevronRight, ChevronLeft } from "lucide-react"

const STEPS = [
  {
    id: "overview",
    title: "Here's how it works",
    icon: Sparkles,
    content: (
      <>
        <p className="text-muted-foreground mb-4">
          FreshStart IL guides you through the Illinois divorce process step by step.
        </p>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>Complete questionnaires about your case</li>
          <li>Generate court-ready documents automatically</li>
          <li>Track deadlines and milestones</li>
          <li>Access calculators for child support and maintenance</li>
        </ul>
      </>
    ),
  },
  {
    id: "situation",
    title: "Your situation",
    icon: Users,
    content: (
      <>
        <p className="text-muted-foreground mb-4">
          Tell us about your case so we can personalize your experience.
        </p>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>Are you the petitioner or respondent?</li>
          <li>Do you have children?</li>
          <li>Do you have a prenuptial agreement?</li>
          <li>What county will you file in?</li>
        </ul>
        <p className="text-muted-foreground mt-4 text-sm">
          You can answer these in the Petition questionnaire when you&apos;re ready.
        </p>
      </>
    ),
  },
  {
    id: "recommended",
    title: "Recommended first step",
    icon: FileText,
    content: (
      <>
        <p className="text-muted-foreground mb-4">
          We recommend starting with the Petition for Dissolution of Marriage questionnaire.
        </p>
        <p className="text-muted-foreground text-sm">
          It captures the basics of your case and unlocks the rest of the workflow. You can save
          progress and return anytime.
        </p>
      </>
    ),
  },
]

interface OnboardingWizardProps {
  open: boolean
  onComplete: () => void
}

export function OnboardingWizard({ open, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const Icon = current.icon

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      onComplete()
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            {current.title}
          </DialogTitle>
          <DialogDescription>
            Step {step + 1} of {STEPS.length}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">{current.content}</div>
        <DialogFooter className="flex justify-between sm:justify-between">
          <div className="flex gap-2">
            {step > 0 ? (
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            ) : (
              <Button variant="ghost" onClick={handleSkip}>
                Skip
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {step < STEPS.length - 1 ? (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={async () => {
                  await onComplete()
                  window.location.href = "/questionnaires"
                }}
              >
                Start Petition
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
