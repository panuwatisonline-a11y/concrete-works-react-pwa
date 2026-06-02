-- Security Advisor warnings: anon/authenticated SECURITY DEFINER RPC exposure,
-- function_search_path_mutable, public bucket listing (request-images).

-- ---------------------------------------------------------------------------
-- 1) Revoke anon (and PUBLIC) EXECUTE on helper/RPC functions.
--    RLS policies still call SECURITY DEFINER helpers without RPC grant.
--    App RPC: admin_* , set_image_upload_provider only (authenticated).
-- ---------------------------------------------------------------------------

-- RLS / trigger helpers — not callable via PostgREST
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
    'public.inspector_scope_includes_booker(uuid)',
    'public.handle_new_user_profile()',
    'public.guard_super_admin_role_assignment()',
    'public.sync_auth_user_avatar_to_profile()'
  ];
BEGIN
  FOREACH sig IN ARRAY sigs
  LOOP
    IF to_regprocedure(sig) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', sig);
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', sig);
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', sig);
    END IF;
  END LOOP;
END $$;

-- Push claim — service_role only (edge function)
REVOKE ALL ON FUNCTION public.claim_push_notify_event(uuid, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_push_notify_event(uuid, integer, integer) FROM anon;
REVOKE ALL ON FUNCTION public.claim_push_notify_event(uuid, integer, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_push_notify_event(uuid, integer, integer) TO service_role;

-- Admin / settings RPC — authenticated only (permission checks inside)
DO $$
DECLARE
  sig text;
  sigs text[] := ARRAY[
    'public.admin_list_profiles()',
    'public.admin_update_profile(uuid, text, text, integer, text, integer, integer)',
    'public.admin_delete_profile(uuid)',
    'public.set_image_upload_provider(text)'
  ];
BEGIN
  FOREACH sig IN ARRAY sigs
  LOOP
    IF to_regprocedure(sig) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', sig);
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', sig);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', sig);
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 2) SET search_path on functions flagged by linter (idempotent)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_user_push_subscriptions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  sig text;
  sigs text[] := ARRAY[
    'public.handle_updated_at()',
    'public.handle_request_updated_at()',
    'public.compute_full_wbs()',
    'public.compute_full_abc()',
    'public.get_request_summary()'
  ];
BEGIN
  FOREACH sig IN ARRAY sigs
  LOOP
    IF to_regprocedure(sig) IS NOT NULL THEN
      EXECUTE format('ALTER FUNCTION %s SET search_path = public', sig);
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 3) Storage: drop broad listing policy on public bucket request-images
--    (images in this app use R2/Drive; bucket listing not required for URLs)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "public read request-images" ON storage.objects;
