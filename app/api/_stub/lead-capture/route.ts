// v2 preview stub — no real CRM/email side effects.
// Logs to stdout so QA can verify wiring; never reaches a provider.
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let payload: unknown = null;
  try {
    payload = await request.json();
  } catch {
    /* ignore — accept empty body too */
  }
  // eslint-disable-next-line no-console
  console.info("[_stub/lead-capture]", payload);
  return NextResponse.json({
    ok: true,
    mock: true,
    endpoint: "lead-capture",
    received: payload,
    note: "Preview-only stub. No CRM or email side effects.",
  });
}

export async function GET() {
  return NextResponse.json({ ok: true, mock: true, endpoint: "lead-capture", method: "GET" });
}
