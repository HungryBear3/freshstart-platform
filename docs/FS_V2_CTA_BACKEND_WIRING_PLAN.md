# FS v2 CTA Backend Wiring Plan

> **SUPERSEDED — DO NOT EXECUTE.** This historical plan describes retired annual/Plus subscription and trial flows. The current approved implementation is `$149` one-time access for 60 days with no subscription. For any release or recovery work, use `docs/ONE_TIME_CHECKOUT_RELEASE_GATE.md`; where this document conflicts, the release gate controls.

> Production wiring tracker. The original v2 preview used five `/api/_stub/*`
> endpoints; this doc now tracks which CTAs have been wired to real or
> signup-first flows and which remain blocked.

---

## Status update — 2026-05-11 (close-blockers pass)

Operator decision from Alexy/Rex: **signup-first**, not anonymous checkout.
Unauthenticated users on a checkout CTA go to `/auth/signup` with intent
preserved; authenticated users hit the existing real Stripe checkout.

What this pass actually wired (safe-and-tested only):

| Stub | New state | Wired at | Tests |
|---|---|---|---|
| `start-trial` | **WIRED → signup-first checkout intent** | `app/v2/_components/Hero.tsx`, `Header.tsx`, `checkout-intent.ts`, `PricingCheckoutResume.tsx` | `__tests__/v2/v2-real-endpoints.test.tsx` |
| `start-filing` | **WIRED → signup-first checkout intent** | `PricingTiers.tsx`, `PricingMobileStickyCTA.tsx`, `checkout-intent.ts`, `PricingCheckoutResume.tsx` | `__tests__/v2/v2-real-endpoints.test.tsx` |
| `lead-capture` | **WIRED → `/api/checklist`** (real endpoint) | `app/v2/_components/ChecklistCapture.tsx` | `__tests__/v2/v2-real-endpoints.test.tsx` |
| `orientation-call` | **WIRED → public Calendly anchor** | `app/v2/_components/OrientationCall.tsx` | `__tests__/v2/v2-real-endpoints.test.tsx` |
| `add-on` | **TEST PREVIEW WIRED / LIVE HOLD** — launch UI shows Parenting Plan Worksheet + Refile Assistance only; checkout uses Stripe test prices in Preview/Development. Add live Production price IDs only after test checkout is verified. | `app/v2/_components/PricingAddons.tsx`, `app/api/stripe/create-checkout-session/route.ts`, `app/api/webhooks/stripe/route.ts` | `__tests__/v2/v2-real-endpoints.test.tsx` |

Start-trial / start-filing are no longer stub-routed from v2 CTAs. They now
store a checkout intent in `sessionStorage`, route unauthenticated users
through `/auth/signup`, preserve plan/source through `/auth/signin`, and
resume via the existing authenticated `/api/stripe/create-checkout-session`
route from the pricing page. No anonymous checkout path was added.

### Signup-first implementation shipped (start-trial + start-filing)

Goal: when an unauthenticated user clicks a checkout CTA on v2, they land
at `/auth/signup` with their plan intent encoded; after signup they
auto-resume the Stripe checkout flow. Authenticated users skip the
detour.

1. **Helper shipped** `app/v2/_components/checkout-intent.ts`:
   - Encodes `plan: "annual" | "one_time"` and CTA source.
   - Stores the pending checkout intent in `sessionStorage`.
   - Builds `/auth/signup?redirect=/pricing&subscribe=true&plan=<plan>&source=<source>`.
   - Maps `essential` → `one_time`; Plus/sticky/header/hero default to `annual`.

2. **Resume component shipped** `app/v2/_components/PricingCheckoutResume.tsx`:
   - Runs only when NextAuth reports `status === "authenticated"`.
   - Reads the pending checkout intent from `sessionStorage`.
   - POSTs the existing authenticated `/api/stripe/create-checkout-session` route.
   - Redirects to the returned Stripe Checkout URL.
   - Clears intent on success or automatic-start failure.

3. **Auth handoff shipped**:
   - `/auth/signup` preserves `plan` and `source` when redirecting to `/auth/signin`.
   - `/auth/signin` marks checkout resume when `subscribe=true` and `callbackUrl=/pricing`.

