-- Migration: EXECOM profiles policy
-- Date: 2026-07-15

-- Enable SELECT policy on profiles for EXECOM members
DO $$ BEGIN
  CREATE POLICY "EXECOM can view all profiles"
    ON public.profiles FOR SELECT
    USING (is_execom());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add email column to profiles and populate it from auth.users
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

UPDATE public.profiles
SET email = auth.users.email
FROM auth.users
WHERE public.profiles.id = auth.users.id;
