-- Manager ใน Inspector line: อ่าน/อัปเดตคำขอที่ตัวเองเป็นผู้จองได้ (ทำงานแทน/ควบพื้นที่)

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
          AND mgr.role = 'manager'
          AND mgr.inspector_id IS NOT NULL
          AND im.profile_id = p_booked_by
      )
      OR EXISTS (
        SELECT 1
        FROM public.profiles mgr
        INNER JOIN public."Inspector" ins ON ins.id = mgr.inspector_id
        WHERE mgr.id = auth.uid()
          AND mgr.role = 'manager'
          AND mgr.inspector_id IS NOT NULL
          AND ins.primary_profile_id = p_booked_by
      )
      OR EXISTS (
        SELECT 1
        FROM public.profiles mgr
        WHERE mgr.id = auth.uid()
          AND mgr.role = 'manager'
          AND mgr.inspector_id IS NOT NULL
          AND p_booked_by = auth.uid()
      )
    );
$$;
