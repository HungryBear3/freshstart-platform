# FreshStart-IL — Refund Policy Alignment Audit

> **HISTORICAL AUDIT — NOT CURRENT OPERATING INSTRUCTIONS.** References below to trials, Plus, subscriptions, cancellation, or earlier public copy describe the May 2026 state and must not be used for a release. The current approved implementation is `$149` one-time access for 60 days with no subscription. Use `docs/ONE_TIME_CHECKOUT_RELEASE_GATE.md` for current release and recovery controls.

Date: 2026-05-11
Scope: Doc-only survey. No code, copy, Stripe, or content changes.
Direction (hard rules):

- Refunds must NOT be tied to spouse contestation.
- No "Essential refunded within 30 days if a spouse contests."
- No "Plus paused if a spouse contests."
- Safer copy direction: `We don't mediate contested disputes or make refund decisions based on why an agreement fell apart` and `Eligible refunds are processed under the published refund policy — no retention call required.`
- Stripe behavior is NOT to be changed in this pass.

## TL;DR

- v2 production-visible copy alignment: ✅ (homepage `/`, `/v2`, `/pricing`, `/v2/pricing`, v2 Footer/Hero/Guarantee/FAQ all use the safer wording; no contestation-based refund or Plus pause survives in the rendered v2 surface).
- Drip / marketing-email alignment: ✅ (no refund, cancellation, or contestation language in `app/api/drip/send/route.ts` steps 1–5).
- Legal-page alignment: ✅ (`/legal-info/refund-policy` now exists; Terms/FAQ no longer claim FreshStart IL is free to use; v2 refund copy uses `support@freshstart-il.com`).
- Stripe / billing code alignment: ✅ (no `contested`/`spouse`/contestation reason-code references in any Stripe path; refund is operator-driven via Stripe Dashboard only — no automated contestation-based refund logic in repo).

Buckets misaligned: **0** after the 2026-05-11 closeout pass.

## Current public v2 refund / cancellation copy (verbatim)

- `app/v2/_components/Hero.tsx:61` — `<span>30-day money-back guarantee</span>`
- `app/v2/_components/Hero.tsx:82` — `<span ...>✓</span> Cancel anytime`
- `app/v2/_components/PricingHero.tsx:28` — `<span>30-day money-back guarantee</span>`
- `app/v2/_components/PricingGuaranteeBand.tsx:7-8` — `Money-back guarantee` / `Full refund within 30 days, no questions, no recovery emails.`
- `app/v2/_components/Footer.tsx:10` — `Available in all 102 Illinois counties · 30-day money-back guarantee · Built around Illinois court forms and filing steps`
- `app/v2/_components/HomeView.tsx:22` — Forms FAQ: `support can help correct generation issues under our guarantee.`
- `app/v2/_components/HomeView.tsx:26` — Contested FAQ: `FreshStart is built for uncontested divorces ... If your case becomes contested, we'll help you understand your options and connect you with attorneys if needed.` (no refund / pause promise)
- `app/v2/_components/HomeView.tsx:38` — Don't-finish FAQ: `The 30-day money-back guarantee means if it's not right for you, you get a full refund.`
- `app/v2/_components/PricingView.tsx:23-24` — Contest FAQ: `We don't mediate contested disputes or make refund decisions based on why an agreement fell apart.`
- `app/v2/_components/PricingView.tsx` — Refund FAQ now directs users to `support@freshstart-il.com` and links `/legal-info/refund-policy`; no `refund@` mailbox promise remains.
- `app/page.tsx:12` and `app/v2/page.tsx:9` — meta description: `7-day free trial, 30-day money-back guarantee.`
- `app/pricing/page.tsx:12` and `app/v2/pricing/page.tsx:8` — meta description: `7-day free trial, 30-day money-back guarantee, all 102 Illinois counties.`

Old promises confirmed absent from v2 surface:

