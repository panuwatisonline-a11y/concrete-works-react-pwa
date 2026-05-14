-- ให้ join booked_by_profile ใน Request ได้: เดิม SELECT profiles ได้แค่แถวของตัวเอง (และ admin)
-- ทำให้ user ทั่วไปเห็น "ไม่ระบุ" แทนชื่อผู้จองคนอื่น
-- อ่านได้เมื่อมีอย่างน้อยหนึ่งคำขอที่มองเห็นได้ (RLS ของ Request ใช้ในซับคิวรี) และ booked_by ชี้มาที่ profiles นี้

CREATE POLICY "profiles_select_when_booked_on_visible_request"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public."Request" r
    WHERE r.booked_by IS NOT NULL
      AND r.booked_by = profiles.id
  )
);
