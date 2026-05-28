-- Allow signup users (pending / profile-not-created) to load Client list on CompleteProfile page.
-- Keep normal users job-scoped through existing job_scope_allows(job_id).

CREATE OR REPLACE FUNCTION public.is_signup_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
           SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
         )
      OR EXISTS (
           SELECT 1 FROM public.profiles p
           WHERE p.id = auth.uid()
             AND p.status = 'pending'
         );
$$;

GRANT EXECUTE ON FUNCTION public.is_signup_user() TO authenticated;

DROP POLICY IF EXISTS client_job_select ON public."Client";
CREATE POLICY client_job_select ON public."Client"
  FOR SELECT TO authenticated
  USING (
    public.job_scope_allows(job_id)
    OR public.is_signup_user()
  );
