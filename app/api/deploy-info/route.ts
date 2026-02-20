import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * Diagnostic: confirms newstart-il (FreshStart IL) is deployed.
 * Visit /api/deploy-info to verify correct app + favicon fix is live.
 */
export async function GET() {
  return NextResponse.json({
    app: "newstart-il",
    project: "FreshStart IL",
    favicon: "base64-in-metadata",
    updated: "2026-02-19",
  })
}
