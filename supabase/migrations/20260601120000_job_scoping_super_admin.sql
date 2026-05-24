-- Job-scoped multi-tenancy + super_admin role
-- Each job-scoped row carries job_id; super_admin (job_id NULL) bypasses job filter via RLS helpers.

-- ---------------------------------------------------------------------------
-- 1) Default job + migrate platform admins
-- ---------------------------------------------------------------------------
INSERT INTO public."Jobs" (job_name)
SELECT 'Default Project'
WHERE NOT EXISTS (SELECT 1 FROM public."Jobs" LIMIT 1);

-- Expand role check BEFORE migrating admin → super_admin (old constraint rejects super_admin)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (
    role IN (
      'super_admin',
      'admin',
      'user',
      'inspector',
      'document',
      'engineer',
      'manager'
    )
  );

DO $$
DECLARE
  v_default_job bigint;
BEGIN
  SELECT id INTO v_default_job FROM public."Jobs" ORDER BY id LIMIT 1;

  UPDATE public.profiles
  SET role = 'super_admin', job_id = NULL
  WHERE lower(trim(role::text)) = 'admin';

  UPDATE public.profiles
  SET job_id = v_default_job
  WHERE role <> 'super_admin'
    AND job_id IS NULL
    AND status <> 'pending';
END $$;

-- ---------------------------------------------------------------------------
-- 2) Job ↔ role constraint (super_admin = no job; others need job unless pending signup)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_job_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_job_role_check
  CHECK (
    (role = 'super_admin' AND job_id IS NULL)
    OR (
      role <> 'super_admin'
      AND (job_id IS NOT NULL OR status = 'pending')
    )
  );

COMMENT ON CONSTRAINT profiles_job_role_check ON public.profiles IS
  'super_admin: company-wide, job_id NULL; other roles must belong to a Job (pending signup exempt).';

-- ---------------------------------------------------------------------------
-- 3) Add job_id to job-scoped tables
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_default_job bigint;
  t text;
  tables text[] := ARRAY[
    'Client',
    'Location',
    'Concrete Works',
    'Structure',
    'Mixed Code',
    'ABC Code',
    'ABC Code1',
    'ABC Code2',
    'ABC Code3',
    'ABC Code4',
    'WBS Code',
    'WBS1',
    'WBS2',
    'WBS3',
    'WBS4',
    'WBS5',
    'WBS6',
    'WBS7',
    'Compression Machine',
    'Inspector',
    'Request',
    'Request_Log',
    'CST'
  ];
BEGIN
  SELECT id INTO v_default_job FROM public."Jobs" ORDER BY id LIMIT 1;

  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS job_id bigint REFERENCES public."Jobs"(id)',
      t
    );
    EXECUTE format(
      'UPDATE public.%I SET job_id = $1 WHERE job_id IS NULL',
      t
    ) USING v_default_job;
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON public.%I (job_id)',
      replace(lower(t), ' ', '_') || '_job_id_idx',
      t
    );
  END LOOP;

  -- Request: prefer booker job when available
  UPDATE public."Request" r
  SET job_id = p.job_id
  FROM public.profiles p
  WHERE r.booked_by = p.id
    AND p.job_id IS NOT NULL
    AND (r.job_id IS NULL OR r.job_id = v_default_job);

  UPDATE public."Request_Log" l
  SET job_id = r.job_id
  FROM public."Request" r
  WHERE l.request_id = r.id
    AND l.job_id IS DISTINCT FROM r.job_id;

  UPDATE public."CST" c
  SET job_id = r.job_id
  FROM public."Request" r
  WHERE c.ref = r.id
    AND c.job_id IS DISTINCT FROM r.job_id;

  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN job_id SET NOT NULL',
      t
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 4) RLS helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND lower(trim(p.role::text)) = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_job_admin()
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
      AND p.job_id IS NOT NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.is_platform_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin() OR public.is_job_admin();
$$;

