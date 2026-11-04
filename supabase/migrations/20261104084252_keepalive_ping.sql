-- Keep Free Plan projects active: real Postgres write via PostgREST RPC.
-- Gateway-only health checks do not count as database activity for pause detection.
-- Anon may EXECUTE only this no-arg function; it updates a single timestamp row.

CREATE TABLE IF NOT EXISTS public.keepalive (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  pinged_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.keepalive (id, pinged_at)
VALUES (1, now())
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.keepalive ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS keepalive_select_anon ON public.keepalive;
CREATE POLICY keepalive_select_anon ON public.keepalive
  FOR SELECT
  TO anon, authenticated
  USING (true);

COMMENT ON TABLE public.keepalive IS
  'Single-row heartbeat for GitHub Actions; prevents Free Plan inactivity pause.';

CREATE OR REPLACE FUNCTION public.keepalive_ping()
RETURNS timestamptz
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.keepalive
  SET pinged_at = now()
  WHERE id = 1
  RETURNING pinged_at;
$$;

REVOKE ALL ON FUNCTION public.keepalive_ping() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.keepalive_ping() TO anon, authenticated;

COMMENT ON FUNCTION public.keepalive_ping() IS
  'Updates keepalive.pinged_at; called by scheduled Actions with the anon key.';
