# /v2 redesign — Deferred items

This is the FreshStart-IL Claude Design v2 redesign. The visual review
passed on preview `https://freshstart-platform-a3p1wbbus-alexy-kapluns-projects.vercel.app`,
and `/` and `/pricing` now render the v2 design. `/v2` and `/v2/pricing`
remain as aliases pointing at the same shared View components.

The items below are open follow-ups. Each must be closed before this
redesign can be considered for production promotion.

## Legal review — required before any external prospect sees the preview

Operational copy-risk review now lives at:

- `docs/FS_V2_LEGAL_COPY_REVIEW.md`
- `docs/FS_V2_ILCS_CLAIMS_AUDIT.md`

Safer wording pass completed after Alexy review:

- Contested-spouse copy now keeps FreshStart out of the middle of disputes;
  no special contested-case refund, reason-based refund, or Plus-pause promise remains.
- Footer copy now says `Built around Illinois court forms and filing steps`;
  no public `Reviewed against Illinois Compiled Statutes` claim remains.
- Court-acceptance-style promises were removed from the v2 marketing surface.
- `80%` and `1 in 12` quantified claims were removed pending an Opus/data audit.
- Testimonials are now explicitly labeled as illustrative examples.
- Opus audit recommendations applied: all-102 language is availability-only, $15k-$25k is scoped to contested divorces, and hard `under 2 hours` copy is removed from Hero.

Still required before external prospects/production:

- Confirm all-102-county product coverage.
- Confirm refund policy/account behavior matches current copy.
- Decide whether illustrative scenarios are acceptable or replace with real permissioned testimonials.
- Complete ILCS/court-form evidence audit if we want to restore a stronger `Reviewed against...` claim.

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

Detailed gate checklist now lives at:

- `docs/FS_V2_PRODUCTION_PROMOTION_GATE.md`

Before flipping `/` and `/pricing` over to the v2 design in production, also do:

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

### 2. Hide dead comparison rows in 2-tier mode — DONE 2026-05-11

In 2-tier mode (`PRICING_TIERS!=3`), comparison-table rows where every
visible tier value is `false` are now filtered in
`app/v2/_components/PricingCompareTable.tsx`. `compareRows` in
`app/v2/_components/tiers.ts` is unchanged so `PRICING_TIERS=3` still
surfaces Concierge-only values.

Regression coverage:

- `__tests__/v2/v2-pages.test.tsx` asserts `1:1 human pre-filing review`
  is hidden in 2-tier mode and present in 3-tier mode.

### 3. Identify floating right-edge circular icon — INVESTIGATED 2026-05-11

Local clean-browser check against `http://localhost:3000/` did NOT show a
floating right-edge widget. DOM inspection found no fixed-position
right-edge app element on `/`; the only sticky/fixed v2 surfaces are:

- `.fs-hd` sticky header (`app/v2/_components/styles.css`)
- `.fs-pr-sticky` mobile pricing CTA, hidden on desktop and bottom-aligned

Source search found no v2 app imports or markup for UserWay, Intercom,
accessibility toolbar, chat widget, contrast widget, scroll-to-top, or a
right-edge floating CTA.

Most likely causes if it appears only in Alexy's preview browser:

- Vercel preview/deployment UI,
- browser extension injection,
- or the uncommitted `tmp_design_bundle/.../tweaks-panel.jsx` scratch
  tooling if that scratch prototype is opened directly. That file is in
  `tmp_design_bundle/`, remains untracked/uncommitted, and is not imported
  by the v2 app.

If this needs final confirmation before production, repro in clean
incognito/no-extension browser against the deployed preview. No app code
removal is indicated from current evidence.