CREATE OR REPLACE FUNCTION public.auth_user_job_id()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.job_id FROM public.profiles p WHERE p.id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.job_scope_allows(p_job_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin()
    OR (p_job_id IS NOT NULL AND p_job_id = public.auth_user_job_id());
$$;

CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin() OR public.is_job_admin();
$$;

GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_job_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_user_job_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.job_scope_allows(bigint) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5) Generic job-scoped RLS on data tables
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'Client',
    'Location',
    'Concrete Works',
    'Structure',
    'Mixed Code',
    'ABC Code',
    'ABC Code1',
    'ABC Code2',
    'ABC Code3',
    'ABC Code4',
    'WBS Code',
    'WBS1',
    'WBS2',
    'WBS3',
    'WBS4',
    'WBS5',
    'WBS6',
    'WBS7',
    'Compression Machine',
    'Inspector',
    'Request',
    'Request_Log',
    'CST'
  ];
  pol_sel text;
  pol_ins text;
  pol_upd text;
  pol_del text;
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    pol_sel := replace(lower(t), ' ', '_') || '_job_select';
    pol_ins := replace(lower(t), ' ', '_') || '_job_insert';
    pol_upd := replace(lower(t), ' ', '_') || '_job_update';
    pol_del := replace(lower(t), ' ', '_') || '_job_delete';

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol_sel, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.job_scope_allows(job_id))',
      pol_sel, t
    );

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol_ins, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.job_scope_allows(job_id))',
      pol_ins, t
    );

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol_upd, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.job_scope_allows(job_id)) WITH CHECK (public.job_scope_allows(job_id))',
      pol_upd, t
    );

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol_del, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.job_scope_allows(job_id))',
      pol_del, t
    );
  END LOOP;
END $$;

-- Jobs registry: everyone reads; only super_admin writes
ALTER TABLE public."Jobs" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS jobs_select_authenticated ON public."Jobs";
CREATE POLICY jobs_select_authenticated ON public."Jobs"
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS jobs_super_admin_write ON public."Jobs";
CREATE POLICY jobs_super_admin_write ON public."Jobs"
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Inspector members: scope via parent inspector job
ALTER TABLE public."Inspector_Member" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inspector_member_job_select ON public."Inspector_Member";
CREATE POLICY inspector_member_job_select ON public."Inspector_Member"
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public."Inspector" ins
      WHERE ins.id = inspector_id
        AND ins.job_id = public.auth_user_job_id()
    )
  );

DROP POLICY IF EXISTS inspector_member_job_write ON public."Inspector_Member";
CREATE POLICY inspector_member_job_write ON public."Inspector_Member"
  FOR ALL TO authenticated
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public."Inspector" ins
      WHERE ins.id = inspector_id
        AND ins.job_id = public.auth_user_job_id()
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public."Inspector" ins
      WHERE ins.id = inspector_id
        AND ins.job_id = public.auth_user_job_id()
    )
  );

-- Drop engineer global request access (replaced by job_scope on Request)
DROP POLICY IF EXISTS request_engineer_update ON public."Request";
DROP POLICY IF EXISTS request_engineer_select ON public."Request";

-- ---------------------------------------------------------------------------
-- 6) Admin profile RPC — super_admin all jobs; job admin same job only
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_list_profiles()
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.*
  FROM public.profiles p
  WHERE public.is_super_admin()
     OR (public.is_job_admin() AND p.job_id = public.auth_user_job_id())
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
  target public.profiles;
BEGIN
  IF NOT public.is_platform_staff() THEN
    RAISE EXCEPTION 'permission denied' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO target FROM public.profiles WHERE id = target_id;
  IF target.id IS NULL THEN
    RAISE EXCEPTION 'profile not found' USING ERRCODE = 'P0002';
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

CREATE OR REPLACE FUNCTION public.admin_delete_profile(target_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target public.profiles;
BEGIN
  IF NOT public.is_platform_staff() THEN
    RAISE EXCEPTION 'permission denied' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO target FROM public.profiles WHERE id = target_id;
  IF target.id IS NULL THEN
    RAISE EXCEPTION 'profile not found' USING ERRCODE = 'P0002';
  END IF;

  IF lower(trim(target.role::text)) = 'super_admin' THEN
    IF NOT public.is_super_admin() THEN
      RAISE EXCEPTION 'permission denied' USING ERRCODE = '42501';
    END IF;
    IF (SELECT count(*) FROM public.profiles WHERE role = 'super_admin') <= 1 THEN
      RAISE EXCEPTION 'cannot delete last super_admin' USING ERRCODE = '42501';
    END IF;
  END IF;

  IF public.is_job_admin() AND NOT public.is_super_admin() THEN
    IF target.job_id IS DISTINCT FROM public.auth_user_job_id() THEN
      RAISE EXCEPTION 'permission denied' USING ERRCODE = '42501';
    END IF;
    IF lower(trim(target.role::text)) IN ('super_admin', 'admin') THEN
      RAISE EXCEPTION 'permission denied' USING ERRCODE = '42501';
    END IF;
  END IF;

  DELETE FROM public.profiles WHERE id = target_id;
END;
$$;

-- Master data edit: super_admin, job admin, document, engineer (existing can_edit_master_data)
CREATE OR REPLACE FUNCTION public.can_edit_master_data()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('super_admin', 'admin', 'document', 'engineer')
  );
$$;
