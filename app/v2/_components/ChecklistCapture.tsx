"use client";

import * as React from "react";
import { analytics } from "./analytics";
import { STUB_ENDPOINTS } from "./tiers";

export function ChecklistCapture() {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "submitting" | "done" | "error">("idle");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;
    setStatus("submitting");
    analytics.track({ name: "email_capture_submit", page: "homepage" });
    try {
      const res = await fetch(STUB_ENDPOINTS.leadCapture, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "homepage_checklist" }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
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
            Mock: checklist queued for delivery (preview only).
          </div>
        )}
        {status === "error" && (
          <div className="fs-cap-status" role="status" aria-live="polite">
            Stub endpoint failed locally. Check console.
          </div>
        )}
      </div>
    </section>
  );
}