4. **CTA call-sites wired**:
   - `app/v2/_components/Hero.tsx` — `start-trial`, `plan: "annual"`.
   - `app/v2/_components/Header.tsx` — `start-trial`, `plan: "annual"`.
   - `app/v2/_components/PricingTiers.tsx` — `start-filing`, Essential `one_time`, others `annual`.
   - `app/v2/_components/PricingMobileStickyCTA.tsx` — `start-filing`, `plan: "annual"`.

5. **Tests shipped** in `__tests__/v2/v2-real-endpoints.test.tsx`:
   - plan mapping;
   - signup URL construction;
   - no start-trial/start-filing stub routing in v2 CTAs;
   - resume component gates on authentication and uses existing checkout-session route;
   - no live Stripe call is made by tests.

6. **Grant-length alignment shipped**: `app/v2/_components/tiers.ts`
   markets "60 days of access" for Essential, and
   `app/api/webhooks/stripe/route.ts:84-113` now grants **60 days** for
   one-time Essential payment sessions. Regression coverage lives in
   `__tests__/v2/v2-real-endpoints.test.tsx`.

7. **Add-ons**: launch buttons no longer call the stub. Preview/Development
   use test-mode Stripe prices for Parenting Plan Worksheet ($29) and Refile
   Assistance ($49). The checkout route accepts the add-on plan keys, and the
   webhook deliberately does not convert add-on payments into core subscription/
   access grants; add-on fulfillment stays operational/manual until a dedicated
   persistence model exists. Production/live price IDs remain on hold until test
   checkout is verified.

### Open questions for Alexy (signup-first specifically)

1. Should checkout intent move from URL/sessionStorage to a server-side intent token later? Current implementation uses URL + `sessionStorage`; it is simple and verified, but a server-side token may better survive email-verification or cross-device flows.
2. After successful Stripe checkout, where should the user land — current
   `success_url` is `/dashboard?success=true`. Keep that, or send to a v2
   onboarding screen?
3. Add-on packaging: ship Concierge ($499) as a separate one-time Stripe
   product, or bundle as a Plus upgrade?

---

## Inventory & Summary

### v2 CTA call-sites (verified by reading `app/v2/_components/*`)

| # | CTA button label | Component | File:line | Stub dispatched |
|---|---|---|---|---|
| 1 | "Start my free 7-day trial" | `HomepageHero` | `app/v2/_components/Hero.tsx:64-66` | `start-trial` |
| 2 | `ctaLabel` (e.g. "Start my free 7-day trial") in nav | `Header` | `app/v2/_components/Header.tsx:37-39` | `start-trial` |
| 3 | "Start my filing" / "Book intake call" (Concierge) on tier cards | `PricingTiers` | `app/v2/_components/PricingTiers.tsx:54-65` | `start-filing` |
| 4 | "Start my filing" (mobile sticky) | `PricingMobileStickyCTA` | `app/v2/_components/PricingMobileStickyCTA.tsx:56-62` | `start-filing` |
| 5 | "Send my checklist" (email capture form) | `ChecklistCapture` | `app/v2/_components/ChecklistCapture.tsx:52-58` | `lead-capture` |
| 6 | "Book a free 15-min call" | `OrientationCall` | `app/v2/_components/OrientationCall.tsx:43-45` | `orientation-call` |
| 7 | "Add →" (2 launch add-ons) | `PricingAddons` | `app/v2/_components/PricingAddons.tsx` | `add-on` |

All five stubs in `app/api/_stub/*` exist and return `{ ok: true, mock: true, ... }`. Stub endpoint constants are exported from `app/v2/_components/tiers.ts:110-116`.

### Stub → real endpoint mapping (top-level)

