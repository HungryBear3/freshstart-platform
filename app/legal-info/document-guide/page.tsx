"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  ArrowRight,
  CheckCircle2,
  Circle,
  ClipboardList,
  Download,
  Sparkles,
  Scale,
  Calculator,
  Users,
  FileCheck,
  AlertCircle,
  ChevronRight,
  Lightbulb,
  ExternalLink,
} from "lucide-react"

// Document generation workflow data
const QUESTIONNAIRE_FORM_MAPPING = [
  {
    id: "petition",
    questionnaire: {
      name: "Petition Questionnaire",
      description: "Basic information about you, your spouse, and your marriage",
      href: "/questionnaires/petition",
      icon: ClipboardList,
      estimatedTime: "15-20 minutes",
    },
    generatedForms: [
      {
        id: "petition-no-children",
        name: "Petition for Dissolution of Marriage (No Children)",
        officialId: "CCP 0910.01",
        required: true,
        condition: "If no minor children",
      },
      {
        id: "petition-with-children",
        name: "Petition for Dissolution of Marriage (With Children)",
        officialId: "CCP 0910.02",
        required: true,
        condition: "If minor children involved",
      },
      {
        id: "summons",
        name: "Summons",
        officialId: "CCP 0101.01",
        required: true,
        condition: "Always required",
      },
      {
        id: "certificate-of-service",
        name: "Certificate of Service",
        officialId: "CCP 0101.00",
        required: true,
        condition: "After serving spouse",
      },
    ],
  },
  {
    id: "financial",
    questionnaire: {
      name: "Financial Affidavit Questionnaire",
      description: "Income, expenses, assets, and debts information",
      href: "/questionnaires/financial_affidavit",
      icon: Calculator,
      estimatedTime: "30-45 minutes",
    },
    generatedForms: [
      {
        id: "financial-affidavit",
        name: "Financial Affidavit",
        officialId: "CCP 0912.03",
        required: true,
        condition: "Required in all cases",
      },
      {
        id: "schedule-a",
        name: "Schedule A - Real Estate",
        officialId: "CCP 0912.04",
        required: false,
        condition: "If you own real estate",
      },
      {
        id: "schedule-b",
        name: "Schedule B - Personal Property",
        officialId: "CCP 0912.05",
        required: false,
        condition: "If significant personal property",
      },
    ],
  },
  {
    id: "parenting",
    questionnaire: {
      name: "Parenting Plan Questionnaire",
      description: "Custody arrangements, visitation schedules, and decision-making",
      href: "/questionnaires/parenting_plan",
      icon: Users,
      estimatedTime: "20-30 minutes",
    },
    generatedForms: [
      {
        id: "parenting-plan",
        name: "Parenting Plan",
        officialId: "CCP 0913.01",
        required: true,
        condition: "Required if minor children",
      },
      {
        id: "allocation-judgment",
        name: "Allocation Judgment",
        officialId: "CCP 0913.02",
        required: true,
        condition: "Required if minor children",
      },
    ],
  },
  {
    id: "settlement",
    questionnaire: {
      name: "Marital Settlement Questionnaire",
      description: "Property division, spousal support, and final agreements",
      href: "/questionnaires/marital_settlement",
      icon: Scale,
      estimatedTime: "20-30 minutes",
    },
    generatedForms: [
      {
        id: "marital-settlement",
        name: "Marital Settlement Agreement",
        officialId: "Custom",
        required: true,
        condition: "For agreed divorces",
      },
      {
        id: "judgment-no-children",
        name: "Judgment of Dissolution (No Children)",
        officialId: "CCP 0910.05",
        required: true,
        condition: "Final judgment without children",
      },
      {
        id: "judgment-with-children",
        name: "Judgment of Dissolution (With Children)",
        officialId: "CCP 0910.06",
        required: true,
        condition: "Final judgment with children",
      },
    ],
  },
]

// Workflow steps
const WORKFLOW_STEPS = [
  {
    step: 1,
    title: "Complete Questionnaires",
    description: "Answer questions about your situation. Your answers are saved automatically.",
    icon: ClipboardList,
  },
  {
    step: 2,
    title: "Generate Documents",
    description: "Our system fills out official Illinois court forms using your answers.",
    icon: Sparkles,
  },
  {
    step: 3,
    title: "Review & Download",
    description: "Review your documents, make edits if needed, then download as PDF.",
    icon: FileCheck,
  },
  {
    step: 4,
    title: "File with Court",
    description: "E-file or print and file your documents with the circuit court.",
    icon: Scale,
  },
]

interface QuestionnaireProgress {
  [key: string]: {
    status: "not_started" | "in_progress" | "completed"
    completedAt?: string
  }
}

