-- Enable Supabase Realtime for app tables (idempotent).
-- Apply via: supabase db push / Dashboard SQL / MCP apply_migration

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'Request',
    'Request_Log',
    'CST',
    'profiles',
    'Status',
    'Client',
    'Location',
    'Concrete Works',
    'Structure',
    'Mixed Code',
    'ABC Code',
    'ABC Code1',
    'ABC Code2',
    'ABC Code3',
    'ABC Code4',
    'WBS Code',
    'WBS1',
    'WBS2',
    'WBS3',
    'WBS4',
    'WBS5',
    'WBS6',
    'WBS7',
    'Jobs',
    'Compression Machine'
  ];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