| Stub | Real endpoint status | Recommended real path |
|---|---|---|
| `POST /api/_stub/start-trial` | Real handler exists | `POST /api/stripe/create-checkout-session` with `{ plan: "annual" }` (subscription_data adds 7-day trial) — `app/api/stripe/create-checkout-session/route.ts:68-73` |
| `POST /api/_stub/start-filing` | Real handler exists | `POST /api/stripe/create-checkout-session` with `{ plan: "one_time" }` for Essential, `{ plan: "annual" }` for Plus — `app/api/stripe/create-checkout-session/route.ts:23-26` |
| `POST /api/_stub/lead-capture` | Real handler exists | `POST /api/checklist` — already persists subscriber + enrolls in `fs-checklist` drip + sends checklist email — `app/api/checklist/route.ts:41-82` |
| `POST /api/_stub/orientation-call` | None — needs new route | Recommend an external Calendly link (no server route) OR a new `POST /api/orientation/book` lead capture. Current legacy banner uses a hard-coded Calendly link at `components/home/IntroCallBanner.tsx:30` |
| `POST /api/_stub/add-on` | Replaced for v2 launch add-ons | v2 launch buttons use `POST /api/stripe/create-checkout-session` with `{ plan: "parenting_plan" }` or `{ plan: "refile_assistance" }`; Preview/Development envs have test-mode `PARENTING_PLAN_PRICE_ID` and `REFILE_PRICE_ID` |

---

## Common preconditions (all five stubs)

1. The existing real Stripe routes require an authenticated NextAuth user
   (`getCurrentUser(request)` returns 401 if absent — see
   `app/api/stripe/create-checkout-session/route.ts:9-13` and
   `app/api/stripe/create-portal-session/route.ts:25-28`). The v2
   homepage and pricing pages do not gate on auth, so any CTA that goes
   to checkout will currently need a signup intermission. The legacy
   subscribe button handles this by routing unauthenticated users to
   `/auth/signup?redirect=/pricing` and stashing intent in
   `sessionStorage` — see `components/stripe/subscribe-button.tsx:27-37`.
2. Stripe price IDs are read from env (`ANNUAL_PRICE_ID`,
   `ONE_TIME_PRICE_ID`) at request time —
   `app/api/stripe/create-checkout-session/route.ts:24-25`. No
   Essential/Plus/Concierge-specific price IDs exist as env vars yet
   (`FRESHSTART_SECRETS_AND_PRICES.md` only documents `ANNUAL_PRICE_ID`).
3. Stripe customer reconciliation and subscription persistence happen on
   webhook in `app/api/webhooks/stripe/route.ts:74-207` (handles
   `checkout.session.completed`, `customer.subscription.*`,
   `invoice.payment_*`). Wiring v2 CTAs through the existing checkout
   route automatically reuses this pipeline.

---

## Stub 1 — `start-trial`

### CTA(s)
- **"Start my free 7-day trial"** — `app/v2/_components/Hero.tsx:64-66` (`HomepageHero`, `onPrimary` at lines 10-22)
- Header CTA button — `app/v2/_components/Header.tsx:37-39` (`Header`, `onCta` at lines 10-17). Currently always POSTs to `start-trial` regardless of page (verify: `Header` is rendered on both `/v2` and `/v2/pricing`).

### Current stub
`POST /api/_stub/start-trial` — `app/api/_stub/start-trial/route.ts:7-23`. Logs payload, returns `{ ok: true, mock: true }`.

### Recommended real endpoint
**Reuse `POST /api/stripe/create-checkout-session`** at
`app/api/stripe/create-checkout-session/route.ts:6`. The existing handler
already builds a 7-day trial when `plan === "annual"` — see
`subscription_data.trial_period_days: 7` at
`app/api/stripe/create-checkout-session/route.ts:69-73`.

Client flow change (in the v2 components, not in this doc):
1. If unauthenticated, mirror `components/stripe/subscribe-button.tsx:27-37`
   and route the user to `/auth/signup?redirect=/v2`.
2. If authenticated, POST `{ plan: "annual" }` to
   `/api/stripe/create-checkout-session` and redirect to the returned
   `url` (`window.location.href = url`).

### Required payload
```ts
// Request
{
  plan: "annual"        // string, required; "annual" | "one_time"
}
// Response (200)
{
  sessionId: string,    // Stripe checkout session id (cs_...)
  url: string           // Stripe-hosted checkout URL — redirect target
}
// Response (401)  { error: "Unauthorized" }
// Response (500)  { error: string, details?: string }
```

