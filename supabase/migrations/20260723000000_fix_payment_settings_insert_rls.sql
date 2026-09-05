-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRATION: fix_payment_settings_insert_rls
-- Fixes:
-- 1. Missing INSERT policy on payment_settings for EXECOM
-- 2. UPDATE policy on profiles for leadership (Chairman / Vice Chairman)
-- 3. DELETE policy on profiles for Core / Exec / Admin
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. payment_settings INSERT policy
DO $$ BEGIN
  CREATE POLICY "EXECOM can insert payment settings"
    ON payment_settings FOR INSERT
    WITH CHECK (is_execom());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. profiles UPDATE policy for leadership
DO $$ BEGIN
  CREATE POLICY "Leadership can update profile permissions"
    ON public.profiles FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND iste_position IN ('Chairman', 'Vice Chairman')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. profiles DELETE policy for Core / Exec / Admin
DO $$ BEGIN
  CREATE POLICY "Core and exec can delete profiles"
    ON public.profiles FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('core', 'exec', 'admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
