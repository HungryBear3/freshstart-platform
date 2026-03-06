/**
 * Derives case data for personalized cost/timeline estimates and readiness score
 */
import { prisma } from "@/lib/db"
import { estimateCosts, type CostInputs } from "@/lib/calculators/cost-estimator"
import { calculateTimeline, type TimelineInputs } from "@/lib/calculators/timeline"

export interface CaseInsightsData {
  county: string
  type: "uncontested" | "contested"
  hasChildren: boolean
  hasProperty: boolean
  filingDate: Date | null
  costEstimate: ReturnType<typeof estimateCosts>
  timelineEstimate: ReturnType<typeof calculateTimeline> | null
}

export async function getCaseInsightsForUser(userId: string): Promise<CaseInsightsData | null> {
  const [caseInfo, children, petitionResponse, financialData] = await Promise.all([
    prisma.caseInfo.findUnique({
      where: { userId },
      select: { county: true, filingDate: true },
    }),
    prisma.child.count({ where: { userId } }),
    prisma.questionnaireResponse.findFirst({
      where: { userId, formType: "petition" },
      orderBy: { updatedAt: "desc" },
      select: { responses: true },
    }),
    prisma.financialData.findUnique({
      where: { userId },
      include: { assets: true },
    }),
  ])

  const rawCounty = caseInfo?.county || "Cook"
  const county = rawCounty.replace(/\s+County$/i, "").trim() || "Cook"
  const hasChildren = (children ?? 0) > 0
  const hasProperty = (financialData?.assets?.length ?? 0) > 0
  const filingDate = caseInfo?.filingDate ?? null

  // Derive contested from petition (default uncontested)
  let type: "uncontested" | "contested" = "uncontested"
  if (petitionResponse?.responses) {
    const r = petitionResponse.responses as Record<string, unknown>
    const divorceType = r.divorceType || r["divorce-type"] || r.contested
    if (divorceType === "contested" || divorceType === true) {
      type = "contested"
    }
  }

  const costInputs: CostInputs = {
    county,
    type,
    hasChildren,
    hasProperty,
    needsServiceOfProcess: true,
    needsMediation: type === "contested",
  }
  const costEstimate = estimateCosts(costInputs)

  let timelineEstimate: ReturnType<typeof calculateTimeline> | null = null
  if (filingDate) {
    const timelineInputs: TimelineInputs = {
      type,
      county,
      hasChildren,
      hasProperty,
      hasComplexAssets: false,
      filingDate,
    }
    timelineEstimate = calculateTimeline(timelineInputs)
  }

  return {
    county,
    type,
    hasChildren,
    hasProperty,
    filingDate,
    costEstimate,
    timelineEstimate,
  }
}

export interface CaseReadinessScore {
  score: number
  completedQuestionnaires: number
  totalQuestionnaires: number
  documentsGenerated: number
  milestonesCompleted: number
  totalMilestones: number
}

export async function getCaseReadinessScore(userId: string): Promise<CaseReadinessScore> {
  const [questionnaires, documents, caseInfo] = await Promise.all([
    prisma.questionnaireResponse.findMany({
      where: { userId },
      select: { formType: true, status: true },
    }),
    prisma.document.findMany({
      where: { userId, status: "ready" },
      select: { id: true },
    }),
    prisma.caseInfo.findUnique({
      where: { userId },
      include: { milestones: true },
    }),
  ])

  const requiredForms = ["petition", "financial_affidavit"]
  const completedQuestionnaires = questionnaires.filter(
    (q) => requiredForms.includes(q.formType) && q.status === "completed"
  ).length
  const totalQuestionnaires = Math.max(2, requiredForms.length)
  const documentsGenerated = documents.length
  const milestonesCompleted = caseInfo?.milestones?.filter((m) => m.completed).length ?? 0
  const totalMilestones = Math.max(1, caseInfo?.milestones?.length ?? 0)

  // Weight: questionnaires 40%, documents 35%, milestones 25%
  const qScore = (completedQuestionnaires / totalQuestionnaires) * 40
  const dScore = Math.min(documentsGenerated / 2, 1) * 35
  const mScore = (milestonesCompleted / totalMilestones) * 25
  const score = Math.round(qScore + dScore + mScore)

  return {
    score: Math.min(100, score),
    completedQuestionnaires,
    totalQuestionnaires,
    documentsGenerated,
    milestonesCompleted,
    totalMilestones,
  }
}
