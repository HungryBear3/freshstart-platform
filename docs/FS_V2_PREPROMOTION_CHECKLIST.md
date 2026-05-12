# FreshStart-IL v2 — Pre-promotion verification checklist

One-document checklist that runs end-to-end before `vercel --prod`. Each section is a copy-pasteable command + a manual checkbox. Stop and resolve the first failure; do not skip.

Companion docs (read first if you haven't):

- `docs/FS_V2_PRODUCTION_PROMOTION_GATE.md` — the gate criteria
- `docs/FS_V2_LEGAL_COPY_REVIEW.md` — current safer copy posture
- `docs/FS_V2_ILCS_CLAIMS_AUDIT.md` — claim-by-claim verdicts
- `docs/FS_V2_CTA_BACKEND_WIRING_PLAN.md` — stub-to-real mapping
- `docs/FS_REFUND_POLICY_ALIGNMENT.md` — refund alignment audit
- `docs/FS_COUNTY_COVERAGE_AUDIT.md` — county list audit
- `docs/FS_V2_BRAND_HANDOFF_CHECKLIST.md` — logo + tokens swap list
- `docs/legal-audit/ILLINOIS_FORMS_FRESHNESS.md` — forms freshness loop

## 0. Pre-flight

```bash
# Confirm the candidate commit and a clean tree (or only known WIP).
git status --short
git log -1 --format="%h %s"
```

- [ ] On the production-candidate commit
- [ ] Working tree is clean OR only contains explicit deferred WIP

## 1. Static checks

```bash
pnpm run type-check          # tsc --noEmit
pnpm run lint                # eslint .
pnpm run forms:verify:offline  # catalog ↔ manifest agreement
```

- [ ] `type-check` exits 0
- [ ] `lint` exits 0
- [ ] `forms:verify:offline` exits 0 with `OK — catalog and manifest agree on every form.`

## 2. Tests

```bash
# v2 surface
pnpm exec jest __tests__/v2/ --no-coverage

# Forms verifier
pnpm exec jest __tests__/forms/verify-illinois-forms.test.ts --no-coverage

# County canonical list (if helper was added)
pnpm exec jest __tests__/lib/counties/ --no-coverage

# Full suite (allowed to fail on known WIP; review failures explicitly)
pnpm test
```

- [ ] v2 tests pass
- [ ] Forms verifier tests pass
- [ ] County tests pass (or n/a if helper not added)
- [ ] Any full-suite failures are pre-existing WIP, not v2 regressions

## 3. Build

```bash
SKIP_ENV_VALIDATION=true pnpm exec next build
```

- [ ] Build completes
- [ ] No `Failed to compile` or runtime-error stack traces in output
- [ ] No new warnings about missing env vars in production-critical paths

## 4. Stub leak scan

The v2 preview routes all in-body CTAs through `/api/_stub/*`. Production must hit real endpoints. Run before deploy:

```bash
# CTAs in v2 surface still pointing at stubs:
grep -rn "/api/_stub/" app/v2/ app/page.tsx app/pricing/page.tsx

# Stub handlers still present (these are fine to keep for /v2 alias; they
# must NOT be called from the production-promoted routes):
ls app/api/_stub/
```

- [ ] Every CTA in `app/v2/`, `app/page.tsx`, `app/pricing/page.tsx` routes to a real endpoint per `docs/FS_V2_CTA_BACKEND_WIRING_PLAN.md`
- [ ] `app/api/_stub/*` handlers can remain in repo (for `/v2` previews) but no production CTA hits them
- [ ] `app/v2/_components/tiers.ts` `CTA_PATHS` map points at real endpoints (or has been replaced by per-tier `href` values)

## 5. VisitorCounter / unrelated-widget leak scan

```bash
# Anywhere a v2 route imports VisitorCounter or /api/visitor-count:
grep -rn "VisitorCounter\|/api/visitor-count" app/v2/ app/layout.tsx app/page.tsx app/pricing/page.tsx
```

- [ ] No v2-surface file imports `VisitorCounter`
- [ ] No v2-surface file fetches `/api/visitor-count`
- [ ] `components/navigation/footer.tsx` (legacy) is NOT mounted on v2 routes (v2 uses `app/v2/_components/Footer.tsx`)

## 6. Analytics destination

Per `app/v2/_components/_DEFERRED_ITEMS.md` §"Real analytics wiring", the dispatcher currently writes to `console.debug` + `sessionStorage`. Before production:

- [ ] Destination chosen and approved (Segment, PostHog, GA4, etc.)
- [ ] `dispatch()` body in `app/v2/_components/analytics.ts` points at the real SDK
- [ ] No secrets are leaked to the client (read-only public keys only)
- [ ] In a real browser, confirm each event fires exactly once:
  - [ ] `page_view`
  - [ ] `cost_band_view`
  - [ ] `cta_click`
  - [ ] `tier_select`
  - [ ] `faq_expand`
  - [ ] `email_capture_submit`
  - [ ] `orientation_cta_click`
  - [ ] `mobile_sticky_cta_click`

## 7. Brand swap

Per `docs/FS_V2_BRAND_HANDOFF_CHECKLIST.md`:

- [ ] Real logo SVG dropped into `app/v2/_components/Logo.tsx`
- [ ] Production tokens pasted into the `:root` block at `app/v2/_components/styles.css:5–30`
- [ ] Favicon regenerated (`node scripts/generate-favicon.mjs`) if the mark changed
- [ ] Desktop visual pass on `/` and `/pricing`
- [ ] Mobile (375px) visual pass — sticky CTA + gradient buttons readable
- [ ] Contrast spot-check on white-on-gradient CTAs

## 8. Copy/claims gate (Opus audit applied)

Per `docs/FS_V2_LEGAL_COPY_REVIEW.md`:

- [ ] `Reviewed against Illinois Compiled Statutes` not present in production-visible copy
- [ ] `All 102 counties` rendered as availability-only, not per-county instructions
- [ ] `$15,000-$25,000` scoped to contested divorces (or external citation linked)
- [ ] Hard `under 2 hours` removed; `one focused session` framing used instead
- [ ] `80%` and `1 in 12` absent from production-visible copy
- [ ] Testimonials are clearly labeled `Illustrative` or replaced with permissioned real ones
- [ ] No contestation-based refund promise / Plus-pause promise (per `docs/FS_REFUND_POLICY_ALIGNMENT.md`)
- [ ] `/refund-policy` route exists (or footer/copy links removed if not) — see refund-alignment doc

## 9. County coverage

Per `docs/FS_COUNTY_COVERAGE_AUDIT.md`:

- [ ] One canonical list file is the only source of truth (recommended: `lib/counties/all-counties.ts`)
- [ ] All copy uses availability-only language unless per-county data is backfilled
- [ ] If `components/efiling/county-instructions.tsx` is reachable from v2 routes, its dropdown imports from the canonical list (no missing-county regression)

## 10. Preview deploy

```bash
vercel deploy --yes --build-env SKIP_ENV_VALIDATION=true
```

- [ ] Preview URL captured
- [ ] Candidate commit SHA captured
- [ ] Previous production deployment URL captured (rollback reference)

## 11. Browser QA on preview (clean incognito, no extensions)

Pages:

- [ ] `/` renders v2 hero, FAQ, testimonials (illustrative), pricing band, footer
- [ ] `/pricing` renders v2 hero, tier cards, compare table, guarantee, add-ons, FAQ
- [ ] Both pages render at 375px without horizontal scroll
- [ ] Mobile sticky CTA shows on `/pricing` and hides when tiers are in view
- [ ] Header CTA / mobile sticky CTA work
- [ ] Keyboard tab order is sensible
- [ ] `:focus-visible` outlines visible on the new background

Network/console pane:

- [ ] No `/api/_stub/*` calls
- [ ] No `/api/visitor-count` call
- [ ] No console errors or React warnings
- [ ] No unexpected floating widgets (UserWay, Intercom, chat, contrast toolbar) — clean incognito should show none

## 12. Lighthouse / axe

- [ ] Lighthouse pass on `/` (performance, accessibility, best practices, SEO scores recorded)
- [ ] Lighthouse pass on `/pricing`
- [ ] axe pass on `/` (no critical / serious violations)
- [ ] axe pass on `/pricing`

## 13. Test-mode side-effect proofs (no production)

For each real CTA endpoint wired in step 4, confirm with Stripe test mode / sandbox / staging — never with production keys:

- [ ] `start-trial` → Stripe Checkout in test mode creates session, redirects, completes (test card 4242)
- [ ] `start-filing` (Essential) → Stripe Checkout in test mode creates one-time session, completes, webhook grants 60 days
- [ ] `start-filing` (Plus) → Stripe Checkout in test mode creates subscription, completes
- [ ] `lead-capture` → real email sent via Resend sandbox / test recipient, drip enrollment recorded
- [ ] `orientation-call` → real `<a>` opens Calendly (or real webhook fires in sandbox)
- [ ] `add-on` → Stripe price ID resolves, test checkout completes

## 14. Promote

Only after every box above is checked:

```bash
vercel --prod
```

- [ ] Production deploy completed
- [ ] Smoke `/` and `/pricing` in production
- [ ] Watch logs/Sentry for 10 minutes; no error spike

## 15. Rollback (if §14 smoke fails)

1. Immediately redeploy the previous production deployment URL captured in §10.
2. Optionally re-enable the legacy `/v1` route if it was disabled.
3. Capture the failure mode (screenshot, console error, network log) and file in repo + Rex memory before re-attempting.

---

## Hard rules (re-state for any operator running this list)

- Do not run this list with production Stripe keys until §13 has passed in test mode.
- Do not delete or edit `app/api/_stub/*` until after promotion is stable — they are still needed by `/v2` alias previews.
- Do not promote without legal/copy sign-off recorded in `docs/FS_V2_LEGAL_COPY_REVIEW.md`.
- Do not use `git add -A` to stage the candidate; stage files explicitly.
- Do not skip §11 (browser QA on preview) — automated tests cannot catch every contrast/focus/widget issue.