### Expected side effect
Creates a Stripe Checkout session in `mode: "subscription"` with a 7-day
trial, attaches the user's Stripe customer (created on first call via
`getOrCreateStripeCustomer` — `lib/stripe/customer.ts:38-121`), stamps
`metadata.userId` and `metadata.plan` so the webhook can upsert the
`Subscription` row (`app/api/webhooks/stripe/route.ts:74-207`). Returns
`{ url }` for client-side `window.location.href = url`.

### Test-mode verification
1. Set `STRIPE_SECRET_KEY=sk_test_...`,
   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...`, and a **test-mode**
   `ANNUAL_PRICE_ID` in `.env.local`.
2. Run `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
   to get a `whsec_...` and set `STRIPE_WEBHOOK_SECRET` (procedure
   documented in `FRESHSTART_SECRETS_AND_PRICES.md:55-60`).
3. Sign in, click Hero CTA → Stripe Checkout opens in test mode → use
   `4242 4242 4242 4242` → verify `Subscription.status = "trialing"`
   and `trialEnd` ~7 days out via `GET /api/stripe/sync`
   (`app/api/stripe/sync/route.ts:12-49`).

### Production risk
- **Unauthenticated CTA**: current v2 button does not check auth.
  Wiring it straight to `/api/stripe/create-checkout-session` will
  always 401 for cold visitors; need to interpose a signup step or
  switch to anonymous-friendly Stripe Customer creation.
- **Multiple-trial abuse**: nothing today prevents a user from
  re-running checkout if their existing subscription is `incomplete` or
  `canceled`. The `getOrCreateStripeCustomer` upsert (`lib/stripe/customer.ts:94-105`)
  reuses the customer, but a second Checkout session could still spin
  up a second active subscription if the first is canceled — confirm
  Stripe's default behavior or guard server-side.
- **Trial cookie / analytics double-fire**: `analytics.track` runs
  before the fetch; on auth redirect the page unloads, the in-memory
  event queue dies, and the conversion is lost.

### Open questions for Alexy
1. **Should the v2 Hero CTA require signup before checkout, or do we
   accept anonymous Stripe Checkout (no NextAuth user, no
   `Subscription` row until webhook)?** This dictates whether
   `/api/stripe/create-checkout-session` stays auth-gated or grows an
   anonymous code path.
