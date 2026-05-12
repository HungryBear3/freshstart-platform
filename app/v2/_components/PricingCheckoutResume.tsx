"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import {
  clearPendingCheckoutIntent,
  getPendingCheckoutIntent,
} from "./checkout-intent";

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
        const res = await fetch("/api/stripe/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: intent.plan, source: intent.source }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.url) {
          throw new Error(data?.error || "Unable to start checkout");
        }

        clearPendingCheckoutIntent();
        if (!cancelled) window.location.href = data.url;
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
