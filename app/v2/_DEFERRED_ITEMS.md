# /v2 redesign — Deferred items

This is the FreshStart-IL Claude Design v2 redesign. The visual review
passed on preview `https://freshstart-platform-a3p1wbbus-alexy-kapluns-projects.vercel.app`,
and `/` and `/pricing` now render the v2 design. `/v2` and `/v2/pricing`
remain as aliases pointing at the same shared View components.

The items below are open follow-ups. Each must be closed before this
redesign can be considered for production promotion.

## Legal review — required before any external prospect sees the preview

The brief flags the following copy as requiring legal sign-off:

- Essential tier "What's not included" footer copy (`PricingTiers`,
  `excluded` array on the Essential tier in
  `app/v2/_components/tiers.ts`).
- The contested-spouse FAQ answer on pricing — it promises a 30-day refund
  on Essential and a Plus subscription pause
  (`app/v2/pricing/page.tsx`, `PRICING_FAQ[0]`).
- The "Reviewed against Illinois Compiled Statutes" footer line
  (`app/v2/_components/Footer.tsx`).
- The "All 102 counties" trust claim used in the eyebrow, the footer
  trust bar, and the guarantee band.

Preview MAY be reviewed internally before legal closes these; it must
NOT be shown to real prospects until legal signs off.

## Real backend wiring

All in-body CTAs currently POST to `/api/_stub/*` handlers that return
`{ ok: true, mock: true }`. None hit Stripe, Resend, Calendly, or the
CRM. The following must be replaced before promotion:

| Stub | Production target |
|---|---|
| `POST /api/_stub/start-trial` | Stripe Checkout (7-day trial subscription) |
| `POST /api/_stub/start-filing` | Stripe Checkout for Essential one-time or Plus annual |
| `POST /api/_stub/lead-capture` | CRM lead create + transactional checklist email |
| `POST /api/_stub/orientation-call` | Calendly / Cal.com booking link or webhook |
| `POST /api/_stub/add-on` | Stripe add-on line item |

## Real analytics wiring

`app/v2/_components/analytics.ts` exports a `track()` function that
console.debugs and pushes the event onto `sessionStorage`. No SDK or
credentials are present — by design, per brief.

Events currently dispatched:

- `page_view` (with `variant` identifier per page)
- `cta_click` (with `location`, `label`, and `tier` when applicable)
- `faq_expand` (which page, which question, index)
- `cost_band_view` (IntersectionObserver)
- `addon_add_click`
- `orientation_cta_click`
- `mobile_sticky_cta_click`
- `email_capture_submit`
- `tier_select`

When the analytics destination is chosen, replace the body of
`dispatch()` with the real SDK call. Do not add credentials or a new
analytics package in this branch.

## Brand token sourcing

The Design's dark navy + purple→blue palette is the placeholder set,
because Claude Design couldn't fetch the production site (JS-rendered).
The single `:root` block in `app/v2/_components/styles.css` is the
substitution point:

- `--fs-bg`, `--fs-bg-2`, `--fs-card`, etc.
- `--fs-grad` / `--fs-grad-soft` (gradient stops)
- `--fs-font` (font stack)
- `--fs-radius` / `--fs-radius-lg`
- `--fs-shadow-cta` / `--fs-shadow-card`

Pull the rendered `:root` from `freshstart-il.com` (DevTools → Elements
→ `:root` computed) and paste into the v2 stylesheet. Single-file
change.

## Real logo swap

The placeholder wordmark logo lives in
`app/v2/_components/Logo.tsx`. Replace the inline SVG with the real
production logo SVG when sourced. Both the header and footer call
through the same component, so the swap is one file.

## Retire / update `__tests__/app/homepage-premium.test.tsx`

That test asserts the in-flight premium-slate homepage WIP markup
(`bg-slate-900/95`, `View All Legal Resources`, etc.). Since `/` now
correctly renders the v2 redesign, that test fails as expected and is
NOT a checkpoint blocker. Before production promotion, either:

- update the assertions to match v2 output, or
- move the slate-theme assertions to a component-scoped test of the
  unstaged `components/home/*` work, or
- delete the test outright if the slate redesign is being discarded in
  favor of v2.

## Production promotion gate

Before flipping `/` and `/pricing` over to the v2 design, also do:

1. Legal sign-off on the four copy items above.
2. Backend wiring of the five stub endpoints to real providers.
3. Analytics dispatcher pointed at a real destination.
4. Brand tokens + logo swapped from production source.
5. Decide what to do with the existing dirty in-flight homepage redesign
   (`app/page.tsx` + `components/home/*`) — merge, discard, or rebase
   on top of v2.
