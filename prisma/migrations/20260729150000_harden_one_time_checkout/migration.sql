-- Additive, local-reviewed payment hardening. Apply separately before code activation.
BEGIN;
ALTER TABLE "subscriptions" ADD COLUMN "providerEventCreatedAt" TIMESTAMP(3);
ALTER TABLE "subscriptions" ADD COLUMN "grantingObligationId" TEXT;
CREATE UNIQUE INDEX "subscriptions_grantingObligationId_key" ON "subscriptions"("grantingObligationId");

ALTER TABLE "payments"
  ADD COLUMN "stripeCheckoutSessionId" TEXT,
  ADD COLUMN "stripePriceId" TEXT;
CREATE UNIQUE INDEX "payments_stripeCheckoutSessionId_key" ON "payments"("stripeCheckoutSessionId");

CREATE TABLE "checkout_obligations" (
  "id" TEXT NOT NULL,
  "contractKey" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "plan" TEXT NOT NULL,
  "cycle" INTEGER NOT NULL DEFAULT 1,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "stripeCustomerId" TEXT,
  "stripeSessionId" TEXT,
  "stripePaymentIntentId" TEXT,
  "stripePriceId" TEXT NOT NULL,
  "expectedAmountCents" INTEGER NOT NULL,
  "expectedCurrency" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "attempt" INTEGER NOT NULL DEFAULT 1,
  "settledAmountCents" INTEGER,
  "settledCurrency" TEXT,
  "settledAt" TIMESTAMP(3),
  "conversionTrackedAt" TIMESTAMP(3),
  "conversionClaimToken" TEXT,
  "conversionLeaseExpiresAt" TIMESTAMP(3),
  "failureReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "checkout_obligations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "checkout_obligations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "checkout_obligations_contractKey_key" ON "checkout_obligations"("contractKey");
CREATE UNIQUE INDEX "checkout_obligations_stripeSessionId_key" ON "checkout_obligations"("stripeSessionId");
CREATE UNIQUE INDEX "checkout_obligations_stripePaymentIntentId_key" ON "checkout_obligations"("stripePaymentIntentId");
CREATE INDEX "checkout_obligations_userId_status_idx" ON "checkout_obligations"("userId", "status");

CREATE TABLE "payment_reversals" (
  "id" TEXT NOT NULL,
  "stripePaymentIntentId" TEXT NOT NULL,
  "stripeEventId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "amountReversedCents" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "payment_reversals_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "payment_reversals_stripePaymentIntentId_key" ON "payment_reversals"("stripePaymentIntentId");

CREATE TABLE "checkout_recovery_audits" (
  "id" TEXT NOT NULL,
  "checkoutObligationId" TEXT NOT NULL,
  "stripeSessionId" TEXT NOT NULL,
  "adminUserId" TEXT NOT NULL,
  "subjectUserId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "stripeMode" TEXT NOT NULL,
  "stripePaymentStatus" TEXT NOT NULL,
  "stripeCustomerId" TEXT,
  "stripePaymentIntentId" TEXT,
  "stripeSubscriptionId" TEXT,
  "stripePriceId" TEXT NOT NULL,
  "stripeAmountCents" INTEGER NOT NULL,
  "stripeCurrency" TEXT NOT NULL,
  "stripeQuantity" INTEGER NOT NULL,
  "providerVerifiedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "checkout_recovery_audits_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "checkout_recovery_audits_checkoutObligationId_fkey" FOREIGN KEY ("checkoutObligationId") REFERENCES "checkout_obligations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "checkout_recovery_audits_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "checkout_recovery_audits_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "checkout_recovery_audits_checkoutObligationId_action_key" ON "checkout_recovery_audits"("checkoutObligationId", "action");
CREATE INDEX "checkout_recovery_audits_checkoutObligationId_createdAt_idx" ON "checkout_recovery_audits"("checkoutObligationId", "createdAt");

ALTER TABLE "stripe_events"
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PROCESSING',
ADD COLUMN "claimToken" TEXT,
ADD COLUMN "leaseExpiresAt" TIMESTAMP(3),
ADD COLUMN "lastError" TEXT,
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3);

UPDATE "stripe_events" SET "updatedAt" = COALESCE("processedAt", CURRENT_TIMESTAMP);
ALTER TABLE "stripe_events" ALTER COLUMN "updatedAt" SET NOT NULL;
ALTER TABLE "stripe_events"
  ALTER COLUMN "processedAt" DROP DEFAULT,
  ALTER COLUMN "processedAt" DROP NOT NULL;

UPDATE "stripe_events" SET "status" = 'COMPLETED', "processedAt" = COALESCE("processedAt", CURRENT_TIMESTAMP);
COMMIT;