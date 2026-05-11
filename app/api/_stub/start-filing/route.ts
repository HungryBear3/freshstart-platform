// v2 preview stub — no payment/checkout side effects.
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
  console.info("[_stub/start-filing]", payload);
  return NextResponse.json({
    ok: true,
    mock: true,
    endpoint: "start-filing",
    received: payload,
    note: "Preview-only stub. Production would route to Stripe checkout.",
  });
}
