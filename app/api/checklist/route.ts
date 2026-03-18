import { NextRequest, NextResponse } from "next/server"
import { sendChecklistEmail } from "@/lib/email"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Checklist] Email delivery error:", error)
    return NextResponse.json(
      { error: "Failed to send checklist. Please try again." },
      { status: 500 }
    )
  }
}
