-- =============================================================================
-- Mentron Database Rollback Script (Post-July 22, 2026 Changes)
-- File: supabase/rollback_post_july22.sql
-- Description: Run this SQL script in your Supabase SQL Editor to undo DB
--              schema additions and RLS policies created after July 22, 2026.
-- =============================================================================

-- 1. Drop Academy Announcements table created on July 23, 2026
DROP TABLE IF EXISTS academy_announcements CASCADE;

-- 2. Drop Audit Log security table created on July 31, 2026 (if created)
DROP TABLE IF EXISTS audit_log CASCADE;

-- 3. Reset storage RLS policies for private payment proofs (if applied)
DROP POLICY IF EXISTS "Buyers can upload own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Buyers can read own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Sellers can read payment proofs for their listings" ON storage.objects;
DROP POLICY IF EXISTS "EXECOM can read all payment proofs" ON storage.objects;

-- 4. Reset is_execom helper function to baseline
CREATE OR REPLACE FUNCTION is_execom()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('exec', 'core', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
