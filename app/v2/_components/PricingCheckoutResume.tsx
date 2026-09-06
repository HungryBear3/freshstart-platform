"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { analytics } from "@/lib/analytics/events";
import {
  clearPendingCheckoutIntent,
  getPendingCheckoutIntent,
  type CheckoutIntent,
} from "./checkout-intent";

/**
 * The single in-flight checkout handoff, shared across a StrictMode
 * cleanup/remount cycle so one pending intent can only ever produce one
 * Checkout Session request and one `begin_checkout`.
 *
 * It is cleared as soon as the request settles, so a completed handoff can
 * never be replayed for a later genuine intent.
 */
let inFlightHandoff: Promise<{ url: string }> | null = null;

function requestCheckoutHandoff(intent: CheckoutIntent): Promise<{ url: string }> {
  if (inFlightHandoff) return inFlightHandoff;

  const request = (async () => {
    const res = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: intent.plan, source: intent.source }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.url) {
      throw new Error(data?.error || "Unable to start checkout");
    }

    // One authoritative success — so exactly one bounded handoff event, and
    // one consumption of the pending intent, no matter how many mounts wait.
    analytics.subscriptionStart("one_time", 149);
    clearPendingCheckoutIntent();
    return { url: data.url as string };
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
        if (!cancelled) window.location.href = handoff.url;
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