export default function DocumentGuide() {
  const [progress, setProgress] = useState<QuestionnaireProgress>({})
  const [loading, setLoading] = useState(true)
  const [hasChildren, setHasChildren] = useState<boolean | null>(null)

  useEffect(() => {
    fetchProgress()
  }, [])

  const fetchProgress = async () => {
    try {
      const response = await fetch("/api/questionnaires/progress")
      if (response.ok) {
        const data = await response.json()
        setProgress(data.progress || {})
        // Check if user has indicated children
        if (data.hasChildren !== undefined) {
          setHasChildren(data.hasChildren)
        }
      }
    } catch (error) {
      console.error("Failed to fetch progress:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status?: "not_started" | "in_progress" | "completed") => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Completed</Badge>
      case "in_progress":
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">In Progress</Badge>
      default:
        return <Badge variant="outline">Not Started</Badge>
    }
  }

  const getStatusIcon = (status?: "not_started" | "in_progress" | "completed") => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case "in_progress":
        return <Circle className="h-5 w-5 text-yellow-600 fill-yellow-100" />
      default:
        return <Circle className="h-5 w-5 text-gray-300" />
    }
  }

  // Filter forms based on whether user has children
  const getRelevantForms = (forms: typeof QUESTIONNAIRE_FORM_MAPPING[0]["generatedForms"]) => {
    if (hasChildren === null) return forms // Show all if unknown
    
    return forms.filter(form => {
      if (hasChildren) {
        return !form.id.includes("no-children")
      } else {
        return !form.id.includes("with-children") && !form.id.includes("parenting")
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/legal-info" className="hover:text-primary">Legal Information</Link>
            <ChevronRight className="h-4 w-4" />
            <span>Document Generation Guide</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Document Generation Guide</h1>
          <p className="mt-2 text-gray-600">
            Understand how our questionnaires generate your official Illinois divorce forms
          </p>
        </div>

        {/* How It Works Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              How Document Generation Works
            </CardTitle>
            <CardDescription>
              Our system automatically fills official court forms based on your questionnaire answers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {WORKFLOW_STEPS.map((step, index) => (
                <div key={step.step} className="relative">
                  {/* Connector line */}
                  {index < WORKFLOW_STEPS.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gray-200" />
                  )}
                  
                  <div className="relative bg-white rounded-lg p-4 border text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
                      <step.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
                      {step.step}
                    </div>
                    <h3 className="font-semibold mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Case Type Filter */}
        {hasChildren === null && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span>Do you have minor children? This affects which forms you need.</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setHasChildren(true)}>
                  Yes, I have children
                </Button>
                <Button size="sm" variant="outline" onClick={() => setHasChildren(false)}>
                  No children
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {hasChildren !== null && (
          <div className="flex items-center justify-between mb-6">
            <Badge variant="outline" className="text-sm">
              Showing forms for: {hasChildren ? "Cases with minor children" : "Cases without children"}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => setHasChildren(null)}>
              Change
            </Button>
          </div>
        )}

        {/* Questionnaire to Form Mapping */}
        <div className="space-y-6 mb-8">
          <h2 className="text-xl font-semibold">Questionnaires & Generated Forms</h2>
          
          {QUESTIONNAIRE_FORM_MAPPING.map((mapping) => {
            const questionnaireStatus = progress[mapping.id]?.status
            const relevantForms = getRelevantForms(mapping.generatedForms)
            
            // Skip parenting section if no children
            if (mapping.id === "parenting" && hasChildren === false) {
              return null
            }
            
            return (
              <Card key={mapping.id} className="overflow-hidden">
                <div className="grid md:grid-cols-2">
                  {/* Questionnaire Side */}
                  <div className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-b md:border-b-0 md:border-r">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <mapping.questionnaire.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{mapping.questionnaire.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            Est. {mapping.questionnaire.estimatedTime}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(questionnaireStatus)}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4">
                      {mapping.questionnaire.description}
                    </p>
                    
                    <Link href={mapping.questionnaire.href}>
                      <Button 
                        className="w-full"
                        variant={questionnaireStatus === "completed" ? "outline" : "default"}
                      >
                        {questionnaireStatus === "completed" ? (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Review Answers
                          </>
                        ) : questionnaireStatus === "in_progress" ? (
                          <>
                            Continue Questionnaire
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        ) : (
                          <>
                            Start Questionnaire
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </Link>
                  </div>
                  
                  {/* Generated Forms Side */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <ArrowRight className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Generates These Forms:</span>
                    </div>
                    
                    <div className="space-y-3">
                      {relevantForms.map((form) => (
                        <div 
                          key={form.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <FileText className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">{form.name}</span>
                              {form.required && (
                                <Badge variant="secondary" className="text-xs">Required</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{form.condition}</p>
                            <p className="text-xs text-muted-foreground">Form: {form.officialId}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {questionnaireStatus === "completed" && (
                      <Link href="/documents" className="block mt-4">
                        <Button variant="outline" size="sm" className="w-full">
                          <Download className="mr-2 h-4 w-4" />
                          Generate & Download Forms
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Helpful Tips */}
        <Card className="mb-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Lightbulb className="h-5 w-5" />
              Tips for Best Results
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Complete questionnaires in order:</strong> The petition questionnaire 
                  collects information used by other questionnaires.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Gather documents first:</strong> Have tax returns, pay stubs, and 
                  financial statements ready for the financial affidavit.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Review before filing:</strong> Always review generated documents 
                  carefully. You can regenerate if you need to make changes.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Download the ZIP package:</strong> Use our document package feature 
                  to download all forms with filing instructions included.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Links to Related Pages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/legal-info/court-forms">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="pt-6">
                <FileText className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-1">Court Forms Library</h3>
                <p className="text-sm text-muted-foreground">
                  View and download blank official Illinois court forms
                </p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/questionnaires">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="pt-6">
                <ClipboardList className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-1">All Questionnaires</h3>
                <p className="text-sm text-muted-foreground">
                  View all available questionnaires and your progress
                </p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/documents">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="pt-6">
                <Download className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-1">My Documents</h3>
                <p className="text-sm text-muted-foreground">
                  Generate, view, and download your completed forms
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
