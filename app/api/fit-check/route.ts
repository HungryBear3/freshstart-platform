import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { rateLimit } from "@/lib/rate-limit"
import {
  FIT_CHECK_POLICY_VERSION,
  FIT_CHECK_QUESTIONS,
  FIT_CHECK_VALIDITY_MS,
  classifyFitCheck,
  fitCheckStatusFor,
  isFitCheckAnswerSet,
  normalizeFitCheckAnswers,
} from "@/lib/fit-check/policy"

/**
 * `/api/fit-check` is the server-side authority for the pre-payment fit check.
 *
 * The browser may render the questions and collect the choices, but it never
 * decides the outcome: this route reclassifies whatever it is sent, ignores any
 * result the client claims, and is the only writer of an assessment row.
 */

const SUBMIT_MAX_PER_WINDOW = 10
const SUBMIT_WINDOW_MS = 60 * 60 * 1000

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user?.id) return unauthorized()

  try {
    // `id` breaks the tie: two assessments can share a `createdAt` millisecond,
    // and "newest" must name one row, not whichever the planner returns first.
    const latest = await prisma.fitCheckAssessment.findFirst({
      where: { userId: user.id },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    })

    const status = fitCheckStatusFor(latest, user.id)

    // A superseded or expired assessment no longer speaks for the user, so it
    // is reported as absent rather than shown back as a stale outcome.
    const assessment =
      latest && status !== "fit_check_required"
        ? {
            id: latest.id,
            result: latest.result,
            policyVersion: latest.policyVersion,
            createdAt: latest.createdAt,
            expiresAt: latest.expiresAt,
          }
        : null

    return NextResponse.json({
      policyVersion: FIT_CHECK_POLICY_VERSION,
      questions: FIT_CHECK_QUESTIONS,
      status,
      assessment,
    })
  } catch (cause) {
    console.error("[FitCheck] Failed to read the current assessment:", cause)
    return NextResponse.json({ error: "Unable to load the fit check" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user?.id) return unauthorized()

  const limit = await rateLimit(`fit-check:${user.id}`, SUBMIT_MAX_PER_WINDOW, SUBMIT_WINDOW_MS)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many fit checks. Please try again later.", code: "rate_limited" },
      { status: 429 },
    )
  }

  let parsed: unknown
  try {
    parsed = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body", code: "invalid_json" }, { status: 400 })
  }

  const answers =
    typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>).answers
      : undefined

  // Anything other than the exact bounded answer set — free text, an extra
  // field, a partial set — is refused before anything is written.
  if (!isFitCheckAnswerSet(answers)) {
    return NextResponse.json(
      { error: "Answer every question using the choices provided.", code: "invalid_answers" },
      { status: 400 },
    )
  }

  // The client's own claim about the result, if it sent one, is never read.
  const classified = classifyFitCheck(answers)

  try {
    await prisma.fitCheckAssessment.create({
      data: {
        userId: user.id,
        policyVersion: FIT_CHECK_POLICY_VERSION,
        result: classified.result,
        answers: normalizeFitCheckAnswers(answers),
        reasons: classified.reasons,
        expiresAt: new Date(Date.now() + FIT_CHECK_VALIDITY_MS),
      },
    })
  } catch (cause) {
    console.error("[FitCheck] Failed to record the assessment:", cause)
    return NextResponse.json({ error: "Unable to record the fit check" }, { status: 500 })
  }

  return NextResponse.json({
    result: classified.result,
    policyVersion: FIT_CHECK_POLICY_VERSION,
  })
}
