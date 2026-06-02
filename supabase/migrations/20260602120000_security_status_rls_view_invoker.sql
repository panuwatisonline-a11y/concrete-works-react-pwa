-- Security Advisor: rls_disabled_in_public (Status), security_definer_view (Request_View, CST_View)
-- Apply: supabase db push หรือรันใน Dashboard SQL Editor

-- ---------------------------------------------------------------------------
-- Status: lookup table — authenticated read-only via API
-- ---------------------------------------------------------------------------
ALTER TABLE public."Status" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS status_select_authenticated ON public."Status";
CREATE POLICY status_select_authenticated ON public."Status"
  FOR SELECT TO authenticated
  USING (true);

COMMENT ON TABLE public."Status" IS
  'Request status registry. RLS: authenticated SELECT only; writes via Dashboard/service role.';

-- ---------------------------------------------------------------------------
-- Views: respect caller RLS (Postgres 15+ security_invoker)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v text;
  views text[] := ARRAY['Request_View', 'CST_View'];
BEGIN
  FOREACH v IN ARRAY views
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = v
        AND c.relkind = 'v'
    ) THEN
      EXECUTE format('ALTER VIEW public.%I SET (security_invoker = true)', v);
    END IF;
  END LOOP;
END $$;
