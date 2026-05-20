-- Dedup การแจ้งเตือน push ต่อ request + status (กันยิงซ้ำจากหลาย client ใน ~15 วินาที)
-- Edge Function notify-request-change ใช้ service role เขียน/อ่าน

CREATE TABLE IF NOT EXISTS public.push_notify_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL,
  status_id  integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_notify_events_recent
  ON public.push_notify_events (request_id, status_id, created_at DESC);

ALTER TABLE public.push_notify_events ENABLE ROW LEVEL SECURITY;

-- ไม่เปิด policy ให้ client — ใช้ service role จาก Edge Function เท่านั้น
