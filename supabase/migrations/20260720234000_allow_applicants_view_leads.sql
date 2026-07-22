-- Migration: Allow applicants to view profiles of project creators/leads
-- Date: 2026-07-20

DROP POLICY IF EXISTS "Applicants can view profiles of project creators" ON public.profiles;

CREATE POLICY "Applicants can view profiles of project creators"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_applications
      JOIN public.projects ON public.projects.id = public.project_applications.project_id
      WHERE public.project_applications.profile_id = auth.uid()
        AND public.projects.posted_by = public.profiles.id
    )
  );