2. Confirm `ANNUAL_PRICE_ID` in Stripe test mode points to the **same
   product** that Hero/Header copy describes ("$299/yr · 7-day free
   trial"). The v2 Hero priceline at `Hero.tsx:50-62` is hard-coded
   copy; we have no test that asserts it matches the Stripe price.

---

## Stub 2 — `start-filing`

### CTA(s)
- **"Start my filing"** on tier cards (Essential, Plus) — `app/v2/_components/PricingTiers.tsx:54-65`, handler `onCta` at lines 10-28.
- **"Book intake call"** on the Concierge tier card — same file, label switched at `PricingTiers.tsx:61`. Still POSTs to `start-filing` with `{ tier: "concierge", price: 499 }`.
- **"Start my filing →"** in mobile sticky pricing footer — `app/v2/_components/PricingMobileStickyCTA.tsx:56-62`, handler `onClick` at lines 30-41.

### Current stub
`POST /api/_stub/start-filing` — `app/api/_stub/start-filing/route.ts:7-23`.

### Recommended real endpoint
**Reuse `POST /api/stripe/create-checkout-session`** at
`app/api/stripe/create-checkout-session/route.ts:6`. Map tier → plan:

| Tier (`tier.key`) | Stripe plan | Notes |
|---|---|---|
| `essential` | `"one_time"` (uses `ONE_TIME_PRICE_ID`) | $149 one-time, mode `payment`, 60-day access granted in webhook — `app/api/webhooks/stripe/route.ts:84-113` |
| `plus` | `"annual"` (uses `ANNUAL_PRICE_ID`) | $299/year subscription with 7-day trial baked in |
| `concierge` | Needs new price ID (no `CONCIERGE_PRICE_ID` exists). Or: switch CTA to call the orientation endpoint (see Stub 4) since the button label says "Book intake call" |

**Concierge note**: today `getOrCreateStripeCustomer` only writes
`plan: "annual"` when bootstrapping a `Subscription` row
(`lib/stripe/customer.ts:99-101`), and the webhook hard-codes
`planPrice = plan === "annual" ? 299 : 29.99` at
`app/api/webhooks/stripe/route.ts:156-157`. Concierge ($499) needs
explicit handling.

### Required payload
```ts
// Request
{ plan: "annual" | "one_time" }    // derived from tier.key client-side
// Response — same as Stub 1
{ sessionId: string, url: string }
```

### Expected side effect
- Essential (`one_time`): Stripe Checkout in `mode: "payment"` → on
  success webhook creates a `Subscription` row with `plan: "one_time"`
  and a 60-day `currentPeriodEnd` (`app/api/webhooks/stripe/route.ts:89-110`).
- Plus (`annual`): same as Stub 1 (subscription + 7-day trial).
- Concierge: undefined today (no price ID, no plan mapping).

### Test-mode verification
1. Add `ONE_TIME_PRICE_ID=price_test_...` env to `.env.local` (already
   referenced at `app/api/stripe/create-checkout-session/route.ts:25`
   but not in the `FRESHSTART_SECRETS_AND_PRICES.md` checklist).
2. Sign in, click each tier card → assert correct mode + price ID in
   the resulting Stripe Checkout session.
3. After successful test payment, confirm `Subscription.plan` is
   `"one_time"` (Essential) or `"annual"` (Plus) and
   `Payment` row appears in DB (Plus only, via
   `invoice.payment_succeeded` — `app/api/webhooks/stripe/route.ts:256-279`).

### Production risk
- **Tier → price mapping lives client-side** (v2 components pass
  `priceNumber` only). Server has no idea which tier was clicked, so
  the wiring has to translate `tier.key` → `plan` on the client. Any
  drift between `app/v2/_components/tiers.ts:28-89` price strings and
  the Stripe price IDs in env will be silent.
- **Concierge has no Stripe path**. Mobile sticky CTA assumes Plus
  (`tier: "plus"` in the analytics event — `PricingMobileStickyCTA.tsx:31`),
  so it's safe for now, but the tier card needs a decision before
  promotion.
- **Duplicate-charge on re-submit**: the button has no disabled state
  during the fetch (`PricingTiers.tsx:54-65`); a fast double-click can
  open two Stripe Checkout tabs. Existing `SubscribeButton` solves this
  with a `loading` flag (`components/stripe/subscribe-button.tsx:39, 96-103`).

### Open questions for Alexy
1. **Is Concierge sold via Stripe at all, or is it a booking-only intake
   call?** If booking-only, route the Concierge CTA to the orientation
   endpoint (Stub 4), not Stripe.
2. **Do we want a `CONCIERGE_PRICE_ID` and let it flow through the same
   checkout route**, or split Concierge into its own path?
3. Resolved: Essential markets 60 days of access and the one-time payment
   webhook now grants 60 days (`app/api/webhooks/stripe/route.ts:83-113`).

---

## Stub 3 — `lead-capture`

### CTA
- **"Send my checklist"** email capture form on homepage — `app/v2/_components/ChecklistCapture.tsx:52-58`, submit handler `onSubmit` at lines 11-26.

### Current stub
`POST /api/_stub/lead-capture` — `app/api/_stub/lead-capture/route.ts:8-28`. Also exposes a GET that returns the same mock.

### Recommended real endpoint
**Reuse `POST /api/checklist`** at `app/api/checklist/route.ts:41-82`.
This endpoint already does everything the v2 stub note implies it
should ("CRM lead create + transactional checklist email"):

- Rate limits 3 req/hr per client (`app/api/checklist/route.ts:42-50`).
- Validates email shape (`app/api/checklist/route.ts:60-62`).
- Sends checklist email via Resend (`sendChecklistEmail` —
  `lib/email.ts:71-79`).
- Persists `ChecklistSubscriber` row (upsert) and enrolls in the
  `fs-checklist` 5-step drip sequence on Vercel `after()` —
  `app/api/checklist/route.ts:10-39`, sequence defined at
  `lib/drip.ts:3-5`, cron handler at `app/api/drip/send/route.ts:50-118`.

The "CRM" is the local `ChecklistSubscriber` table + the drip pipeline.
No external CRM (HubSpot/Salesforce/etc.) is integrated today.

### Required payload
```ts
// Request
{ email: string }                     // required; trimmed + lowercased server-side
// Response (200)  { success: true }
// Response (400)  { error: "Please enter a valid email address." | "Invalid request body." }
// Response (429)  { error: "Too many requests. Please try again in an hour." }
// Response (500)  { error: "Failed to send checklist. Please try again." }
```

Note: the v2 stub call sends `{ email, source: "homepage_checklist" }`
(`ChecklistCapture.tsx:20`). The real `/api/checklist` route ignores
`source` and instead derives it from the `referer` header
(`app/api/checklist/route.ts:71`). Either accept the extra field
(harmless, unused) or extend the route to honor a client-supplied
`source` for the v2 page.

### Expected side effect
Resend transactional email to the entered address with the Illinois
divorce checklist (subject: "Your Illinois Divorce Checklist —
FreshStart IL" — `lib/email.ts:75`). Plus a 5-step Resend drip over 30
days (delays `[0, 3, 7, 14, 30]` — `lib/drip.ts:4`), gated by the cron
endpoint at `app/api/drip/send/route.ts:50-118` (auth via
`CRON_SECRET` bearer token).

### Test-mode verification
1. Without `RESEND_API_KEY`, the email layer falls back to console log
   (`lib/email.ts:6-14`) — easy local smoke.
2. With a Resend sandbox key, submit the form → see the email arrive
   at a `+test@` alias.
3. Verify a `ChecklistSubscriber` row was created
   (`prisma/schema.prisma` model is on the codebase per graph; cross-check
   via `npx prisma studio`).
4. Verify 5 `DripEmail` rows scheduled with stepped `scheduledFor`
   timestamps. Manually invoke
   `curl -H "Authorization: Bearer $CRON_SECRET" -X POST localhost:3000/api/drip/send`
   to fire the next due step.

### Production risk
- **Email-only signups bypass NextAuth**. Subscriber rows are
  fingerprinted by email — a malicious user can pollute the drip
  queue. The rate limiter (3/hr per IP) helps but is not bulletproof.
- **`after()` work can be killed by Vercel**: the route note at
  `app/api/checklist/route.ts:68-72` already calls this out. If the
  function dies before persistence, the user gets the email but the
  drip never enrolls.
- **No double-opt-in**: GDPR/CAN-SPAM unsubscribe is referenced in copy
  ("Unsubscribe anytime" — `ChecklistCapture.tsx:60`) but there is no
  unsubscribe endpoint or token discovery in this audit. Verify
  `lib/email.ts` adds a List-Unsubscribe header in production.

### Open questions for Alexy
1. **Is `ChecklistSubscriber` + the `fs-checklist` drip the CRM, or do
   you want this dual-written to an external CRM (HubSpot, Notion,
   Airtable) before promotion?** If yes, that's a new lib + extra
   `after()` call. Nothing today writes externally.
2. The v2 client sends `source: "homepage_checklist"`; do we want
   `/api/checklist` to honor that explicitly (and store it on the
   subscriber row) so we can attribute v2 vs. legacy traffic?

---

## Stub 4 — `orientation-call`

### CTA
- **"Book a free 15-min call"** — `app/v2/_components/OrientationCall.tsx:43-45`, handler `onClick` at lines 19-31. Used on both `/v2` and `/v2/pricing` via the `page` prop.

### Current stub
`POST /api/_stub/orientation-call` — `app/api/_stub/orientation-call/route.ts:7-23`.

### Recommended real endpoint
**No real endpoint exists.** Two viable paths:

**Option A (lowest risk): swap the button for an external link.**
The legacy `components/home/IntroCallBanner.tsx:30` already uses a
hard-coded Calendly URL (`https://calendly.com/il-support/30min`).
Replicate that pattern in `OrientationCall`: turn the `<button>` into an
`<a target="_blank" rel="noopener noreferrer">` pointing at the
Calendly URL. No server, no secrets. Analytics still fires on click.

**Option B: new `POST /api/orientation/book` endpoint** that:
- Accepts `{ email?: string, name?: string, page: "homepage" | "pricing" }`
- Persists a `OrientationLead` row (new Prisma model) — equivalent to
  the `ChecklistSubscriber` pattern at `app/api/checklist/route.ts:10-39`.
- Optionally posts to Calendly's API to create a single-use scheduling
  link OR returns the static Calendly URL for the client to redirect.
- Sends a confirmation email via Resend.

Option A is one component edit. Option B requires schema + new route +
Calendly API key. Recommend Option A for the v1 wiring; revisit B if
attribution data becomes important.

### Required payload (Option B)
```ts
// Request
{
  email?: string,
  name?: string,
  page: "homepage" | "pricing"
}
// Response (200)
{
  bookingUrl: string    // Calendly URL (static or single-use)
}
```

### Expected side effect
- **Option A**: opens Calendly in a new tab. Booking handled entirely
  outside our app. We get the lead via Calendly's own email
  notifications.
- **Option B**: `OrientationLead` row + confirmation email +
  (optionally) Calendly single-use link. Our app owns the lead record.

### Test-mode verification
- **Option A**: click the button in any environment — opens the real
  Calendly. Use a Calendly sandbox / staff calendar to avoid customer
  noise.
- **Option B**: hit the route with a fake email, assert a row in the
  new `OrientationLead` table, assert email delivered (or logged when
  `RESEND_API_KEY` is absent — `lib/email.ts:7-14`).

### Production risk
- **Option A**: Calendly URL is hard-coded — moving the calendar or
  changing the slug requires a code deploy. Mitigation: store in env.
- **Option A**: pop-up blockers on mobile sometimes nuke
  `target="_blank"` from non-anchor elements; keeping it a real `<a>`
  avoids that.
- **Option B**: doubles the surface area (DB migration + API key) for
  what is effectively a static external link.

### Open questions for Alexy
1. **Is `calendly.com/il-support/30min` (per `IntroCallBanner.tsx:30`)
   the canonical orientation calendar, or has that moved?** If it
   moved, what's the new URL?
2. **Are we OK keeping Calendly as the booking provider, or is a Cal.com
   migration in flight?** No Cal.com references exist in the
   codebase today.
3. **Do we need an `OrientationLead` row in our DB** (i.e., attribution
   matters more than the bounce risk of a new endpoint), or is "lead
   lands in Calendly inbox" enough?

---

## Stub 5 — `add-on`

### CTA
- **"Add →"** on each of 2 launch add-ons (Parenting Plan Worksheet $29, Refile Assistance $49) — `app/v2/_components/PricingAddons.tsx`. Prenup and Mediation Referral are intentionally held for later.

### Current stub
`POST /api/_stub/add-on` — `app/api/_stub/add-on/route.ts:7-23`.

### Recommended real endpoint
**No real endpoint exists.** Recommended path: generalize the existing
checkout route to accept an arbitrary price ID + cart, rather than the
fixed `"annual" | "one_time"` mapping at
`app/api/stripe/create-checkout-session/route.ts:23-26`.

Proposed shape:

```
POST /api/stripe/create-checkout-session-addon
Body: { items: Array<{ priceId: string, quantity?: number }> }
Returns: { sessionId, url }
```

Or: add an optional `addons: string[]` array to the existing
`/api/stripe/create-checkout-session` payload that is appended as
additional Stripe `line_items`.

Either way: each launch add-on needs its own Stripe Price ID env var
(`PARENTING_PLAN_PRICE_ID`, `REFILE_PRICE_ID`). Prenup/Mediation IDs should wait until those products return to launch scope.

### Required payload
```ts
// Request
{
  addonKey: "parenting_plan" | "refile",
  // OR: a richer cart shape if multi-add-on
  items: Array<{ priceId: string, quantity: number }>
}
// Response — same as Stub 1/2
{ sessionId: string, url: string }
```

The v2 client currently sends `{ addon: <name>, price: <"$79"> }`
(`PricingAddons.tsx:42-44`), which is a display-string payload not
safe to trust server-side. The real route must map a stable key →
server-side price ID.

### Expected side effect
Stripe Checkout in `mode: "payment"` for one-shot add-ons, with the
appropriate price ID(s). On success the webhook handles
`checkout.session.completed` for `session.mode === "payment"` at
`app/api/webhooks/stripe/route.ts:84-113`, which currently writes a
`Subscription` row with a 60-day end date. That logic was written for
the Essential one-time plan and will need branching to record add-ons
separately (perhaps a new `AddOnPurchase` table).

### Test-mode verification
1. Create test-mode Stripe Products for each add-on.
2. Add the two launch `*_PRICE_ID` env vars.
3. Sign in, click "Add" on one item → Stripe Checkout in
   `mode: payment` with the right line item → pay with `4242…` →
   verify the resulting DB row (`Payment`? new `AddOnPurchase`?) is
   created correctly.
4. Edge case: user already on a Plus subscription buys the Parenting
   Plan worksheet (which is bundled into Plus per
   `PricingAddons.tsx:18`). Confirm we either disable the button
   server-side or surface a "Already included" message.

### Production risk
- **Untrusted price input**: the current stub call accepts the price
  as a string from the client. The real route must reject any client-
  supplied price and look up the Stripe Price ID from a server-side
  whitelist by add-on key.
- **`session.mode === "payment"` is currently overloaded**: it grants
  60 days of access regardless of the line items
  (`app/api/webhooks/stripe/route.ts:84-113`). Buying a $29 worksheet
  would incorrectly upgrade the user to 60-day platform access. This
  is a real bug magnet — branch on `metadata.kind: "addon"` before the
  upsert.
- **Plus customers get Parenting Plan worksheet for free** per copy
  (`PricingAddons.tsx:18`). The UX should hide or disable that button
  for active Plus subscribers; the server should refund or 409 if the
  request comes through anyway.

### Open questions for Alexy
1. **Do add-ons exist as Stripe Products today, or are these aspirational?**
   No price IDs are documented in `FRESHSTART_SECRETS_AND_PRICES.md`
   for them. The two launch IDs need to be created in Stripe.
2. **Are add-ons stand-alone one-shot purchases**, or do they require
   an active Essential/Plus subscription first? The current copy
   doesn't make it explicit; the wiring depends on the answer
   (gate server-side vs. allow anonymous purchase).
3. **One add-on at a time, or cart-style?** The current UI is
   single-click, single-add (one Stripe Checkout per click). Cart-style
   would change both the v2 component and the new endpoint shape.
4. **What do we do for Parenting-plan-worksheet buyers who later
   upgrade to Plus?** Auto-credit, refund, or shrug?

---

## Cross-cutting items (apply to all five stubs)

1. **Auth wall vs. anonymous CTAs**: the existing real Stripe routes
   (`/api/stripe/create-checkout-session`, `/api/stripe/create-portal-session`)
   require a logged-in NextAuth user. v2 CTAs do not gate on auth. The
   single biggest product decision blocking all stubs except
   `lead-capture` is: **does the v2 flow require signup-first, or do we
   want an anonymous Stripe Checkout path?** This is the top open
   question (see "Top blocker" in the summary call-out).
2. **Analytics dispatch is fire-and-forget pre-redirect**: every v2
   CTA calls `analytics.track(...)` synchronously, then awaits a fetch.
   `analytics.track` only writes to console + `sessionStorage` today
   (`app/v2/_components/analytics.ts`, per `_DEFERRED_ITEMS.md:51-70`).
   When the real CTAs redirect to Stripe, the in-memory event queue
   dies. Wire the analytics destination first or use `navigator.sendBeacon`.
3. **Idempotency**: the webhook is idempotent (`app/api/webhooks/stripe/route.ts:28-40`).
   The client fetches are not — there is no per-button-click guard
   against duplicate-submit. Add a `loading` state per CTA before
   promotion (model: `components/stripe/subscribe-button.tsx:39, 96-103`).
4. **Stub deletion**: once each `/api/_stub/*` route is replaced,
   delete the corresponding directory under `app/api/_stub/` and the
   constants block at `app/v2/_components/tiers.ts:110-116`. The v2
   regression test at `__tests__/v2/v2-stubs.test.ts` will need to
   be retired or repointed.

---

## Top blocker for Alexy

**Decide whether the v2 marketing CTAs route through signup-first (NextAuth user → `/api/stripe/create-checkout-session`) or support an anonymous-checkout path.** This single decision shapes Stubs 1, 2, 4, and 5 and determines whether we reuse the existing real Stripe handler as-is or grow an anonymous variant.
