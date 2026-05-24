-- Only existing super_admin may assign the super_admin role (UI + RPC + RLS + trigger + signup).

-- ---------------------------------------------------------------------------
-- 1) Signup: never trust metadata for privileged roles
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cid INTEGER;
  jid INTEGER;
  ava text;
BEGIN
  BEGIN
    cid := NULLIF(TRIM(NEW.raw_user_meta_data->>'client_id'), '')::INTEGER;
  EXCEPTION WHEN OTHERS THEN
    cid := NULL;
  END;
  BEGIN
    jid := NULLIF(TRIM(NEW.raw_user_meta_data->>'job_id'), '')::INTEGER;
  EXCEPTION WHEN OTHERS THEN
    jid := NULL;
  END;

  ava := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'avatar_url'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'picture'), '')
  );

  INSERT INTO public.profiles (
    id, employee_id, fname, lname, phone, role, status,
    client_id, client_name, job_id, avatar_url
  )
  VALUES (
    NEW.id,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'employee_id'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'fname'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'lname'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), ''),
    'user',
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'status'), ''), 'pending'),
    cid,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'client_name'), ''),
    jid,
    ava
  )
  ON CONFLICT (id) DO UPDATE SET
    employee_id = COALESCE(EXCLUDED.employee_id, profiles.employee_id),
    fname = COALESCE(EXCLUDED.fname, profiles.fname),
    lname = COALESCE(EXCLUDED.lname, profiles.lname),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    status = COALESCE(EXCLUDED.status, profiles.status),
    client_id = COALESCE(EXCLUDED.client_id, profiles.client_id),
    client_name = COALESCE(EXCLUDED.client_name, profiles.client_name),
    job_id = COALESCE(EXCLUDED.job_id, profiles.job_id),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = now();

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2) Trigger: block role → super_admin unless actor is super_admin
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_super_admin_role_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(trim(NEW.role::text)) = 'super_admin'
     AND (
       TG_OP = 'INSERT'
       OR lower(trim(COALESCE(OLD.role::text, ''))) <> 'super_admin'
     )
     AND NOT public.is_super_admin()
  THEN
    RAISE EXCEPTION 'only super_admin can assign super_admin'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_guard_super_admin_role ON public.profiles;
CREATE TRIGGER profiles_guard_super_admin_role
  BEFORE INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_super_admin_role_assignment();

-- ---------------------------------------------------------------------------
-- 3) admin_update_profile: explicit promotion guard
-- ---------------------------------------------------------------------------
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
  target public.profiles;
BEGIN
  IF NOT public.is_platform_staff() THEN
    RAISE EXCEPTION 'permission denied' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO target FROM public.profiles WHERE id = target_id;
  IF target.id IS NULL THEN
    RAISE EXCEPTION 'profile not found' USING ERRCODE = 'P0002';
  END IF;

  IF lower(trim(new_role)) = 'super_admin' AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'only super_admin can assign super_admin' USING ERRCODE = '42501';
  END IF;

  IF public.is_job_admin() AND NOT public.is_super_admin() THEN
    IF target.job_id IS DISTINCT FROM public.auth_user_job_id() THEN
      RAISE EXCEPTION 'permission denied' USING ERRCODE = '42501';
    END IF;
    IF lower(trim(new_role)) = 'super_admin' THEN
      RAISE EXCEPTION 'permission denied' USING ERRCODE = '42501';
    END IF;
    IF new_job_id IS DISTINCT FROM public.auth_user_job_id() THEN
      RAISE EXCEPTION 'permission denied' USING ERRCODE = '42501';
    END IF;
  END IF;

  IF lower(trim(target.role::text)) = 'super_admin'
     AND lower(trim(new_role)) <> 'super_admin'
     AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'permission denied' USING ERRCODE = '42501';
  END IF;

  UPDATE public.profiles
  SET
    role = new_role,
    status = new_status,
    client_id = new_client_id,
    client_name = new_client_name,
    job_id = CASE
      WHEN lower(trim(new_role)) = 'super_admin' THEN NULL
      ELSE new_job_id
    END,
    inspector_id = new_inspector_id,
    updated_at = now()
  WHERE id = target_id
  RETURNING * INTO row;

  RETURN row;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4) profiles RLS: job admin cannot write super_admin rows or assign super_admin
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS profiles_admin_select_all ON public.profiles;
CREATE POLICY profiles_admin_select_all ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR (public.is_job_admin() AND job_id = public.auth_user_job_id())
  );

DROP POLICY IF EXISTS profiles_admin_update_all ON public.profiles;
CREATE POLICY profiles_admin_update_all ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    OR (
      public.is_job_admin()
      AND job_id = public.auth_user_job_id()
      AND lower(trim(role::text)) NOT IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR (
      public.is_job_admin()
      AND job_id = public.auth_user_job_id()
      AND lower(trim(role::text)) <> 'super_admin'
    )
  );

DROP POLICY IF EXISTS profiles_admin_delete ON public.profiles;
CREATE POLICY profiles_admin_delete ON public.profiles
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR (
      public.is_job_admin()
      AND job_id = public.auth_user_job_id()
      AND lower(trim(role::text)) NOT IN ('super_admin', 'admin')
    )
  );
