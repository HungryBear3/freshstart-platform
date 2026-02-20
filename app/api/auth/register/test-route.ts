// Simple test route to verify API routing works
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    message: "Test route working",
    timestamp: new Date().toISOString()
  })
}
