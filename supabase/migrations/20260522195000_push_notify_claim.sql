-- กันยิง push ซ้ำแบบ atomic (ใช้จาก Edge Function notify-request-change)

CREATE OR REPLACE FUNCTION public.claim_push_notify_event(
  p_request_id uuid,
  p_status_id integer,
  p_window_seconds integer DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lock_key bigint;
BEGIN
  lock_key := hashtextextended(p_request_id::text || ':' || p_status_id::text, 0);
  PERFORM pg_advisory_xact_lock(lock_key);

  IF EXISTS (
    SELECT 1
    FROM public.push_notify_events
    WHERE request_id = p_request_id
      AND status_id = p_status_id
      AND created_at > now() - make_interval(secs => p_window_seconds)
  ) THEN
    RETURN false;
  END IF;

  INSERT INTO public.push_notify_events (request_id, status_id)
  VALUES (p_request_id, p_status_id);
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_push_notify_event(uuid, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_push_notify_event(uuid, integer, integer) TO service_role;
