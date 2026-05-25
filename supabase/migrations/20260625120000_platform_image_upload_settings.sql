-- Platform-wide image upload destination (Google Drive or Cloudflare R2).
-- Configurable by super_admin only; Edge Function reads via service role.

CREATE TABLE public.platform_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  image_upload_provider text NOT NULL DEFAULT 'r2'
    CHECK (image_upload_provider IN ('google_drive', 'r2')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

INSERT INTO public.platform_settings (id, image_upload_provider)
VALUES (1, 'r2')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS platform_settings_super_admin_select ON public.platform_settings;
CREATE POLICY platform_settings_super_admin_select ON public.platform_settings
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS platform_settings_super_admin_update ON public.platform_settings;
CREATE POLICY platform_settings_super_admin_update ON public.platform_settings
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE OR REPLACE FUNCTION public.set_image_upload_provider(p_provider text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v text;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'only super_admin can change image upload provider' USING ERRCODE = '42501';
  END IF;
  v := lower(trim(p_provider));
  IF v NOT IN ('google_drive', 'r2') THEN
    RAISE EXCEPTION 'invalid provider: %', p_provider USING ERRCODE = '22023';
  END IF;
  UPDATE public.platform_settings
  SET image_upload_provider = v,
      updated_at = now(),
      updated_by = auth.uid()
  WHERE id = 1;
  RETURN v;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_image_upload_provider(text) TO authenticated;

COMMENT ON TABLE public.platform_settings IS 'Singleton platform config (id=1). image_upload_provider: google_drive | r2.';
