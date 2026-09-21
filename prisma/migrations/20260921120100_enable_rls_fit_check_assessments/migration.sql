-- Restrict Supabase Data API access to the fit-check assessment table,
-- matching the other payment tables. The server application reaches this table
-- with Prisma through the Postgres owner connection, which is not subject to
-- these policies.
BEGIN;

ALTER TABLE IF EXISTS public.fit_check_assessments ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  policy_record record;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'fit_check_assessments'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.fit_check_assessments', policy_record.policyname);
  END LOOP;

  IF to_regclass('public.fit_check_assessments') IS NOT NULL THEN
    DROP POLICY IF EXISTS service_role_full_fit_check_assessments
      ON public.fit_check_assessments;
    CREATE POLICY service_role_full_fit_check_assessments
      ON public.fit_check_assessments
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

COMMIT;
