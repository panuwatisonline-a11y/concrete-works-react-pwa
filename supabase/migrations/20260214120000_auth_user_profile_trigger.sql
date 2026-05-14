-- สร้างแถว profiles อัตโนมัติเมื่อมีผู้ใช้ใหม่ใน auth.users
-- จำเป็นเมื่อเปิด "Confirm email" ใน Supabase: หลัง signUp ไม่มี session จึง insert จาก client ไม่ได้ (RLS)
-- ข้อมูลมาจาก auth.signUp({ options: { data: { ... } } }) → raw_user_meta_data

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cid INTEGER;
  jid INTEGER;
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

  INSERT INTO public.profiles (id, employee_id, fname, lname, phone, role, client_id, client_name, job_id)
  VALUES (
    NEW.id,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'employee_id'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'fname'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'lname'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), ''),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), ''), 'user'),
    cid,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'client_name'), ''),
    jid
  )
  ON CONFLICT (id) DO UPDATE SET
    employee_id = COALESCE(EXCLUDED.employee_id, profiles.employee_id),
    fname = COALESCE(EXCLUDED.fname, profiles.fname),
    lname = COALESCE(EXCLUDED.lname, profiles.lname),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    role = COALESCE(EXCLUDED.role, profiles.role),
    client_id = COALESCE(EXCLUDED.client_id, profiles.client_id),
    client_name = COALESCE(EXCLUDED.client_name, profiles.client_name),
    job_id = COALESCE(EXCLUDED.job_id, profiles.job_id),
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();
