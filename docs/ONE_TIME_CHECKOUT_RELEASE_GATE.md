# One-Time Checkout Hardening Release Gate

This change is **not compatible with code-first deployment**. The application reads `checkout_obligations` and new `stripe_events`, `payments`, and `subscriptions` columns immediately.

## Approval boundary

Production migration and deployment require Alexy's explicit approval. Do not run these steps from tests, previews, or local review.

## Phase 0 — exact artifact and environment

1. Start from a clean release worktree at the reviewed commit hash.
2. Confirm the target Vercel project and production database explicitly; do not infer them from the current shell.
3. Back up the production database using the project's established provider workflow.
4. Confirm the migration file exists:
   `prisma/migrations/20260729150000_harden_one_time_checkout/migration.sql`.
5. Run local gates from the exact commit: Prisma validation/generation, focused tests, full tests, and production build.
6. Before applying anything, run `npx prisma migrate status` and a read-only catalog check:
   - if the migration is unapplied, none of its marker objects may already exist (`checkout_obligations`, `payment_reversals`, `subscriptions.grantingObligationId`, or `stripe_events.status`);
   - if Prisma records it as applied, every object listed in Phase 1 must exist and the migration must not be rerun;
   - any mixed/partial state is a hard stop requiring a separately reviewed recovery plan.

## Phase 1 — additive database migration only

1. Keep the currently deployed application version active.
2. Apply migrations to the explicitly confirmed production database with the established migration runner:
   `npx prisma migrate deploy`.
3. Require a zero exit code. If migration fails, stop; do not deploy application code.
4. Verify `npx prisma migrate status` reports no pending migration.
5. Verify read-only database metadata shows:
   - tables `checkout_obligations`, `payment_reversals`, and `checkout_recovery_audits`;
   - `checkout_obligations.cycle`, `conversionTrackedAt`, `conversionClaimToken`, and `conversionLeaseExpiresAt`;
   - `stripe_events.status`, `claimToken`, `leaseExpiresAt`, `lastError`, `createdAt`, `updatedAt`;
   - `payments.stripeCheckoutSessionId` and `stripePriceId`;
   - `subscriptions.providerEventCreatedAt` and unique `grantingObligationId`;
   - expected unique indexes on obligation contract/session/payment-intent, reversal payment-intent, and payment session.
6. Verify existing `stripe_events` rows are `COMPLETED`, retain `processedAt`, and have non-null `updatedAt`.

The migration is additive and the old application does not depend on the new fields, so the old code remains the rollback target during this phase.

The migration is wrapped in a PostgreSQL transaction. On failure, verify both Prisma migration status and the catalog again. Never resolve or rerun a failed migration until the catalog proves whether PostgreSQL rolled it back.

## Phase 1.5 — pre-cutover Checkout Session drain

1. With read-only Stripe access, inventory **all** Checkout Sessions created by the old deployment that remain `open` at the proposed activation time, including one-time `payment` Sessions and legacy `subscription` Sessions. Record mode, session ID, authenticated user metadata, creation time, and expiration time without copying payment details.
2. Prefer delaying activation until the inventory is empty through normal completion or expiration under the old application.
3. If activation must proceed with open sessions, assign a named support/reconciliation owner before deployment. The new webhook creates a `REVIEW_REQUIRED` obligation for settled pre-cutover one-time or legacy subscription Sessions with sufficient user/session evidence; the dashboard then tells the customer not to pay again.
4. After activation, reconcile every inventoried session to exactly one of: expired, paid with active access, or paid with an actionable `REVIEW_REQUIRED` obligation. Any missing state is a release incident.

## Phase 2 — application activation

Only after every Phase 1 and Phase 1.5 verification passes:

1. Deploy the exact reviewed commit hash.
2. Smoke-test public pages and authenticated read-only dashboard access.
3. Verify webhook endpoint health without synthesizing a payment.
4. Perform any payment smoke test only with separate explicit approval and a documented recovery owner.
5. Monitor webhook failures, `REVIEW_REQUIRED` obligations, and checkout errors.

