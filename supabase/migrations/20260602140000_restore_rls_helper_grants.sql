-- Fix: revoking EXECUTE from authenticated broke RLS policies that call
-- is_super_admin(), job_scope_allows(), etc. Users could not SELECT their
-- profile → app sent them to /complete-profile even when already approved.
--
-- RPC exposure: anon still has no EXECUTE. authenticated may EXECUTE helpers
-- used inside policies (not callable via PostgREST without grant — actually
-- PostgREST can still call if granted; helpers are only used in RLS for most).
-- Admin RPCs remain explicitly granted in 20260602130000 migration.

-- Own profile read/update (all roles including super_admin)
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- RLS helper functions — authenticated needs EXECUTE for policy evaluation
DO $$
DECLARE
  sig text;
  sigs text[] := ARRAY[
    'public.is_signup_user()',
    'public.is_super_admin()',
    'public.is_job_admin()',
    'public.is_platform_staff()',
    'public.is_app_admin()',
    'public.is_admin()',
    'public.is_engineer()',
    'public.can_edit_master_data()',
    'public.auth_user_job_id()',
    'public.job_scope_allows(bigint)',
    'public.inspector_scope_includes_booker(uuid)'
  ];
BEGIN
  FOREACH sig IN ARRAY sigs
  LOOP
    IF to_regprocedure(sig) IS NOT NULL THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', sig);
    END IF;
  END LOOP;
END $$;
