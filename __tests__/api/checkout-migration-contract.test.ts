import { readFileSync } from "fs";
import { join } from "path";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("one-time checkout migration contract", () => {
  it("keeps old Prisma clients compatible while backfilling Stripe event updatedAt", () => {
    const migration = read("prisma/migrations/20260729150000_harden_one_time_checkout/migration.sql");
    expect(migration).toMatch(/ADD COLUMN "updatedAt" TIMESTAMP\(3\) DEFAULT CURRENT_TIMESTAMP;/);
    expect(migration).toMatch(/UPDATE "stripe_events" SET "updatedAt" = COALESCE\("processedAt", CURRENT_TIMESTAMP\);/);
    expect(migration).toMatch(/ALTER COLUMN "updatedAt" SET NOT NULL/);
    const runbook = read("docs/ONE_TIME_CHECKOUT_RELEASE_GATE.md");
    expect(runbook).toContain("old generated Prisma Client omits that new field on inserts");
    expect(runbook).toContain("transitional database `CURRENT_TIMESTAMP` default");
  });

  it("documents migration-first activation and fail-closed rollback", () => {
    const runbook = read("docs/ONE_TIME_CHECKOUT_RELEASE_GATE.md");
    expect(runbook).toContain("not compatible with code-first deployment");
    expect(runbook).toContain("If migration fails, stop; do not deploy application code");
    expect(runbook).toContain("roll application code back to the prior exact hash");
    expect(runbook).toContain("pre-cutover Checkout Session drain");
    expect(runbook).toContain("mixed/partial state is a hard stop");
  });

  it("wraps the additive migration in a transaction and creates the reversal ledger", () => {
    const migration = read("prisma/migrations/20260729150000_harden_one_time_checkout/migration.sql");
    const schema = read("prisma/schema.prisma");
    expect(migration).toMatch(/^BEGIN;/m);
    expect(migration).toMatch(/^COMMIT;/m);
    expect(migration).toContain('CREATE TABLE "payment_reversals"');
    expect(migration).toContain('payment_reversals_stripePaymentIntentId_key');
    expect(schema).toContain("model PaymentReversal");
  });
});
