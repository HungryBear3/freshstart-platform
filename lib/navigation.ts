/**
 * The one place client code hands the browser a new document.
 *
 * `window.location` is unforgeable: it is a non-configurable, non-writable own
 * property of `window`, so a test cannot replace it or spy on it, and a direct
 * `window.location.href = …` in a component is unobservable — JSDOM logs
 * "navigation not implemented" and leaves `href` at the page URL. Routing every
 * full-page navigation through this named module gives tests a seam that
 * records the exact destination without changing what production does.
 */
export function navigateTo(url: string): void {
  if (typeof window === "undefined") return
  window.location.href = url
}
