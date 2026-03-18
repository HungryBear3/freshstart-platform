"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  FileText, 
  Download, 
  ExternalLink, 
  Info, 
  ChevronDown, 
  ChevronRight,
  Scale,
  DollarSign,
  Users,
  FileCheck,
  Gavel,
  Heart,
  ClipboardList,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  ILLINOIS_COURT_FORMS, 
  FORM_CATEGORIES,
  getFormsByCategory,
  getFormPath,
  type CourtForm,
  type FormCategory
} from "@/lib/forms/illinois-court-forms"

const categoryIcons: Record<FormCategory, React.ReactNode> = {
  petition: <FileText className="h-5 w-5" />,
  financial: <DollarSign className="h-5 w-5" />,
  parenting: <Users className="h-5 w-5" />,
  service: <FileCheck className="h-5 w-5" />,
  judgment: <Gavel className="h-5 w-5" />,
  support: <Heart className="h-5 w-5" />,
}

// Map form IDs to questionnaire paths and display names
const FORM_TO_QUESTIONNAIRE: Record<string, { path: string; name: string }> = {
  'petition-no-children': { path: '/questionnaires/petition', name: 'Petition Questionnaire' },
  'petition-with-children': { path: '/questionnaires/petition', name: 'Petition Questionnaire' },
  'financial-affidavit': { path: '/questionnaires/financial_affidavit', name: 'Financial Questionnaire' },
  'schedule-a': { path: '/questionnaires/financial_affidavit', name: 'Financial Questionnaire' },
  'schedule-b': { path: '/questionnaires/financial_affidavit', name: 'Financial Questionnaire' },
  'parenting-plan': { path: '/questionnaires/parenting_plan', name: 'Parenting Questionnaire' },
  'allocation-judgment': { path: '/questionnaires/parenting_plan', name: 'Parenting Questionnaire' },
  'marital-settlement': { path: '/questionnaires/marital_settlement', name: 'Settlement Questionnaire' },
  'judgment-no-children': { path: '/questionnaires/marital_settlement', name: 'Settlement Questionnaire' },
  'judgment-with-children': { path: '/questionnaires/marital_settlement', name: 'Settlement Questionnaire' },
  'summons': { path: '/questionnaires/petition', name: 'Petition Questionnaire' },
  'certificate-of-service': { path: '/questionnaires/petition', name: 'Petition Questionnaire' },
}

interface QuestionnaireProgress {
  [key: string]: {
    status: "not_started" | "in_progress" | "completed"
    completedAt?: string
  }
}

