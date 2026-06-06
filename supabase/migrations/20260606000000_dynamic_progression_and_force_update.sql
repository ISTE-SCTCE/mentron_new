-- Add admission_year and admission_month to profiles
ALTER TABLE public.profiles
ADD COLUMN admission_year INT,
ADD COLUMN admission_month INT;

-- Set admission_month to 8 for existing users
UPDATE public.profiles
SET admission_month = 8;

-- Map existing year to admission_year
UPDATE public.profiles
SET admission_year = CASE
    WHEN year = 1 THEN 2025
    WHEN year = 2 THEN 2024
    WHEN year = 3 THEN 2023
    WHEN year = 4 THEN 2022
    ELSE 2025
END
WHERE year IS NOT NULL;

-- Create app_config table
CREATE TABLE IF NOT EXISTS public.app_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    latest_version TEXT NOT NULL,
    minimum_version TEXT NOT NULL,
    force_update BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert initial configuration
INSERT INTO public.app_config (latest_version, minimum_version, force_update)
VALUES ('1.0.0', '1.0.0', false);

-- Enable RLS on app_config
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users for app_config
CREATE POLICY "Allow public read access to app_config"
ON public.app_config
FOR SELECT
TO public
USING (true);

-- Create subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_code TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    semester INT NOT NULL,
    branch TEXT NOT NULL,
    credits INT DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on subjects
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users for subjects
CREATE POLICY "Allow authenticated read access to subjects"
ON public.subjects
FOR SELECT
TO authenticated
USING (true);
