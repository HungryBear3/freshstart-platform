# FreshStart-IL v2 Legal/Claims Copy Review

Date: 2026-05-11
Scope: v2 homepage/pricing copy currently served on `/` and `/pricing` after the v2 root-route checkpoint.
Related claims audit: `docs/FS_V2_ILCS_CLAIMS_AUDIT.md`
External research follow-up: `docs/FS_V2_EXTERNAL_CLAIMS_FORMS_RESEARCH.md`

This is an operational copy-risk review, not legal advice. Counsel/operator should still approve before production promotion.

## Current status

Safer wording pass completed after Alexy review:

- Removed court-acceptance-style promises from the v2 marketing surface.
- Replaced `Trusted by Illinois residents in all 102 counties` with `Built for Illinois residents in all 102 counties`.
- Replaced `Reviewed against Illinois Compiled Statutes` in the footer with `Built around Illinois court forms and filing steps`.
- Replaced `court-ready` marketing copy with `Illinois form drafts`, `Illinois form workflow`, or similar softer wording.
- Rewrote contested-spouse FAQ to avoid promising that a filing remains valid, that Plus can be paused, or that FreshStart will make refund decisions based on spouse contestation.
- Rewrote Cook County / rejection / refile copy to avoid court-reliant promises.
- Removed unsubstantiated `80%` and `1 in 12` claims from customer-facing copy pending data review.
- Labeled testimonials/scenarios as illustrative examples until real permissioned testimonials exist.
- Applied Opus audit recommendations: changed all-102 language to availability-only, scoped the $15k-$25k attorney-cost comparison to contested divorces, and removed hard `under 2 hours` hero copy.

## Illinois Compiled Statutes review question

Alexy asked whether FreshStart performed an Illinois Compiled Statutes review in the initial product build.

Likely answer: the product appears to have been built around Illinois-specific divorce requirements, court forms, child-support/spousal-maintenance concepts, county filing steps, and legal-info content. That is different from having a dated legal/counsel review artifact proving the marketing claim `Reviewed against Illinois Compiled Statutes`.

Production recommendation:

- Keep the product-positioning idea: `Built around Illinois court forms and filing steps`.
- Do not use `Reviewed against Illinois Compiled Statutes` publicly unless we create or locate a dated review artifact listing the statutes/forms checked, reviewer, date, and scope.

Difficulty to create the artifact:

- Light internal audit: 2-4 hours with Opus/Claude to map current product claims/forms/calculators to source files and ILCS/court-form references.
- Stronger launch artifact: 0.5-1 day to produce a traceable checklist with citations, form names, county caveats, and known unsupported edge cases.
- Legal sign-off: outside counsel/operator review after the checklist; time depends on reviewer availability.

## Current higher-priority production items

### 1. All-102-counties claim

Current safer copy:

- `Available in all 102 Illinois counties`
- `FreshStart is available for Illinois residents in all 102 counties.`

Risk:

- Still requires product coverage to really support all 102 Illinois counties.
- This is safer than `Trusted by`, because it is a coverage claim rather than a customer-proof claim.

Production gate:

- Confirm county coverage in product data/routing before production.

### 2. Refund / cancellation language

Current safer copy:

- `We don't mediate contested disputes or make refund decisions based on why an agreement fell apart.`
- `Eligible refunds are processed under the published refund policy — no retention call required.`

What the old contested-spouse refund meant:

- Old copy said Essential would be refunded within 30 days if a spouse contests.
- That created a specific operational promise tied to a legal/event trigger.
- Safer copy keeps FreshStart out of the middle of contentious spouse disputes and avoids tying refunds to contestation claims.

What the old Plus pause meant:

- Old copy said FreshStart would pause a Plus subscription if a spouse contests.
- That requires Stripe/account support and an internal policy. If not implemented, do not promise it.
- Safer copy removed the pause promise.

Production gate:

- Confirm the actual refund policy and Stripe/account behavior before adding stronger language.

### 3. Court acceptance / rejection claims

Current safer position:

- FreshStart prepares Illinois form drafts and filing steps.
- Users review everything before filing.
- Support can help correct generation issues under the guarantee.
- No current v2 marketing copy promises court acceptance.

Production gate:

- Keep this posture unless real policy, support workflow, and legal sign-off support a stronger guarantee.

### 4. Quantified claims

Current status:

- `$15,000-$25,000` attorney-cost framing remains only with a contested-divorce qualifier.
- Exact `under 2 hours` customer-facing copy was removed; current copy uses one-focused-session framing for straightforward uncontested cases when information is ready.
- `80%` removed from copy pending data check.
- `1 in 12` removed from copy pending data check.

Production gate:

- Attorney-cost range is now scoped to contested divorces; add an external citation before making the claim broader.
- Exact `under 2 hours` copy was removed from Hero; current copy uses `one focused session` framing.
- `80%` and `1 in 12` should only return if Opus/data review substantiates them.

### 5. Testimonials

Current status:

- v2 testimonials are now explicitly illustrative examples.
- Headings and labels say `Illustrative examples`, `Illustrative Illinois filing scenarios`, `Illustrative pricing scenarios`, and `Example:`.

Production gate:

- Replace with real permissioned testimonials when available.
- Or keep clearly illustrative scenarios if legally acceptable for launch.

## Remaining recommended checks before production

1. Run an Opus/Claude source audit for ILCS/court-form review evidence.
2. Run an Opus/Claude data audit for `80%` completion-in-one-sitting and `1 in 12` refile claims.
3. Confirm product county coverage truly supports all 102 counties.
4. Confirm refund policy and Stripe/account behavior match copy.
5. Decide whether illustrative testimonials are acceptable or replace them with real permissioned examples.