## Fail-closed rollback

- Before code activation: keep the old application deployed; do not drop additive fields.
- After code activation: roll application code back to the prior exact hash if errors occur. Leave additive schema in place until a separately reviewed cleanup migration exists.
- Never manually mark an obligation `PAID`, grant access, refund, or alter a customer record as part of rollback without explicit customer/payment approval.

## Operator procedure — paid legacy Checkout recovery

This operation is for post-cutover `REVIEW_REQUIRED` obligations created from paid pre-cutover `payment` or `subscription` Checkout Sessions. It performs Stripe reads only. It does **not** create/refund a payment, mutate a Stripe customer, or change a Stripe subscription.

1. Sign in as an administrator. Put the current Auth.js session cookie into a shell variable without saving it in shell history:
   ```sh
   read -rs AUTHJS_COOKIE
   ```
2. List the review queue from the deployed application (replace the host explicitly):
   ```sh
   curl --fail-with-body -sS \
     -H "Cookie: __Secure-authjs.session-token=$AUTHJS_COOKIE" \
     https://www.freshstart-il.com/api/admin/checkout-recovery
   ```
3. For one obligation, independently inspect its user ID, Checkout Session ID, expected/settled integer cents, lowercase currency, Price ID, customer ID, mode, and reason. Do not proceed if any evidence is missing, if a reversal exists, or if another active purchase/subscription could be overwritten. For a legacy `subscription`-mode Session, the endpoint also reads the exact Stripe Subscription, original paid `subscription_create` invoice, Invoice Payment, PaymentIntent, and unreversed charge. Approval fails unless all evidence matches and the provider Subscription is already `canceled`; if it remains billable, stop and obtain separate explicit approval for any provider-side cancellation before retrying recovery.
4. Resolve exactly one obligation. Echo all four contract fields back deliberately; the endpoint retrieves the Checkout Session and line items read-only and rejects any user/session/customer/amount/currency/Price/quantity/payment-status mismatch.

   Approve a verified payment for its original, non-extended 60-day access window:
   ```sh
   curl --fail-with-body -sS -X POST \
     -H "Cookie: __Secure-authjs.session-token=$AUTHJS_COOKIE" \
     -H 'Content-Type: application/json' \
     https://www.freshstart-il.com/api/admin/checkout-recovery \
     --data '{"obligationId":"OBLIGATION_ID","action":"APPROVE","reason":"Verified paid pre-cutover Checkout Session","expectedUserId":"USER_ID","expectedAmountCents":14900,"expectedCurrency":"usd","expectedPriceId":"PRICE_ID"}'
   ```

   Or explicitly close it without access (for example, a proven duplicate already fulfilled by another exact grant). If the review was opened by a partial refund, `REJECT` cancels only the one-time access tied to that exact obligation and preserves the payment as `partially_refunded`:
   ```sh
   curl --fail-with-body -sS -X POST \
     -H "Cookie: __Secure-authjs.session-token=$AUTHJS_COOKIE" \
     -H 'Content-Type: application/json' \
     https://www.freshstart-il.com/api/admin/checkout-recovery \
     --data '{"obligationId":"OBLIGATION_ID","action":"REJECT","reason":"Documented reason with ticket/reference","expectedUserId":"USER_ID","expectedAmountCents":14900,"expectedCurrency":"usd","expectedPriceId":"PRICE_ID"}'
   ```
5. Require HTTP 200. A 400/409/500 is a hard stop; do not edit database rows directly and do not retry with altered evidence merely to make it pass.
6. Read the closed obligation and append-only audit evidence:
   ```sh
   curl --fail-with-body -sS \
     -H "Cookie: __Secure-authjs.session-token=$AUTHJS_COOKIE" \
     'https://www.freshstart-il.com/api/admin/checkout-recovery?obligationId=OBLIGATION_ID'
   ```
   Confirm the final obligation status, admin ID, subject user ID, action, reason, provider verification timestamp, and exact Stripe evidence. Repeating the resolution cannot create a second grant because only `REVIEW_REQUIRED` can transition.
