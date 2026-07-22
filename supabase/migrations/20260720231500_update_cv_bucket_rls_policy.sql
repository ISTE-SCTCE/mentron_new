-- Migration: Update CV bucket SELECT policy to support both mobile (3 segments) and web (2 segments) folder paths
-- Date: 2026-07-20

DROP POLICY IF EXISTS "Project creators can view CVs of applicants" ON storage.objects;

CREATE POLICY "Project creators can view CVs of applicants"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'cv_bucket' AND (
      EXISTS (
        SELECT 1 FROM public.project_applications
        JOIN public.projects ON public.projects.id = public.project_applications.project_id
        WHERE public.project_applications.profile_id::text = (storage.foldername(name))[1]
          AND public.projects.posted_by = auth.uid()
      )
    )
  );
