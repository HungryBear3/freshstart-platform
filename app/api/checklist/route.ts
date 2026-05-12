import { after, NextRequest, NextResponse } from "next/server"
import { sendChecklistEmail } from "@/lib/email"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { prisma } from "@/lib/db"
import { enrollInDrip } from "@/lib/drip"
import { errorTracker } from "@/lib/monitoring/error-tracking"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Returns `true` only when this request is running in real production.
 *
 * Vercel sets `VERCEL_ENV` to `"production" | "preview" | "development"`.
 * We require both `NODE_ENV === "production"` and either an absent
 * `VERCEL_ENV` (self-hosted prod) or `VERCEL_ENV === "production"`. Every
 * other case — Vercel Preview, local `next dev`, jest tests — is treated
 * as a preview/test environment and the route returns a fast 200 noop
 * without touching email, the database, or the drip enrollment.
 *
 * `CHECKLIST_FORCE_PREVIEW_NOOP=true` lets an operator force noop mode
 * on production for incident-response without redeploy.
 */
function isProductionEnvironment(): boolean {
  if (process.env.CHECKLIST_FORCE_PREVIEW_NOOP === "true") return false
  if (process.env.NODE_ENV !== "production") return false
  const vercelEnv = process.env.VERCEL_ENV
  if (vercelEnv && vercelEnv !== "production") return false
  return true
}

async function persistChecklistSignup(email: string, source: string) {
  try {
    await prisma.checklistSubscriber.upsert({
      where: { email },
      update: {},
      create: {
        email,
        source,
      },
    })
  } catch (err) {
    console.error("[Checklist] Failed to save subscriber:", err)
    errorTracker.captureError(err instanceof Error ? err : new Error(String(err)), {
      path: "/api/checklist",
      email,
      context: "subscriber_db_save",
    })
  }

  try {
    await enrollInDrip(email, "fs-checklist")
  } catch (err) {
    console.error("[Drip] Failed to enroll subscriber:", err)
    errorTracker.captureError(err instanceof Error ? err : new Error(String(err)), {
      path: "/api/checklist",
      email,
      context: "drip_enroll",
    })
  }
}

export async function POST(request: NextRequest) {
  // 1) Parse + validate the body BEFORE any external service call. Bad body
  //    and bad email return early without ever touching Redis/email/DB.
  let email: string
  try {
    const body = await request.json()
    email = (body.email || "").trim().toLowerCase()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 })
  }

  // 2) Preview / non-production environments must NOT touch Upstash Redis
  //    (rate limiter), Resend (email), the DB, the drip enrollment, or
  //    `after()`. Return a fast 200 noop BEFORE calling getClientIdentifier
  //    or rateLimit — `lib/rate-limit.ts` will call Upstash when env vars
  //    are present, and we never want that off-production.
  if (!isProductionEnvironment()) {
    return NextResponse.json({
      success: true,
      mode: "preview_noop",
      reason:
        process.env.CHECKLIST_FORCE_PREVIEW_NOOP === "true"
          ? "forced_via_env"
          : "non_production_environment",
    })
  }

  // 3) Real production: rate-limit, send email, queue persistence + drip.
  const identifier = getClientIdentifier(request)
  const { allowed } = await rateLimit(`checklist:${identifier}`, 3, 60 * 60 * 1000)

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in an hour." },
      { status: 429 }
    )
  }

  try {
    await sendChecklistEmail(email)

    // Schedule subscriber persistence + drip enrollment after the response.
    // Avoid raw fire-and-forget promises: Vercel can terminate serverless work
    // after a response, which shows up as pg "Connection terminated" noise.
    const referer = request.headers.get("referer") || ""
    const source = referer.includes("/checklist") ? "checklist-page" : "homepage"
    after(() => persistChecklistSignup(email, source))

    return NextResponse.json({ success: true, mode: "production" })
  } catch (error) {
    console.error("[Checklist] Email delivery error:", error)
    return NextResponse.json(
      { error: "Failed to send checklist. Please try again." },
      { status: 500 }
    )
  }
}
