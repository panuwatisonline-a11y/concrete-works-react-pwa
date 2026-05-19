-- สมัครใหม่: role user + status pending

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
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), ''), 'user'),
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
    role = COALESCE(EXCLUDED.role, profiles.role),
    status = COALESCE(EXCLUDED.status, profiles.status),
    client_id = COALESCE(EXCLUDED.client_id, profiles.client_id),
    client_name = COALESCE(EXCLUDED.client_name, profiles.client_name),
    job_id = COALESCE(EXCLUDED.job_id, profiles.job_id),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = now();

  RETURN NEW;
END;
$$;