export default function CourtFormsLibraryPage() {
  const [expandedCategories, setExpandedCategories] = useState<Set<FormCategory>>(
    new Set(['petition', 'financial', 'parenting'])
  )
  const [selectedCaseType, setSelectedCaseType] = useState<'all' | 'with_children' | 'no_children'>('all')
  const [questionnaireProgress, setQuestionnaireProgress] = useState<QuestionnaireProgress>({})
  const [loadingProgress, setLoadingProgress] = useState(true)

  useEffect(() => {
    fetchQuestionnaireProgress()
  }, [])

  const fetchQuestionnaireProgress = async () => {
    try {
      const response = await fetch("/api/questionnaires/progress")
      if (response.ok) {
        const data = await response.json()
        setQuestionnaireProgress(data.progress || {})
      }
    } catch (error) {
      console.error("Failed to fetch questionnaire progress:", error)
    } finally {
      setLoadingProgress(false)
    }
  }

  const toggleCategory = (category: FormCategory) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const filterForms = (forms: CourtForm[]): CourtForm[] => {
    if (selectedCaseType === 'all') return forms
    return forms.filter(form => 
      form.requiredFor.includes(selectedCaseType) || form.requiredFor.includes('both')
    )
  }

  // Get questionnaire status for a form
  const getQuestionnaireStatusForForm = (formId: string): "not_started" | "in_progress" | "completed" | null => {
    const questionnaire = FORM_TO_QUESTIONNAIRE[formId]
    if (!questionnaire) return null
    
    // Extract questionnaire type from path
    const pathParts = questionnaire.path.split('/')
    const questionnaireType = pathParts[pathParts.length - 1]
    
    return questionnaireProgress[questionnaireType]?.status || "not_started"
  }

  const categories = Object.keys(FORM_CATEGORIES) as FormCategory[]

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/legal-info" className="hover:text-foreground">
            Legal Information
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span>Court Forms Library</span>
        </div>
        
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Scale className="h-8 w-8 text-primary" />
          Illinois Court Forms Library
        </h1>
        <p className="text-muted-foreground text-lg">
          Official Illinois Supreme Court approved standardized divorce and family law forms. 
          These forms are required to be accepted by all Illinois Circuit Courts.
        </p>
      </div>

      {/* Auto-Fill CTA */}
      <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Let Us Fill Out Your Forms</h3>
              <p className="text-sm text-muted-foreground">
                Complete our questionnaires and we'll automatically fill out the official court forms for you.
                No typing into PDFs - just answer questions and download ready-to-file documents.
              </p>
            </div>
            <Link href="/legal-info/document-guide">
              <Button>
                See How It Works
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Important Notice */}
      <Alert className="mb-6 bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Important:</strong> Always download forms to your computer before filling them out. 
          Use Adobe Acrobat Reader for best results. If e-filing, you may need to "flatten" the PDF 
          after filling (print to PDF) so it cannot be edited.
        </AlertDescription>
      </Alert>

      {/* Filter by Case Type */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filter Forms</CardTitle>
          <CardDescription>Show forms based on your situation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCaseType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCaseType('all')}
            >
              All Forms
            </Button>
            <Button
              variant={selectedCaseType === 'no_children' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCaseType('no_children')}
            >
              No Minor Children
            </Button>
            <Button
              variant={selectedCaseType === 'with_children' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCaseType('with_children')}
            >
              With Minor Children
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Forms by Category */}
      <div className="space-y-4">
        {categories.map(category => {
          const categoryInfo = FORM_CATEGORIES[category]
          const forms = filterForms(getFormsByCategory(category))
          
          if (forms.length === 0) return null

          const isExpanded = expandedCategories.has(category)

          return (
            <Card key={category}>
              <CardHeader 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleCategory(category)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      {categoryIcons[category]}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{categoryInfo.name}</CardTitle>
                      <CardDescription>{categoryInfo.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {forms.length} form{forms.length !== 1 ? 's' : ''}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {forms.map(form => (
                      <FormCard 
                        key={form.id} 
                        form={form} 
                        questionnaireStatus={getQuestionnaireStatusForForm(form.id)}
                        questionnaireInfo={FORM_TO_QUESTIONNAIRE[form.id]}
                      />
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* Official Source Link */}
      <Card className="mt-8 bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <ExternalLink className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Official Source</h3>
              <p className="text-sm text-muted-foreground mb-3">
                All forms are sourced from the Illinois Courts website. For the most up-to-date 
                versions and additional forms, visit the official site.
              </p>
              <Button variant="outline" asChild>
                <a 
                  href="https://www.illinoiscourts.gov/forms/approved-forms/forms-circuit-court/divorce-child-support-maintenance" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Visit IllinoisCourts.gov
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="mt-8 p-4 bg-muted rounded-lg text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-2">Disclaimer</p>
        <p>
          These forms are provided for informational purposes. FreshStart IL is not a law firm 
          and does not provide legal advice. Form requirements may vary by county. If you have 
          questions about which forms to use or how to complete them, please consult with an 
          attorney or contact your local circuit court clerk's office.
        </p>
      </div>
    </div>
  )
}

interface FormCardProps {
  form: CourtForm
  questionnaireStatus: "not_started" | "in_progress" | "completed" | null
  questionnaireInfo?: { path: string; name: string }
}

function FormCard({ form, questionnaireStatus, questionnaireInfo }: FormCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  const hasQuestionnaire = !!questionnaireInfo

  return (
    <div className="border rounded-lg p-4 bg-background">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className="font-medium">{form.name}</h4>
          <p className="text-sm text-muted-foreground mt-1">{form.description}</p>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-2">
            {form.requiredFor.includes('with_children') && !form.requiredFor.includes('both') && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">
                With Children
              </span>
            )}
            {form.requiredFor.includes('no_children') && !form.requiredFor.includes('both') && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                No Children
              </span>
            )}
            {form.requiredFor.includes('both') && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                All Cases
              </span>
            )}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
              v{form.version}
            </span>
          </div>

          {/* Questionnaire Link */}
          {hasQuestionnaire && (
            <div className="mt-3 flex items-center gap-2">
              {questionnaireStatus === "completed" ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">
                    Questionnaire completed
                  </span>
                  <Link href="/documents">
                    <Button size="sm" variant="outline" className="ml-2 h-7">
                      <Sparkles className="mr-1 h-3 w-3" />
                      Generate Form
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                  <Link 
                    href={questionnaireInfo.path}
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    {questionnaireStatus === "in_progress" ? "Continue" : "Fill with"} {questionnaireInfo.name}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                  {questionnaireStatus === "in_progress" && (
                    <Badge variant="secondary" className="text-xs">In Progress</Badge>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-2">
          <Button size="sm" variant="outline" asChild>
            <a 
              href={getFormPath(form)} 
              download={form.filename}
              className="inline-flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Blank PDF
            </a>
          </Button>
          {hasQuestionnaire && questionnaireStatus !== "completed" && (
            <Link href={questionnaireInfo.path}>
              <Button size="sm" className="w-full">
                <ClipboardList className="mr-1 h-4 w-4" />
                Auto-Fill
              </Button>
            </Link>
          )}
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide' : 'Details'}
          </Button>
        </div>
      </div>
      
      {showDetails && (
        <div className="mt-4 pt-4 border-t space-y-3">
          {form.instructions && (
            <div>
              <h5 className="text-sm font-medium">Instructions</h5>
              <p className="text-sm text-muted-foreground">{form.instructions}</p>
            </div>
          )}
          
          {hasQuestionnaire && (
            <div className="p-3 bg-primary/5 rounded-lg">
              <h5 className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Auto-Fill Available
              </h5>
              <p className="text-sm text-muted-foreground mt-1">
                Complete the <strong>{questionnaireInfo.name}</strong> and we'll automatically 
                fill out this form for you. Just answer questions in plain English - no need to 
                understand legal terminology or PDF forms.
              </p>
              <Link href={questionnaireInfo.path}>
                <Button size="sm" variant="outline" className="mt-2">
                  {questionnaireStatus === "in_progress" ? "Continue Questionnaire" : "Start Questionnaire"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
          
          {form.relatedQuestionnaires.length > 0 && !hasQuestionnaire && (
            <div>
              <h5 className="text-sm font-medium">Related Questionnaires</h5>
              <p className="text-sm text-muted-foreground">
                Complete these questionnaires to auto-fill this form: {form.relatedQuestionnaires.join(', ')}
              </p>
            </div>
          )}
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Last Updated: {form.lastUpdated}</span>
            <a 
              href={form.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Official Source
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
