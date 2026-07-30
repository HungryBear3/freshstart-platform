import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"

export const runtime = "nodejs"

async function disabled(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json(
    { error: "Legacy subscription synchronization is disabled; Stripe webhooks own access changes" },
    { status: 410 },
  )
}

/** Legacy route retained only to fail closed for old clients. */
export async function POST(request: NextRequest) {
  return disabled(request)
}

/** Legacy route retained only to fail closed for old clients. */
export async function GET(request: NextRequest) {
  return disabled(request)
}
