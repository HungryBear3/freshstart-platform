"use client"

import { cn } from "@/lib/utils"
import { 
  CheckCircle2, 
  Circle, 
  ClipboardList, 
  FileText, 
  Upload, 
  Gavel,
  ChevronRight,
  Clock,
  AlertCircle
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export type WorkflowStep = 
  | 'account'
  | 'questionnaires'
  | 'documents'
  | 'review'
  | 'efiling'

export interface WorkflowStepConfig {
  id: WorkflowStep
  label: string
  description: string
  icon: React.ReactNode
  href: string
  estimatedTime?: string
}

export interface StepProgress {
  step: WorkflowStep
  status: 'not_started' | 'in_progress' | 'completed'
  completedItems?: number
  totalItems?: number
  lastUpdated?: Date
}

interface DivorceProgressWizardProps {
  currentStep?: WorkflowStep
  stepProgress: StepProgress[]
  variant?: 'horizontal' | 'vertical' | 'compact'
  showEstimatedTime?: boolean
  className?: string
}

const WORKFLOW_STEPS: WorkflowStepConfig[] = [
  {
    id: 'account',
    label: 'Account Setup',
    description: 'Create account and subscription',
    icon: <Circle className="h-5 w-5" />,
    href: '/dashboard/profile',
    estimatedTime: '5 min',
  },
  {
    id: 'questionnaires',
    label: 'Questionnaires',
    description: 'Complete required questionnaires',
    icon: <ClipboardList className="h-5 w-5" />,
    href: '/dashboard/questionnaires',
    estimatedTime: '45-60 min',
  },
  {
    id: 'documents',
    label: 'Documents',
    description: 'Generate your court forms',
    icon: <FileText className="h-5 w-5" />,
    href: '/dashboard/documents',
    estimatedTime: '10 min',
  },
  {
    id: 'review',
    label: 'Review',
    description: 'Review and download documents',
    icon: <AlertCircle className="h-5 w-5" />,
    href: '/dashboard/documents',
    estimatedTime: '15 min',
  },
  {
    id: 'efiling',
    label: 'E-Filing',
    description: 'File with the court',
    icon: <Upload className="h-5 w-5" />,
    href: '/dashboard/efiling',
    estimatedTime: '20 min',
  },
]

export function DivorceProgressWizard({
  currentStep,
  stepProgress,
  variant = 'horizontal',
  showEstimatedTime = true,
  className,
}: DivorceProgressWizardProps) {
  const getStepStatus = (stepId: WorkflowStep): StepProgress['status'] => {
    const progress = stepProgress.find(p => p.step === stepId)
    return progress?.status || 'not_started'
  }

  const getStepProgress = (stepId: WorkflowStep): StepProgress | undefined => {
    return stepProgress.find(p => p.step === stepId)
  }

  const getCurrentStepIndex = () => {
    if (!currentStep) return -1
    return WORKFLOW_STEPS.findIndex(s => s.id === currentStep)
  }

  // Calculate overall progress
  const completedSteps = stepProgress.filter(p => p.status === 'completed').length
  const totalSteps = WORKFLOW_STEPS.length
  const overallProgress = Math.round((completedSteps / totalSteps) * 100)

  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {WORKFLOW_STEPS.map((step, index) => {
          const status = getStepStatus(step.id)
          const isActive = currentStep === step.id
          
          return (
            <div key={step.id} className="flex items-center">
              <Link
                href={step.href}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-md text-sm transition-colors",
                  status === 'completed' && "text-green-600",
                  status === 'in_progress' && "text-blue-600 font-medium",
                  status === 'not_started' && "text-muted-foreground",
                  isActive && "bg-primary/10"
                )}
              >
                {status === 'completed' ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : status === 'in_progress' ? (
                  <div className="h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{step.label}</span>
              </Link>
              {index < WORKFLOW_STEPS.length - 1 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  if (variant === 'vertical') {
    return (
      <div className={cn("space-y-4", className)}>
        {/* Progress Summary */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium">Overall Progress</span>
          <span className="text-sm text-muted-foreground">{overallProgress}% Complete</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 mb-6">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {WORKFLOW_STEPS.map((step, index) => {
            const status = getStepStatus(step.id)
            const progress = getStepProgress(step.id)
            const isActive = currentStep === step.id
            
            return (
              <Link
                key={step.id}
                href={step.href}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border transition-colors",
                  status === 'completed' && "bg-green-50 border-green-200",
                  status === 'in_progress' && "bg-blue-50 border-blue-200",
                  status === 'not_started' && "bg-muted/30 border-muted",
                  isActive && "ring-2 ring-primary"
                )}
              >
                <div className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                  status === 'completed' && "bg-green-100 text-green-600",
                  status === 'in_progress' && "bg-blue-100 text-blue-600",
                  status === 'not_started' && "bg-muted text-muted-foreground"
                )}>
                  {status === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{step.label}</h4>
                    {showEstimatedTime && status !== 'completed' && step.estimatedTime && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {step.estimatedTime}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  
                  {progress?.completedItems !== undefined && progress?.totalItems && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>{progress.completedItems} of {progress.totalItems} completed</span>
                        <span>{Math.round((progress.completedItems / progress.totalItems) * 100)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div 
                          className={cn(
                            "h-1.5 rounded-full transition-all",
                            status === 'completed' ? "bg-green-500" : "bg-blue-500"
                          )}
                          style={{ width: `${(progress.completedItems / progress.totalItems) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </Link>
            )
          })}
        </div>
      </div>
    )
  }

  // Horizontal variant (default)
  return (
    <div className={cn("w-full", className)}>
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium">Your Progress</span>
          <span className="text-muted-foreground">{completedSteps} of {totalSteps} steps complete</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-start justify-between">
        {WORKFLOW_STEPS.map((step, index) => {
          const status = getStepStatus(step.id)
          const isActive = currentStep === step.id
          const isLast = index === WORKFLOW_STEPS.length - 1
          
          return (
            <div key={step.id} className="flex items-start flex-1">
              <div className="flex flex-col items-center text-center">
                <Link
                  href={step.href}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                    status === 'completed' && "bg-green-100 text-green-600",
                    status === 'in_progress' && "bg-blue-100 text-blue-600 ring-2 ring-blue-300",
                    status === 'not_started' && "bg-muted text-muted-foreground",
                    isActive && "ring-2 ring-primary"
                  )}
                >
                  {status === 'completed' ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    step.icon
                  )}
                </Link>
                <span className={cn(
                  "text-sm mt-2 font-medium",
                  status === 'completed' && "text-green-600",
                  status === 'in_progress' && "text-blue-600",
                  status === 'not_started' && "text-muted-foreground"
                )}>
                  {step.label}
                </span>
                {showEstimatedTime && status !== 'completed' && step.estimatedTime && (
                  <span className="text-xs text-muted-foreground mt-0.5">
                    ~{step.estimatedTime}
                  </span>
                )}
              </div>
              
              {!isLast && (
                <div className={cn(
                  "flex-1 h-0.5 mt-6 mx-2",
                  index < getCurrentStepIndex() || getStepStatus(WORKFLOW_STEPS[index + 1].id) !== 'not_started'
                    ? "bg-green-300"
                    : "bg-muted"
                )} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Simple progress indicator for headers
 */
export function ProgressIndicator({
  completed,
  total,
  label,
  className,
}: {
  completed: number
  total: number
  label?: string
  className?: string
}) {
  const percentage = Math.round((completed / total) * 100)
  
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
      <div className="flex-1 min-w-[100px]">
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <span className="text-sm font-medium">{percentage}%</span>
    </div>
  )
}

/**
 * Next step call-to-action
 */
export function NextStepCTA({
  nextStep,
  className,
}: {
  nextStep: WorkflowStepConfig
  className?: string
}) {
  return (
    <div className={cn(
      "flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20",
      className
    )}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          {nextStep.icon}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Next Step</p>
          <p className="font-medium">{nextStep.label}</p>
        </div>
      </div>
      <Button asChild>
        <Link href={nextStep.href}>
          Continue
          <ChevronRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  )
}
