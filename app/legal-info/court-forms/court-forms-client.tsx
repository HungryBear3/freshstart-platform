"use client"

import { useState } from "react"
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
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
// Imported from the client-safe leaf, NOT from `illinois-court-forms`. A value
// import from the catalog module pulls `ILLINOIS_COURT_FORMS` into this browser
// chunk — the rows are built by top-level calls, so nothing tree-shakes them —
// and with it every pinned `sha256` and every `officialUrl`. Stage 0 first closed
// this boundary while unsupported questionnaire slugs still existed; Stage 1
// retired those slugs. The DTO boundary governs serialized props, while this
// import boundary continues to govern the browser module graph.
// Guarded by __tests__/app/court-forms-client-bundle-boundary.test.ts.
import {
  FORM_CATEGORIES,
  UNVERIFIED_CATALOG_VALUE,
  formatCatalogLastUpdated,
  type FormCategory
} from "@/lib/forms/court-forms-presentation"
import type { GatedFormNotice, RenderedFormDTO } from "@/lib/forms/court-forms-read-model"

const categoryIcons: Record<FormCategory, React.ReactNode> = {
  petition: <FileText className="h-5 w-5" />,
  financial: <DollarSign className="h-5 w-5" />,
  parenting: <Users className="h-5 w-5" />,
  service: <FileCheck className="h-5 w-5" />,
  judgment: <Gavel className="h-5 w-5" />,
  support: <Heart className="h-5 w-5" />,
}

// REMOVED 2026-09-21 — the questionnaire→form map and every form-preparation
// control it drove. Those controls told a customer this page could complete named
// forms from their answers. No catalog entry is automation-eligible, `getFormPath`
// throws for all 21 entries, and four of the map's keys named rows the reconciled
// catalog does not hold. They rendered only for an entry carrying a server-issued
// `downloadHref` and so were unreachable in practice, which meant the copy sat in
// source waiting for this route's redirect to be lifted. Restoring any of it needs
// cleared field-mapping and generated-output review, not a UI change. Rationale and
// the exact removed strings: docs/legal-audit/fs-catalog-reconciliation-review-2026-09-21.md §9.4.
// Guarded by __tests__/app/court-forms-claims-boundaries.test.ts.

export interface CourtFormsLibraryProps {
  /** Rendered DTOs the server read model cleared. Download hrefs are server-decided. */
  forms: RenderedFormDTO[]
  /** Entries withheld by a gate, rendered as neutral notices with no download. */
  gatedNotices: GatedFormNotice[]
}

export default function CourtFormsLibraryPage({ forms: availableForms, gatedNotices }: CourtFormsLibraryProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<FormCategory>>(
    new Set(['petition', 'financial', 'parenting'])
  )
  const [selectedCaseType, setSelectedCaseType] = useState<'all' | 'with_children' | 'no_children'>('all')

  const toggleCategory = (category: FormCategory) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const filterForms = (forms: RenderedFormDTO[]): RenderedFormDTO[] => {
    if (selectedCaseType === 'all') return forms
    return forms.filter(form => 
      form.requiredFor.includes(selectedCaseType) || form.requiredFor.includes('both')
    )
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
          The Illinois Courts website publishes approved standardized divorce and family law forms.
          Form requirements can vary by case and circuit, so verify the current requirements with your circuit clerk.
        </p>
      </div>

      {/* What this page is, and is not. This list is a reference index: it does
          not host blank PDFs, and no entry here is prepared from your answers. */}
      <Alert className="mb-6 bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Reference only.</strong> This page lists the forms and where they come from.
          It does not prepare, complete, or supply copies of them. Get the current version of
          any form from the issuing source below, and check the requirements for your case with
          your circuit clerk.
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

      {/* Forms withheld by an availability gate. Rendered as neutral notices —
          deliberately no download control and no external link. */}
      {gatedNotices.length > 0 && (
        <div className="space-y-3" data-testid="gated-form-notices">
          {gatedNotices.map(notice => (
            <Alert key={notice.formId} data-testid={`gated-form-${notice.formId}`}>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <span className="font-medium">{notice.name}</span>
                {notice.copy.map((line, i) => (
                  <span key={i} className="mt-1 block text-sm text-muted-foreground">
                    {line}
                  </span>
                ))}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Forms by Category */}
      <div className="space-y-4">
        {categories.map(category => {
          const categoryInfo = FORM_CATEGORIES[category]
          // Category membership is derived from the SERVER read model, never
          // from the raw catalog: a gated form must not be renderable here.
          const forms = filterForms(availableForms.filter(f => f.category === category))
          
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
                      <FormCard key={form.id} form={form} />
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
                The Illinois Supreme Court approved (ATJ) forms listed here are sourced from the
                Illinois Courts website. The federal Income Withholding for Support form
                (OMB 0970-0154) is a federal form sourced from the U.S. Department of Health and
                Human Services, Administration for Children and Families — not from the Illinois
                Courts website. For the most up-to-date versions, check the issuing source.
              </p>
              <Button variant="outline" asChild>
                <a 
                  href="https://www.illinoiscourts.gov/documents-and-forms/approved-forms/circuit-court-standardized-forms-suites/divorce-child-support-maintenance/"
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
          This catalog information is provided for informational purposes. FreshStart IL is not a law firm
          and does not provide legal advice. Form requirements may vary by county. If you have 
          questions about which forms to use or how to complete them, please consult with an 
          attorney or contact your local circuit court clerk's office.
        </p>
      </div>
    </div>
  )
}

interface FormCardProps {
  form: RenderedFormDTO
}

function FormCard({ form }: FormCardProps) {
  const [showDetails, setShowDetails] = useState(false)

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
            {/* The sentinel is not a version and must not be prefixed with "v".
                "vunverified" reads as a version string for a row that has none. */}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
              {form.version === UNVERIFIED_CATALOG_VALUE ? "No verified version" : `v${form.version}`}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {/* The ONLY download control on this page, and only when the server
              read model issued an href for this entry. The client neither
              derives a path nor offers a control without one. */}
          {form.downloadHref && (
            <Button size="sm" variant="outline" asChild>
              <a
                href={form.downloadHref}
                download={form.filename}
                className="inline-flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Blank PDF
              </a>
            </Button>
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
          
          {form.relatedQuestionnaires.length > 0 && (
            <div>
              <h5 className="text-sm font-medium">Related Questionnaires</h5>
              <p className="text-sm text-muted-foreground">
                Questionnaires that collect information relevant to this form:{' '}
                {form.relatedQuestionnaires.join(', ')}
              </p>
            </div>
          )}

          {/* Month precision for an official row, the sentinel otherwise. The
              catalog states what the artifact states and nothing finer. */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Last Updated: {formatCatalogLastUpdated(form.lastUpdated)}</span>
            {form.officialUrl && (
              <a
                href={form.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Official Source
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
