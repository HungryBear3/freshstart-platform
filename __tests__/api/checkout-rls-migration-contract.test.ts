import { readFileSync } from "fs";
import { join } from "path";

const migrationPath =
  "prisma/migrations/20260804201000_enable_rls_checkout_security_tables/migration.sql";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const withoutComments = (sql: string) => sql.replace(/--.*$/gm, "");

const tables = [
  "checkout_obligations",
  "checkout_recovery_audits",
  "payment_reversals",
] as const;

describe("checkout security tables RLS migration contract", () => {
  const migration = withoutComments(read(migrationPath));

  it("atomically enables ordinary RLS on every payment-hardening table", () => {
    expect(migration.trim()).toMatch(/^BEGIN;/);
    expect(migration.trim()).toMatch(/COMMIT;$/);
    expect(migration).not.toMatch(/FORCE ROW LEVEL SECURITY/i);

    for (const table of tables) {
      expect(migration).toContain(
        `ALTER TABLE IF EXISTS public.${table} ENABLE ROW LEVEL SECURITY;`,
      );
    }
  });

  it("removes every pre-existing policy from the three tables before replacement", () => {
    expect(migration).toContain("FROM pg_policies");
    expect(migration).toContain("schemaname = 'public'");
    expect(migration).toContain(
      "tablename = ANY (ARRAY['checkout_obligations', 'checkout_recovery_audits', 'payment_reversals']::name[])",
    );
    expect(migration).toMatch(
      /DROP POLICY %I ON public\.%I[\s\S]*policy_record\.policyname[\s\S]*policy_record\.tablename/,
    );
    expect(migration.indexOf("DROP POLICY %I")).toBeLessThan(
      migration.indexOf("CREATE POLICY service_role_full_checkout_obligations"),
    );
  });

  it("creates one explicit service-role-only policy per table", () => {
    const createPolicyStatements = migration.match(/CREATE POLICY[\s\S]*?WITH CHECK \(true\);/g) ?? [];
    expect(createPolicyStatements).toHaveLength(tables.length);

    for (const table of tables) {
      const policy = createPolicyStatements.find((statement) =>
        statement.includes(`ON public.${table}`),
      );
      expect(policy).toBeDefined();
      expect(policy).toMatch(/FOR ALL\s+TO service_role\s+USING \(true\)\s+WITH CHECK \(true\);/);
      expect(policy).not.toMatch(/\bTO\s+(?:PUBLIC|anon|authenticated)\b/i);
    }
  });
});
