"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Circle, ChevronRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Step {
  id: string
  title: string
  description?: string
  content?: React.ReactNode
  estimatedTime?: string
  required?: boolean
  completed?: boolean
}

interface StepByStepGuideProps {
  title: string
  description?: string
  steps: Step[]
  onStepComplete?: (stepId: string) => void
  className?: string
}

export function StepByStepGuide({
  title,
  description,
  steps,
  onStepComplete,
  className,
}: StepByStepGuideProps) {
  const [expandedStep, setExpandedStep] = useState<string | null>(steps[0]?.id || null)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(
    new Set(steps.filter((s) => s.completed).map((s) => s.id))
  )

  const completedCount = completedSteps.size
  const progress = (completedCount / steps.length) * 100

  const handleToggleStep = (stepId: string) => {
    setExpandedStep(expandedStep === stepId ? null : stepId)
  }

  const handleCompleteStep = (stepId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newCompleted = new Set(completedSteps)
    if (newCompleted.has(stepId)) {
      newCompleted.delete(stepId)
    } else {
      newCompleted.add(stepId)
    }
    setCompletedSteps(newCompleted)
    onStepComplete?.(stepId)
  }

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        {description && <p className="text-gray-600">{description}</p>}
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Progress: {completedCount} of {steps.length} steps completed
          </span>
          <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} />
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.has(step.id)
          const isExpanded = expandedStep === step.id

          return (
            <Card
              key={step.id}
              className={cn(
                "transition-all",
                isCompleted && "border-green-200 bg-green-50/50",
                isExpanded && "border-blue-200"
              )}
            >
              <CardHeader
                className="cursor-pointer"
                onClick={() => handleToggleStep(step.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="mt-1">
                      {isCompleted ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      ) : (
                        <Circle className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">
                          Step {index + 1}: {step.title}
                        </CardTitle>
                        {step.required && (
                          <span className="text-xs font-medium text-red-600">Required</span>
                        )}
                      </div>
                      {step.description && (
                        <CardDescription className="mt-1">{step.description}</CardDescription>
                      )}
                      {step.estimatedTime && (
                        <p className="text-xs text-gray-500 mt-1">
                          Estimated time: {step.estimatedTime}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleCompleteStep(step.id, e)}
                      className={cn(
                        isCompleted
                          ? "text-green-600 hover:text-green-700"
                          : "text-gray-600 hover:text-gray-900"
                      )}
                    >
                      {isCompleted ? "Mark incomplete" : "Mark complete"}
                    </Button>
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </CardHeader>
              {isExpanded && step.content && (
                <CardContent className="pt-0">
                  <div className="pl-10 border-l-2 border-gray-200">
                    {step.content}
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
