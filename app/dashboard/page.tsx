import { redirect } from "next/navigation"
import { Suspense } from "react"
import { getCurrentUser } from "@/lib/auth/session"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  FileText, 
  Calendar, 
  Calculator, 
  User, 
  Users, 
  Upload, 
  CreditCard, 
  CheckCircle2,
  ArrowRight,
  Download,
  Scale,
  Clock,
  AlertCircle,
  BookOpen
} from "lucide-react"
import { getUserSubscription } from "@/lib/stripe/subscription"
import { prisma } from "@/lib/db"
import { 
  DivorceProgressWizard, 
  NextStepCTA,
  type StepProgress,
  type WorkflowStep
} from "@/components/workflow/divorce-progress-wizard"
import { CheckoutSuccessTracker } from "@/components/analytics/checkout-success-tracker"
import { PrenupGuidanceBanner } from "@/components/prenup/prenup-guidance-banner"
import { getPrenupStatus, PrenupContext } from "@/lib/prenup/branching"

async function getUserProgress(userId: string) {
  // Get questionnaire responses
  const questionnaireResponses = await prisma.questionnaireResponse.findMany({
    where: { userId },
    select: { 
      formType: true, 
      status: true,
      updatedAt: true,
    },
  })

  // Get documents
  const documents = await prisma.document.findMany({
    where: { userId, status: 'ready' },
    select: { type: true, generatedAt: true },
  })

  // Calculate progress
  const requiredQuestionnaires = ['petition', 'financial_affidavit']
  const completedQuestionnaires = questionnaireResponses.filter(
    q => q.status === 'completed'
  ).length
  const totalQuestionnaires = Math.max(requiredQuestionnaires.length, questionnaireResponses.length)

  const documentCount = documents.length

  return {
    questionnaires: {
      completed: completedQuestionnaires,
      total: totalQuestionnaires,
      responses: questionnaireResponses,
    },
    documents: {
      count: documentCount,
      items: documents,
    },
  }
}

async function getPrenupStatusForUser(userId: string): Promise<"none" | "uncontested" | "disputed" | "unclear"> {
  // Get the latest petition questionnaire response
  const petitionResponse = await prisma.questionnaireResponse.findFirst({
    where: {
      userId,
      formType: "petition",
    },
    orderBy: {
      updatedAt: "desc",
    },
  })

  if (!petitionResponse?.responses) {
    return "none"
  }

  const responses = petitionResponse.responses as any
  const hasPrenup = responses.hasPrenup || responses["has-prenup"] || "no"

  if (hasPrenup === "no" || hasPrenup === "not_sure") {
    return "none"
  }

  // Extract prenup context
  const prenupContext: PrenupContext = {
    hasPrenup: hasPrenup as "yes" | "no" | "not_sure",
    prenupFollowStatus: (responses.prenupFollowStatus || responses["prenup-follow-status"]) as PrenupContext["prenupFollowStatus"],
    prenupType: (responses.prenupType || responses["prenup-type"]) as PrenupContext["prenupType"],
    prenupSignedState: (responses.prenupSignedState || responses["prenup-signed-state"]) as string,
    prenupIndependentCounsel: (responses.prenupIndependentCounsel || responses["prenup-independent-counsel"]) as PrenupContext["prenupIndependentCounsel"],
    prenupFullDisclosure: (responses.prenupFullDisclosure || responses["prenup-full-disclosure"]) as PrenupContext["prenupFullDisclosure"],
  }

  return getPrenupStatus(prenupContext)
}

