-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRATION: add_fcm_token_to_profiles
-- Adds a device FCM registration token column to profiles so that the
-- marketplace Cloud Functions can send targeted notifications to specific
-- users (seller, buyer, or admin) rather than broadcasting to all_users.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- ── RLS: users can only update their own fcm_token ───────────────────────────
-- Existing SELECT/UPDATE policies on profiles already allow users to manage
-- their own row. The fcm_token column is included automatically.
-- No new policy needed — existing "Users can update own profile" covers it.
-- If no such policy exists, add a targeted one here:

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
      AND policyname = 'Users can update own fcm token'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can update own fcm token"
        ON profiles FOR UPDATE
        USING (id = auth.uid())
        WITH CHECK (id = auth.uid());
    $policy$;
  END IF;
END $$;
