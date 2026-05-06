import { after, NextRequest, NextResponse } from "next/server"
import { sendChecklistEmail } from "@/lib/email"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { prisma } from "@/lib/db"
import { enrollInDrip } from "@/lib/drip"
import { errorTracker } from "@/lib/monitoring/error-tracking"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
  const identifier = getClientIdentifier(request)
  const { allowed } = await rateLimit(`checklist:${identifier}`, 3, 60 * 60 * 1000)

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in an hour." },
      { status: 429 }
    )
  }

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

  try {
    await sendChecklistEmail(email)

    // Schedule subscriber persistence + drip enrollment after the response.
    // Avoid raw fire-and-forget promises: Vercel can terminate serverless work
    // after a response, which shows up as pg "Connection terminated" noise.
    const referer = request.headers.get("referer") || ""
    const source = referer.includes("/checklist") ? "checklist-page" : "homepage"
    after(() => persistChecklistSignup(email, source))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Checklist] Email delivery error:", error)
    return NextResponse.json(
      { error: "Failed to send checklist. Please try again." },
      { status: 500 }
    )
  }
}
