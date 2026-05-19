-- Admin จัดการ profiles ผ่าน RPC (ข้าม RLS ที่บล็อก UPDATE โดยตรง)

CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND lower(trim(p.role::text)) = 'admin'
  );
$$;

-- RLS (ถ้ายังไม่มี)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_admin_select_all ON public.profiles;
CREATE POLICY profiles_admin_select_all ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_app_admin());

DROP POLICY IF EXISTS profiles_admin_update_all ON public.profiles;
CREATE POLICY profiles_admin_update_all ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

DROP POLICY IF EXISTS profiles_admin_delete ON public.profiles;
CREATE POLICY profiles_admin_delete ON public.profiles
  FOR DELETE TO authenticated
  USING (public.is_app_admin());

CREATE OR REPLACE FUNCTION public.admin_list_profiles()
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.*
  FROM public.profiles p
  WHERE public.is_app_admin()
  ORDER BY p.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_profile(
  target_id uuid,
  new_role text,
  new_status text,
  new_client_id integer,
  new_client_name text,
  new_job_id integer,
  new_inspector_id integer
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row public.profiles;
BEGIN
  IF NOT public.is_app_admin() THEN
    RAISE EXCEPTION 'permission denied' USING ERRCODE = '42501';
  END IF;

  UPDATE public.profiles
  SET
    role = new_role,
    status = new_status,
    client_id = new_client_id,
    client_name = new_client_name,
    job_id = new_job_id,
    inspector_id = new_inspector_id,
    updated_at = now()
  WHERE id = target_id
  RETURNING * INTO row;

  IF row.id IS NULL THEN
    RAISE EXCEPTION 'profile not found' USING ERRCODE = 'P0002';
  END IF;

  RETURN row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_profile(target_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_app_admin() THEN
    RAISE EXCEPTION 'permission denied' USING ERRCODE = '42501';
  END IF;
  DELETE FROM public.profiles WHERE id = target_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_profile(uuid, text, text, integer, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_profile(uuid) TO authenticated;