function calculateStepProgress(
  hasSubscription: boolean,
  progress: Awaited<ReturnType<typeof getUserProgress>>
): { stepProgress: StepProgress[]; currentStep: WorkflowStep } {
  const stepProgress: StepProgress[] = []
  let currentStep: WorkflowStep = 'account'

  // Account step
  if (hasSubscription) {
    stepProgress.push({ step: 'account', status: 'completed' })
    currentStep = 'questionnaires'
  } else {
    stepProgress.push({ step: 'account', status: 'in_progress' })
    return { stepProgress, currentStep }
  }

  // Questionnaires step
  const qProgress = progress.questionnaires
  if (qProgress.completed >= 2) {
    stepProgress.push({ step: 'questionnaires', status: 'completed' })
    currentStep = 'documents'
  } else if (qProgress.completed > 0) {
    stepProgress.push({ 
      step: 'questionnaires', 
      status: 'in_progress',
      completedItems: qProgress.completed,
      totalItems: Math.max(2, qProgress.total),
    })
  } else {
    stepProgress.push({ step: 'questionnaires', status: 'not_started' })
    return { stepProgress, currentStep }
  }

  // Documents step
  if (progress.documents.count >= 2) {
    stepProgress.push({ step: 'documents', status: 'completed' })
    currentStep = 'review'
  } else if (progress.documents.count > 0) {
    stepProgress.push({ 
      step: 'documents', 
      status: 'in_progress',
      completedItems: progress.documents.count,
      totalItems: 2,
    })
  } else {
    stepProgress.push({ step: 'documents', status: 'not_started' })
  }

  // Review step
  if (progress.documents.count >= 2) {
    stepProgress.push({ step: 'review', status: 'in_progress' })
    currentStep = 'review'
  } else {
    stepProgress.push({ step: 'review', status: 'not_started' })
  }

  // E-Filing step
  stepProgress.push({ step: 'efiling', status: 'not_started' })

  return { stepProgress, currentStep }
}

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/signin")
  }

  // Check subscription status
  const subscription = await getUserSubscription(user.id)
  const hasActiveSubscription = subscription?.isActive ?? false

  // Get user progress
  const progress = await getUserProgress(user.id)
  const { stepProgress, currentStep } = calculateStepProgress(
    hasActiveSubscription,
    progress
  )

  // Check for prenup status
  const prenupStatus = await getPrenupStatusForUser(user.id)

  // Calculate overall completion percentage
  const completedSteps = stepProgress.filter(s => s.status === 'completed').length
  const totalSteps = 5
  const overallProgress = Math.round((completedSteps / totalSteps) * 100)

  // Determine next action
  const getNextAction = () => {
    if (!hasActiveSubscription) {
      return { 
        title: 'Start Your Free Trial', 
        description: 'Subscribe to access all features',
        href: '/pricing',
        icon: CreditCard,
      }
    }
    if (progress.questionnaires.completed === 0) {
      return { 
        title: 'Complete Petition Questionnaire', 
        description: 'Start with basic information about your case',
        href: '/questionnaires',
        icon: FileText,
      }
    }
    if (progress.questionnaires.completed < 2) {
      return { 
        title: 'Complete Financial Affidavit', 
        description: 'Required for all divorce cases',
        href: '/questionnaires',
        icon: Calculator,
      }
    }
    if (progress.documents.count === 0) {
      return { 
        title: 'Generate Your Documents', 
        description: 'Create court-ready forms from your questionnaires',
        href: '/documents',
        icon: FileText,
      }
    }
    return { 
      title: 'Review & File Documents', 
      description: 'Download and file with the court',
      href: '/dashboard/efiling',
      icon: Upload,
    }
  }

  const nextAction = getNextAction()

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back{user.name ? `, ${user.name}` : ""}
          </h1>
          <p className="mt-2 text-gray-600">
            {hasActiveSubscription 
              ? "Track your progress and manage your divorce documents"
              : "Start your subscription to begin the divorce process"}
          </p>
        </div>

        {/* Subscription Status Banner */}
        {!hasActiveSubscription && (
          <Card className="mb-8 border-2 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <CreditCard className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Complete Your Subscription
                    </h3>
                    <p className="text-sm text-gray-600">
                      Start your 7-day free trial to access all FreshStart IL features
                    </p>
                  </div>
                </div>
                <Link href="/pricing">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {hasActiveSubscription && subscription && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Active Subscription
                  </h3>
                  <p className="text-sm text-gray-600">
                    {subscription.status === "trialing" && subscription.trialEnd
                      ? `Trial ends ${new Date(subscription.trialEnd).toLocaleDateString()}`
                      : subscription.currentPeriodEnd
                      ? `Renews ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                      : "Your subscription is active"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Prenup Guidance Banner */}
        {hasActiveSubscription && prenupStatus !== "none" && (
          <div className="mb-6">
            <PrenupGuidanceBanner status={prenupStatus} />
          </div>
        )}

        {/* Progress Wizard */}
        {hasActiveSubscription && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Your Divorce Process Progress
              </CardTitle>
              <CardDescription>
                Follow these steps to complete your divorce paperwork
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DivorceProgressWizard
                currentStep={currentStep}
                stepProgress={stepProgress}
                variant="horizontal"
                showEstimatedTime={true}
              />
            </CardContent>
          </Card>
        )}

        {/* Next Step CTA */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <nextAction.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Next Step</p>
                  <h3 className="text-lg font-semibold">{nextAction.title}</h3>
                  <p className="text-sm text-muted-foreground">{nextAction.description}</p>
                </div>
              </div>
              <Link href={nextAction.href}>
                <Button size="lg">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats (for active users) */}
        {hasActiveSubscription && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Questionnaires</p>
                    <p className="text-2xl font-bold">
                      {progress.questionnaires.completed}/{Math.max(2, progress.questionnaires.total)}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Documents</p>
                    <p className="text-2xl font-bold">{progress.documents.count}</p>
                  </div>
                  <FileText className="h-8 w-8 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Overall Progress</p>
                    <p className="text-2xl font-bold">{overallProgress}%</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <FileText className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Questionnaires</CardTitle>
              <CardDescription>
                Complete questionnaires to generate your divorce documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/questionnaires">
                <Button variant="outline" className="w-full">
                  {progress.questionnaires.completed > 0 ? 'Continue' : 'Start'} Questionnaire
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <FileText className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Documents</CardTitle>
              <CardDescription>
                View, generate, and download your court forms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/documents">
                <Button variant="outline" className="w-full">
                  View Documents
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <Download className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Download All</CardTitle>
              <CardDescription>
                Download all your documents as a ZIP package
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a href="/api/documents/package" download>
                <Button 
                  variant="outline" 
                  className="w-full"
                  disabled={progress.documents.count === 0}
                >
                  Download Package
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>

        {/* Resources */}
        <h2 className="text-xl font-semibold mb-4">Resources & Tools</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <Scale className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Court Forms Library</CardTitle>
              <CardDescription>
                Access official Illinois court forms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/legal-info/court-forms">
                <Button variant="outline" className="w-full">
                  View Forms
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <Calendar className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Case Management</CardTitle>
              <CardDescription>
                Track deadlines, court dates, and milestones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/case">
                <Button variant="outline" className="w-full">
                  Manage Case
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <Calculator className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Financial Tools</CardTitle>
              <CardDescription>
                Calculate child support and spousal maintenance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/financial">
                <Button variant="outline" className="w-full">
                  Financial Tools
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <Users className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Parenting Tools</CardTitle>
              <CardDescription>
                Manage children's information and create parenting plans
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/parenting">
                <Button variant="outline" className="w-full">
                  Parenting Tools
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <Upload className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>E-Filing Guidance</CardTitle>
              <CardDescription>
                Step-by-step guide for filing through Illinois E-Services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/efiling">
                <Button variant="outline" className="w-full">
                  E-Filing Guide
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <BookOpen className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Legal Information</CardTitle>
              <CardDescription>
                Learn about the Illinois divorce process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/legal-info">
                <Button variant="outline" className="w-full">
                  Learn More
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <User className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Manage your account settings and subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/profile">
                <Button variant="outline" className="w-full">
                  View Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Track checkout success for analytics */}
      <Suspense fallback={null}>
        <CheckoutSuccessTracker />
      </Suspense>
    </DashboardLayout>
  )
}
