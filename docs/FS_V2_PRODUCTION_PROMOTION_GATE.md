# FreshStart-IL v2 Production Promotion Gate

Date: 2026-05-11
Current preview checkpoint: `0f58ce8` (`feat(fs): ship v2 redesign preview on root routes`)
Preview reviewed: `https://freshstart-platform-a3p1wbbus-alexy-kapluns-projects.vercel.app`

## Gate status

**NOT APPROVED FOR PRODUCTION YET.**

The v2 redesign is approved as a preview/internal checkpoint only. Production promotion requires every item below to be closed or explicitly waived by Alexy/operator.

## Hard blockers

### 1. Legal/copy sign-off

Reference: `docs/FS_V2_LEGAL_COPY_REVIEW.md`
Audit: `docs/FS_V2_ILCS_CLAIMS_AUDIT.md`
External research: `docs/FS_V2_EXTERNAL_CLAIMS_FORMS_RESEARCH.md`

Safer wording pass is already applied, but close before production:

- Refund/guarantee policy approved and operationally supported.
- Account/Stripe behavior confirmed against current cancellation/refund copy.
- `All 102 counties` support verified for availability/coverage; do not imply per-county instructions for all 102 unless data is backfilled.
- Quantified claims either substantiated or kept in softened form:
  - `$15,000-$25,000` remains scoped to contested divorces unless externally cited.
  - `under 2 hours` remains removed/softened to `one focused session` unless telemetry supports it.
- Removed claims should only return if data substantiates them:
  - `80%`
  - `1 in 12`
- Illustrative scenarios approved for launch or replaced with real permissioned testimonials.
- ILCS/court-form audit completed if we want to restore stronger `Reviewed against...` language later.
- Illinois court forms catalog refreshed against official 2025 Illinois Courts sources before using any stronger `current`, `accepted`, or `statewide-standardized` copy.

### 2. Real backend wiring

Current v2 CTA handlers are mocks under `/api/_stub/*`.

Close before production:

- `start-trial` → real Stripe checkout/subscription trial path.
- `start-filing` → real Stripe checkout for Essential / Plus.
- `lead-capture` → real CRM + checklist email path.
- `orientation-call` → real booking path or real intake handoff.
- `add-on` → real Stripe/add-on path.
- Add side-effect tests or dry-run proofs for each route.
- Confirm no stub endpoint is linked from production CTA paths.

### 3. Real analytics wiring

The analytics bridge is wired to existing Google `gtag`; before production,
verify that the deployed environment has the correct public Google IDs and that
Realtime/DebugView receives v2 events.

Close before production:

- Choose destination.
- Wire dispatcher without leaking secrets to client.
- Confirm expected events fire once:
  - `page_view`
  - `cost_band_view`
  - `cta_click`
  - `tier_select`
  - `faq_expand`
  - `email_capture_submit`
  - `orientation_cta_click`
  - `mobile_sticky_cta_click`
- Confirm no duplicate events from hydration/re-render.

### 4. Brand/logo finalization

Close before production:

- Replace placeholder wordmark in `app/v2/_components/Logo.tsx` with real logo.
- Replace inferred v2 colors/tokens in `app/v2/_components/styles.css` with approved production brand tokens or explicit final palette approval.
- Quick desktop/mobile visual pass after token swap.

### 5. Test cleanup

Close before production:

- Resolve `__tests__/app/homepage-premium.test.tsx`:
  - update to v2,
  - move to component-level test for preserved slate WIP,
  - or delete if slate WIP is discarded.
- Decide fate of unstaged `components/home/*` and `components/navigation/*` WIP.
- Run full project test/build after that decision.

## Required verification before `vercel --prod`

Run locally:

```bash
git status --short
npx jest __tests__/v2/ --no-coverage
SKIP_ENV_VALIDATION=true npx next build
```

Then preview deploy from the exact production candidate commit:

```bash
vercel deploy --yes --build-env SKIP_ENV_VALIDATION=true
```

Browser QA on preview:

- `/`
- `/pricing`
- mobile narrow viewport for sticky CTA
- console/network confirms only intended live destinations
- no `VisitorCounter`
- no `/api/visitor-count`
- no stub endpoint calls left on production-intended CTAs
- no unexpected floating widgets in clean incognito/no extensions

Accessibility/perf:

- Lighthouse pass on `/` and `/pricing`
- axe pass on `/` and `/pricing`
- keyboard tab order + visible focus rings
- contrast spot-check on gradient CTAs and dark cards

Only after all items close:

```bash
vercel --prod
```

## Rollback plan

Before prod deploy, record:

- previous production deployment URL
- candidate commit SHA
- Vercel project/env target

If production visual or side-effect QA fails:

1. Immediately redeploy previous known-good production commit/deployment.
2. Re-enable legacy route if needed.
3. Log incident notes in the repo and Rex memory.
