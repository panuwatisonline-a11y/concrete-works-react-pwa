-- Inspector line head: one profile per line (field 1 in admin UI)

ALTER TABLE public."Inspector"
  ADD COLUMN IF NOT EXISTS primary_profile_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS inspector_primary_profile_id_idx ON public."Inspector" (primary_profile_id);
