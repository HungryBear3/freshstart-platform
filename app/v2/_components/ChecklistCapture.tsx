"use client";

import * as React from "react";
import { analytics } from "./analytics";

// Lead-capture is wired to the real /api/checklist route (drop-in replacement
// for /api/_stub/lead-capture per docs/FS_V2_CTA_BACKEND_WIRING_PLAN.md).
// Payload is { email }; the route derives source from the Referer header and
// handles rate-limiting, subscriber persistence, drip enrollment, and email.
// In Vercel Preview / non-production environments the route returns a fast
// 200 noop ({ mode: "preview_noop" }) so this UI must not hang on it.
const LEAD_CAPTURE_ENDPOINT = "/api/checklist";

// Defensive client-side timeout. The route should respond in well under
// 2s; if it does not (cold start, dropped connection, hung downstream),
// abort the request and surface an error so the button never sticks at
// "Sending…".
const CHECKLIST_TIMEOUT_MS = 2000;

export function ChecklistCapture() {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "submitting" | "done" | "error">("idle");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;
    setStatus("submitting");
    analytics.track({ name: "email_capture_submit", page: "homepage" });

    const controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = controller
      ? setTimeout(() => controller.abort(), CHECKLIST_TIMEOUT_MS)
      : null;

    try {
      const res = await fetch(LEAD_CAPTURE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        signal: controller?.signal,
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      // AbortError (timeout) and any network/parse failure both land here.
      setStatus("error");
    } finally {
      if (timer) clearTimeout(timer);
    }
  };

  return (
    <section id="capture" className="fs-cap" aria-labelledby="cap-title">
      <div className="fs-cap-inner">
        <div className="fs-cap-tag">Free download</div>
        <h3 id="cap-title" className="fs-cap-title">
          The Illinois Divorce Checklist — county-specific.
        </h3>
        <p className="fs-cap-sub">
          A printable, county-aware checklist so you know exactly what to gather before filing. No
          commitment.
        </p>
        <form className="fs-cap-form" onSubmit={onSubmit} noValidate>
          <label className="fs-sr" htmlFor="checklist-email">
            Email address
          </label>
          <input
            id="checklist-email"
            className="fs-cap-input"
            type="email"
            placeholder="you@email.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            className="fs-btn fs-btn-checklist fs-btn-md"
            disabled={status === "submitting"}
          >
            {status === "submitting" ? "Sending…" : "Send my checklist"}
          </button>
        </form>
        <div className="fs-cap-fine">We&apos;ll email it once. Unsubscribe anytime.</div>
        {status === "done" && (
          <div className="fs-cap-status" role="status" aria-live="polite">
            Sent! Check your inbox in the next minute or two.
          </div>
        )}
        {status === "error" && (
          <div className="fs-cap-status" role="status" aria-live="polite">
            Something went wrong. Please try again, or email support@freshstart-il.com.
          </div>
        )}
      </div>
    </section>
  );
}
