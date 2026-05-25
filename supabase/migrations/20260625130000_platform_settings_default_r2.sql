-- Default upload destination is R2 until super_admin changes it in Upload Settings.

ALTER TABLE public.platform_settings
  ALTER COLUMN image_upload_provider SET DEFAULT 'r2';

COMMENT ON COLUMN public.platform_settings.image_upload_provider IS
  'Default r2; super_admin may switch to google_drive via set_image_upload_provider.';
