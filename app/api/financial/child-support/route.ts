import { NextResponse } from "next/server"

export async function POST(_request?: Request) {
  return NextResponse.json(
    {
      error: "Child-support calculator unavailable pending independent formula validation",
    },
    { status: 410 },
  )
}
