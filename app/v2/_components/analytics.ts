// FreshStart-IL v2 — analytics dispatcher.
//
// Bridges v2-specific UI events into the existing site-wide Google Analytics
// gtag installation while preserving the console/sessionStorage trace used by
// preview QA. No new SDK or credentials are introduced here.
//
// The Google bridge is gated on `isLiveTrackingEnabled()` so Preview /
// localhost / dev only ever see the console/sessionStorage trace. The trace
// stays on in all environments — it's local-only.

import { isLiveTrackingEnabled } from "@/lib/analytics/tracking-gate";

export type AnalyticsPage = "homepage" | "pricing";

export type AnalyticsEvent =
  | { name: "page_view"; page: AnalyticsPage; variant?: string }
  | { name: "cta_click"; page: AnalyticsPage; location: string; label: string; tier?: string }
  | { name: "faq_expand"; page: AnalyticsPage; question: string; index: number }
  | { name: "cost_band_view"; page: AnalyticsPage }
  | { name: "addon_add_click"; page: "pricing"; addon: string; price: string }
  | { name: "orientation_cta_click"; page: AnalyticsPage }
  | { name: "mobile_sticky_cta_click"; page: "pricing"; tier?: string }
  | { name: "email_capture_submit"; page: "homepage" }
  | { name: "tier_select"; page: "pricing"; tier: string };

const STORAGE_KEY = "fs-v2-analytics-trace";

function toGaEvent(event: AnalyticsEvent): [string, Record<string, string | number | undefined>] {
  switch (event.name) {
    case "page_view":
      return ["page_view", { page_path: `/v2${event.page === "pricing" ? "/pricing" : ""}`, page_section: event.page, variant: event.variant }];
    case "cta_click":
      return ["select_content", { content_type: "cta", page_section: event.page, location: event.location, item_name: event.label, tier: event.tier }];
    case "tier_select":
      return ["select_item", { item_list_name: "v2_pricing_tiers", item_name: event.tier, page_section: event.page }];
    case "addon_add_click":
      return ["add_to_cart", { item_name: event.addon, price: event.price, page_section: event.page }];
    case "orientation_cta_click":
      return ["generate_lead", { lead_type: "orientation_call", page_section: event.page }];
    case "email_capture_submit":
      return ["generate_lead", { lead_type: "checklist", page_section: event.page }];
    case "mobile_sticky_cta_click":
      return ["select_content", { content_type: "cta", location: "mobile_sticky", page_section: event.page, tier: event.tier }];
    case "faq_expand":
      return ["select_content", { content_type: "faq", page_section: event.page, item_name: event.question, index: event.index }];
    case "cost_band_view":
      return ["view_item_list", { item_list_name: "cost_bands", page_section: event.page }];
  }
}

function dispatchToGoogle(event: AnalyticsEvent) {
  if (typeof window === "undefined") return;
  if (!isLiveTrackingEnabled()) return;
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== "function") return;
  const [eventName, params] = toGaEvent(event);
  gtag("event", eventName, params);
}

function dispatch(event: AnalyticsEvent) {
  if (typeof window === "undefined") {
    // Server-side render: no-op. page_view fires from the client effect.
    return;
  }

  dispatchToGoogle(event);

  // Preview QA trace: keep this even when Google Analytics is configured so
  // reviewers can verify every v2 event locally without leaving the browser.
  // eslint-disable-next-line no-console
  console.debug("[fs-v2 analytics]", event.name, event);
  try {
    const existing = window.sessionStorage.getItem(STORAGE_KEY);
    const trace: AnalyticsEvent[] = existing ? JSON.parse(existing) : [];
    trace.push(event);
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(trace.slice(-200)));
  } catch {
    /* swallow storage quota / private mode */
  }
}

export const analytics = {
  track: dispatch,
};

export function readTrace(): AnalyticsEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
