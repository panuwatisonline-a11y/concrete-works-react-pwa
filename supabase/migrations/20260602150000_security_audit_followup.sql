-- Follow-up audit: legacy profile policies, is_admin(), anon on utility functions.

-- is_admin() legacy policies still referenced role 'admin' only; include super_admin.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND lower(trim(p.role::text)) IN ('admin', 'super_admin')
  );
$$;

-- Drop duplicate Dashboard-era policies (superseded by profiles_*_own / profiles_admin_*).
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Utility functions: block anon RPC (not used by app client).
DO $$
DECLARE
  sig text;
  sigs text[] := ARRAY[
    'public.compute_full_wbs()',
    'public.compute_full_abc()',
    'public.get_request_summary()',
    'public.handle_updated_at()',
    'public.handle_request_updated_at()',
    'public.set_user_push_subscriptions_updated_at()'
  ];
BEGIN
  FOREACH sig IN ARRAY sigs
  LOOP
    IF to_regprocedure(sig) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', sig);
    END IF;
  END LOOP;
END $$;