6. Re-run `npm test` and `npm run build` against the v2 routes after
   the merges.
7. axe + Lighthouse passes in a real browser (Jest can't catch every
   contrast / focus-ring issue).
8. Decide whether to keep `/v2` reachable post-promotion (probably yes,
   as a redirect, until external links die out).
9. If keeping `/v2` post-promotion: drop the `/v2` sitemap entries.

## Phase-2 A/B test hooks (leave in place)

The brief asks not to wire A/B tests now, but to leave hooks so they're
cheap to flip later. The hook points are:

- **Homepage headline variant** — `app/v2/_components/Hero.tsx` is
  currently the "Price-forward" copy. Speed-forward and Original
  variants are documented in the design (see `homepage.jsx` in the
  bundle); swap the headline string and `data-variant` attribute on
  the page wrapper.
- **Homepage hero CTA** — `HERO_CTA_LABEL` constant in
  `Hero.tsx`. Alternatives: `"Get My Free Checklist"`,
  `"Get Started"`.
- **Pricing hero copy** — `from $149` lives in
  `app/v2/_components/PricingHero.tsx`. The two-price variant is the
  original Design copy.
- **Recommended tier** — `recommendedTier` prop passed to `getTiers()`
  in `app/v2/pricing/page.tsx`.
- **Tier count** — `PRICING_TIERS=3` env flag.
- **Primary CTA copy on pricing** — `PRIMARY_CTA` constant in
  `app/v2/_components/PricingTiers.tsx`. Alternative:
  `"Start 7-day free trial"`.

All variants are visually pre-validated by the Design prototype.

## Mobile sticky CTA — visibility

`PricingMobileStickyCTA` hides when the tiers section is in view (avoids
the double-CTA problem) and respects `prefers-reduced-motion`. Verify in
a real device once the preview is up.

## Accessibility pass

Component-level a11y is wired:

- FAQ buttons have `aria-expanded` + `aria-controls` + focus-visible
  outline.
- Comparison table dashes carry `aria-label="not included"`.
- Landmarks: `<main>`, `<nav>`, `<footer>`, `<header>` set on both
  pages.
- Focus rings on every interactive element via
  `:focus-visible { outline: ... }` in the shared CSS.

Still required: axe + Lighthouse against the deployed preview, plus a
contrast spot-check on white-on-gradient CTAs in a real browser. The
deployed preview is the only place these can run meaningfully.

## Fast-follow items from the 2026-05-11 checkpoint review

These are accepted as-is for the visual-review checkpoint and tracked
for a follow-up pass.

### 1. Pricing cost-anchor placement A/B test

Current section order on `/pricing`:
`hero → cards → table → add-ons → guarantee → cost-vs-attorney → testimonials → FAQ`.

The original Claude Design spec ordered the cost-vs-attorney band BEFORE
the cards (pre-decision anchor). Current ships post-decision anchor.
Accepted as-is for this checkpoint; log as a Phase-2 A/B test candidate:

- Variant A (current): post-decision anchor (cost band after tiers).
- Variant B (spec): pre-decision anchor (cost band before tiers).

Hook point: section ordering inside
`app/v2/_components/PricingView.tsx`. Move the `<CostBand … variant="pricing" />`
element above `<PricingTiers />` to flip variants. No data-model
changes required.

### 2. Hide dead comparison rows in 2-tier mode

In 2-tier mode (`PRICING_TIERS!=3`), some comparison-table rows render
`—` on every visible tier — most prominently `1:1 human pre-filing
review`, which only Concierge offers. Those rows add table height with
zero discriminating signal.

Fast-follow: filter `compareRows` in
`app/v2/_components/PricingCompareTable.tsx` so any row where every
visible tier value is `false` is skipped. This is a render-condition
change inside the existing renderer — NOT a data-model rewrite of
`compareRows` in `app/v2/_components/tiers.ts` (which still needs the
3-tier values for `PRICING_TIERS=3`).

CSS-level alternative (acceptable): `:has()` selector to collapse the
row when all `td > .fs-pr-table-dash` are present, but the render-time
filter is simpler and more SR-friendly.

### 3. Identify floating right-edge circular icon

A floating circular icon was visible on the lower-right edge of the
preview during visual review. Source unknown. Confirm whether it is:

- Vercel preview UI (toolbar / live edit / feedback widget),
- an accessibility widget injected by the browser or extension,
- a browser extension (Grammarly, password manager, etc.),
- or stray app code (e.g., a leftover floating CTA, chat widget, or
  scroll-to-top button) we haven't catalogued.

If intentional (Vercel-injected): document and move on. If stray app
code: remove in a later cleanup. Repro path: load preview in a clean
incognito browser without extensions and re-check.
