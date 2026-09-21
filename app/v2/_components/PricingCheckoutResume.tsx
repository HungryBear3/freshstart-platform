"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { analytics } from "@/lib/analytics/events";
import { navigateTo } from "@/lib/navigation";
import {
  buildFitCheckUrl,
  clearPendingCheckoutIntent,
  getPendingCheckoutIntent,
  isFitCheckBlock,
  isFitCheckHardBlock,
  type CheckoutIntent,
} from "./checkout-intent";

/**
 * A checkout handoff either produces a Stripe URL or is turned away by the
 * server's fit gate.
 *
 * The two refusals are not the same detour. `fit_check_required` means the
 * user simply has not answered yet, so the pending intent stays armed and the
 * fit check hands it straight back. `fit_check_blocked` means a stored
 * assessment already says this workflow cannot serve them: resuming would be
 * refused again by the same gate, so the intent is retired here rather than
 * left to bounce the user between pricing and the fit check.
 */
type CheckoutHandoff =
  | { kind: "checkout"; url: string }
  | { kind: "fit_check" };

/**
 * The single in-flight checkout handoff, shared across a StrictMode
 * cleanup/remount cycle so one pending intent can only ever produce one
 * Checkout Session request and one `begin_checkout`.
 *
 * It is cleared as soon as the request settles, so a completed handoff can
 * never be replayed for a later genuine intent.
 */
let inFlightHandoff: Promise<CheckoutHandoff> | null = null;

function requestCheckoutHandoff(intent: CheckoutIntent): Promise<CheckoutHandoff> {
  if (inFlightHandoff) return inFlightHandoff;

  const request = (async (): Promise<CheckoutHandoff> => {
    const res = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: intent.plan, source: intent.source }),
    });

    const data = await res.json().catch(() => ({}));

    // No checkout happened, so no handoff event. The intent survives a
    // "not answered yet", but a stored blocked assessment retires it.
    if (!res.ok && isFitCheckBlock(data?.code)) {
      if (isFitCheckHardBlock(data?.code)) clearPendingCheckoutIntent();
      return { kind: "fit_check" };
    }

    if (!res.ok || !data?.url) {
      throw new Error(data?.error || "Unable to start checkout");
    }

    // One authoritative success — so exactly one bounded handoff event, and
    // one consumption of the pending intent, no matter how many mounts wait.
    analytics.subscriptionStart("one_time", 149);
    clearPendingCheckoutIntent();
    return { kind: "checkout", url: data.url as string };
  })();

  inFlightHandoff = request;
  const release = () => {
    if (inFlightHandoff === request) inFlightHandoff = null;
  };
  request.then(release, release);
  return request;
}

export function PricingCheckoutResume() {
  const sessionResult = useSession();
  const status = sessionResult?.status ?? "loading";
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (status !== "authenticated") return;

    const pendingIntent = getPendingCheckoutIntent();
    if (!pendingIntent) return;
    const intent = pendingIntent;

    let cancelled = false;
    setMessage("Redirecting to secure checkout…");

    async function resumeCheckout() {
      try {
        const handoff = await requestCheckoutHandoff(intent);
        if (cancelled) return;
        if (handoff.kind === "fit_check") {
          // A `fit_check_required` intent is still in sessionStorage for the
          // fit check to resume; a `fit_check_blocked` one has been retired.
          setMessage("Checking that the FreshStart workflow fits your situation…");
          navigateTo(buildFitCheckUrl(intent));
          return;
        }
        navigateTo(handoff.url);
      } catch (error) {
        console.error("[fs-v2 checkout] resume failed", error);
        if (!cancelled) {
          setMessage("We could not start checkout automatically. Please choose your plan again.");
          clearPendingCheckoutIntent();
        }
      }
    }

    void resumeCheckout();
    return () => {
      cancelled = true;
    };
  }, [status]);

  if (!message) return null;

  return (
    <div className="fs-checkout-resume" role="status" aria-live="polite">
      {message}
    </div>
  );
}
