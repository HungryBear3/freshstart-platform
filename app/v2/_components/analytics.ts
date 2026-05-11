// FreshStart-IL v2 — analytics dispatcher.
//
// Stub-only: every event lands on console.debug so we can verify wiring during
// preview review without an analytics SDK. Replace `dispatch()` with the real
// Segment / GA4 / RudderStack / posthog call once the destination is chosen.
//
// Brief explicitly forbids adding a new analytics SDK or credentials in this
// pass, so this is the no-op surface. See _DEFERRED_ITEMS.md for follow-up.

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

function dispatch(event: AnalyticsEvent) {
  if (typeof window === "undefined") {
    // Server-side render: no-op. page_view fires from the client effect.
    return;
  }
  // Preview-only console trace so QA can see every event in DevTools.
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
