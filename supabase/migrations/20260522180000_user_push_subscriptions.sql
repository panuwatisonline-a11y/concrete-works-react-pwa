-- ============================================================
-- ตาราง user_push_subscriptions
-- เก็บ Push Subscription ต่ออุปกรณ์ (endpoint ไม่ซ้ำ)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_push_subscriptions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  endpoint   text NOT NULL,
  p256dh     text NOT NULL,
  auth_key   text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_push_subscriptions_endpoint_unique UNIQUE (endpoint)
);

CREATE INDEX IF NOT EXISTS idx_user_push_subscriptions_user_id
  ON public.user_push_subscriptions (user_id);

CREATE OR REPLACE FUNCTION public.set_user_push_subscriptions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_push_subscriptions_updated_at ON public.user_push_subscriptions;
CREATE TRIGGER trg_user_push_subscriptions_updated_at
  BEFORE UPDATE ON public.user_push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_push_subscriptions_updated_at();

-- ============================================================
-- RLS: เจ้าของบัญชีจัดการ subscription ของตัวเองเท่านั้น
-- Edge Function send-push ใช้ SERVICE_ROLE_KEY ข้าม RLS ได้
-- ============================================================

ALTER TABLE public.user_push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY push_subscriptions_select_own
  ON public.user_push_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY push_subscriptions_insert_own
  ON public.user_push_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY push_subscriptions_update_own
  ON public.user_push_subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY push_subscriptions_delete_own
  ON public.user_push_subscriptions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
