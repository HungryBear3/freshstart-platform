-- Restrict Supabase Data API access to the payment-hardening tables.
-- The server application uses Prisma through the Postgres owner connection.
BEGIN;

ALTER TABLE IF EXISTS public.checkout_obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.checkout_recovery_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payment_reversals ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  policy_record record;
BEGIN
  FOR policy_record IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY (ARRAY['checkout_obligations', 'checkout_recovery_audits', 'payment_reversals']::name[])
  LOOP
    EXECUTE format(
      'DROP POLICY %I ON public.%I',
      policy_record.policyname,
      policy_record.tablename
    );
  END LOOP;

  IF to_regclass('public.checkout_obligations') IS NOT NULL THEN
    DROP POLICY IF EXISTS service_role_full_checkout_obligations
      ON public.checkout_obligations;
    CREATE POLICY service_role_full_checkout_obligations
      ON public.checkout_obligations
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  IF to_regclass('public.checkout_recovery_audits') IS NOT NULL THEN
    DROP POLICY IF EXISTS service_role_full_checkout_recovery_audits
      ON public.checkout_recovery_audits;
    CREATE POLICY service_role_full_checkout_recovery_audits
      ON public.checkout_recovery_audits
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  IF to_regclass('public.payment_reversals') IS NOT NULL THEN
    DROP POLICY IF EXISTS service_role_full_payment_reversals
      ON public.payment_reversals;
    CREATE POLICY service_role_full_payment_reversals
      ON public.payment_reversals
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

COMMIT;
