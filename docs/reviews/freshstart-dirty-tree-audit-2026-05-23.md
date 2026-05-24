# Fresh Start Dirty-Tree Audit — 2026-05-23

Status: internal cleanup/audit only. **No deploy.**

## Current dirty files

Tracked modifications still present before this audit:

- `components/home/HeroSection.tsx`
- `components/home/HowItWorksSection.tsx`
- `components/home/IntroCallBanner.tsx`
- `components/home/StatsBar.tsx`
- `components/home/TestimonialsSection.tsx`
- `components/home/TrustBadgesSection.tsx`
- `components/navigation/Logo.tsx`
- `components/navigation/header.tsx`

Untracked additions:

- `__tests__/app/homepage-premium.test.tsx`
- `tmp_design_bundle/`

## What the drift appears to be

This is a broad premium-homepage/nav redesign, not a small bug fix:

- Homepage hero moves from light green/white utility positioning to dark slate/indigo premium SaaS styling.
- Header/nav adds heavier glass/dark visual treatment.
- Trust/testimonial section removes fake-looking testimonials and replaces them with safer process cards.
- Copy shifts away from stronger legal-risk claims such as “court-ready forms” and toward “reviewable form drafts” / “official filing resources.”
- Several sections add gradients, shadows, rounded cards, and iconography.
- Test file likely belongs with this design pass but is currently untracked.

## Risk assessment

Good direction:

- Safer copy posture: less outcome/court-acceptance certainty.
- Fake testimonial removal is a trust/compliance improvement.
- More premium visual language may help conversion if it still feels credible.

Risks:

- Broad visual change touches multiple imported homepage/nav files at once.
- Needs mobile/browser visual QA before preview or production.
- Needs full test/build check before any commit of the actual redesign.
- Calendar/booking CTA remains visible; confirm this is still desired for Fresh Start before shipping.
- `tmp_design_bundle/` should not be committed blindly; inspect contents and source first.

## Recommended cleanup path

1. Keep the current production-safe root/v2 copy/test commits separate. They are already committed.
2. Do **not** deploy this dirty design tree as-is.
3. If Alexy wants to keep exploring it, create a dedicated preview branch:
   - `fs-premium-homepage-audit-2026-05-23`
   - stage only the eight tracked component changes plus `__tests__/app/homepage-premium.test.tsx` after review
   - exclude `tmp_design_bundle/` unless its files are explicitly identified as source/reference assets
4. Run before preview:
   - `npm test -- --runTestsByPath __tests__/app/homepage-premium.test.tsx __tests__/v2/v2-pages.test.tsx __tests__/app/legal-info/refund-policy.test.tsx --runInBand`
   - `npm run build`
   - mobile visual smoke for `/`, `/pricing`, `/checklist`, `/faq`
5. Default recommendation if no one owns the redesign today: leave it uncommitted and do not mix it into operational fixes.

## Current Rex action

Rex only documented and isolated the drift. No revert, no deploy, no staging of the premium redesign files.

## Resolution (2026-05-23, preview branch)

Branch `fs-premium-homepage-audit-2026-05-23`. No deploy, no push.

- **Wiring:** the dirty `components/home/*` premium sections were orphaned (nothing imported them); `/` and `/v2` render the v2 `HomeView`. Rather than repoint production `/` (which would risk shipping the redesign on merge), the premium design is now mounted at a dedicated preview route: `app/preview/premium-homepage/page.tsx` → **`/preview/premium-homepage`**. Production `/` is unchanged.
- **Nav:** added a backward-compatible `forceHomeVariant` prop to `components/navigation/header.tsx` so the dark premium shell renders on the preview route (which is not at `/`). Layout callers are unaffected.
- **Excluded from the composition:** `AttorneyEndorsementBand` ("Erin Birt" attorney quote / "Attorney-Reviewed Platform") and the duplicate pre-call card — matching the safer trust posture.
- **Legal copy fix:** the homepage test asserted `"Court-Ready Forms"` (a court-acceptance-flavored claim) and a nonexistent `"View All Legal Resources"` CTA. Tests realigned to the shipped legally-safe copy (`"Reviewable Form Drafts"`, `"Why FreshStart IL"`) and repointed at the preview composition.
- **Excluded from commit:** `tmp_design_bundle/` (design mockups/chat exports — not app source); added to `.gitignore`.
- **Checks:** targeted Jest suite (homepage-premium + v2-pages + refund-policy) = 28 passed; `npm run build` compiled and prerendered 126 routes including `/preview/premium-homepage`.
- **Open product questions for go/no-go:** the hero CTA "Get My Free Checklist" links to `/auth/signup` (intentional gate vs. mismatch?); Calendly orientation-call CTAs remain. Both are funnel decisions, left as-is.
