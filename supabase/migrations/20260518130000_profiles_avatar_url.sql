-- เก็บรูปโปรไฟล์ใน profiles เพื่อให้ admin แสดงใน Users Settings ได้ (จาก auth metadata)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;

UPDATE public.profiles p
SET avatar_url = COALESCE(
  NULLIF(TRIM(u.raw_user_meta_data->>'avatar_url'), ''),
  NULLIF(TRIM(u.raw_user_meta_data->>'picture'), '')
)
FROM auth.users u
WHERE p.id = u.id
  AND COALESCE(
    NULLIF(TRIM(u.raw_user_meta_data->>'avatar_url'), ''),
    NULLIF(TRIM(u.raw_user_meta_data->>'picture'), '')
  ) IS NOT NULL;

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

  INSERT INTO public.profiles (id, employee_id, fname, lname, phone, role, client_id, client_name, job_id, avatar_url)
  VALUES (
    NEW.id,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'employee_id'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'fname'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'lname'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), ''),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), ''), 'user'),
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
    role = COALESCE(EXCLUDED.role, profiles.role),
    client_id = COALESCE(EXCLUDED.client_id, profiles.client_id),
    client_name = COALESCE(EXCLUDED.client_name, profiles.client_name),
    job_id = COALESCE(EXCLUDED.job_id, profiles.job_id),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = now();

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_auth_user_avatar_to_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ava text;
BEGIN
  ava := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'avatar_url'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'picture'), '')
  );
  IF ava IS NULL OR ava = COALESCE(
    NULLIF(TRIM(OLD.raw_user_meta_data->>'avatar_url'), ''),
    NULLIF(TRIM(OLD.raw_user_meta_data->>'picture'), '')
  ) THEN
    RETURN NEW;
  END IF;
  UPDATE public.profiles SET avatar_url = ava, updated_at = now() WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated_profile_avatar ON auth.users;

CREATE TRIGGER on_auth_user_updated_profile_avatar
  AFTER UPDATE OF raw_user_meta_data ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_auth_user_avatar_to_profile();
