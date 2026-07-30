import { NextResponse } from "next/server"

export async function POST(_request?: Request) {
  return NextResponse.json(
    {
      error: "Maintenance calculator unavailable pending independent formula validation",
    },
    { status: 410 },
  )
}
