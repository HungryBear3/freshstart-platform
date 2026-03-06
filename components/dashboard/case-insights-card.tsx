import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, Calendar, TrendingUp, ArrowRight } from "lucide-react"
import type { CaseInsightsData } from "@/lib/case/insights"
import type { CaseReadinessScore } from "@/lib/case/insights"
import { format } from "date-fns"

interface CaseInsightsCardProps {
  insights: CaseInsightsData | null
  readiness: CaseReadinessScore
}

export function CaseInsightsCard({ insights, readiness }: CaseInsightsCardProps) {
  if (!insights) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Case Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm mb-4">
            Add your case info and complete the Petition questionnaire to see personalized cost and
            timeline estimates.
          </p>
          <Link href="/dashboard/case">
            <Button variant="outline">Add Case Info</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Your Case Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Readiness Score */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <span className="text-sm font-medium">Case Readiness</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${readiness.score}%` }}
              />
            </div>
            <span className="text-sm font-bold">{readiness.score}%</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Based on questionnaires ({readiness.completedQuestionnaires}/{readiness.totalQuestionnaires}
          ), documents ({readiness.documentsGenerated}), and milestones (
          {readiness.milestonesCompleted}/{readiness.totalMilestones})
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Cost Estimate */}
          <div className="p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Estimated Cost</span>
            </div>
            <p className="text-2xl font-bold">
              ${insights.costEstimate.total.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {insights.county} • {insights.type}
            </p>
            <Link href="/legal-info/cost-estimator" className="mt-2 inline-block">
              <Button variant="link" size="sm" className="h-auto p-0">
                View details
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>

          {/* Timeline */}
          <div className="p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Estimated Timeline</span>
            </div>
            {insights.timelineEstimate ? (
              <>
                <p className="text-lg font-bold">
                  ~{insights.timelineEstimate.estimatedDays} days
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  From filing: {format(insights.timelineEstimate.estimatedCompletion, "MMM d, yyyy")}
                </p>
                <Link href="/legal-info/timeline-calculator" className="mt-2 inline-block">
                  <Button variant="link" size="sm" className="h-auto p-0">
                    View details
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Add filing date in Case Management for timeline
                </p>
                <Link href="/dashboard/case" className="mt-2 inline-flex items-center text-sm font-medium text-primary hover:underline">
                  Add filing date
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
