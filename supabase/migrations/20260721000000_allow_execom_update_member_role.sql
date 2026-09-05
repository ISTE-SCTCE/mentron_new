-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRATION: allow_execom_update_member_role
-- Allows Execom members (exec, core, admin) to promote/demote other users
-- between 'member' and 'exec'. Restricts settable role in WITH CHECK to
-- prevent privilege escalation to 'core' or 'admin'.
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
      AND policyname = 'Execom can update user roles'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Execom can update user roles"
        ON public.profiles FOR UPDATE
        USING (public.is_execom())
        WITH CHECK (
          role IN ('member', 'exec')
        );
    $policy$;
  END IF;
END $$;
