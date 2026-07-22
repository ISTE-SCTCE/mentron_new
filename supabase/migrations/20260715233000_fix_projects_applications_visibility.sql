-- Migration: Fix project applications and resume visibility for project creators (Prevent RLS recursion)
-- Date: 2026-07-15

-- 1. Create a security definer function to check project applications.
-- This function runs with superuser privileges (bypassing RLS on project_applications and projects),
-- which prevents infinite recursion when evaluating policies on public.profiles.
CREATE OR REPLACE FUNCTION public.is_project_applicant(applicant_id uuid, creator_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_applications
    JOIN public.projects ON public.projects.id = public.project_applications.project_id
    WHERE public.project_applications.profile_id = applicant_id
      AND public.projects.posted_by = creator_id
  );
$$;

-- Drop the old policy if it exists and create the recursion-safe policy on profiles
DROP POLICY IF EXISTS "Project creators can view profiles of applicants" ON public.profiles;

CREATE POLICY "Project creators can view profiles of applicants"
  ON public.profiles FOR SELECT
  USING (
    public.is_project_applicant(id, auth.uid())
  );

-- 2. Redefine is_execom as SECURITY DEFINER to prevent potential RLS recursion on role checks
CREATE OR REPLACE FUNCTION public.is_execom()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE public.profiles.id = auth.uid()
      AND public.profiles.role IN ('exec', 'core', 'admin')
  );
$$;

-- 3. Enable SELECT policy on storage.objects for project creators to view the applicant's CV
DO $$ BEGIN
  CREATE POLICY "Project creators can view CVs of applicants"
    ON storage.objects FOR SELECT
    USING (
      bucket_id = 'cv_bucket' AND (
        EXISTS (
          SELECT 1 FROM public.projects
          WHERE public.projects.id::text = (storage.foldername(name))[2]
            AND public.projects.posted_by = auth.uid()
        )
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. Enable SELECT policy on storage.objects for Execom members (exec, core, admin) to view all CVs
DO $$ BEGIN
  CREATE POLICY "Execom can view all CVs"
    ON storage.objects FOR SELECT
    USING (
      bucket_id = 'cv_bucket' AND public.is_execom()
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
