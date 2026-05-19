-- Workflow scope: หัวสาย (primary_profile_id) แทน profiles.inspector_id

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
        FROM public."Inspector" ins
        INNER JOIN public."Inspector_Member" im ON im.inspector_id = ins.id
        WHERE ins.primary_profile_id = auth.uid()
          AND im.profile_id = p_booked_by
      )
      OR EXISTS (
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
        FROM public."Inspector" ins
        WHERE ins.primary_profile_id = auth.uid()
          AND ins.primary_profile_id = p_booked_by
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
        FROM public."Inspector" ins
        WHERE ins.primary_profile_id = auth.uid()
          AND p_booked_by = auth.uid()
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
