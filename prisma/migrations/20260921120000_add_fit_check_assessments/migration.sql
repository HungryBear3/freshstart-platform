-- Additive: the bounded pre-payment fit-check assessment table.
-- Nothing that already exists is created or changed here, and an older
-- deployed Prisma Client never writes this table, so it stays inert until the
-- new application code ships.
BEGIN;

CREATE TABLE "fit_check_assessments" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "policyVersion" TEXT NOT NULL,
  "result" TEXT NOT NULL,
  "answers" JSONB NOT NULL,
  "reasons" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "fit_check_assessments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "fit_check_assessments_result_check" CHECK ("result" IN ('fit', 'review_required', 'out_of_scope')),
  CONSTRAINT "fit_check_assessments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- The only lookup the checkout gate performs: this user's newest assessment.
CREATE INDEX "fit_check_assessments_userId_createdAt_idx" ON "fit_check_assessments"("userId", "createdAt");

COMMIT;