- No `pause your Plus` / `Plus paused`.
- No `prorated refund` / `prorated on cancelation`.
- No `Essential refunded within 30 days if your spouse contests` / `contestation`-conditional refund.
- Regression locked by `__tests__/v2/v2-root-routes.test.tsx:103-108`:
  - asserts `We don't mediate contested disputes` present.
  - asserts `pause your Plus | prorated refund | contestation is not a separate refund trigger` not matched.

## Bucketed survey

### 1. Production-visible v2 copy (`app/v2/`, `app/page.tsx`, `app/pricing/page.tsx`)

Aligned. Files: `Hero.tsx`, `PricingHero.tsx`, `PricingGuaranteeBand.tsx`, `Footer.tsx`, `HomeView.tsx`, `PricingView.tsx`, root `page.tsx` / `pricing/page.tsx`. All references to refund/cancel are: `30-day money-back guarantee`, `Cancel anytime`, `Eligible refunds are processed under the published refund policy`, plus the explicit `We don't mediate contested disputes` line. No contestation-conditional refund, no Plus pause, no proration.

### 2. Other production-visible copy (legacy app/ pages outside v2)

Aligned. The only legacy-touch surfaces with refund/cancellation strings are user-facing dashboard controls (`app/dashboard/profile/page.tsx:400` "cancel subscription" link, `:539` button label) and questionnaire/form `Cancel` buttons — generic UI, no refund-policy promise.

### 3. Marketing emails / drips (`app/api/drip/`)

Aligned. `app/api/drip/send/route.ts` steps 1–5 contain zero refund, cancellation, contestation, money-back, or Plus-pause language. The closest match is step 4 (`Is your spouse delaying your divorce?`) — about default judgment timing, not refunds. Safe.

### 4. Legal / policy pages

Aligned after the 2026-05-11 closeout pass:

- `app/legal-info/refund-policy/page.tsx` now provides the canonical refund-policy route.
- `app/legal-info/terms/page.tsx` no longer claims FreshStart IL is free to use and links the refund policy.
- `app/legal-info/faq/page.tsx` no longer claims FreshStart IL is free to use and summarizes the 30-day guarantee/exclusions.
- `app/v2/_components/PricingView.tsx` uses `support@freshstart-il.com` and links `/legal-info/refund-policy`.

No contestation-based refund language in legal pages — the structural gap is closed.

### 5. Tests (`__tests__/`)

Aligned. `__tests__/v2/v2-root-routes.test.tsx:103-108` actively enforces the no-contestation-refund / no-Plus-pause / no-proration regression. `__tests__/v2/v2-pages.test.tsx:56,129,137` asserts the safer wording is present. No test asserts the old promise.

### 6. Internal docs / WIP

- `docs/FS_V2_LEGAL_COPY_REVIEW.md` and `docs/FS_V2_ILCS_CLAIMS_AUDIT.md` correctly describe the safer direction.
- `app/v2/_DEFERRED_ITEMS.md:20-21,32` correctly states no contestation refund / Plus-pause promise remains; flags `Confirm refund policy/account behavior matches current copy` as still-open.
- `docs/FS_V2_PRODUCTION_PROMOTION_GATE.md:22-23` lists refund/guarantee policy and Stripe-cancellation-behavior confirmation as gates.
- `tmp_design_bundle/freshstart-il/project/pricing.jsx` (untracked scratch bundle) still contains the OLD promises verbatim — `pricing.jsx:208,212` carry the contestation-based Essential refund + Plus pause + prorated refund and the `refund@freshstart-il.com ... No questions, no retention call. Plus subscribers also get a prorated refund on cancelation.` line. This is the design-bundle prototype, not imported by the v2 app (per `_DEFERRED_ITEMS.md` investigation note), so it does not surface in production. Per task scope it is excluded from the survey, but flagged here so it isn't accidentally copied forward.
- `PRD_HOMEPAGE_V2.md:39`, `PRD_PRICING_V2.md`, `MARKET_TESTING_CHECKLIST.md:44`, `TESTING_CHECKLIST.md:65-72,284,316`, `STRIPE_TESTING_GUIDE.md`, `LESSONS_LEARNED.md`, `EMAIL_AND_PAYMENT_SETUP.md`, `PAYMENT_IMPLEMENTATION_GUIDE.md`, `GOOGLE_ADS_SETUP_COMPLETE.md` — internal docs referencing refund/cancel are procedural (test the refund button, schema includes `refunded` state, etc.). No public promise.

