-- Expand roles: manager → inspector (profiles.role is text on remote)

UPDATE public.profiles SET role = 'inspector' WHERE role = 'manager';

CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_engineer()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'engineer'
  );
$$;

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
      AND p.role IN ('admin', 'document', 'engineer')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_engineer() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit_master_data() TO authenticated;

CREATE OR REPLACE FUNCTION public.inspector_scope_includes_booker(p_booked_by uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p_booked_by IS NOT NULL
    AND (
      EXISTS (
        SELECT 1
        FROM public.profiles mgr
        INNER JOIN public."Inspector_Member" im ON im.inspector_id = mgr.inspector_id
        WHERE mgr.id = auth.uid()
          AND mgr.role IN ('inspector', 'manager')
          AND mgr.inspector_id IS NOT NULL
          AND im.profile_id = p_booked_by
      )
      OR EXISTS (
        SELECT 1
        FROM public.profiles mgr
        INNER JOIN public."Inspector" insp ON insp.id = mgr.inspector_id
        WHERE mgr.id = auth.uid()
          AND mgr.role IN ('inspector', 'manager')
          AND mgr.inspector_id IS NOT NULL
          AND insp.primary_profile_id = p_booked_by
      )
      OR EXISTS (
        SELECT 1
        FROM public.profiles mgr
        WHERE mgr.id = auth.uid()
          AND mgr.role IN ('inspector', 'manager')
          AND mgr.inspector_id IS NOT NULL
          AND p_booked_by = auth.uid()
      )
    );
$$;

DROP POLICY IF EXISTS request_manager_select_in_inspector_scope ON public."Request";
CREATE POLICY request_inspector_select_in_scope ON public."Request"
  FOR SELECT TO authenticated
  USING (public.inspector_scope_includes_booker(booked_by));

DROP POLICY IF EXISTS request_manager_update_in_inspector_scope ON public."Request";
CREATE POLICY request_inspector_update_in_scope ON public."Request"
  FOR UPDATE TO authenticated
  USING (public.inspector_scope_includes_booker(booked_by))
  WITH CHECK (public.inspector_scope_includes_booker(booked_by));

DROP POLICY IF EXISTS inspector_admin_write ON public."Inspector";
CREATE POLICY inspector_master_write ON public."Inspector"
  FOR ALL TO authenticated
  USING (public.can_edit_master_data())
  WITH CHECK (public.can_edit_master_data());

DROP POLICY IF EXISTS inspector_member_admin_write ON public."Inspector_Member";
CREATE POLICY inspector_member_master_write ON public."Inspector_Member"
  FOR ALL TO authenticated
  USING (public.can_edit_master_data())
  WITH CHECK (public.can_edit_master_data());

-- Engineer: full request update (additive; existing policies may already allow)
DROP POLICY IF EXISTS request_engineer_update ON public."Request";
CREATE POLICY request_engineer_update ON public."Request"
  FOR UPDATE TO authenticated
  USING (public.is_engineer())
  WITH CHECK (public.is_engineer());

DROP POLICY IF EXISTS request_engineer_select ON public."Request";
CREATE POLICY request_engineer_select ON public."Request"
  FOR SELECT TO authenticated
  USING (public.is_engineer());
