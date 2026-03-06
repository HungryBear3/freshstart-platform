"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit,
  FileText,
  ArrowRight,
  Bell,
  ListChecks,
  BarChart3,
  CalendarDays,
  History,
  Target,
  Shield,
  Lightbulb,
} from "lucide-react"
import { CaseInfoForm } from "@/components/case/case-info-form"
import { MilestonesList } from "@/components/case/milestones-list"
import { DeadlinesList } from "@/components/case/deadlines-list"
import { DocumentsStatus } from "@/components/case/documents-status"
import { CalendarView } from "@/components/case/calendar-view"
import { ChecklistView } from "@/components/case/checklist-view"
import { TimelineView } from "@/components/case/timeline-view"

interface CaseInfo {
  id: string
  caseNumber?: string | null
  courtName?: string | null
  county?: string | null
  judgeName?: string | null
  filingDate?: Date | string | null
  status: string
  milestones: Milestone[]
  deadlines: Deadline[]
}

interface Milestone {
  id: string
  title: string
  description?: string | null
  date: Date | string
  completed: boolean
}

interface Deadline {
  id: string
  title: string
  description?: string | null
  dueDate: Date | string
  completed: boolean
  reminderSent: boolean
}

// Feature explanation cards data
const CASE_MANAGEMENT_FEATURES = [
  {
    icon: Target,
    title: "Milestone Tracking",
    description: "Track key events in your divorce process: filing date, service completion, waiting periods, mediation, hearings, and final judgment.",
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    icon: Clock,
    title: "Deadline Management",
    description: "Never miss a deadline. Set reminders for response due dates, discovery deadlines, motion filing dates, and court appearances.",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  {
    icon: FileText,
    title: "Document Status",
    description: "Track which documents are draft, ready for filing, or already filed. See your complete document package at a glance.",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    icon: CalendarDays,
    title: "Calendar View",
    description: "Visualize all your deadlines and milestones in a monthly calendar format. Export to your favorite calendar app.",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    icon: ListChecks,
    title: "Filing Checklist",
    description: "Step-by-step checklist ensures you complete all required tasks. Check items off as you progress through the process.",
    color: "text-teal-600",
    bgColor: "bg-teal-50",
  },
  {
    icon: History,
    title: "Timeline View",
    description: "See your entire case history in a visual timeline. Track progress from initial filing to final decree.",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
]

// Illinois divorce timeline info
const DIVORCE_TIMELINE_INFO = [
  { stage: "File Petition", timing: "Day 1", description: "File your Petition for Dissolution with the court" },
  { stage: "Serve Spouse", timing: "Within 30 days", description: "Your spouse must be officially served with papers" },
  { stage: "Response Period", timing: "30 days after service", description: "Spouse has 30 days to file a response" },
  { stage: "Waiting Period", timing: "Minimum 6 months*", description: "Illinois requires 6-month separation period (can be waived)" },
  { stage: "Discovery (if needed)", timing: "Varies", description: "Exchange of financial documents and information" },
  { stage: "Final Hearing", timing: "After waiting period", description: "Judge reviews agreement and issues final decree" },
]

export default function CaseManagementPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [caseInfo, setCaseInfo] = useState<CaseInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showIntro, setShowIntro] = useState(true)

  useEffect(() => {
    fetchCaseInfo()
  }, [])

  const fetchCaseInfo = async () => {
    try {
      const response = await fetch("/api/case")
      if (!response.ok) {
        throw new Error("Failed to fetch case information")
      }
      const data = await response.json()
      setCaseInfo(data)
      // Hide intro if user has already started their case
      if (data?.caseNumber || data?.filingDate || (data?.milestones && data.milestones.length > 0)) {
        setShowIntro(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load case information")
    } finally {
      setLoading(false)
    }
  }

  const handleCaseInfoUpdate = (updated: CaseInfo) => {
    setCaseInfo(updated)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-gray-600">Loading case information...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Case Management</h1>
          <p className="mt-2 text-gray-600">
            Track your case information, deadlines, milestones, and documents
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Intro/Explainer Section - shown for new users */}
        {showIntro && activeTab === "overview" && (
          <div className="mb-8 space-y-6">
            {/* Hero Card */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <BarChart3 className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-2">How We Help Manage Your Case</h2>
                    <p className="text-muted-foreground mb-4">
                      FreshStart IL provides comprehensive case management tools to keep your divorce 
                      process organized and on track. Track deadlines, milestones, documents, and 
                      court dates all in one place.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => setShowIntro(false)}>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Got it, show my case
                      </Button>
                      <Link href="/questionnaires">
                        <Button size="sm">
                          Start with Questionnaires
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features Grid */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Case Management Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {CASE_MANAGEMENT_FEATURES.map((feature) => (
                  <Card key={feature.title} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className={`w-10 h-10 rounded-lg ${feature.bgColor} flex items-center justify-center mb-3`}>
                        <feature.icon className={`h-5 w-5 ${feature.color}`} />
                      </div>
                      <h4 className="font-semibold mb-1">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Illinois Divorce Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Typical Illinois Divorce Timeline
                </CardTitle>
                <CardDescription>
                  Understanding the key stages helps you plan ahead
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                  
                  <div className="space-y-6">
                    {DIVORCE_TIMELINE_INFO.map((item, index) => (
                      <div key={item.stage} className="relative pl-10">
                        {/* Timeline dot */}
                        <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 ${
                          index === 0 ? 'bg-primary border-primary' : 'bg-white border-gray-300'
                        }`} />
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                          <span className="font-semibold text-sm">{item.stage}</span>
                          <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full w-fit">
                            {item.timing}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Alert className="mt-6">
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Pro tip:</strong> The 6-month separation requirement can often be satisfied 
                    by the time your paperwork is complete, especially if you've been separated for a while.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="space-y-6">
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: "overview", label: "Overview" },
                { id: "case-info", label: "Case Information" },
                { id: "milestones", label: "Milestones" },
                { id: "deadlines", label: "Deadlines" },
                { id: "documents", label: "Documents" },
                { id: "calendar", label: "Calendar" },
                { id: "checklist", label: "Checklist" },
                { id: "timeline", label: "Timeline" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {activeTab === "overview" && !showIntro && (
            <div className="space-y-6">
              {/* Show intro toggle */}
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => setShowIntro(true)}>
                  <Lightbulb className="mr-2 h-4 w-4" />
                  Show Feature Guide
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Case Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {caseInfo?.status
                        ? caseInfo.status.replace("_", " ").toUpperCase()
                        : "NOT FILED"}
                    </div>
                    {caseInfo?.caseNumber && (
                      <p className="text-sm text-gray-600 mt-2">
                        Case #: {caseInfo.caseNumber}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Upcoming Deadlines</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {caseInfo?.deadlines && caseInfo.deadlines.length > 0 ? (
                      <div className="text-2xl font-bold text-orange-600">
                        {
                          caseInfo.deadlines.filter(
                            (d) => !d.completed && new Date(d.dueDate) >= new Date()
                          ).length
                        }
                      </div>
                    ) : (
                      <div className="text-2xl font-bold text-gray-400">0</div>
                    )}
                    <p className="text-sm text-gray-600 mt-2">Active deadlines</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Milestones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {caseInfo?.milestones && caseInfo.milestones.length > 0 ? (
                      <div className="text-2xl font-bold text-green-600">
                        {caseInfo.milestones.filter((m) => m.completed).length} /{" "}
                        {caseInfo.milestones.length}
                      </div>
                    ) : (
                      <div className="text-2xl font-bold text-gray-400">0 / 0</div>
                    )}
                    <p className="text-sm text-gray-600 mt-2">Completed</p>
                  </CardContent>
                </Card>
              </div>

              {caseInfo && (
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Button variant="outline" onClick={() => setActiveTab("deadlines")}>
                        <Clock className="mr-2 h-4 w-4" />
                        View Deadlines
                      </Button>
                      <Button variant="outline" onClick={() => setActiveTab("milestones")}>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        View Milestones
                      </Button>
                      <Button variant="outline" onClick={() => setActiveTab("documents")}>
                        <FileText className="mr-2 h-4 w-4" />
                        View Documents
                      </Button>
                      <Button variant="outline" onClick={() => setActiveTab("case-info")}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Case Info
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Helpful Tips Card */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Shield className="h-5 w-5" />
                    Stay Organized, Stay On Track
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-blue-700">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Add your case number once you receive it from the court</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Set deadline reminders at least 7 days before due dates</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Update milestones as you complete each step</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Use the calendar view to see all dates at a glance</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "case-info" && (
            <CaseInfoForm caseInfo={caseInfo} onUpdate={handleCaseInfoUpdate} />
          )}

          {activeTab === "milestones" && (
            <MilestonesList caseInfo={caseInfo} onUpdate={fetchCaseInfo} />
          )}

          {activeTab === "deadlines" && (
            <DeadlinesList caseInfo={caseInfo} onUpdate={fetchCaseInfo} />
          )}

          {activeTab === "documents" && <DocumentsStatus />}

          {activeTab === "calendar" && (
            <CalendarView
              milestones={caseInfo?.milestones || []}
              deadlines={caseInfo?.deadlines || []}
            />
          )}

          {activeTab === "checklist" && (
            <ChecklistView
              milestones={caseInfo?.milestones || []}
              deadlines={caseInfo?.deadlines || []}
            />
          )}

          {activeTab === "timeline" && (
            <TimelineView
              milestones={caseInfo?.milestones || []}
              deadlines={caseInfo?.deadlines || []}
              filingDate={caseInfo?.filingDate}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