### 7. Stripe / account / billing code

Aligned with the hard rule (no behavior change recommended).

- `app/api/webhooks/stripe/route.ts:229,251` — only `cancelAtPeriodEnd` and `status: "canceled"` (Stripe-driven, no contestation hook).
- `app/api/stripe/sync/route.ts:39,148`, `app/api/stripe/sync-subscription/route.ts:165`, `lib/stripe/subscription.ts:22` — read-side mirroring of `cancel_at_period_end` only.
- `app/api/stripe/create-checkout-session/route.ts:64` — `cancel_url` for Stripe Checkout (user-cancel of checkout flow, not subscription).
- `app/api/auth/delete-account/route.ts:52-63` — cancels Stripe subscription on account delete; no contestation reason code.
- `app/api/auth/export-data/route.ts:114` — exports `cancelAtPeriodEnd` from user subscription record.
- `app/api/dev/create-test-subscription/route.ts:48,71` — dev-only test seed.
- `prisma/schema.prisma:597,601,620` — `Subscription.status` enum includes `"canceled"`, `Payment.status` enum includes `"refunded"`. Generic Stripe-mirror schema; no contestation column.
- `lib/analytics/events.ts:250-255` — `subscriptionCancel(planName, reason?)` analytics event. Optional `reason` is free-form and not surfaced anywhere as a refund trigger; not user-set on cancellation flow.

No file in the repo issues automated refunds, processes contestation-keyed refunds, or pauses a Plus subscription. Refunds are operator-driven via Stripe Dashboard (per `TESTING_CHECKLIST.md:65-72`, `LESSONS_LEARNED.md:2239`). This matches the safer copy direction: "Eligible refunds are processed under the published refund policy — no retention call required" implies manual operator processing, which is what exists.

## Implementation gaps

Resolved in the 2026-05-11 closeout pass:

1. **Canonical refund policy page:** closed by `app/legal-info/refund-policy/page.tsx`.
2. **Stale "free to use" copy:** removed from Terms and FAQ.
3. **`refund@freshstart-il.com` mailbox:** removed from v2 PricingView; refund/support path is `support@freshstart-il.com`.

Remaining operator confirmations before production:

1. Confirm the 30-day money-back guarantee is operationally approved for both Essential and Plus.
2. Confirm Stripe/account/support workflow can process policy-eligible refunds via support.
3. Confirm no automated refund logic is desired before launch; current posture remains operator-driven refunds via Stripe Dashboard.

## No-change items (Stripe code — explicitly NOT recommended to touch per hard rule)

- `app/api/webhooks/stripe/route.ts` — no change.
- `app/api/stripe/sync/route.ts`, `app/api/stripe/sync-subscription/route.ts` — no change.
- `app/api/stripe/create-checkout-session/route.ts` — no change.
- `app/api/auth/delete-account/route.ts` Stripe-cancel path — no change.
- `lib/stripe/subscription.ts` — no change.
- `prisma/schema.prisma` Subscription/Payment status enums — no change.
- `app/api/dev/create-test-subscription/route.ts` — dev-only, no change.
- `lib/analytics/events.ts` `subscriptionCancel` — no change; `reason` arg is free-form and harmless.

Current Stripe behavior (operator-driven refunds via Dashboard, no automated contestation logic) already matches the safer copy. No code change is required to support the new direction.
