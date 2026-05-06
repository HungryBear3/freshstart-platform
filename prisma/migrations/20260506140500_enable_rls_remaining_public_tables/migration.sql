-- Enable RLS on public tables created after the original RLS pass.
-- This addresses Supabase security warnings:
-- - rls_disabled_in_public
-- - sensitive_columns_exposed
--
-- The Next.js app uses Prisma through the Postgres connection string/server APIs.
-- Direct Supabase REST access should not be able to read/write these tables.

ALTER TABLE IF EXISTS public._prisma_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.case_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.case_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.marketing_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.stripe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_badges ENABLE ROW LEVEL SECURITY;

-- Allow Supabase service role direct API access where needed by operators/backend tools.
-- The regular Prisma/Postgres owner connection continues to work because table owners
-- bypass RLS unless FORCE ROW LEVEL SECURITY is enabled.
DO $$
BEGIN
  IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
    DROP POLICY IF EXISTS service_role_full__prisma_migrations ON public._prisma_migrations;
    CREATE POLICY service_role_full__prisma_migrations
      ON public._prisma_migrations
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  IF to_regclass('public.case_collaborators') IS NOT NULL THEN
    DROP POLICY IF EXISTS service_role_full_case_collaborators ON public.case_collaborators;
    CREATE POLICY service_role_full_case_collaborators
      ON public.case_collaborators
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);

    DROP POLICY IF EXISTS auth_own_case_collaborators ON public.case_collaborators;
    CREATE POLICY auth_own_case_collaborators
      ON public.case_collaborators
      FOR ALL
      TO authenticated
      USING ((auth.uid())::text = "userId")
      WITH CHECK ((auth.uid())::text = "userId");
  END IF;

  IF to_regclass('public.case_invitations') IS NOT NULL THEN
    DROP POLICY IF EXISTS service_role_full_case_invitations ON public.case_invitations;
    CREATE POLICY service_role_full_case_invitations
      ON public.case_invitations
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  IF to_regclass('public.marketing_links') IS NOT NULL THEN
    DROP POLICY IF EXISTS service_role_full_marketing_links ON public.marketing_links;
    CREATE POLICY service_role_full_marketing_links
      ON public.marketing_links
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  IF to_regclass('public.stripe_events') IS NOT NULL THEN
    DROP POLICY IF EXISTS service_role_full_stripe_events ON public.stripe_events;
    CREATE POLICY service_role_full_stripe_events
      ON public.stripe_events
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  IF to_regclass('public.user_badges') IS NOT NULL THEN
    DROP POLICY IF EXISTS service_role_full_user_badges ON public.user_badges;
    CREATE POLICY service_role_full_user_badges
      ON public.user_badges
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);

    DROP POLICY IF EXISTS auth_own_user_badges ON public.user_badges;
    CREATE POLICY auth_own_user_badges
      ON public.user_badges
      FOR SELECT
      TO authenticated
      USING ((auth.uid())::text = "userId");
  END IF;
END $$;
