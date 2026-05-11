// v2 preview stub — no payment/Stripe side effects.
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let payload: unknown = null;
  try {
    payload = await request.json();
  } catch {
    /* ignore */
  }
  // eslint-disable-next-line no-console
  console.info("[_stub/start-trial]", payload);
  return NextResponse.json({
    ok: true,
    mock: true,
    endpoint: "start-trial",
    received: payload,
    note: "Preview-only stub. Production would create a Stripe trial.",
  });
}
